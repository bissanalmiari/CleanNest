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
import mongoose from "mongoose";
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
