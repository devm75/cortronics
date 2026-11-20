/* Cortronics — dependency-free SVG schematic & board sketch renderer.
 * All colours are resolved from CSS custom properties at render time so the
 * diagrams follow the active theme and exported SVGs are self-contained.
 */
(function () {
  "use strict";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fallback) => (cs.getPropertyValue(name) || "").trim() || fallback;
    return {
      bg: v("--d-bg", "#0b1118"),
      grid: v("--d-grid", "#1c2836"),
      block: v("--d-block", "#141e29"),
      stroke: v("--d-stroke", "#33465c"),
      text: v("--d-text", "#e7eef5"),
      muted: v("--d-muted", "#93a4b8"),
      power: v("--d-power", "#f5b942"),
      signal: v("--d-signal", "#2dd4bf"),
      mains: v("--d-mains", "#fb7185"),
      rf: v("--d-rf", "#a78bfa"),
      measure: v("--d-measure", "#38bdf8"),
      analog: v("--d-analog", "#5eead4"),
      load: v("--d-load", "#4ade80"),
      board: v("--d-board", "#0f2a24"),
      boardEdge: v("--d-board-edge", "#2dd4bf"),
    };
  }

  function kindColor(kind, p) {
    return ({
      power: p.power, protection: p.mains, analog: p.analog, passive: p.muted,
      sensor: p.measure, mcu: p.signal, load: p.load, io: p.measure,
      comm: p.rf, mains: p.mains,
    })[kind] || p.stroke;
  }

  const netColor = (type, p) => ({
    power: p.power, mains: p.mains, rf: p.rf, measure: p.measure, signal: p.signal,
  })[type] || p.signal;

  function uid() {
    return "dg" + Math.random().toString(36).slice(2, 9);
  }

  function wrap(body, title, p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 480" width="820" height="480" role="img" aria-label="${esc(title)}">
      <rect width="820" height="480" fill="${p.bg}"/>
      ${body}
    </svg>`;
  }

  /* ---------------- schematic ---------------- */
  function schematic(spec, title, paletteOverride) {
    const p = paletteOverride || palette();
    const id = uid();
    const startX = 30, startY = 84, colW = 192, rowH = 124, bw = 160, bh = 78;
    const stages = spec.stages.map((s) => ({
      ...s,
      x: startX + s.col * colW,
      y: startY + s.row * rowH,
      w: bw, h: bh,
    }));
    const byId = Object.fromEntries(stages.map((s) => [s.id, s]));
    const bottom = Math.max(...stages.map((s) => s.y + s.h)) + 20;

    const wireColors = [...new Set(spec.wires.map((w) => netColor(w.type, p)))];
    const markers = wireColors.map((c, i) => `
      <marker id="${id}-arrow-${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="${c}"/>
      </marker>`).join("");
    const markerFor = (color) => `${id}-arrow-${wireColors.indexOf(color)}`;
    const grid = `<defs>
      <pattern id="${id}-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0V24" fill="none" stroke="${p.grid}" stroke-width="0.6"/>
      </pattern>
      ${markers}
    </defs>
    <rect width="820" height="480" fill="url(#${id}-grid)" opacity="0.5"/>`;

    const header = `
      <text x="24" y="30" fill="${p.muted}" font-family="monospace" font-size="10" letter-spacing="2.2">SCHEMATIC / BLOCK LEVEL</text>
      <text x="24" y="56" fill="${p.text}" font-family="system-ui,sans-serif" font-size="17" font-weight="700">${esc(title)}</text>
      <line x1="24" y1="68" x2="796" y2="68" stroke="${p.stroke}" stroke-width="1"/>`;

    const wires = spec.wires.map((w) => {
      const s = byId[w.from], t = byId[w.to];
      if (!s || !t) return "";
      const color = netColor(w.type, p);
      const sx = s.x + s.w, sy = s.y + s.h / 2;
      const tx = t.x, ty = t.y + t.h / 2;
      let d;
      if (tx > sx + 8) {
        const mx = sx + (tx - sx) / 2;
        d = `M${sx} ${sy} H${mx} V${ty} H${tx}`;
        var lx = mx, ly = (sy + ty) / 2 - 8;
      } else {
        d = `M${sx} ${sy} H${sx + 18} V${bottom} H${tx - 18} V${ty} H${tx}`;
        var lx = (sx + tx) / 2, ly = bottom - 8;
      }
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#${markerFor(color)})" opacity="0.9"/>
        <text x="${lx}" y="${ly}" fill="${color}" font-family="monospace" font-size="9.5" text-anchor="middle">${esc(w.net)}</text>`;
    }).join("");

    const blocks = stages.map((s) => {
      const c = kindColor(s.kind, p);
      return `<g>
        <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="8" fill="${p.block}" stroke="${c}" stroke-width="1.6"/>
        <circle cx="${s.x + 15}" cy="${s.y + 16}" r="4" fill="${c}"/>
        <text x="${s.x + 27}" y="${s.y + 20}" fill="${p.text}" font-family="monospace" font-size="11" font-weight="700">${esc(s.label)}</text>
        <text x="${s.x + 14}" y="${s.y + 43}" fill="${p.muted}" font-family="system-ui,sans-serif" font-size="10">${esc(s.sub)}</text>
        <line x1="${s.x + 14}" y1="${s.y + s.h - 18}" x2="${s.x + s.w - 14}" y2="${s.y + s.h - 18}" stroke="${p.stroke}" stroke-width="0.8"/>
        <text x="${s.x + 14}" y="${s.y + s.h - 6}" fill="${p.muted}" font-family="monospace" font-size="8" letter-spacing="1">${esc(s.kind.toUpperCase())}</text>
        <circle cx="${s.x}" cy="${s.y + s.h / 2}" r="3" fill="${c}"/>
        <circle cx="${s.x + s.w}" cy="${s.y + s.h / 2}" r="3" fill="${c}"/>
      </g>`;
    }).join("");

    const legendItems = [
      ["POWER", p.power], ["SIGNAL", p.signal], ["MEASURE", p.measure],
      ["MAINS", p.mains], ["RF", p.rf],
    ];
    let lx = 26;
    const legend = legendItems.map(([label, color]) => {
      const out = `<circle cx="${lx}" cy="456" r="4" fill="${color}"/><text x="${lx + 10}" y="459" fill="${p.muted}" font-family="monospace" font-size="9">${label}</text>`;
      lx += label.length * 7 + 34;
      return out;
    }).join("");
    const footer = `${legend}<text x="796" y="459" fill="${p.muted}" font-family="monospace" font-size="9" text-anchor="end">BLOCK SKETCH · NOT FOR FABRICATION</text>`;

    return wrap(grid + header + wires + blocks + footer, title, p);
  }

  /* ---------------- board placement ---------------- */
  function board(spec, title, paletteOverride) {
    const p = paletteOverride || palette();
    const id = uid();
    const startX = 58, startY = 100, colW = 182, rowH = 112, bw = 138, bh = 64;
    const parts = spec.stages.map((s) => ({
      ...s,
      x: startX + s.col * colW,
      y: startY + s.row * rowH,
      w: bw, h: bh,
    }));

    const grid = `<defs>
      <pattern id="${id}-bgrid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" fill="none" stroke="${p.grid}" stroke-width="0.5"/>
      </pattern>
      <pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="${p.boardEdge}" stroke-width="1" opacity="0.35"/>
      </pattern>
      <clipPath id="${id}-clip"><rect x="30" y="66" width="760" height="352" rx="10"/></clipPath>
    </defs>`;

    const header = `
      <text x="24" y="30" fill="${p.muted}" font-family="monospace" font-size="10" letter-spacing="2.2">PCB / 2D PLACEMENT SKETCH</text>
      <text x="24" y="56" fill="${p.text}" font-family="system-ui,sans-serif" font-size="17" font-weight="700">${esc(title)}</text>`;

    const outline = `
      <rect x="30" y="66" width="760" height="352" rx="10" fill="${p.board}" stroke="${p.boardEdge}" stroke-width="2"/>
      <rect x="40" y="76" width="740" height="332" rx="6" fill="url(#${id}-bgrid)" stroke="${p.grid}" stroke-dasharray="4 4" stroke-width="1"/>
      ${[[48, 84], [772, 84], [48, 400], [772, 400]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${p.bg}" stroke="${p.boardEdge}" stroke-width="1.5"/><line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}" stroke="${p.boardEdge}" stroke-width="0.8"/>`).join("")}`;

    const zoneRects = (spec.zones || []).slice(0, 4).map((z, i) => {
      const x = 44 + i * 186, y = 386, w = 176, h = 26;
      return `<g clip-path="url(#${id}-clip)">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${id}-hatch)" stroke="${p.boardEdge}" stroke-width="0.7" opacity="0.85"/>
        <text x="${x + 6}" y="${y + 17}" fill="${p.text}" font-family="monospace" font-size="8">${esc(z.length > 25 ? z.slice(0, 24) + "…" : z)}</text>
      </g>`;
    }).join("");

    const footprints = parts.map((s) => {
      const c = kindColor(s.kind, p);
      const label = s.label.length > 20 ? s.label.slice(0, 19) + "…" : s.label;
      const pins = Array.from({ length: 4 }, (_, i) => {
        const px = s.x + 18 + i * (s.w - 36) / 3;
        return `<rect x="${px - 2}" y="${s.y - 5}" width="4" height="5" fill="${c}" opacity="0.8"/>
                <rect x="${px - 2}" y="${s.y + s.h}" width="4" height="5" fill="${c}" opacity="0.8"/>`;
      }).join("");
      return `<g>
        ${pins}
        <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="4" fill="${p.block}" stroke="${c}" stroke-width="1.5"/>
        <text x="${s.x + 10}" y="${s.y + 22}" fill="${p.text}" font-family="monospace" font-size="10.5" font-weight="700">${esc(label)}</text>
        <text x="${s.x + 10}" y="${s.y + 40}" fill="${p.muted}" font-family="system-ui,sans-serif" font-size="9">${esc(s.sub.length > 27 ? s.sub.slice(0, 26) + "…" : s.sub)}</text>
        <rect x="${s.x + 10}" y="${s.y + s.h - 13}" width="26" height="5" rx="1" fill="${c}" opacity="0.6"/>
      </g>`;
    }).join("");

    const footer = `
      <text x="26" y="450" fill="${p.muted}" font-family="monospace" font-size="9">TOP VIEW · CONCEPTUAL OUTLINE · ZONES SHADED</text>
      <text x="796" y="450" fill="${p.muted}" font-family="monospace" font-size="9" text-anchor="end">REFERENCE PLACEMENT ONLY</text>`;

    return wrap(grid + header + outline + zoneRects + footprints + footer, title, p);
  }

  window.CortronicsDiagrams = {
    schematic,
    board,
    palette,
    forProject(id, title) {
      const spec = window.DIAGRAMS[id];
      if (!spec) return null;
      const p = palette();
      return {
        schematic: schematic(spec, title + " · Schematic", p),
        board: board(spec, title + " · Board Layout", p),
        zones: spec.zones || [],
        note: spec.note || "",
      };
    },
  };
})();
