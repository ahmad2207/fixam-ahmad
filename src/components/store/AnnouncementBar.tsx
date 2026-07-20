import { Truck, ShieldCheck, Users } from 'lucide-react';

const ITEMS = [
  { Icon: Truck,        label: 'Fast Delivery'              },
  { Icon: ShieldCheck,  label: 'Secure Checkout'            },
  { Icon: Users,        label: '10,000+ Happy Customers'    },
];

export function AnnouncementBar() {
  return (
    <div
      className="h-[40px] flex items-center justify-center gap-4 px-4 select-none overflow-hidden"
      style={{ backgroundColor: '#0a8800' }}
    >
      {/* Heading */}
      <span className="text-xs font-extrabold text-white tracking-wide whitespace-nowrap">
        Why choose Fixam?
      </span>

      <span className="text-white/30 text-sm">|</span>

      {/* Benefit items */}
      {ITEMS.map((item, i) => (
        <span key={item.label} className="flex items-center gap-4 whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <item.Icon className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
            <span className="text-xs font-semibold text-white/90">{item.label}</span>
          </span>
          {i < ITEMS.length - 1 && (
            <span className="text-white/30 text-sm">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
