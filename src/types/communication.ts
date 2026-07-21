import type {  ContactMessageStatus } from "./enums";



export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  status: ContactMessageStatus;
  assignedAdminId?: string;
  createdAt: string;
}
