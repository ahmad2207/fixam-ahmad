// Delivery fee calculation based on location zones

// ─── Default Abuja (FCT) zones ───
export const DEFAULT_ABUJA_ZONES: Record<string, { areas: string[]; fee: number }> = {
  'AMAC 1': {
    areas: [
      'Central Area', 'Garki', 'Wuse', 'Gwarinpa', 'Maitama',
      'Central Business District', 'Katampe', 'Oando', 'Lifecamp',
      'Karmo', 'Durumi', 'Jabi', 'Utako', 'Berger',
    ],
    fee: 3500,
  },
  'AMAC 2': {
    areas: [
      'Asokoro', 'AYA', 'Apo', 'Lugbe', 'Karmajiji',
      'Guzape', 'Mpape', 'Lokogoma',
    ],
    fee: 4500,
  },
  'AMAC 3': {
    areas: [
      'Jiwa', 'Gui', 'Karshi', 'Kabusa', 'Orozo',
      'Karu', 'Nyanya', 'Gwagwa',
    ],
    fee: 6000,
  },
  'Bwari Area Council 1': {
    areas: [
      'Bwari Central', 'Kuduru', 'Igu', 'Shere',
      'Kawu', 'Ushafa', 'Byazhin',
    ],
    fee: 5500,
  },
  'Bwari Area Council 2': {
    areas: [
      'Kubwa', 'Usuma', 'Dawaki', 'Galadima', 'Dutse Alhaji',
    ],
    fee: 3500,
  },
  'Abaji': {
    areas: [
      'Abaji Central', 'Abaji North East', 'Abaji South East',
      'Agyana/Pandagi', 'Rimba Ebagi', 'Nuku', 'Alu/Mamagi',
      'Yaba', 'Gurdi', 'Gawu',
    ],
    fee: 9500,
  },
  'Gwagwalada': {
    areas: [
      'Gwagwalada Central', 'Kutunku', 'Staff Quarters', 'Ibwa',
      'Dobi', 'Paiko', 'Tungan Maje', 'Zuba', 'Ikwa', 'Gwako',
    ],
    fee: 9500,
  },
  'Kuje': {
    areas: [
      'Kuje Central', 'Chibiri', 'Gaube', 'Kwaku', 'Kabi',
      'Rubochi', 'Gwargwada', 'Gudun Karya', 'Kujekwa', 'Yenche',
    ],
    fee: 9500,
  },
  'Kwali': {
    areas: [
      'Kwali Ward', 'Yangoji', 'Pai', 'Kilankwa',
      'Dafa', 'Kundu', 'Ashara', 'Gumbo', 'Wako', 'Yebu',
    ],
    fee: 9500,
  },
};

// ─── Default interstate tiers ───
export const DEFAULT_INTERSTATE_TIERS = [
  { minSubtotal: 110000, fee: 15000 },
  { minSubtotal: 60000, fee: 10000 },
  { minSubtotal: 0, fee: 6000 },
];

// ─── Delivery config interface (stored in DB) ───
export interface DeliveryConfig {
  abuja_zones: Record<string, { areas: string[]; fee: number }>;
  interstate_tiers: { minSubtotal: number; fee: number }[];
}

export function getDefaultDeliveryConfig(): DeliveryConfig {
  return {
    abuja_zones: DEFAULT_ABUJA_ZONES,
    interstate_tiers: DEFAULT_INTERSTATE_TIERS,
  };
}

export function mergeDeliveryConfig(dbConfig: Partial<DeliveryConfig> | null | undefined): DeliveryConfig {
  const defaults = getDefaultDeliveryConfig();
  if (!dbConfig) return defaults;

  const mergedZones = { ...defaults.abuja_zones };
  if (dbConfig.abuja_zones) {
    for (const [zone, data] of Object.entries(dbConfig.abuja_zones)) {
      if (mergedZones[zone]) {
        mergedZones[zone] = {
          areas: data.areas?.length ? data.areas : mergedZones[zone].areas,
          fee: data.fee ?? mergedZones[zone].fee,
        };
      } else {
        mergedZones[zone] = data;
      }
    }
  }

  return {
    abuja_zones: mergedZones,
    interstate_tiers: dbConfig.interstate_tiers?.length ? dbConfig.interstate_tiers : defaults.interstate_tiers,
  };
}

let activeConfig: DeliveryConfig = getDefaultDeliveryConfig();

export function setActiveDeliveryConfig(config: DeliveryConfig) {
  activeConfig = config;
}

export function getActiveDeliveryConfig(): DeliveryConfig {
  return activeConfig;
}

export const ABUJA_ZONES = DEFAULT_ABUJA_ZONES;

export const INTERSTATE_STATES: Record<string, string[]> = {
  'South East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'North Central': ['Benue', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau'],
  'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Sokoto', 'Zamfara'],
  'South South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
  'South West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
};

export const ALL_INTERSTATE_STATES = Object.values(INTERSTATE_STATES).flat();
export const ALL_STATES = ['FCT - Abuja', ...ALL_INTERSTATE_STATES].sort();

export function getAbujaZoneNames(config?: DeliveryConfig): string[] {
  return Object.keys((config || activeConfig).abuja_zones);
}

export const ABUJA_ZONE_NAMES = Object.keys(DEFAULT_ABUJA_ZONES);

export function getAbujaAreas(zone: string, config?: DeliveryConfig): string[] {
  return (config || activeConfig).abuja_zones[zone]?.areas || [];
}

export function detectAbujaZone(
  streetAddress: string,
  city: string,
  config?: DeliveryConfig,
): { zone: string; area: string } | null {
  const haystack = `${streetAddress} ${city}`.toLowerCase();
  const zones = (config || activeConfig).abuja_zones;
  for (const [zoneName, { areas }] of Object.entries(zones)) {
    for (const area of areas) {
      if (haystack.includes(area.toLowerCase())) {
        return { zone: zoneName, area };
      }
    }
  }
  return null;
}

function getInterstateFee(subtotal: number, config?: DeliveryConfig): number {
  const tiers = (config || activeConfig).interstate_tiers;
  const sorted = [...tiers].sort((a, b) => b.minSubtotal - a.minSubtotal);
  for (const tier of sorted) {
    if (subtotal >= tier.minSubtotal) return tier.fee;
  }
  return sorted[sorted.length - 1]?.fee ?? 6000;
}

function getAbujaFee(zone: string, config?: DeliveryConfig): number | null {
  return (config || activeConfig).abuja_zones[zone]?.fee ?? null;
}

export interface DeliveryFeeResult {
  fee: number;
  label: string;
}

export function calculateDeliveryFee(
  state: string,
  subtotal: number,
  abujaZone?: string,
  config?: DeliveryConfig,
): DeliveryFeeResult {
  if (state === 'FCT - Abuja' && abujaZone) {
    const fee = getAbujaFee(abujaZone, config);
    if (fee !== null) {
      return { fee, label: `${abujaZone} – ₦${fee.toLocaleString()}` };
    }
  }
  const fee = getInterstateFee(subtotal, config);
  const tier = subtotal >= 110000 ? 'Large' : subtotal >= 60000 ? 'Medium' : 'Small';
  return { fee, label: `Interstate (${tier}) – ₦${fee.toLocaleString()}` };
}
