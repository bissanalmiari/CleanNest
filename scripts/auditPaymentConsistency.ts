/**
 * Read-only consistency audit for booking/payment synchronization.
 *
 * Usage:
 *   npx tsx scripts/auditPaymentConsistency.ts
 */
import { config } from "dotenv";
import { MongoClient, type ObjectId } from "mongodb";
import Stripe from "stripe";

config({ path: ".env.local", quiet: true });

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI is not configured.");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

interface BookingRow {
  _id: ObjectId;
  bookingNumber?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface PaymentRow {
  _id: ObjectId;
  bookingId: ObjectId;
  provider?: string;
  status?: string;
  stripeCheckoutSessionId?: string;
}

async function main() {
  const client = new MongoClient(uri as string);

  try {
    await client.connect();
    const database = client.db();
    const [bookings, payments] = await Promise.all([
      database
        .collection<BookingRow>("bookings")
        .find({})
        .project<BookingRow>({
          _id: 1,
          bookingNumber: 1,
          paymentMethod: 1,
          paymentStatus: 1,
        })
        .toArray(),
      database
        .collection<PaymentRow>("payments")
        .find({})
        .project<PaymentRow>({
          _id: 1,
          bookingId: 1,
          provider: 1,
          status: 1,
          stripeCheckoutSessionId: 1,
        })
        .toArray(),
    ]);

    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const paymentByBookingId = new Map(
      payments.map((payment) => [String(payment.bookingId), payment])
    );

    const orphanPayments = payments.filter(
      (payment) => !bookingById.has(String(payment.bookingId))
    );
    const mismatchedStatuses = payments.filter((payment) => {
      const booking = bookingById.get(String(payment.bookingId));
      return booking && booking.paymentStatus !== payment.status;
    });
    const missingPayments = bookings.filter(
      (booking) => !paymentByBookingId.has(String(booking._id))
    );
    const legacyStripeProviders = payments.filter(
      (payment) => payment.stripeCheckoutSessionId && payment.provider !== "stripe"
    );
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
    const stripeSessions = stripe
      ? await Promise.all(
          payments
            .filter((payment) => payment.stripeCheckoutSessionId)
            .map(async (payment) => {
              const booking = bookingById.get(String(payment.bookingId));
              try {
                const session = await stripe.checkout.sessions.retrieve(
                  payment.stripeCheckoutSessionId as string
                );
                return {
                  bookingNumber: booking?.bookingNumber ?? String(payment.bookingId),
                  databaseStatus: payment.status ?? null,
                  stripePaymentStatus: session.payment_status,
                  stripeSessionStatus: session.status,
                };
              } catch (error) {
                return {
                  bookingNumber: booking?.bookingNumber ?? String(payment.bookingId),
                  databaseStatus: payment.status ?? null,
                  stripeError:
                    error instanceof Error ? error.message : "Unable to retrieve session",
                };
              }
            })
        )
      : "STRIPE_SECRET_KEY is not configured";

    console.log(
      JSON.stringify(
        {
          bookings: bookings.length,
          payments: payments.length,
          orphanPayments: orphanPayments.length,
          missingPayments: missingPayments.length,
          mismatchedStatuses: mismatchedStatuses.map((payment) => {
            const booking = bookingById.get(String(payment.bookingId));
            return {
              bookingNumber: booking?.bookingNumber ?? String(payment.bookingId),
              bookingStatus: booking?.paymentStatus ?? null,
              paymentStatus: payment.status ?? null,
            };
          }),
          legacyStripeProviders: legacyStripeProviders.map((payment) => {
            const booking = bookingById.get(String(payment.bookingId));
            return {
              bookingNumber: booking?.bookingNumber ?? String(payment.bookingId),
              paymentStatus: payment.status ?? null,
              provider: payment.provider ?? null,
            };
          }),
          stripeSessions,
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
