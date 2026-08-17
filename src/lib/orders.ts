// A "paid order" — the definition every revenue/COGS/gross-profit figure in
// the admin dashboard, analytics, and orders summary should be built on.
//
// This is deliberately NOT `['confirmed', 'shipped', 'delivered'].includes(status)`
// (the proxy this codebase used to use everywhere) — that's a fulfillment
// stage, not a payment fact. A Pay-on-Delivery or Pay-at-Pickup order starts
// at status 'pending' and paymentStatus 'pending', and stays at status
// 'pending' until an admin separately walks it through the fulfillment
// pipeline — so revenue never counted a POD/pickup order the moment its
// payment was actually confirmed via the "Confirm Payment" action, only
// once (if ever) someone also bumped its status. paymentStatus is the fact
// that money changed hands; status is a separate, independent axis.
//
// paymentStatus is also never reset when an order is cancelled or refunded
// (see the status-update route), so a since-cancelled order can still have
// paymentStatus === 'paid' sitting on it — status must be checked too, not
// used interchangeably with paymentStatus.
export function isOrderPaid(order: { paymentStatus: string | null; status: string }): boolean {
  return order.paymentStatus === 'paid' && order.status !== 'cancelled' && order.status !== 'refunded';
}

// Which of 'cancelled'/'refunded' does NOT make sense for an order's current
// paymentStatus: an unpaid order has nothing to refund (cancel it instead),
// a paid order shouldn't just be cancelled — that loses track of money
// already collected (refund it instead). Single source of truth shared by
// the admin status dropdowns (hide the wrong option) and the status route's
// backend guard (reject the wrong option outright) — see
// /api/admin/orders/[id]/status.
export function invalidTerminalStatusFor(paymentStatus: string | null): 'cancelled' | 'refunded' {
  return paymentStatus === 'paid' ? 'cancelled' : 'refunded';
}

// Filters a list of selectable order statuses down to the one terminal
// status ('cancelled' or 'refunded') that's actually valid for this order's
// paymentStatus, leaving every non-terminal fulfillment status untouched.
export function getSelectableOrderStatuses(allStatuses: string[], paymentStatus: string | null): string[] {
  const invalid = invalidTerminalStatusFor(paymentStatus);
  return allStatuses.filter((s) => s !== invalid);
}

// Base labels for stored `orders.paymentMethod` values. 'pod' deliberately
// excluded here — it covers both cash-on-delivery and cash-on-pickup orders
// (deliveryMethod is a separate column), so its label must be resolved via
// getPaymentMethodLabel() below, not looked up directly from this map.
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  paystack:      'Paystack',
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  card:          'Card',
  card_pos:      'Card (POS)',
};

// Resolves the display label for an order's payment method, disambiguating
// 'pod' ("pay on delivery" at write time — see /api/payment/pod) into
// "Pay on Delivery" or "Pay on Pickup" based on the order's deliveryMethod,
// since both cases are stored under the same 'pod' value.
export function getPaymentMethodLabel(
  paymentMethod: string | null | undefined,
  deliveryMethod?: string | null,
): string {
  if (!paymentMethod) return '';
  if (paymentMethod === 'pod') {
    return deliveryMethod === 'pickup' ? 'Pay on Pickup' : 'Pay on Delivery';
  }
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod.replace(/_/g, ' ');
}
