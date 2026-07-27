import { z } from "zod";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { notifyActiveAdmins } from "@/services/notificationService";

const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(15).max(2000),
});

export async function POST(request: Request) {
  try {
    const input = contactMessageSchema.parse(await request.json());
    await connectDB();
    const contactMessage = await ContactMessage.create({
      ...input,
      phone: input.phone || undefined,
      status: "new",
    });

    await notifyActiveAdmins({
      type: "contact_message",
      title: `New contact message: ${input.subject}`,
      message: `${input.name} (${input.email}) wrote: ${input.message.slice(0, 750)}`,
      href: `mailto:${input.email}?subject=${encodeURIComponent(`Re: ${input.subject}`)}`,
      dedupeKey: `contact-message:${contactMessage._id.toString()}`,
      email: false,
    }).catch((error) => console.error("[notification:contact-message]", error));

    return successResponse({ submitted: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
