/* Cortronics — theme switcher (dark → light → blueprint) */
(function () {
  "use strict";

  const THEMES = [
    { id: "dark", label: "Dark", icon: "☾" },
    { id: "light", label: "Light", icon: "☀" },
    { id: "blueprint", label: "Blueprint", icon: "▦" },
  ];
  const KEY = "cortronics-theme";

  function current() {
    const stored = localStorage.getItem(KEY);
    return THEMES.find((t) => t.id === stored) ? stored : "dark";
  }

  function apply(id, persist) {
    const theme = THEMES.find((t) => t.id === id) || THEMES[0];
    document.documentElement.dataset.theme = theme.id;
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.querySelector(".theme-icon").textContent = theme.icon;
      btn.querySelector(".theme-name").textContent = theme.label;
      btn.setAttribute("aria-label", "Theme: " + theme.label + ". Click to change.");
      btn.title = "Theme: " + theme.label;
    }
    if (persist) {
      try { localStorage.setItem(KEY, theme.id); } catch (e) { /* ignore */ }
    }
    window.dispatchEvent(new CustomEvent("cortronics-themechange", { detail: theme.id }));
  }

  function init() {
    apply(current(), false);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const i = THEMES.findIndex((t) => t.id === current());
        apply(THEMES[(i + 1) % THEMES.length].id, true);
      });
    }
  }

  init();
})();
