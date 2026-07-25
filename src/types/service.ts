export type ServiceSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export type Service = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
  features: string[];
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServicesPagination = {
  page: number;
  limit: number;
  totalServices: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ServicesData = {
  services: Service[];
  categories: string[];
  pagination: ServicesPagination;
};

export type ServicesResponse = {
  success: true;
  message: string;
  data: ServicesData;
};

export type ServiceDetailsResponse = {
  success: true;
  message: string;
  data: {
    service: Service;
  };
};

export type ServicesErrorResponse = {
  success: false;
  message: string;
  error?: string;
};

export type ServiceFilters = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: ServiceSort;
  page: number;
};

export type ServiceArea = {
  id: string;
  city: string;
  area: string;
  serviceFee: number;
  maximumConcurrentBookings: number;
  isActive: boolean;
};
