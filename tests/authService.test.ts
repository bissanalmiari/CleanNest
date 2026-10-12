import assert from "node:assert/strict";
import Module from "node:module";
import { beforeEach, test } from "node:test";

process.env.AUTH_SECRET ??= "auth-rate-limit-test-secret";

type TestUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "customer";
  status: "pending_verification" | "active" | "suspended";
  preferredLanguage: "en";
  emailVerificationOtpHash: string | null;
  emailVerificationOtpExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
};

const users = new Map<string, TestUser>();
const rateLimitCounts = new Map<string, number>();
let deliveryError: Error | null = null;
let omitTimestamps = false;
const deliveredCodes: string[] = [];

const fakeUser = {
  findOne({ email }: { email: string }) {
    const result = users.get(email) ?? null;
    return {
      then: (resolve: (value: TestUser | null) => unknown) => Promise.resolve(resolve(result)),
      select: async () => result,
    };
  },
  async create(
    input: Omit<TestUser, "_id" | "createdAt" | "updatedAt" | "save" | "preferredLanguage">
  ) {
    const now = new Date();
    const user: TestUser = {
      ...input,
      _id: { toString: () => "new-user-id" },
      preferredLanguage: "en",
      createdAt: omitTimestamps ? (undefined as unknown as Date) : now,
      updatedAt: omitTimestamps ? (undefined as unknown as Date) : now,
      save: async () => {},
    };
    users.set(user.email, user);
    return user;
  },
};

const moduleLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = (request, parent, isMain) => {
  if (request === "server-only") return {};
  if (request === "@/lib/db") return { connectDB: async () => {} };
  if (request === "@/models/User") return { User: fakeUser };
  if (request === "@/lib/auth") return { signAuthToken: () => "test-token" };
  if (request === "@/models/AuthRateLimit") {
    return {
      AuthRateLimit: {
        init: async () => {},
        findOneAndUpdate: async ({ key }: { key: string }) => {
          const count = (rateLimitCounts.get(key) ?? 0) + 1;
          rateLimitCounts.set(key, count);
          return { count };
        },
      },
    };
  }
  if (request === "@/lib/email") {
    return {
      sendOtpEmail: async (_email: string, otp: string) => {
        if (deliveryError) throw deliveryError;
        deliveredCodes.push(otp);
      },
    };
  }
  return originalLoad(request, parent, isMain);
};
const { registerUser, verifyEmailOtp, loginUser, resendEmailVerificationOtp, resetPassword } =
  require("../src/services/authService") as typeof import("../src/services/authService");
moduleLoader._load = originalLoad;

const registration = {
  name: "Jane Doe",
  email: "jane@example.test",
  password: "Password123",
  confirmPassword: "Password123",
  role: "customer" as const,
};

beforeEach(() => {
  users.clear();
  rateLimitCounts.clear();
  deliveredCodes.length = 0;
  deliveryError = null;
  omitTimestamps = false;
});

test("a saved account is reported as created even if verification delivery fails", async () => {
  deliveryError = new Error("SMTP unavailable");

  const result = await registerUser(registration);

  assert.equal(result.user.email, registration.email);
  assert.equal(result.user.status, "pending_verification");
  assert.equal(result.verificationEmailSent, false);
  assert.equal(users.size, 1);
});

test("successful registration sends a usable verification code", async () => {
  const result = await registerUser(registration);
  const user = users.get(registration.email);
  const code = deliveredCodes[0];

  assert.equal(result.verificationEmailSent, true);
  assert.ok(code);
  assert.match(code, /^\d{6}$/);
  assert.ok(user?.emailVerificationOtpHash);
  assert.notEqual(user.emailVerificationOtpHash, code);
  assert.equal(
    (await verifyEmailOtp({ email: registration.email, otp: code })).user.status,
    "active"
  );
  assert.equal(
    (await loginUser({ email: registration.email, password: registration.password })).user.status,
    "active"
  );
});

test("registration still responds after mail delivery when the user document lacks timestamps", async () => {
  omitTimestamps = true;

  const result = await registerUser(registration);

  assert.equal(result.verificationEmailSent, true);
  assert.ok(Number.isFinite(Date.parse(result.user.createdAt)));
  assert.equal(deliveredCodes.length, 1);
});

test("duplicate registration does not create or resend an account", async () => {
  await registerUser(registration);

  await assert.rejects(
    registerUser(registration),
    (error: { statusCode?: number }) => error.statusCode === 409
  );
  assert.equal(users.size, 1);
  assert.equal(deliveredCodes.length, 1);
});

test("pending accounts cannot log in and can request a new code", async () => {
  await registerUser(registration);
  await assert.rejects(
    loginUser({ email: registration.email, password: registration.password }),
    (error: { statusCode?: number }) => error.statusCode === 403
  );

  const user = users.get(registration.email)!;
  user.emailVerificationOtpExpires = new Date(Date.now() - 1000);
  await resendEmailVerificationOtp({ email: registration.email });
  assert.equal(deliveredCodes.length, 2);
});

test("suspended accounts cannot be reactivated through verification or resend", async () => {
  await registerUser(registration);
  const user = users.get(registration.email)!;
  user.status = "suspended";
  const code = deliveredCodes[0];
  assert.ok(code);

  await assert.rejects(
    verifyEmailOtp({ email: registration.email, otp: code }),
    (error: { statusCode?: number }) => error.statusCode === 403
  );
  user.emailVerificationOtpExpires = new Date(Date.now() - 1_000);
  await assert.rejects(
    resendEmailVerificationOtp({ email: registration.email }),
    (error: { statusCode?: number }) => error.statusCode === 403
  );
  assert.equal(user.status, "suspended");
  assert.equal(deliveredCodes.length, 1);
});

test("failed resend reports delivery failure without activating or duplicating the account", async () => {
  await registerUser(registration);
  const user = users.get(registration.email)!;
  user.emailVerificationOtpExpires = new Date(Date.now() - 1000);
  deliveryError = new Error("SMTP unavailable");

  await assert.rejects(
    resendEmailVerificationOtp({ email: registration.email }),
    (error: { statusCode?: number }) => error.statusCode === 503
  );
  assert.equal(user.status, "pending_verification");
  assert.equal(users.size, 1);
});

test("an account recovers from failed initial delivery through resend and verification", async () => {
  deliveryError = new Error("SMTP unavailable");
  const registrationResult = await registerUser(registration);
  assert.equal(registrationResult.verificationEmailSent, false);

  deliveryError = null;
  users.get(registration.email)!.emailVerificationOtpExpires = new Date(Date.now() - 1000);
  await resendEmailVerificationOtp({ email: registration.email });
  assert.equal(deliveredCodes.length, 1);

  const code = deliveredCodes[0];
  assert.ok(code);
  const verified = await verifyEmailOtp({ email: registration.email, otp: code });
  assert.equal(verified.user.status, "active");
  assert.equal(
    (await loginUser({ email: registration.email, password: registration.password })).user.status,
    "active"
  );
  assert.equal(users.size, 1);
});

test("verification rejects guesses after five attempts for one account", async () => {
  await registerUser(registration);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(
      verifyEmailOtp({ email: registration.email, otp: "000000" }),
      (error: { statusCode?: number }) => error.statusCode === 400
    );
  }
  await assert.rejects(
    verifyEmailOtp({ email: registration.email, otp: "111111" }),
    (error: { statusCode?: number }) => error.statusCode === 429
  );
  assert.equal(users.get(registration.email)?.status, "pending_verification");
});

test("login rejects repeated password guesses", async () => {
  await registerUser(registration);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await assert.rejects(
      loginUser({ email: registration.email, password: "WrongPassword123" }),
      (error: { statusCode?: number }) => error.statusCode === 401
    );
  }
  await assert.rejects(
    loginUser({ email: registration.email, password: registration.password }),
    (error: { statusCode?: number }) => error.statusCode === 429
  );
});

test("password reset rejects repeated code guesses", async () => {
  await registerUser(registration);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(
      resetPassword({
        email: registration.email,
        otp: "000000",
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      }),
      (error: { statusCode?: number }) => error.statusCode !== 429
    );
  }
  await assert.rejects(
    resetPassword({
      email: registration.email,
      otp: "111111",
      newPassword: "NewPassword123",
      confirmNewPassword: "NewPassword123",
    }),
    (error: { statusCode?: number }) => error.statusCode === 429
  );
});

test("concurrent resend requests send at most one new code", async () => {
  await registerUser(registration);
  users.get(registration.email)!.emailVerificationOtpExpires = new Date(Date.now() - 1000);

  const results = await Promise.allSettled([
    resendEmailVerificationOtp({ email: registration.email }),
    resendEmailVerificationOtp({ email: registration.email }),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(deliveredCodes.length, 2);
});

test("resend rejects a sixth request within an hour", async () => {
  const realNow = Date.now;
  let clock = Math.floor(realNow() / 3_600_000) * 3_600_000 + 1_000;
  Date.now = () => clock;
  try {
    await registerUser(registration);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      clock += 61_000;
      users.get(registration.email)!.emailVerificationOtpExpires = new Date(clock - 1_000);
      await resendEmailVerificationOtp({ email: registration.email });
    }
    clock += 61_000;
    users.get(registration.email)!.emailVerificationOtpExpires = new Date(clock - 1_000);

    await assert.rejects(
      resendEmailVerificationOtp({ email: registration.email }),
      (error: { statusCode?: number }) => error.statusCode === 429
    );
    assert.equal(deliveredCodes.length, 6);
  } finally {
    Date.now = realNow;
  }
});
