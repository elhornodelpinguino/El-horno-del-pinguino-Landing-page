import { describe, it, expect } from "vitest";

import { THEME_STORAGE_KEY, nextTheme, resolveTheme, toggleLabel } from "./theme.js";

describe("resolveTheme", () => {
  it("follows the system when the visitor never chose", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("keeps the visitor's stored choice over the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("ignores a corrupted stored value and falls back to the system", () => {
    expect(resolveTheme("purple", true)).toBe("dark");
    expect(resolveTheme("", false)).toBe("light");
  });
});

describe("nextTheme", () => {
  it("flips between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("toggleLabel", () => {
  it("names the action the button will perform, not the current state", () => {
    expect(toggleLabel("light")).toBe("Activar modo oscuro");
    expect(toggleLabel("dark")).toBe("Activar modo claro");
  });
});

it("stores the choice under a stable key", () => {
  expect(THEME_STORAGE_KEY).toBe("horno-theme");
});
