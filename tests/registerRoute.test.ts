import assert from "node:assert/strict";
import Module from "node:module";
import { test } from "node:test";

let verificationEmailSent = false;
let registrationError: Error | null = null;
const moduleLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = (request, parent, isMain) => {
  if (request === "@/lib/authRateLimit") {
    return { enforceAuthRequestRateLimit: async () => {} };
  }
  if (request === "@/services/authService") {
    return {
      registerUser: async () => {
        if (registrationError) throw registrationError;
        return {
          user: { email: "jane@example.test", status: "pending_verification" },
          verificationEmailSent,
        };
      },
    };
  }
  return originalLoad(request, parent, isMain);
};
const { POST } =
  require("../src/app/api/auth/register/route") as typeof import("../src/app/api/auth/register/route");
const { ConflictError } = require("../src/lib/apiError") as typeof import("../src/lib/apiError");
moduleLoader._load = originalLoad;

const input = {
  name: "Jane Doe",
  email: "jane@example.test",
  password: "Password123",
  confirmPassword: "Password123",
  role: "customer",
};

test("registration responds 201 without claiming delivery when email failed", async () => {
  verificationEmailSent = false;
  registrationError = null;
  const response = await POST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }) as Parameters<typeof POST>[0]
  );
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.verificationEmailSent, false);
  assert.match(body.data.message, /couldn't confirm/i);
});

test("registration responds 201 with check-email guidance after delivery", async () => {
  verificationEmailSent = true;
  registrationError = null;
  const response = await POST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }) as Parameters<typeof POST>[0]
  );
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.data.verificationEmailSent, true);
  assert.match(body.data.message, /check your email/i);
});

test("duplicate registration returns 409 with a clear message", async () => {
  registrationError = new ConflictError("An account with this email already exists");
  const response = await POST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }) as Parameters<typeof POST>[0]
  );
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.match(body.error, /already exists/i);
});

test("unexpected registration errors stay on the server", async () => {
  registrationError = new Error("private database detail");
  const originalError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);
  try {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }) as Parameters<typeof POST>[0]
    );
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error, "Internal server error");
    assert.ok(logged.length > 0);
    assert.ok(!JSON.stringify(body).includes("private database detail"));
  } finally {
    console.error = originalError;
    registrationError = null;
  }
});
