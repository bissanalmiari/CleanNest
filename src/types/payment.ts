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
  serviceId?: string;
  customerName?: string;
  serviceName?: string;
  rating: number;
  comment?: string;
  tags: string[];
  privateFeedback?: string;
  isVerified: boolean;
  canEdit: boolean;
  beforeImages: string[];
  afterImages: string[];
  adminReply?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
