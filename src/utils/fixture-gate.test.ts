import { describe, it, expect } from "vitest";
import { fixturePathsFor } from "./fixture-gate";

describe("fixturePathsFor", () => {
  it("returns no paths when the env var is undefined", () => {
    expect(fixturePathsFor(undefined)).toEqual([]);
  });

  it("returns no paths when the env var is an empty string", () => {
    expect(fixturePathsFor("")).toEqual([]);
  });

  it("returns fixture params for counts 0, 1, 6 when enabled", () => {
    expect(fixturePathsFor("true")).toEqual([
      { params: { count: "0" } },
      { params: { count: "1" } },
      { params: { count: "6" } },
    ]);
  });
});
