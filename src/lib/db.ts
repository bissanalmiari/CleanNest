import "server-only";
import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached =
  globalForMongoose.mongooseCache ??
  (globalForMongoose.mongooseCache = {
    connection: null,
    promise: null,
  });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.connection) {
    return cached.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from .env.local");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri);
  }

  try {
    cached.connection = await cached.promise;
    return cached.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}