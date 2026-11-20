# Cortronics

Electronics & IoT project index — a static website listing hardware builds with their
component lists (BOMs) and estimated costs in INR.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Project index page |
| `blog.html` | Separate technical blog page |
| `styles.css` | Dark, circuit-inspired responsive styling |
| `data.js` | All project, component, price, tool and blog data |
| `app.js` | Sidebar filtering, search, sorting and BOM rendering |
| `blog.js` | Blog topic filters and article reader |
| `postcard.js` | Shared blog card rendering |
| `diagram-data.js` | Per-project functional blocks, nets, zones and design notes |
| `diagrams.js` | Dependency-free SVG schematic & board renderer |
| `theme.js` | Dark / Light / Blueprint theme switcher |
| `footer.js` | Shared contact line, copyright and "made with love" note |
| `seo.js` | Meta tags, canonical URLs and JSON-LD structured data |
| `og-image.svg`, `og-image.png` | Social preview image (1200×630) |
| `favicon.svg` | Site icon |
| `robots.txt`, `sitemap.xml` | Crawler directives and URL list |
| `vercel.json` | Vercel rewrites and cache headers |
| `docs/*.pdf` | The three source blueprints |

## Running it

No build step or dependencies. Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Features

- 19 projects across three blueprint volumes (Core Lab, Field Systems, Flagship)
- Sidebar with a beginner→expert learning path (Easy / Medium / Hard / Expert), 12 skill tags and blueprint filters
- Separate blog page with topic filters and six seeded technical articles (replace with your own posts in `data.js`)
- Per-project component tables with quantities and cost breakdowns
- Estimate basis for every line item: blueprint-quoted, from the core kit, or indicative
- Search by project or component name, filter by volume/category, sort by cost
- Expandable BOMs with copy-to-clipboard
- Vol. 2 consolidated shopping list and Vol. 1 core lab kit reference
- Prerequisite tools section: bench instruments, hand tools, safety gear and software
- Per-project block schematics and 2D board placement sketches rendered as SVG, with download button
- Three themes (Dark, Light, Blueprint) with local storage persistence; DM Sans / IBM Plex Mono typography
- Product name "cortronics" with the tagline "Where blueprints become hardware." (edit `site.tagline` in `data.js`)

Edit `site.email` in `data.js` to change the contact address shown in both footers.

## Diagram notes

The schematics are functional block diagrams and the board views are conceptual 2D placement
sketches generated from `diagram-data.js`. They are meant for understanding and planning each
build — they are **not** fabrication-ready KiCad schematics or Gerbers. The source blueprints
in `docs/` remain the authoritative engineering references.

## SEO & deployment

Set `site.url` in `data.js` to your real domain before deploying — it drives canonical URLs,
Open Graph tags and the JSON-LD structured data. If it differs from `https://cortronics.com`,
also update the absolute URLs in `robots.txt`, `sitemap.xml` and the static `<head>` tags in
both HTML files.

`vercel.json` maps `/blog/<post-id>` to `blog.html?post=<post-id>`, so each article has a clean,
crawlable URL with its own title, description and `BlogPosting` structured data. No build
command is required on Vercel — Framework Preset "Other", output directory `.`.

## Price notes

Only the Vol. 2 shopping list contains quoted prices. All other figures are indicative
INR retail estimates derived from the component lists. Flagship estimates assume 4-layer
PCB fabrication at roughly ₹1,500–₹3,000 for five boards. Always verify current pricing.
