/**
 * Audits Stripe Checkout sessions against MongoDB and repairs completed
 * payments that were not synchronized. Dry-run by default.
 *
 * Usage:
 *   npx tsx scripts/reconcileStripePayments.ts
 *   npx tsx scripts/reconcileStripePayments.ts --execute
 */
import { config } from "dotenv";
import { MongoClient, type ObjectId } from "mongodb";
import Stripe from "stripe";

config({ path: ".env.local", quiet: true });

const databaseUri = process.env.MONGODB_URI?.trim();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const execute = process.argv.includes("--execute");

if (!databaseUri) throw new Error("MONGODB_URI is not configured.");
if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

interface PaymentRow {
  _id: ObjectId;
  bookingId: ObjectId;
  provider?: string;
  status?: string;
  stripeCheckoutSessionId: string;
  paidAt?: Date;
}

interface BookingRow {
  _id: ObjectId;
  bookingNumber?: string;
  paymentStatus?: string;
}

interface Repair {
  payment: PaymentRow;
  booking: BookingRow;
  session: Stripe.Checkout.Session;
  repairPaymentStatus: boolean;
  repairProvider: boolean;
}

async function main() {
  const databaseClient = new MongoClient(databaseUri as string);
  const stripe = new Stripe(stripeSecretKey as string);

  try {
    await databaseClient.connect();
    const database = databaseClient.db();
    const payments = database.collection<PaymentRow>("payments");
    const bookings = database.collection<BookingRow>("bookings");
    const paymentRows = await payments
      .find({
        stripeCheckoutSessionId: { $type: "string" },
      })
      .toArray();

    const repairs: Repair[] = [];
    const ignoredUnpaidSessions: string[] = [];
    const orphanSessions: string[] = [];

    for (const payment of paymentRows) {
      const [booking, stripeSession] = await Promise.all([
        bookings.findOne({ _id: payment.bookingId }),
        stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId),
      ]);

      if (!booking) {
        orphanSessions.push(String(payment.bookingId));
        continue;
      }

      if (stripeSession.payment_status !== "paid") {
        ignoredUnpaidSessions.push(booking.bookingNumber ?? String(booking._id));
        continue;
      }

      const repairPaymentStatus = payment.status !== "paid" || booking.paymentStatus !== "paid";
      const repairProvider = payment.provider !== "stripe";
      if (repairPaymentStatus || repairProvider) {
        repairs.push({
          payment,
          booking,
          session: stripeSession,
          repairPaymentStatus,
          repairProvider,
        });
      }
    }

    const audit = {
      mode: execute ? "execute" : "dry-run",
      stripeSessionsChecked: paymentRows.length,
      paidStatusRepairs: repairs
        .filter((repair) => repair.repairPaymentStatus)
        .map((repair) => ({
          bookingNumber: repair.booking.bookingNumber ?? String(repair.booking._id),
          databasePaymentStatus: repair.payment.status ?? null,
          databaseBookingStatus: repair.booking.paymentStatus ?? null,
        })),
      providerRepairs: repairs
        .filter((repair) => repair.repairProvider)
        .map((repair) => ({
          bookingNumber: repair.booking.bookingNumber ?? String(repair.booking._id),
          previousProvider: repair.payment.provider ?? null,
        })),
      ignoredUnpaidSessions,
      orphanSessions: orphanSessions.length,
    };

    if (!execute || repairs.length === 0) {
      console.log(JSON.stringify(audit, null, 2));
      return;
    }

    const mongoSession = databaseClient.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        for (const repair of repairs) {
          const paymentIntent =
            typeof repair.session.payment_intent === "string"
              ? repair.session.payment_intent
              : (repair.session.payment_intent?.id ?? undefined);
          const stripeCustomer =
            typeof repair.session.customer === "string" ? repair.session.customer : undefined;

          await payments.updateOne(
            { _id: repair.payment._id },
            {
              $set: {
                provider: "stripe",
                status: "paid",
                paidAt: repair.payment.paidAt ?? new Date(),
                transactionReference: repair.session.id,
                stripePaymentIntentId: paymentIntent,
                stripeCustomerId: stripeCustomer,
              },
              $unset: {
                failureReason: "",
                failedAt: "",
              },
            },
            { session: mongoSession }
          );
          await bookings.updateOne(
            { _id: repair.booking._id },
            { $set: { paymentStatus: "paid" } },
            { session: mongoSession }
          );
        }
      });
    } finally {
      await mongoSession.endSession();
    }

    console.log(
      JSON.stringify(
        {
          ...audit,
          repairedPayments: repairs.length,
          repairedBookings: repairs.filter((repair) => repair.repairPaymentStatus).length,
        },
        null,
        2
      )
    );
  } finally {
    await databaseClient.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
