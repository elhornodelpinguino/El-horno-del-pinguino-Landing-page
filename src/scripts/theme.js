// Light/dark theme. The first paint is handled by the inline script in
// BaseLayout's <head> (same rules as resolveTheme, duplicated because inline
// scripts cannot import); this module wires the sun/moon toggle and keeps
// following the system while the visitor has not chosen.

export const THEME_STORAGE_KEY = "horno-theme";

/**
 * @param {string | null} stored value from localStorage
 * @param {boolean} prefersDark system preference
 * @returns {"light" | "dark"}
 */
export function resolveTheme(stored, prefersDark) {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

/** @param {"light" | "dark"} theme */
export function nextTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}

/** The button names what it will do, not the current state. */
export function toggleLabel(theme) {
  return theme === "dark" ? "Activar modo claro" : "Activar modo oscuro";
}

function readStored() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode, policies): follow the system
  }
}

function apply(theme, toggles) {
  document.documentElement.dataset.theme = theme;
  for (const toggle of toggles) toggle.setAttribute("aria-label", toggleLabel(theme));
}

export function initThemeToggle(root = document) {
  const toggles = [...root.querySelectorAll("[data-theme-toggle]")];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  apply(resolveTheme(readStored(), media.matches), toggles);

  for (const toggle of toggles) {
    toggle.addEventListener("click", () => {
      const theme = nextTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Not persisted, but the switch still applies for this page view.
      }
      apply(theme, toggles);
    });
  }

  media.addEventListener("change", (event) => {
    if (readStored() === null) apply(resolveTheme(null, event.matches), toggles);
  });
}
