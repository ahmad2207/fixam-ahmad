import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  Package, ShoppingBag, ChevronRight,
  Clock, Truck, CircleCheckBig, XCircle, Banknote, CreditCard,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:  { label: 'Confirmed',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  processing: { label: 'Processing', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  shipped:    { label: 'Shipped',    cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  delivered:  { label: 'Delivered',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-600 border border-red-200' },
  refunded:   { label: 'Refunded',   cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'delivered': return <CircleCheckBig className="h-3 w-3" />;
    case 'shipped':   return <Truck className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    default:          return <Clock className="h-3 w-3" />;
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId  = (session.user as any).id as string;
  const email   = session.user?.email ?? '';

  const userOrders = await db
    .select()
    .from(orders)
    .where(or(eq(orders.userId, userId), email ? eq(orders.guestEmail, email) : eq(orders.userId, userId)))
    .orderBy(desc(orders.createdAt));

  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">My Orders</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4 max-w-3xl">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          My Orders
          {ordersWithItems.length > 0 && (
            <span className="ml-2 text-sm font-bold text-gray-400">({ordersWithItems.length})</span>
          )}
        </h1>

        {ordersWithItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-sm text-gray-500 mb-6">When you place an order, it will appear here.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ordersWithItems.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const isPaid = order.paymentStatus === 'paid';
              const isPod  = order.paymentMethod === 'pod';

              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                    {/* Header row */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div>
                        <p className="font-extrabold text-sm text-gray-900">
                          {order.orderNumber ?? `#${order.id.slice(0, 10).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Payment badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isPaid
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : isPod
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {isPod ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                          {isPaid ? 'Paid' : isPod ? 'Pay on Delivery' : 'Unpaid'}
                        </span>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                          <StatusIcon status={order.status} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Content row */}
                    <div className="flex items-center gap-4 px-4 py-3">
                      {/* Product images */}
                      <div className="flex -space-x-2 flex-shrink-0">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="w-11 h-11 rounded-xl border-2 border-white bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ zIndex: 3 - idx }}
                          >
                            {item.productImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <Package className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-11 h-11 rounded-xl border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0" style={{ zIndex: 0 }}>
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 leading-tight">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="font-extrabold text-base text-primary leading-tight mt-0.5">
                          {formatCurrency(Number(order.total))}
                        </p>
                        {order.shippingState && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            Delivery to {order.shippingState}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
