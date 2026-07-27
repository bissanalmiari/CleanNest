import "server-only";

import { Types, type FilterQuery } from "mongoose";

import { NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import ContactMessageModel, { type IContactMessage } from "@/models/ContactMessage";
import type { ContactMessage } from "@/types/communication";
import type { ContactMessageStatus } from "@/types/enums";

interface ListContactMessagesInput {
  page: number;
  limit: number;
  status?: ContactMessageStatus;
  search?: string;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toContactMessage(message: IContactMessage): ContactMessage {
  return {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    status: message.status,
    assignedAdminId: message.assignedAdminId?.toString(),
    createdAt: message.createdAt.toISOString(),
  };
}

export async function listContactMessages(input: ListContactMessagesInput) {
  await connectDB();

  const filter: FilterQuery<IContactMessage> = {};
  if (input.status) filter.status = input.status;

  const search = input.search?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: pattern },
      { email: pattern },
      { phone: pattern },
      { subject: pattern },
      { message: pattern },
    ];
  }

  const skip = (input.page - 1) * input.limit;
  const [messages, total, all, newCount, inProgress, resolved] = await Promise.all([
    ContactMessageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit),
    ContactMessageModel.countDocuments(filter),
    ContactMessageModel.countDocuments(),
    ContactMessageModel.countDocuments({ status: "new" }),
    ContactMessageModel.countDocuments({ status: "in_progress" }),
    ContactMessageModel.countDocuments({ status: "resolved" }),
  ]);

  return {
    messages: messages.map(toContactMessage),
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
    summary: {
      all,
      new: newCount,
      in_progress: inProgress,
      resolved,
    },
  };
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
  adminId: string
) {
  await connectDB();

  const assignment =
    status === "new"
      ? { $unset: { assignedAdminId: 1 } }
      : { $set: { status, assignedAdminId: new Types.ObjectId(adminId) } };

  const update = status === "new" ? { $set: { status }, ...assignment } : assignment;

  const message = await ContactMessageModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!message) throw new NotFoundError("Contact message not found");
  return toContactMessage(message);
}
