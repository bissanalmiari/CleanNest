import assert from "node:assert/strict";
import Module from "node:module";
import { test } from "node:test";

const moduleLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = (request, parent, isMain) =>
  request === "server-only" ? {} : originalLoad(request, parent, isMain);
const { sendEmail } = require("../src/lib/email") as typeof import("../src/lib/email");
moduleLoader._load = originalLoad;

test("an unconfigured email transport does not report delivery", async () => {
  assert.equal(process.env.EMAIL_SERVER, undefined);

  await assert.rejects(
    sendEmail({ to: "customer@example.test", subject: "Verify", html: "<p>123456</p>" }),
    /Email service is not configured/
  );
});
