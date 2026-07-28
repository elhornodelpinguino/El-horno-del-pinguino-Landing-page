import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, it } from "vitest";
it("does not emit the local analytics fixture route in production", () => {
  const build = (fixtures: string) => execFileSync("npm", ["run", "build"], { cwd: process.cwd(), env: { ...process.env, ENABLE_E2E_FIXTURES: fixtures }, stdio: "ignore" });
  build("true"); expect(existsSync("dist/e2e-fixtures")).toBe(true);
  build("");
  expect(existsSync("dist/count/index.html")).toBe(false); expect(existsSync("dist/e2e-fixtures")).toBe(false);
}, 15_000);
