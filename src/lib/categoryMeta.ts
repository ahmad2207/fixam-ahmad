export const CATEGORY_META: Record<string, {
  icon: string;
  desc: string;
  gradient: string;
  hoverBorder: string;
  accent: string;
  image?: string;
}> = {
  cookware:   { icon: '🍳', desc: 'Pots & pans',       gradient: 'from-orange-50 to-amber-100',  hoverBorder: 'group-hover:border-orange-300',  accent: 'bg-orange-400',  image: '/cookware.png'   },
  cutlery:    { icon: '🔪', desc: 'Knives & blades',    gradient: 'from-blue-50 to-sky-100',      hoverBorder: 'group-hover:border-blue-300',    accent: 'bg-blue-400',    image: '/cutlery.png'    },
  appliances: { icon: '⚡', desc: 'Kitchen gadgets',    gradient: 'from-violet-50 to-purple-100', hoverBorder: 'group-hover:border-violet-300',  accent: 'bg-violet-400',  image: '/Appliances.png' },
  storage:    { icon: '🗄️', desc: 'Jars & containers', gradient: 'from-green-50 to-emerald-100', hoverBorder: 'group-hover:border-green-300',   accent: 'bg-emerald-400', image: '/storage.png'    },
  bakeware:   { icon: '🧁', desc: 'Trays & moulds',     gradient: 'from-pink-50 to-rose-100',     hoverBorder: 'group-hover:border-pink-300',    accent: 'bg-pink-400',    image: '/bakeware.png'   },
  utensils:   { icon: '🥄', desc: 'Spoons & spatulas',  gradient: 'from-yellow-50 to-amber-100',  hoverBorder: 'group-hover:border-yellow-300',  accent: 'bg-yellow-400',  image: '/utensils.png'   },
  seasonal:   { icon: '🌿', desc: 'Seasonal picks',     gradient: 'from-teal-50 to-emerald-100',  hoverBorder: 'group-hover:border-teal-300',    accent: 'bg-teal-400'                            },
};
