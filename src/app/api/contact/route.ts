import { z } from "zod";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import ContactMessage from "@/models/ContactMessage";
import { notifyActiveAdmins } from "@/services/notificationService";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL?.trim() || "cleannest.project@gmail.com";

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

    const reference = contactMessage._id.toString().slice(-8).toUpperCase();
    const safeName = escapeHtml(input.name);
    const safeEmail = escapeHtml(input.email);
    const safePhone = escapeHtml(input.phone || "Not provided");
    const safeSubject = escapeHtml(input.subject);
    const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");

    await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: input.email,
      subject: `[CleanNest Contact CN-${reference}] ${input.subject}`,
      html: `
        <h2>New CleanNest contact request</h2>
        <p><strong>Reference:</strong> CN-${reference}</p>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong><br />${safeMessage}</p>
      `,
      text:
        `New CleanNest contact request\n\n` +
        `Reference: CN-${reference}\n` +
        `Name: ${input.name}\n` +
        `Email: ${input.email}\n` +
        `Phone: ${input.phone || "Not provided"}\n` +
        `Subject: ${input.subject}\n\n` +
        input.message,
      referenceId: contactMessage._id.toString(),
    }).catch((error) => console.error("[email:contact-message]", error));

    return successResponse(
      {
        submitted: true,
        reference,
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
