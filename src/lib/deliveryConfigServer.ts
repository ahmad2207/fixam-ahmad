import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import { mergeDeliveryConfig, type DeliveryConfig } from '@/lib/deliveryFees';

// The single source of truth for the admin-configured delivery fee schedule.
// Reads straight from the DB on every call rather than relying on an
// in-memory singleton — this app runs on Vercel, where module state doesn't
// survive across serverless invocations, so a "set once, read later" cache
// would silently keep serving defaults from whichever instance never got
// the update.
export async function getDeliveryConfigFromDb(): Promise<DeliveryConfig> {
  const [row] = await db.select().from(storeSettings).limit(1);
  return mergeDeliveryConfig(row?.deliveryConfig as Partial<DeliveryConfig> | null | undefined);
}
