import type { AssignmentStatus, BookingStatus } from "@/types/enums";

export interface CleanerJob {
  id: string;
  assignmentId: string;
  assignmentStatus: AssignmentStatus;
  bookingNumber: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes: number;
  serviceName: string;
  customerName: string;
  customerPhone: string | null;
  addressLabel: string;
  addressLine: string;
  city: string;
  area: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  landmark: string | null;
  accessInstructions: string | null;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  propertySize: number | null;
  customerNotes: string | null;
  adminNotes: string | null;
  paymentMethod: string;
  paymentStatus: string;
}

export interface CleanerJobsResponse {
  jobs: CleanerJob[];
  summary: {
    total: number;
    assigned: number;
    accepted: number;
    inProgress: number;
    completed: number;
  };
}
