/* Cortronics — SEO metadata, canonical URLs and JSON-LD structured data */
(function () {
  "use strict";

  const D = window.CORTRONICS;
  const S = D.site;
  const ROOT = S.url.replace(/\/$/, "");
  const abs = (path) => ROOT + (path.startsWith("/") ? path : "/" + path);
  const ogImage = abs("/og-image.png");

  function meta(attr, key, value) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function canonical(url) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.rel = "canonical";
      document.head.appendChild(el);
    }
    el.href = url;
  }

  function ld(id, data) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function setPage(opts) {
    document.title = opts.title;
    meta("name", "description", opts.description);
    meta("name", "robots", "index,follow,max-image-preview:large");
    meta("name", "theme-color", "#080b10");
    meta("name", "author", S.author);
    meta("property", "og:site_name", S.name);
    meta("property", "og:locale", "en_IN");
    meta("property", "og:type", opts.type || "website");
    meta("property", "og:title", opts.title);
    meta("property", "og:description", opts.description);
    meta("property", "og:url", opts.url);
    meta("property", "og:image", ogImage);
    meta("property", "og:image:secure_url", ogImage);
    meta("property", "og:image:type", "image/png");
    meta("property", "og:image:width", "1200");
    meta("property", "og:image:height", "630");
    meta("property", "og:image:alt", S.name + " — " + S.tagline);
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", opts.title);
    meta("name", "twitter:description", opts.description);
    meta("name", "twitter:image", ogImage);
    canonical(opts.url);
  }

  function publisher() {
    return {
      "@type": "Organization",
      name: S.author,
      url: ROOT,
      email: S.email,
      address: { "@type": "PostalAddress", addressLocality: "Punjab", addressCountry: "IN" },
    };
  }

  function base() {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": ROOT + "/#website",
          url: ROOT,
          name: S.name,
          description: S.description,
          inLanguage: "en-IN",
          publisher: { "@id": ROOT + "/#organization" },
        },
        Object.assign({ "@id": ROOT + "/#organization" }, publisher()),
      ],
    };
  }

  function page(kind) {
    if (kind === "blog") {
      setPage({
        title: "Field Notes · " + S.name + " Technical Blog",
        description: "Technical write-ups on power electronics, ESP32, RF, PCB design and bench measurement from the cortronics electronics and IoT workbench.",
        url: abs("/blog.html"),
        type: "website",
      });
      ld("ld-page", {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Field Notes · " + S.name,
        description: "Technical notes from the cortronics workbench.",
        url: abs("/blog.html"),
        inLanguage: "en-IN",
        publisher: { "@id": ROOT + "/#organization" },
        blogPost: D.blogPosts.map((p) => ({
          "@type": "BlogPosting",
          "@id": abs("/blog/" + p.id) + "#article",
          headline: p.title,
          description: p.excerpt,
          datePublished: p.date,
          url: abs("/blog/" + p.id),
          mainEntityOfPage: abs("/blog/" + p.id),
          author: { "@type": "Organization", name: S.author },
          keywords: p.tags.join(", "),
        })),
      });
    } else {
      setPage({ title: S.name + " · Electronics & IoT Project Index", description: S.description, url: abs("/") });
      ld("ld-page", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: S.name + " project index",
        description: S.description,
        numberOfItems: D.projects.length,
        itemListElement: D.projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          description: p.description,
          url: abs("/") + "#" + p.id,
        })),
      });
    }
    ld("ld-base", base());
    const articleEl = document.getElementById("ld-article");
    if (articleEl) articleEl.textContent = "";
  }

  function article(post) {
    setPage({
      title: post.title + " · " + S.name + " Field Notes",
      description: post.excerpt,
      url: abs("/blog/" + post.id),
      type: "article",
    });
    const body = post.body.map((b) => (b.items ? b.items.join(" ") : b.text)).join(" ");
    ld("ld-article", {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      articleBody: body,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "en-IN",
      url: abs("/blog/" + post.id),
      mainEntityOfPage: abs("/blog/" + post.id),
      image: ogImage,
      keywords: post.tags.join(", "),
      author: { "@type": "Organization", name: S.author, url: ROOT },
      publisher: { "@id": ROOT + "/#organization" },
    });
  }

  function init() {
    const isBlog = !!document.getElementById("post-grid");
    page(isBlog ? "blog" : "home");
    if (isBlog) {
      const id = new URLSearchParams(location.search).get("post");
      const post = id && D.blogPosts.find((p) => p.id === id);
      if (post) article(post);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.CortronicsSEO = { setPage, page, article, abs, publisher, base };
})();
