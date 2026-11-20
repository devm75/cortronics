/* Cortronics — shared footer contact and legal line */
(function () {
  "use strict";

  function render() {
    const site = window.CORTRONICS.site;
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-tagline]").forEach((el) => {
      el.textContent = site.tagline;
    });
    document.querySelectorAll("[data-footer-extra]").forEach((box) => {
      box.innerHTML = `
        <div class="footer-contact">
          <a href="mailto:${site.email}" class="footer-email"><span aria-hidden="true">✉</span> ${site.email}</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <span class="footer-location"><span aria-hidden="true">⌖</span> ${site.location}</span>
        </div>
        <div class="footer-legal">
          <span>© ${year} Cortronics. All rights reserved.</span>
          <span class="footer-love">Made with <span class="heart" aria-label="love">♥</span> in Punjab</span>
        </div>`;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
