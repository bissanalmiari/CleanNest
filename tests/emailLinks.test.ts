import assert from "node:assert/strict";
import Module from "node:module";
import { test } from "node:test";

process.env.EMAIL_SERVER = "smtp://test:pass@example.test:587";
process.env.APP_URL = "https://app.example.test";

const messages: Array<{ html: string; text: string }> = [];
const moduleLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = (request, parent, isMain) => {
  if (request === "server-only") return {};
  if (request === "nodemailer") {
    return {
      createTransport: () => ({
        sendMail: async (message: (typeof messages)[number]) => {
          messages.push(message);
        },
      }),
    };
  }
  return originalLoad(request, parent, isMain);
};
const { sendOtpEmail } = require("../src/lib/email") as typeof import("../src/lib/email");
moduleLoader._load = originalLoad;

test("verification and reset emails keep OTPs in the body, outside links", async () => {
  await sendOtpEmail("jane@example.test", "123456", "verify-email");
  await sendOtpEmail("jane@example.test", "654321", "reset-password");

  assert.equal(messages.length, 2);
  assert.match(messages[0]?.text ?? "", /123456/);
  assert.match(messages[1]?.text ?? "", /654321/);
  for (const message of messages) {
    assert.doesNotMatch(message.html, /href="[^"]*otp=/);
    assert.doesNotMatch(message.text, /https:\/\/[^\s]*otp=/);
    assert.match(message.html, /https:\/\/app\.example\.test\//);
  }
});
