import assert from "node:assert/strict";
import Module from "node:module";
import { afterEach, test } from "node:test";

const counts = new Map<string, number>();
const moduleLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = (request, parent, isMain) => {
  if (request === "server-only") return {};
  if (request === "@/lib/db") return { connectDB: async () => {} };
  if (request === "@/models/AuthRateLimit") {
    return {
      AuthRateLimit: {
        init: async () => {},
        findOneAndUpdate: async ({ key }: { key: string }) => {
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          return { count };
        },
      },
    };
  }
  return originalLoad(request, parent, isMain);
};
const { enforceAuthRequestRateLimit } =
  require("../src/lib/authRateLimit") as typeof import("../src/lib/authRateLimit");
moduleLoader._load = originalLoad;

const previousVercel = process.env.VERCEL;
const previousSecret = process.env.AUTH_SECRET;
afterEach(() => {
  counts.clear();
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  if (previousSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousSecret;
});

test("untrusted forwarded IP is ignored outside Vercel", async () => {
  delete process.env.VERCEL;
  process.env.AUTH_SECRET = "test-secret";
  const request = new Request("http://localhost/api/auth/verify-email", {
    headers: { "x-vercel-forwarded-for": "203.0.113.1" },
  });

  await enforceAuthRequestRateLimit(request, "verify-email", 1, 60_000);
  await enforceAuthRequestRateLimit(request, "verify-email", 1, 60_000);
  assert.equal(counts.size, 0);
});

test("Vercel edge IP receives an atomic shared limit", async () => {
  process.env.VERCEL = "1";
  process.env.AUTH_SECRET = "test-secret";
  const request = new Request("http://localhost/api/auth/verify-email", {
    headers: { "x-vercel-forwarded-for": "203.0.113.1" },
  });

  await enforceAuthRequestRateLimit(request, "verify-email", 1, 60_000);
  await assert.rejects(
    enforceAuthRequestRateLimit(request, "verify-email", 1, 60_000),
    (error: { statusCode?: number }) => error.statusCode === 429
  );
  assert.equal(counts.size, 1);
  assert.ok(!Array.from(counts.keys())[0]?.includes("203.0.113.1"));
});
