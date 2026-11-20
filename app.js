/* Cortronics — rendering, sidebar filtering and interaction */
(function () {
  "use strict";

  const DATA = window.CORTRONICS;
  const projects = DATA.projects;
  const state = {
    volume: "all",
    level: "all",
    skill: "all",
    query: "",
    sort: "volume",
    expanded: new Set(),
  };

  const $ = (sel) => document.querySelector(sel);
  const grid = $("#project-grid");

  /* ---------- helpers ---------- */
  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  const levelLabel = (id) => DATA.levels.find((l) => l.id === id)?.label || id;
  const skillLabel = (id) => DATA.skills.find((s) => s.id === id)?.label || id;
  const projectTotal = (p) => p.components.reduce((sum, c) => sum + (c.cost || 0), 0);
  const byLevelOrder = (a, b) =>
    DATA.levels.findIndex((l) => l.id === a.level) - DATA.levels.findIndex((l) => l.id === b.level);

  const BASIS_LABEL = { listed: "listed", kit: "kit", estimate: "est." };
  const BASIS_NOTE = {
    listed:
      "Prices marked <span class='basis-pill listed'>listed</span> come straight from the Vol. 2 blueprint shopping list. " +
      "<span class='basis-pill kit'>kit</span> and <span class='basis-pill estimate'>est.</span> items are indicative additions needed to complete the build. " +
      "Shared parts appear in more than one project.",
    indicative:
      "The blueprints list the components for this build but no prices. Every figure above is an " +
      "<span class='basis-pill estimate'>indicative</span> INR retail estimate — verify against current local pricing before ordering.",
  };

  /* ---------- one-time setup ---------- */
  function setup() {
    const totals = projects.map(projectTotal);
    const itemCount = projects.reduce((n, p) => n + p.components.length, 0);

    $("#stat-projects").textContent = projects.length;
    $("#stat-components").textContent = itemCount;
    $("#stat-range").textContent = `${inr(Math.min(...totals))} – ${inr(Math.max(...totals))}`;
    $("#hero-project-count").textContent = String(projects.length).padStart(2, "0") + " indexed";
    $("#hero-component-count").textContent = itemCount + " tracked";

    renderSidebar();
    renderShoppingList();
    renderKit();
    renderTools();
    renderBlogTeaser();
    renderSources();
    render();

    window.addEventListener("cortronics-themechange", () => render());

    // top controls
    $("#search").addEventListener("input", (e) => {
      state.query = e.target.value.trim().toLowerCase();
      render();
    });
    $("#sort").addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });

    // sidebar filters (delegated)
    $("#sidebar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-level], [data-skill], [data-volume]");
      if (!btn) return;
      if (btn.dataset.level !== undefined) state.level = btn.dataset.level;
      if (btn.dataset.skill !== undefined) state.skill = btn.dataset.skill;
      if (btn.dataset.volume !== undefined) state.volume = btn.dataset.volume;
      renderSidebar();
      render();
    });

    // active-filter chips
    $("#active-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-clear]");
      if (!btn) return;
      const key = btn.dataset.clear;
      if (key === "query") {
        state.query = "";
        $("#search").value = "";
      } else {
        state[key] = "all";
      }
      renderSidebar();
      render();
    });

    // reset buttons
    document.querySelectorAll("#reset-filters, .js-reset").forEach((btn) =>
      btn.addEventListener("click", resetFilters)
    );

    // mobile sidebar
    $("#filter-toggle").addEventListener("click", () => {
      const open = $("#sidebar").classList.toggle("open");
      $("#filter-toggle").setAttribute("aria-expanded", String(open));
    });
    $("#sidebar-close").addEventListener("click", closeSidebar);

    $("#expand-all").addEventListener("click", () => {
      const visible = getVisible();
      const allOpen = visible.every((p) => state.expanded.has(p.id));
      if (allOpen) visible.forEach((p) => state.expanded.delete(p.id));
      else visible.forEach((p) => state.expanded.add(p.id));
      render();
    });

    // card actions
    grid.addEventListener("click", (e) => {
      const toggle = e.target.closest(".card-toggle");
      if (toggle) {
        const id = toggle.closest(".card").dataset.id;
        if (state.expanded.has(id)) state.expanded.delete(id);
        else state.expanded.add(id);
        render();
        return;
      }
      const copy = e.target.closest(".copy-btn");
      if (copy) {
        copyBom(projects.find((p) => p.id === copy.closest(".card").dataset.id), copy);
        return;
      }
      const diagTab = e.target.closest(".diagram-tab");
      if (diagTab) {
        const section = diagTab.closest(".diagram-section");
        const which = diagTab.dataset.diagram;
        section.querySelectorAll(".diagram-tab").forEach((b) => b.classList.toggle("active", b === diagTab));
        section.querySelectorAll(".diagram-frame").forEach((f) => (f.hidden = f.dataset.diagramView !== which));
        const dl = section.querySelector(".diagram-download");
        dl.dataset.download = which;
        dl.textContent = "↓ " + (which === "schematic" ? "Schematic" : "Board") + " SVG";
        return;
      }
      const dlBtn = e.target.closest(".diagram-download");
      if (dlBtn) {
        const card = dlBtn.closest(".card");
        const project = projects.find((p) => p.id === card.dataset.id);
        const frame = dlBtn.closest(".diagram-section").querySelector(`.diagram-frame[data-diagram-view="${dlBtn.dataset.download}"] svg`);
        downloadSvg(frame, project.title + " " + dlBtn.dataset.download);
      }
    });
  }

  function resetFilters() {
    Object.assign(state, { volume: "all", level: "all", skill: "all", query: "", sort: "volume" });
    $("#search").value = "";
    $("#sort").value = "volume";
    renderSidebar();
    render();
    closeSidebar();
  }

  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#filter-toggle").setAttribute("aria-expanded", "false");
  }

  /* ---------- sidebar ---------- */
  function renderSidebar() {
    const levelRows = [{ id: "all", label: "All levels", note: "Every project" }]
      .concat(DATA.levels)
      .map((l) => {
        const count = l.id === "all" ? projects.length : projects.filter((p) => p.level === l.id).length;
        return sideRow("level", l.id, l.label, l.note, count, state.level === l.id);
      }).join("");

    const volumeRows = [{ id: "all", short: "All blueprints", full: "All three volumes" }]
      .concat(Object.entries(DATA.volumes).map(([id, v]) => ({ id, short: v.short, full: "Vol. " + id.slice(1) })))
      .map((v) => {
        const count = v.id === "all" ? projects.length : projects.filter((p) => p.volume === v.id).length;
        return sideRow("volume", v.id, v.short, v.full, count, state.volume === v.id);
      }).join("");

    const skillRows = DATA.skills.map((s) => {
      const count = projects.filter((p) => p.skills.includes(s.id)).length;
      return `<button class="skill-item${state.skill === s.id ? " active" : ""}" data-skill="${esc(s.id)}" type="button">
        <span>${esc(s.label)}</span><span class="side-count">${count}</span>
      </button>`;
    }).join("");

    $("#level-nav").innerHTML = levelRows;
    $("#volume-nav").innerHTML = volumeRows;
    $("#skill-nav").innerHTML = skillRows;
  }

  function sideRow(type, id, label, note, count, active) {
    return `<button class="side-item${active ? " active" : ""}" data-${type}="${esc(id)}" type="button">
      <span class="side-item-copy">
        <span class="side-item-title"><span class="level-dot ${esc(id)}"></span>${esc(label)}</span>
        <span class="side-item-note">${esc(note)}</span>
      </span>
      <span class="side-count">${count}</span>
    </button>`;
  }

  /* ---------- filtering ---------- */
  function getVisible() {
    let list = projects.filter((p) => {
      if (state.volume !== "all" && p.volume !== state.volume) return false;
      if (state.level !== "all" && p.level !== state.level) return false;
      if (state.skill !== "all" && !p.skills.includes(state.skill)) return false;
      if (state.query) {
        const haystack = [
          p.title, p.section, p.category, p.description, levelLabel(p.level),
          ...p.skills.map(skillLabel),
          ...p.highlights,
          ...p.components.map((c) => c.name),
        ].join(" ").toLowerCase();
        if (!haystack.includes(state.query)) return false;
      }
      return true;
    });

    if (state.sort === "cost-asc") list.sort((a, b) => projectTotal(a) - projectTotal(b));
    else if (state.sort === "cost-desc") list.sort((a, b) => projectTotal(b) - projectTotal(a));
    else if (state.sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.sort === "path") list.sort((a, b) => byLevelOrder(a, b) || projects.indexOf(a) - projects.indexOf(b));
    else list.sort((a, b) => projects.indexOf(a) - projects.indexOf(b));

    return list;
  }

  /* ---------- rendering ---------- */
  function render() {
    const list = getVisible();
    grid.innerHTML = list.map(cardHtml).join("");
    $("#empty-state").hidden = list.length > 0;
    $("#results-count").textContent =
      `${list.length} of ${projects.length} projects` +
      (state.query ? ` · matching “${state.query}”` : "");

    const allOpen = list.length > 0 && list.every((p) => state.expanded.has(p.id));
    $("#expand-all").textContent = allOpen ? "Collapse all" : "Expand all";
    renderActiveFilters();
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.level !== "all") chips.push(["level", "Level: " + levelLabel(state.level)]);
    if (state.skill !== "all") chips.push(["skill", "Skill: " + skillLabel(state.skill)]);
    if (state.volume !== "all") chips.push(["volume", DATA.volumes[state.volume].short]);
    if (state.query) chips.push(["query", `“${state.query}”`]);

    const box = $("#active-filters");
    box.innerHTML = chips.length
      ? `<span class="active-label">Active filters</span>` +
        chips.map(([key, label]) => `<button class="filter-chip" data-clear="${esc(key)}" type="button">${esc(label)} <span aria-hidden="true">×</span></button>`).join("")
      : "";
    box.hidden = chips.length === 0;
  }

  function cardHtml(p) {
    const vol = DATA.volumes[p.volume];
    const isOpen = state.expanded.has(p.id);
    const total = projectTotal(p);
    return `
      <article id="${esc(p.id)}" class="card${isOpen ? " expanded" : ""}" data-id="${esc(p.id)}" data-volume="${esc(p.volume)}">
        <div class="card-main">
          <div class="card-top">
            <span class="vol-badge">${esc(vol.short)}</span>
            <span class="level-badge ${esc(p.level)}">${esc(levelLabel(p.level))}</span>
          </div>
          <div class="card-section">${esc(p.section)}</div>
          <h3>${esc(p.title)}</h3>
          <p class="card-desc">${esc(p.description)}</p>
          <div class="card-tags">
            <span class="tag cat">${esc(p.category)}</span>
            ${p.skills.map((s) => `<span class="tag skill">${esc(skillLabel(s))}</span>`).join("")}
          </div>
          <div class="card-foot">
            <div class="cost-block">
              <span class="cost-label">Estimated build cost</span>
              <span class="cost-value"><span class="approx">≈</span>${inr(total)}</span>
              <span class="cost-foot">${p.priceBasis === "listed" ? "blueprint quotes + estimates" : "indicative estimate"}</span>
            </div>
            <button class="card-toggle" type="button" aria-expanded="${isOpen}">
              ${isOpen ? "Hide details" : "Components &amp; BOM"}<span class="chev" aria-hidden="true">⌄</span>
            </button>
          </div>
        </div>
        ${isOpen ? detailHtml(p) : ""}
      </article>`;
  }

  function detailHtml(p) {
    const rows = p.components.map((c) => `
      <tr>
        <td>${esc(c.name)}${c.note ? `<span class="comp-note">${esc(c.note)}</span>` : ""}</td>
        <td class="qty">${esc(c.qty)}</td>
        <td><span class="basis-pill ${esc(c.basis)}">${BASIS_LABEL[c.basis] || esc(c.basis)}</span></td>
        <td class="num">${c.cost ? inr(c.cost) : "—"}</td>
      </tr>`).join("");

    return `
      <div class="card-detail">
        <div>
          <div class="detail-title">Profile · ${esc(p.difficulty)} · ${esc(p.category)}</div>
          <ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
          <div class="detail-title">Price basis</div>
          <p class="basis-note">${BASIS_NOTE[p.priceBasis]}</p>
        </div>
        <div>
          <div class="detail-title">Bill of materials</div>
          <table class="bom-mini">
            <thead><tr><th>Component</th><th>Qty</th><th>Basis</th><th style="text-align:right">Est. INR</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="3">Estimated total</td><td class="num">${inr(projectTotal(p))}</td></tr></tfoot>
          </table>
          <div class="detail-actions">
            <button class="copy-btn" type="button">Copy BOM to clipboard</button>
          </div>
        </div>
      </div>
      ${diagramHtml(p)}`;
  }

  function diagramHtml(p) {
    const dg = window.CortronicsDiagrams && window.CortronicsDiagrams.forProject(p.id, p.title);
    if (!dg) return "";
    return `
      <section class="diagram-section" aria-label="Schematic and board diagrams">
        <div class="detail-title">Schematic &amp; board layout</div>
        <div class="diagram-tabs">
          <button class="diagram-tab active" data-diagram="schematic" type="button">Schematic</button>
          <button class="diagram-tab" data-diagram="board" type="button">Board layout</button>
          <div class="diagram-actions">
            <button class="diagram-download" data-download="schematic" type="button">↓ Schematic SVG</button>
          </div>
        </div>
        <div class="diagram-frame" data-diagram-view="schematic">${dg.schematic}</div>
        <div class="diagram-frame" data-diagram-view="board" hidden>${dg.board}</div>
        <p class="diagram-caption"><strong>Design note</strong> ${esc(dg.note)}</p>
        <div class="diagram-zones">${dg.zones.map((z) => `<span class="diagram-zone">${esc(z)}</span>`).join("")}</div>
      </section>`;
  }

  function downloadSvg(svg, name) {
    if (!svg) return;
    const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderShoppingList() {
    const rows = DATA.shoppingList.map((c) => `
      <tr>
        <td>${esc(c.component)}</td>
        <td>${esc(c.qty)}</td>
        <td>${inr(c.cost)}${c.qty.includes("–") ? " ea" : ""}</td>
        <td>${esc(c.target)}</td>
      </tr>`).join("");
    const total = DATA.shoppingList.reduce((n, c) => n + c.cost, 0);
    $("#shopping-list-body").innerHTML = rows;
    $("#shopping-list-foot").innerHTML = `
      <tr>
        <td>Total — one of each listed item</td>
        <td>—</td>
        <td>${inr(total)}</td>
        <td>+${inr(550)} if a 2nd ESP32-CAM is needed</td>
      </tr>`;
  }

  function renderKit() {
    $("#kit-grid").innerHTML = DATA.coreKit.map((k, i) => `
      <article class="kit-card">
        <div class="kit-num">KIT / ${String(i + 1).padStart(2, "0")}</div>
        <h3>${esc(k.category)}</h3>
        <p>${esc(k.items)}</p>
      </article>`).join("");
  }

  function renderTools() {
    const LEVEL = { required: "Must have", recommended: "Recommended", optional: "Optional" };
    $("#tools-grid").innerHTML = DATA.prereqTools.map((g, i) => `
      <article class="tool-group">
        <div class="tool-group-head">
          <div class="tool-group-num">TOOLS / ${String(i + 1).padStart(2, "0")}</div>
          <h3>${esc(g.group)}</h3>
          <p>${esc(g.note)}</p>
        </div>
        <ul class="tool-list">
          ${g.items.map((t) => `
            <li class="tool-row">
              <div class="tool-name">${esc(t.name)}</div>
              <div class="tool-meta">
                <span class="level-pill ${esc(t.level)}">${LEVEL[t.level] || esc(t.level)}</span>
                <span class="tool-cost">${esc(t.cost)}</span>
              </div>
              <div class="tool-purpose">${esc(t.purpose)}</div>
            </li>`).join("")}
        </ul>
      </article>`).join("");
  }

  function renderBlogTeaser() {
    $("#blog-teaser-grid").innerHTML = DATA.blogPosts
      .slice(0, 3)
      .map((post) => window.CortronicsBlog.card(post, "blog.html?post="))
      .join("");
  }

  function renderSources() {
    $("#source-links").innerHTML = Object.values(DATA.volumes).map((v) => `
      <a class="source-link" href="${esc(v.file)}" target="_blank" rel="noopener">${esc(v.full)} ↗</a>`).join("");
  }

  function copyBom(p, btn) {
    if (!p) return;
    const lines = [
      `${p.title} — estimated ${inr(projectTotal(p))}`,
      "",
      ...p.components.map((c) => `- ${c.qty} × ${c.name}${c.cost ? ` — ${inr(c.cost)}` : ""}`),
      `TOTAL: ${inr(projectTotal(p))}`,
    ];
    const text = lines.join("\n");
    const done = () => {
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = old), 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  setup();
})();
