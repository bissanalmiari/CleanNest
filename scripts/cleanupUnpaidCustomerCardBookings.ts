/**
 * Audits or removes customer-created card bookings that never reached a paid
 * state. The script is dry-run by default.
 *
 * Usage:
 *   npx tsx scripts/cleanupUnpaidCustomerCardBookings.ts
 *   npx tsx scripts/cleanupUnpaidCustomerCardBookings.ts --execute
 *
 * Related booking records are removed in one MongoDB transaction. Promo-code
 * usage counters are reversed so deleting an abandoned checkout does not
 * consume a customer's or campaign's usage allowance.
 */
import { config } from "dotenv";
import { MongoClient, type ClientSession, type Collection, type ObjectId } from "mongodb";

config({ path: ".env.local", quiet: true });

const execute = process.argv.includes("--execute");
const uri = process.env.MONGODB_URI?.trim();

if (!uri) {
  throw new Error("MONGODB_URI is not configured.");
}

const client = new MongoClient(uri);

type BookingCandidate = {
  _id: ObjectId;
  bookingNumber?: string;
  paymentStatus?: string;
  createdAt?: Date;
};

type PromoUsage = {
  promoCodeId: ObjectId;
};

const abandonedFilter = {
  source: "customer",
  paymentMethod: "card",
  paymentStatus: { $in: ["unpaid", "pending", "failed"] },
} as const;

async function countDependants(database: ReturnType<MongoClient["db"]>, bookingIds: ObjectId[]) {
  const collectionNames = [
    "payments",
    "bookingaddons",
    "bookingstatushistories",
    "bookingreschedulehistories",
    "bookingcleanerassignmenthistories",
    "cleanerassignments",
    "serviceproofs",
    "reviews",
    "notifications",
    "promocodeusages",
  ];

  return Object.fromEntries(
    await Promise.all(
      collectionNames.map(async (name) => [
        name,
        await database.collection(name).countDocuments({ bookingId: { $in: bookingIds } }),
      ])
    )
  );
}

async function deleteByBookingId(
  collection: Collection,
  bookingIds: ObjectId[],
  session: ClientSession
) {
  return collection.deleteMany({ bookingId: { $in: bookingIds } }, { session });
}

async function main() {
  try {
    await client.connect();
    const database = client.db();
    const bookings = database.collection<BookingCandidate>("bookings");
    const payments = database.collection("payments");

    const candidates = await bookings
      .find(abandonedFilter)
      .project<BookingCandidate>({
        _id: 1,
        bookingNumber: 1,
        paymentStatus: 1,
        createdAt: 1,
      })
      .sort({ createdAt: 1 })
      .toArray();

    const candidateIds = candidates.map((booking) => booking._id);
    const protectedPaymentBookingIds =
      candidateIds.length === 0
        ? []
        : ((await payments.distinct("bookingId", {
            bookingId: { $in: candidateIds },
            status: { $in: ["paid", "refunded"] },
          })) as ObjectId[]);
    const protectedIds = new Set(protectedPaymentBookingIds.map(String));
    const targets = candidates.filter((booking) => !protectedIds.has(String(booking._id)));
    const targetIds = targets.map((booking) => booking._id);
    const dependantCounts =
      targetIds.length === 0 ? {} : await countDependants(database, targetIds);

    const audit = {
      mode: execute ? "execute" : "dry-run",
      matchedBookings: candidates.length,
      protectedByPaidPaymentRecord: candidates.length - targets.length,
      targetBookings: targets.length,
      oldestTargetCreatedAt: targets.at(0)?.createdAt?.toISOString() ?? null,
      newestTargetCreatedAt: targets.at(-1)?.createdAt?.toISOString() ?? null,
      statusCounts: Object.fromEntries(
        ["unpaid", "pending", "failed"].map((status) => [
          status,
          targets.filter((booking) => booking.paymentStatus === status).length,
        ])
      ),
      dependantCounts,
    };

    if (!execute || targetIds.length === 0) {
      console.log(JSON.stringify(audit, null, 2));
      process.exitCode = 0;
    } else {
      const session = client.startSession();
      const deleted: Record<string, number> = {};

      try {
        await session.withTransaction(async () => {
          const promoUsages = await database
            .collection<PromoUsage>("promocodeusages")
            .find({ bookingId: { $in: targetIds } }, { session })
            .project<PromoUsage>({ promoCodeId: 1 })
            .toArray();

          const usageByPromo = new Map<string, { id: ObjectId; count: number }>();
          for (const usage of promoUsages) {
            const key = String(usage.promoCodeId);
            const current = usageByPromo.get(key);
            usageByPromo.set(key, {
              id: usage.promoCodeId,
              count: (current?.count ?? 0) + 1,
            });
          }

          for (const { id, count } of usageByPromo.values()) {
            await database.collection("promocodes").updateOne(
              { _id: id },
              [
                {
                  $set: {
                    usageCount: {
                      $max: [0, { $subtract: [{ $ifNull: ["$usageCount", 0] }, count] }],
                    },
                  },
                },
              ],
              { session }
            );
          }

          for (const collectionName of Object.keys(dependantCounts)) {
            const result = await deleteByBookingId(
              database.collection(collectionName),
              targetIds,
              session
            );
            deleted[collectionName] = result.deletedCount;
          }

          const bookingResult = await bookings.deleteMany(
            { _id: { $in: targetIds }, ...abandonedFilter },
            { session }
          );
          if (bookingResult.deletedCount !== targetIds.length) {
            throw new Error(
              `Cleanup stopped: expected ${targetIds.length} bookings but matched ${bookingResult.deletedCount}.`
            );
          }
          deleted.bookings = bookingResult.deletedCount;
        });
      } finally {
        await session.endSession();
      }

      console.log(JSON.stringify({ ...audit, deleted }, null, 2));
    }
  } finally {
    await client.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
