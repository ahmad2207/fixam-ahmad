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
