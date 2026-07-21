import type {
  BookingSource,
  BookingStatus,
  BookingFrequency,
  PropertyType,
  PaymentMethod,
  PaymentStatus,
  AssignmentStatus,
} from "./enums";
import type { Address } from "./user";
import type { Service, ServiceArea } from "./service";

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  serviceId: string;
  addressId: string;
  createdByUserId: string;
  serviceAreaId: string;
  promoCodeId?: string;

  source: BookingSource;
  status: BookingStatus;
  frequency: BookingFrequency;

  bookingDate: string;
  startTime: string;
  endTime: string;

  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;

  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  customerNotes?: string;
  adminNotes?: string;

  createdAt: string;
}

// Booking with common relations populated — what the "my bookings" /
// "assigned jobs" endpoints typically return.
export interface BookingWithRelations extends Omit<Booking, "serviceId" | "addressId"> {
  service: Service;
  address: Address;
  serviceArea?: ServiceArea;
}

export interface BookingAddon {
  id: string;
  bookingId: string;
  addonId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingStatusHistoryEntry {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedByUserId: string;
  createdAt: string;
}

export interface BookingAssignment {
  id: string;
  bookingId: string;
  cleanerId: string;
  assignedByUserId: string;
  assignedAt: string;
  status: AssignmentStatus;
}
