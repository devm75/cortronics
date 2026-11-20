/* Shared blog post card rendering (used by index.html and blog.html) */
window.CortronicsBlog = (function () {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);

  function fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function card(post, base) {
    const href = (base || "blog.html?post=") + post.id;
    return `<a class="post-card" href="${esc(href)}">
      <div class="post-card-top">
        <span class="post-cat">${esc(post.category)}</span>
        <span class="post-read">${esc(post.read)} read</span>
      </div>
      <h3>${esc(post.title)}</h3>
      <p>${esc(post.excerpt)}</p>
      <div class="post-card-foot">
        <span>${esc(fmtDate(post.date))}</span>
        <span class="post-cta">Read article <span aria-hidden="true">→</span></span>
      </div>
    </a>`;
  }

  return { esc, fmtDate, card };
})();
