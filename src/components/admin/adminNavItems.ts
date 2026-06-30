import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Monitor,
  Receipt,
  CreditCard,
  Users,
  BarChart3,
  Tag,
  ShieldCheck,
  ScrollText,
  Settings,
  Image,
  MessageSquare,
  Flame,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const adminNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics',  icon: BarChart3 },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products',     label: 'Products',     icon: Package },
      { href: '/admin/combo-deals', label: 'Combo Deals',  icon: Flame },
      { href: '/admin/inventory',   label: 'Inventory',    icon: Warehouse },
      { href: '/admin/categories',  label: 'Categories',   icon: Tag },
      { href: '/admin/banners',     label: 'Banners',      icon: Image },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders',       label: 'Orders',        icon: ShoppingCart },
      { href: '/admin/pos',          label: 'Point of Sale', icon: Monitor },
      { href: '/admin/receipts',     label: 'Receipts',      icon: Receipt },
      { href: '/admin/transactions', label: 'Transactions',  icon: CreditCard },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/messages',  label: 'Messages',  icon: MessageSquare },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/users',    label: 'User Roles', icon: ShieldCheck },
      { href: '/admin/audit',    label: 'Audit Log',  icon: ScrollText },
      { href: '/admin/settings', label: 'Settings',   icon: Settings },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((g) => g.items);
