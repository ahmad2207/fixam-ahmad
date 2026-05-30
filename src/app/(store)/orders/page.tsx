import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  Package, ShoppingBag, ArrowLeft, ChevronRight,
  Clock, Truck, CheckCircle, XCircle, CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending': return <Clock className="h-3 w-3" />;
    case 'processing': return <Package className="h-3 w-3" />;
    case 'shipped': return <Truck className="h-3 w-3" />;
    case 'delivered': return <CheckCircle className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id as string;
  const userEmail = session.user?.email ?? '';
  const userOrders = await db
    .select()
    .from(orders)
    .where(or(eq(orders.userId, userId), userEmail ? eq(orders.guestEmail, userEmail) : eq(orders.userId, userId)))
    .orderBy(desc(orders.createdAt));

  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Orders</h1>

          {ordersWithItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-4">When you place an order, it will appear here.</p>
                <Button asChild>
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ordersWithItems.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="flex items-center justify-between p-4 bg-muted/30">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{order.orderNumber ?? `#${order.id.slice(0, 12).toUpperCase()}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`gap-1 ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                          <CreditCard className="h-3 w-3" />
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Confirmation'}
                        </Badge>
                        <Badge className={`gap-1 ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                          <StatusIcon status={order.status} />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Items preview */}
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={item.id}
                              className="w-12 h-12 rounded-lg border-2 border-card bg-muted overflow-hidden flex items-center justify-center flex-shrink-0"
                              style={{ zIndex: 3 - idx }}
                            >
                              {item.productImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-12 h-12 rounded-lg border-2 border-card bg-muted flex items-center justify-center text-xs font-medium">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                          <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                        </div>

                        <Button variant="ghost" size="sm" className="gap-1" asChild>
                          <Link href={`/orders/${order.id}`}>
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
