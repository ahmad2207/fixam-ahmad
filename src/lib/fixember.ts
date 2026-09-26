import { db } from '@/lib/db';
import { orders, fixemberPrizes, fixemberSpins } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

// Same shared-executor pattern as lib/inventory.ts — this pool is
// configured with max: 1 (a single connection, total), so a function that
// might run inside a caller's transaction MUST thread that tx through
// rather than falling back to the plain `db`, or it deadlocks (the
// transaction holds the pool's only connection, then blocks forever
// waiting for a second one that can never free up).
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// Fixed at 1 in 500 (lowered from an initial 1 in 100 after live testing
// turned up a win almost immediately), independent of the wheel's visual
// mix of prize vs "you didn't win" segments — a plain constant rather than
// an admin-editable setting, so it can't silently drift from the requested
// odds.
export const WIN_PROBABILITY = 1 / 500;

export const FIXEMBER_MIN_SUBTOTAL = 150000;

export interface WheelSegment {
  id: string;
  label: string;
  imageUrl: string | null;
  isPrize: boolean;
}

export type SpinResult =
  | { eligible: false }
  | {
      eligible: true;
      alreadySpun: boolean;
      segments: WheelSegment[];
      isWin: boolean;
      prizeId: string | null;
      prizeLabel: string;
    };

function pickRandom<T>(rows: T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return rows[Math.floor(Math.random() * rows.length)];
}

async function getActiveSegments(executor: DbOrTx): Promise<WheelSegment[]> {
  const rows = await executor
    .select()
    .from(fixemberPrizes)
    .where(eq(fixemberPrizes.isActive, true))
    .orderBy(asc(fixemberPrizes.sortOrder));
  return rows.map((r) => ({ id: r.id, label: r.label, imageUrl: r.imageUrl, isPrize: r.isPrize }));
}

/** Read-only eligibility + past-result check — no writes. Used to decide
 *  whether to even show the "Spin the wheel!" prompt on the order page,
 *  and to fetch the segment list the wheel renders. */
export async function checkSpinEligibility(orderId: string, tx?: DbOrTx): Promise<SpinResult> {
  const executor = tx ?? db;

  const [order] = await executor.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { eligible: false };

  const [existingSpin] = await executor
    .select()
    .from(fixemberSpins)
    .where(eq(fixemberSpins.orderId, orderId))
    .limit(1);

  const segments = await getActiveSegments(executor);

  if (existingSpin) {
    return {
      eligible: true,
      alreadySpun: true,
      segments,
      isWin: existingSpin.isWin,
      prizeId: existingSpin.prizeId,
      prizeLabel: existingSpin.prizeLabel,
    };
  }

  const qualifies = Number(order.subtotal) >= FIXEMBER_MIN_SUBTOTAL
    && order.status !== 'cancelled' && order.status !== 'refunded'
    // Fail closed rather than show a customer a wheel with nothing on it —
    // an admin needs to visit Admin > Fixember at least once (which seeds
    // the default segments) before the customer-facing wheel can work.
    && segments.length > 0;
  if (!qualifies) return { eligible: false };

  return { eligible: true, alreadySpun: false, segments, isWin: false, prizeId: null, prizeLabel: '' };
}

/** Actually resolves (and claims) a spin for this order. Idempotent: if the
 *  order already spun, returns that same recorded result instead of rolling
 *  again — enforced by fixemberSpins.orderId's DB-level UNIQUE constraint,
 *  not by a check-then-insert (which would have a race window under
 *  concurrent requests). */
export async function resolveSpin(orderId: string): Promise<SpinResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { eligible: false };

    const qualifies = Number(order.subtotal) >= FIXEMBER_MIN_SUBTOTAL
      && order.status !== 'cancelled' && order.status !== 'refunded';
    if (!qualifies) return { eligible: false };

    const segments = await getActiveSegments(tx);

    const isWin = Math.random() < WIN_PROBABILITY;
    const pool = segments.filter((s) => s.isPrize === isWin);
    const chosen = pickRandom(pool) ?? pickRandom(segments);

    if (!chosen) {
      // Misconfigured wheel (no active segments at all) — fail closed
      // rather than crash or silently invent a prize.
      console.error('[fixember] no active prize segments configured');
      return { eligible: false };
    }

    try {
      const [spin] = await tx.insert(fixemberSpins).values({
        orderId,
        userId: order.userId,
        guestEmail: order.guestEmail,
        customerName: order.shippingFullName,
        customerPhone: order.shippingPhone,
        prizeId: chosen.id,
        prizeLabel: chosen.label,
        isWin: chosen.isPrize,
      }).returning();

      return {
        eligible: true,
        alreadySpun: false,
        segments,
        isWin: spin.isWin,
        prizeId: spin.prizeId,
        prizeLabel: spin.prizeLabel,
      };
    } catch (err: any) {
      // 23505 = unique_violation on orderId — a concurrent request (e.g. a
      // rapid double-click) already claimed this order's spin first; return
      // that result instead of erroring, so a retry is safe either way.
      if (err?.code === '23505') {
        const [existing] = await tx.select().from(fixemberSpins).where(eq(fixemberSpins.orderId, orderId)).limit(1);
        if (existing) {
          return {
            eligible: true,
            alreadySpun: true,
            segments,
            isWin: existing.isWin,
            prizeId: existing.prizeId,
            prizeLabel: existing.prizeLabel,
          };
        }
      }
      throw err;
    }
  });
}
