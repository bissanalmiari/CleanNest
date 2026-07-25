import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

/*
  Load variables from .env.local.
  The file must be beside package.json.
*/
loadEnvConfig(process.cwd());

type SeedService = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
  features: string[];
  imageUrl: string;
  isActive: boolean;
};

const services: SeedService[] = [
  {
    name: "Regular Home Cleaning",
    slug: "regular-home-cleaning",
    shortDescription:
      "Reliable routine cleaning for a fresh and comfortable home.",
    description:
      "Regular Home Cleaning is designed for customers who want to keep their homes consistently clean and comfortable. It includes dusting, sweeping, mopping, kitchen surface cleaning, bathroom cleaning, and trash removal.",
    category: "Home Cleaning",
    price: 35,
    durationMinutes: 120,
    features: [
      "Dusting furniture and surfaces",
      "Sweeping and mopping floors",
      "Kitchen surface cleaning",
      "Bathroom cleaning",
      "Trash removal",
    ],
    imageUrl: "",
    isActive: true,
  },
  {
    name: "Deep Cleaning",
    slug: "deep-cleaning",
    shortDescription:
      "Detailed cleaning for spaces that need extra care and attention.",
    description:
      "Deep Cleaning provides intensive cleaning for kitchens, bathrooms, bedrooms, living spaces, furniture, corners, and difficult-to-reach areas.",
    category: "Home Cleaning",
    price: 65,
    durationMinutes: 240,
    features: [
      "Detailed kitchen cleaning",
      "Detailed bathroom cleaning",
      "Hard-to-reach area cleaning",
      "Furniture and surface dusting",
      "Floor scrubbing and mopping",
      "Door and window frame cleaning",
    ],
    imageUrl: "",
    isActive: true,
  },
  {
    name: "Move-In / Move-Out Cleaning",
    slug: "move-in-move-out-cleaning",
    shortDescription:
      "Complete cleaning before moving into or leaving a property.",
    description:
      "Move-In and Move-Out Cleaning prepares an empty house or apartment for its next occupants. It includes detailed cleaning of rooms, kitchens, bathrooms, cabinets, floors, and interior surfaces.",
    category: "Home Cleaning",
    price: 85,
    durationMinutes: 300,
    features: [
      "Empty property cleaning",
      "Inside cabinet cleaning",
      "Kitchen and bathroom cleaning",
      "Complete floor cleaning",
      "Door and frame cleaning",
      "Final property inspection",
    ],
    imageUrl: "",
    isActive: true,
  },
  {
    name: "Office Cleaning",
    slug: "office-cleaning",
    shortDescription:
      "Professional cleaning for offices and commercial workspaces.",
    description:
      "Office Cleaning helps maintain a clean, organized, and comfortable working environment. It covers desks, common areas, floors, kitchens, bathrooms, and shared workspaces.",
    category: "Commercial Cleaning",
    price: 75,
    durationMinutes: 240,
    features: [
      "Desk and surface cleaning",
      "Shared workspace cleaning",
      "Kitchen and bathroom cleaning",
      "Floor vacuuming and mopping",
      "Trash collection",
      "Reception area cleaning",
    ],
    imageUrl: "",
    isActive: true,
  },
  {
    name: "Sofa and Upholstery Cleaning",
    slug: "sofa-upholstery-cleaning",
    shortDescription:
      "Focused cleaning for sofas, chairs, and upholstered furniture.",
    description:
      "Sofa and Upholstery Cleaning removes dust and surface dirt from upholstered furniture while helping restore a cleaner and fresher appearance.",
    category: "Specialized Cleaning",
    price: 45,
    durationMinutes: 120,
    features: [
      "Sofa surface cleaning",
      "Chair upholstery cleaning",
      "Dust and debris removal",
      "Cushion cleaning",
      "Final furniture inspection",
    ],
    imageUrl: "",
    isActive: true,
  },
  {
    name: "Post-Construction Cleaning",
    slug: "post-construction-cleaning",
    shortDescription:
      "Intensive cleaning after construction or renovation work.",
    description:
      "Post-Construction Cleaning removes construction dust, debris, marks, and surface residue after renovation or building work.",
    category: "Specialized Cleaning",
    price: 110,
    durationMinutes: 360,
    features: [
      "Construction dust removal",
      "Floor and surface cleaning",
      "Window frame cleaning",
      "Kitchen and bathroom cleaning",
      "Debris collection",
      "Final detailed inspection",
    ],
    imageUrl: "",
    isActive: true,
  },
];

async function seedServices() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing from the root .env.local file.",
    );
  }

  try {
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB Atlas.");

    const servicesCollection =
      mongoose.connection.collection("services");

    const currentDate = new Date();

    const operations = services.map((service) => ({
      updateOne: {
        filter: {
          slug: service.slug,
        },
        update: {
          $set: {
            ...service,
            updatedAt: currentDate,
          },
          $setOnInsert: {
            createdAt: currentDate,
          },
        },
        upsert: true,
      },
    }));

    const result =
      await servicesCollection.bulkWrite(operations);

    console.log("Services seeded successfully.");
    console.log(`New services: ${result.upsertedCount}`);
    console.log(`Updated services: ${result.modifiedCount}`);
    console.log(`Existing services: ${result.matchedCount}`);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seedServices().catch((error: unknown) => {
  console.error("Service seed failed:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
// One-off script to create the first admin account directly in the database.
// Admins are never created through the public /signup form (registerSchema
// only allows "customer" | "cleaner") — this script is the only way in.
//
// Setup:
//   npm install -D tsx dotenv
// Env (in .env.local):
//   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
// Run:
//   npm run seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";

const BCRYPT_SALT_ROUNDS = 12;

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!mongoUri) throw new Error("MONGODB_URI is missing from .env.local");
  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be set in .env.local before seeding"
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`An account already exists for ${email} (role: ${existing.role}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "admin",
    status: "active", // skips email verification entirely — seeded, not registered
  });

  console.log(`Admin account created: ${admin.email} (id: ${admin._id.toString()})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
