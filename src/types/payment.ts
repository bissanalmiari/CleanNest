import type { PaymentMethod, PaymentStatus } from "./enums";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  paidAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  rating: number;
  comment?: string;
  adminReply?: string;
  isVisible: boolean;
}
