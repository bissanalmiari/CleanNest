export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  baseDurationMinutes: number;
  isActive: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  extraDurationMinutes: number;
  isActive: boolean;
}

export interface ServiceAddon {
  id: string;
  serviceId: string;
  addonId: string;
}

export interface ServiceArea {
  id: string;
  city: string;
  area: string;
  postalCode: string;
  serviceFee: number;
  isActive: boolean;
}
