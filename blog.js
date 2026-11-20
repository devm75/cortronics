/* Cortronics blog — article list, topic filters and in-page reader */
(function () {
  "use strict";

  const DATA = window.CORTRONICS;
  const B = window.CortronicsBlog;
  const posts = DATA.blogPosts;
  const state = { topic: "all" };

  const $ = (s) => document.querySelector(s);
  const esc = B.esc;

  function setup() {
    const topics = [...new Set(posts.map((p) => p.category))].sort();
    $("#blog-hero-meta").innerHTML = `
      <span><strong>${posts.length}</strong> articles</span>
      <span><strong>${topics.length}</strong> topics</span>
      <span><strong>100%</strong> bench-tested opinion</span>`;

    $("#topic-filters").innerHTML =
      [{ id: "all", label: "All topics" }]
        .concat(topics.map((t) => ({ id: t, label: t })))
        .map((t) => `<button class="topic-chip${state.topic === t.id ? " active" : ""}" data-topic="${esc(t.id)}" type="button">${esc(t.label)}</button>`)
        .join("");

    $("#topic-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-topic]");
      if (!btn) return;
      state.topic = btn.dataset.topic;
      document.querySelectorAll(".topic-chip").forEach((c) => c.classList.toggle("active", c === btn));
      renderList();
    });

    $("#back-to-blog").addEventListener("click", () => {
      history.pushState(null, "", location.pathname + location.search);
      syncView();
    });

    window.addEventListener("popstate", syncView);
    window.addEventListener("hashchange", syncView);

    renderList();
    syncView();
  }

  function renderList() {
    const list = state.topic === "all" ? posts : posts.filter((p) => p.category === state.topic);
    $("#post-grid").innerHTML = list.map((p) => B.card(p, "#")).join("");
    $("#blog-results-count").textContent =
      `${list.length} of ${posts.length} articles` +
      (state.topic === "all" ? "" : ` · ${state.topic}`);
  }

  function syncView() {
    const match = /^#post-(.+)$/.exec(location.hash);
    const post = match ? posts.find((p) => p.id === match[1]) : null;
    if (post) {
      $("#blog-list-view").hidden = true;
      $("#article-view").hidden = false;
      $("#article-content").innerHTML = articleHtml(post);
      $("#article-bottom").innerHTML = nextPostHtml(post);
      document.title = post.title + " · Cortronics Blog";
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      $("#blog-list-view").hidden = false;
      $("#article-view").hidden = true;
      $("#article-content").innerHTML = "";
      $("#article-bottom").innerHTML = "";
      document.title = "Field Notes · Cortronics Blog";
    }
  }

  function articleHtml(post) {
    const tags = post.tags.map((t) => {
      const found = DATA.skills.find((s) => s.id === t);
      return `<span class="post-tag">${esc(found ? found.label : t)}</span>`;
    }).join("");

    return `
      <header class="article-head">
        <div class="post-card-top">
          <span class="post-cat">${esc(post.category)}</span>
          <span class="post-read">${esc(post.read)} read</span>
        </div>
        <h1>${esc(post.title)}</h1>
        <p class="article-excerpt">${esc(post.excerpt)}</p>
        <div class="article-meta">
          <span>${esc(B.fmtDate(post.date))}</span>
          <span class="meta-sep">·</span>
          <span>${esc(post.read)} read</span>
        </div>
        <div class="post-tags">${tags}</div>
      </header>
      <div class="article-body">
        ${post.body.map(blockHtml).join("")}
      </div>`;
  }

  function blockHtml(block) {
    if (block.type === "h2") return `<h2>${esc(block.text)}</h2>`;
    if (block.type === "list") return `<ul>${block.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    if (block.type === "callout") return `<aside class="article-callout"><span class="callout-label">SCOPE NOTE</span><p>${esc(block.text)}</p></aside>`;
    return `<p>${esc(block.text)}</p>`;
  }

  function nextPostHtml(post) {
    const i = posts.indexOf(post);
    const next = posts[(i + 1) % posts.length];
    return `
      <div class="next-post-label">Up next</div>
      ${B.card(next, "#")}`;
  }

  setup();
})();
