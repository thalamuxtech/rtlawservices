// Builds group.rtlawservices.com into ../dist: plain HTML, one stylesheet and
// one small script, with no third-party requests. Run: node src/build.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUSINESSES, DISCLAIMER, SITE } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, "static"), DIST, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (f) => readFileSync(join(ROOT, "static", f), "utf8").replace(/<\?xml[^>]*>/, "").replace(/\s(width|height)="[^"]*"/g, "");
const LOGO_DARK = inline("brand/logo-dark.svg").replace("<svg ", '<svg class="logo" role="img" aria-label="RT Law Services" ');
const year = new Date().getFullYear();
// The firm's RT mark (gold letters and white dot) cut from the full logo.
const logoPaths = [...readFileSync(join(ROOT, "static/brand/logo-dark.svg"), "utf8").matchAll(/<path[^>]*>/g)].map((m) => m[0]);
const MARK = `<svg class="mark" viewBox="274 175 462 318" aria-hidden="true">${logoPaths[0]}${logoPaths[logoPaths.length - 1]}</svg>`;

/* ---------- engraved patterns (the business card's guilloche) ---------- */

function rosette(size = 400) {
  const c = size / 2;
  const out = [];
  for (const [rad, amp, petals, strands] of [[0.86, 0.1, 14, 9], [0.56, 0.08, 10, 7], [0.3, 0.06, 7, 5]]) {
    for (let j = 0; j < strands; j++) {
      const pts = [];
      for (let i = 0; i <= 360; i++) {
        const t = (i / 360) * Math.PI * 2;
        const r = c * (rad + amp * Math.sin(petals * t + (j / strands) * Math.PI * 2));
        pts.push(`${(c + r * Math.cos(t)).toFixed(1)} ${(c + r * Math.sin(t)).toFixed(1)}`);
      }
      out.push(`<path d="M${pts.join("L")}Z"/>`);
    }
    out.push(`<circle cx="${c}" cy="${c}" r="${(c * (rad + amp + 0.025)).toFixed(1)}"/>`);
  }
  return `<svg class="rosette" viewBox="0 0 ${size} ${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="0.6"><g class="turn">${out.join("")}</g></svg>`;
}

function weave(w = 1600, h = 140) {
  const groups = [[70, 30, 160, 9, 0.55, 18], [70, 48, 240, 5, 0.35, 28]].map(([cy, amp, len, strands, op, secs]) => {
    const paths = Array.from({ length: strands }, (_, j) => {
      const pts = [];
      for (let x = 0; x <= w + len; x += 4) pts.push(`${x} ${(cy + amp * Math.sin(((x + (j * len) / strands) / len) * Math.PI * 2)).toFixed(1)}`);
      return `<path d="M${pts.join("L")}"/>`;
    });
    return `<g class="drift" style="--drift:-${len}px;--time:${secs}s" opacity="${op}">${paths.join("")}</g>`;
  });
  return `<svg class="weave" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="0.8" vector-effect="non-scaling-stroke">${groups.join("")}</svg>`;
}

/* ---------- line icons for the businesses ---------- */

// Detailed line illustrations, drawn on a 64-unit grid. "t" marks soft gold
// fills (tint) and "f" fine detail lines; both follow the icon colour.
const ICONS = {
  // A globe with the Americas and Africa, joined by a route between two pins.
  bridge: `
    <circle cx="32" cy="32" r="23"/>
    <ellipse cx="32" cy="32" rx="10" ry="23" class="f"/>
    <path class="f" d="M9 32h46"/>
    <path class="t" d="M16.5 17.5c2.5-2.2 6-2.6 8.4-1.4 1.8.9 1.2 2.8-.3 3.6-1.6.8-1.7 2.2-.6 3.3 1.3 1.4 3.5 1.4 4.1 3.3.5 1.7-1.2 2.7-2.8 2.9-2.2.3-2.8 2.2-2.4 4.2.5 2.6-.2 5.4-1.9 7.6-.9-2.4-1.1-5-2.6-7-1.5-2-3.3-3.5-3.2-6.1.1-2.4-1.4-3.9-1.5-6.1 0-1.8 1-3.3 2.8-4.3z"/>
    <path class="t" d="M36.4 21.6c2.7-1.2 6.2-1.3 8.6-.2 1.4.6 1.9 2 3.3 2.6 1.6.7 1.7 2.4.7 3.8-1.3 1.7-2.9 2.9-3.4 5.1-.6 2.7-.4 5.7-2.6 7.7-1 .9-2.2 1.5-2.5 2.9-1.2-1.5-1.3-3.6-1.9-5.4-.6-1.9-2.4-3.1-2.7-5.1-.3-2.1 1.2-3.5.6-5.5-.4-1.6-2.1-2.5-1.6-4 .3-.9.9-1.5 1.5-1.9z"/>
    <path d="M22.5 21.5C27 15 37 14.5 41.5 25.5" stroke-dasharray="2 2.2"/>
    <circle cx="22.5" cy="21.5" r="1.7" class="dot"/><circle cx="22.5" cy="21.5" r="3.4" class="f"/>
    <circle cx="41.5" cy="25.5" r="1.7" class="dot"/><circle cx="41.5" cy="25.5" r="3.4" class="f"/>
  `,
  // A bank vault door: dial, three-spoke handle, hinges and bolts.
  shield: `
    <rect x="8" y="9" width="48" height="44" rx="4"/>
    <rect x="12" y="13" width="40" height="36" rx="2.5" class="t"/>
    <path d="M14 53v3h6v-3M44 53v3h6v-3"/>
    <rect x="5.5" y="17" width="3" height="7" rx="1"/><rect x="5.5" y="38" width="3" height="7" rx="1"/>
    <circle cx="32" cy="31" r="12"/>
    <circle cx="32" cy="31" r="8.5" class="f"/>
    <path class="f" d="M32 19.6v2.2M32 40.2v2.2M20.6 31h2.2M41.2 31h2.2M24 23l1.5 1.5M38.5 37.5L40 39M40 23l-1.5 1.5M25.5 37.5L24 39"/>
    <circle cx="32" cy="31" r="2.6"/>
    <path d="M32 28.4V24M34.3 32.3l3.8 2.2M29.7 32.3l-3.8 2.2"/>
    <circle cx="32" cy="23.6" r="1.1" class="dot"/><circle cx="38.4" cy="34.7" r="1.1" class="dot"/><circle cx="25.6" cy="34.7" r="1.1" class="dot"/>
    <path class="f" d="M48 17v4M48 41v4"/>
  `,
  // A passport with a globe emblem, and an entry stamp.
  path: `
    <rect x="13" y="7" width="32" height="46" rx="3"/>
    <rect x="16.5" y="10.5" width="25" height="39" rx="1.5" class="t"/>
    <circle cx="29" cy="25" r="7.5"/>
    <ellipse cx="29" cy="25" rx="3.2" ry="7.5" class="f"/>
    <path class="f" d="M21.5 25h15M22.6 21h12.8M22.6 29h12.8"/>
    <path d="M22 38h14M24 42h10" class="f"/>
    <path d="M22 14.5h14" class="f"/>
    <circle cx="47" cy="44" r="9" stroke-dasharray="2 1.8"/>
    <circle cx="47" cy="44" r="6.2" class="f"/>
    <path d="M43.2 44.6l3 2.6 5-5.6"/>
  `,
  // A risk gauge: low, medium and high zones, a needle and its hub.
  compass: `
    <path d="M8 42a24 24 0 0 1 48 0"/>
    <path d="M13.5 42a18.5 18.5 0 0 1 5.4-13.1" class="zone z1"/>
    <path d="M21.2 26.9a18.5 18.5 0 0 1 21.6 0" class="zone z2"/>
    <path d="M45.1 28.9a18.5 18.5 0 0 1 5.4 13.1" class="zone z3"/>
    <path class="f" d="M8.8 35.8l2.4.7M12.3 26.6l2.1 1.4M18.7 19.8l1.5 2M27 16.3l.4 2.4M37 16.3l-.4 2.4M45.3 19.8l-1.5 2M51.7 26.6l-2.1 1.4M55.2 35.8l-2.4.7"/>
    <path d="M32 42l-9.5-11.5" stroke-width="2.2"/>
    <circle cx="32" cy="42" r="3.6" class="t"/><circle cx="32" cy="42" r="3.6"/>
    <path d="M10 49h44" />
    <path class="f" d="M16 53h32"/>
  `,
};
const icon = (k, cls = "icon") => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

const ARROW = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>`;
const href = (b) => b.external || `/${b.slug}/`;
// The first sentence, without splitting at abbreviations such as "U.S.".
const firstSentence = (t) => t.split(/(?<=[a-z]\.)\s+(?=[A-Z])/)[0];
const ext = (b) => (b.external ? ` target="_blank" rel="noopener"` : "");

/* ---------- shared page parts ---------- */

function head({ title, description, path, ld }) {
  const url = `${SITE.url}${path}`;
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#14181f">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/brand/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/eb-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/lato-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script src="/app.js" defer></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function header(current = "") {
  const link = (h, label) => `<a href="${h}"${current === h ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header" data-header>
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="RT Law Services, home of the group">${LOGO_DARK}</a>
    <nav class="nav" aria-label="Main">
      ${link("/#businesses", "Businesses")}
      ${link("/#contact", "Contact")}
    </nav>
    <a class="btn btn-gold btn-sm magnetic" href="${SITE.firmUrl}/">RT Law Services ${ARROW}</a>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="weave-band">${weave()}</div>
  <div class="wrap foot">
    <div>
      <a class="brand" href="/">${LOGO_DARK}</a>
      <p class="motto">${SITE.motto}</p>
      <p class="muted">${SITE.headline}.</p>
    </div>
    <div>
      <p class="eyebrow">The businesses</p>
      <ul>${BUSINESSES.map((b) => `<li><a href="${href(b)}"${ext(b)}>${esc(b.name)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <p class="eyebrow">Contact</p>
      <ul>
        <li><a href="${SITE.phoneHref}">${SITE.phone}</a></li>
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li><a href="${SITE.firmUrl}/book/">Book a consultation</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap legal">
    <p>${DISCLAIMER}</p>
    <p>&copy; ${year} ${SITE.name}. <a href="${SITE.firmUrl}/legal/privacy/">Privacy</a> &middot; <a href="${SITE.firmUrl}/legal/disclaimer/">Disclaimer</a></p>
  </div>
</footer>
</body>
</html>
`;
}

function contactBand() {
  return `<section class="cta" id="contact">
  ${rosette()}
  <div class="wrap cta-inner reveal">
    <p class="eyebrow">Speak with the firm</p>
    <h2 class="display">Bring us the matter. We will map the way forward.</h2>
    <div class="cta-actions">
      <a class="btn btn-gold magnetic" href="${SITE.firmUrl}/book/">Book a consultation ${ARROW}</a>
      <a class="btn btn-line" href="mailto:${SITE.email}">${SITE.email}</a>
      <a class="btn btn-line" href="${SITE.phoneHref}">${SITE.phone}</a>
    </div>
  </div>
</section>`;
}

function card(b, i) {
  return `<a class="biz reveal" style="--d:${i * 90}ms" href="${href(b)}"${ext(b)} data-tilt>
  <span class="biz-glow" aria-hidden="true"></span>
  <span class="biz-top"><span class="biz-num">${b.number}</span>${icon(b.icon, "icon biz-icon")}</span>
  <span class="biz-name">${esc(b.name)}</span>
  <span class="biz-tag">${esc(b.tagline)}</span>
  <span class="biz-text">${esc(firstSentence(b.body))}</span>
  <span class="biz-go">${b.external ? "Visit rtlawservices.com" : "Explore"} ${ARROW}</span>
</a>`;
}

const firmLd = {
  "@type": ["LegalService", "Organization"],
  "@id": `${SITE.firmUrl}/#firm`,
  name: SITE.name,
  url: `${SITE.firmUrl}/`,
  slogan: SITE.motto,
  telephone: SITE.phone,
  email: SITE.email,
};

/* ---------- home ---------- */

function home() {
  const words = SITE.headline.split(" ");
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      firmLd,
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/#page`,
        url: `${SITE.url}/`,
        name: `${SITE.name}: ${SITE.headline}`,
        description: SITE.intro,
        about: { "@id": firmLd["@id"] },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: BUSINESSES.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "Service", name: b.name, description: b.body, url: b.external || `${SITE.url}/${b.slug}/`, provider: { "@id": firmLd["@id"] } },
          })),
        },
      },
    ],
  };
  return `${head({ title: `${SITE.name} | ${SITE.headline}`, description: "Four businesses, one standard: Africa-U.S. business law, global asset recovery, immigration law and risk management advisory from RT Law Services.", path: "/", ld })}
${header()}
<main id="main">
  <section class="hero" data-hero>
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-rosette" data-parallax="0.04">${rosette()}</div>
    <div class="hero-weave">${weave()}</div>
    <div class="wrap hero-inner">
      <p class="eyebrow rise">${SITE.name} &middot; The group</p>
      <h1 class="display hero-title">${words.map((w, i) => `<span class="word" style="--d:${120 + i * 70}ms">${esc(w)}</span>`).join(" ")}</h1>
      <span class="rule rise" style="--d:650ms" aria-hidden="true"><i></i><b></b><i></i></span>
      <p class="lead rise" style="--d:760ms">${esc(SITE.intro)}</p>
      <div class="hero-actions rise" style="--d:900ms">
        <a class="btn btn-gold magnetic" href="#businesses">Explore the businesses ${ARROW}</a>
        <a class="btn btn-line" href="${SITE.firmUrl}/">Visit rtlawservices.com</a>
      </div>
    </div>
    <a class="scroll-cue" href="#businesses" aria-label="Scroll to the businesses"><span></span></a>
  </section>

  <section class="section" id="businesses">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">Four businesses</p>
        <h2 class="display">One firm. Four disciplines. One standard of trust.</h2>
      </div>
      <div class="orbit-wrap reveal">
        <div class="orbit" data-orbit>
          <svg class="orbit-lines" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="49.6" class="ring-outer"/>
            <circle cx="50" cy="50" r="36" class="ring-dash"/>
            ${BUSINESSES.map((_, i) => { const a = ((i * 90 - 135) * Math.PI) / 180; return `<line x1="50" y1="50" x2="${(50 + 50 * Math.cos(a)).toFixed(2)}" y2="${(50 + 50 * Math.sin(a)).toFixed(2)}" data-spoke="${i}"/>`; }).join("")}
          </svg>
          <span class="orbit-traveller" aria-hidden="true"><i></i></span>
          <div class="orbit-core" aria-hidden="true">${rosette()}${MARK}</div>
          ${BUSINESSES.map((b, i) => `<a class="orbit-node" style="--a:${i * 90 - 135}deg" href="${href(b)}"${ext(b)} data-node="${i}" aria-label="${b.number} ${esc(b.name)}">
            <span class="orbit-badge">${b.number}</span>${icon(b.icon)}
            <span class="orbit-label">${esc(b.name)}</span>
          </a>`).join("")}
        </div>
        <ol class="orbit-list">
          ${BUSINESSES.map((b, i) => `<li><a href="${href(b)}"${ext(b)} data-node-link="${i}"><span class="num">${b.number}</span><span><strong>${esc(b.name)}</strong><em>${esc(b.tagline)}</em></span>${ARROW}</a></li>`).join("")}
        </ol>
      </div>
      <div class="biz-grid">${BUSINESSES.map(card).join("")}</div>
    </div>
  </section>

  ${contactBand()}
</main>
${footer()}`;
}

/* ---------- a business page ---------- */

function businessPage(b) {
  const others = BUSINESSES.filter((x) => x.slug !== b.slug);
  const url = `${SITE.url}/${b.slug}/`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      firmLd,
      { "@type": "Service", "@id": `${url}#service`, name: b.name, description: b.body, url, provider: { "@id": firmLd["@id"] }, audience: b.audience.map((a) => ({ "@type": "Audience", audienceType: a })) },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Group", item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: b.name },
        ],
      },
    ],
  };
  return `${head({ title: `${b.name} | ${SITE.name}`, description: `${b.tagline.replace(/[^.]$/, "$&.")} ${firstSentence(b.body)}`, path: `/${b.slug}/`, ld })}
${header()}
<main id="main">
  <section class="hero hero-page" data-hero>
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-weave">${weave()}</div>
    <div class="wrap page-hero">
      <div>
        <nav class="crumbs rise" aria-label="Breadcrumb"><a href="/">Group</a><span aria-hidden="true">/</span><span>${esc(b.name)}</span></nav>
        <p class="eyebrow rise" style="--d:80ms">Business ${b.number}</p>
        <h1 class="display hero-title">${b.name.split(" ").map((w, i) => `<span class="word" style="--d:${150 + i * 70}ms">${esc(w)}</span>`).join(" ")}</h1>
        <span class="rule rise" style="--d:600ms" aria-hidden="true"><i></i><b></b><i></i></span>
        <p class="tagline rise" style="--d:700ms">${esc(b.tagline)}</p>
      </div>
      <div class="seal rise" style="--d:300ms" data-parallax="0.03">
        ${rosette()}
        <span class="seal-core">${icon(b.icon, "icon seal-icon")}</span>
        <span class="seal-num">${b.number}</span>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap detail">
      <div class="detail-body reveal">
        <p class="eyebrow">Overview</p>
        <p class="lead-dark">${esc(b.body)}</p>
      </div>
      <aside class="detail-side">
        <div class="panel reveal">
          <p class="eyebrow">Focus</p>
          <ul class="chips">${b.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        </div>
        <div class="panel reveal" style="--d:90ms">
          <p class="eyebrow">Who we serve</p>
          <ul class="chips">${b.audience.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        </div>
        <div class="panel panel-dark reveal" style="--d:180ms">
          <p class="eyebrow">Start a conversation</p>
          <p>Tell us about the matter and we will explain how we can help.</p>
          <a class="btn btn-gold magnetic" href="${SITE.firmUrl}/book/">Book a consultation ${ARROW}</a>
          <a class="side-link" href="mailto:${SITE.email}">${SITE.email}</a>
        </div>
      </aside>
    </div>
  </section>

  <section class="section tint">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">The group</p>
        <h2 class="display">Explore the other businesses</h2>
      </div>
      <div class="biz-grid three">${others.map(card).join("")}</div>
    </div>
  </section>

  ${contactBand()}
</main>
${footer()}`;
}

/* ---------- write ---------- */

writeFileSync(join(DIST, "index.html"), home());
for (const b of BUSINESSES.filter((x) => !x.external)) {
  mkdirSync(join(DIST, b.slug), { recursive: true });
  writeFileSync(join(DIST, b.slug, "index.html"), businessPage(b));
}
const pages = ["/", ...BUSINESSES.filter((b) => !b.external).map((b) => `/${b.slug}/`)];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`,
);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(join(DIST, "404.html"), `${head({ title: `Page not found | ${SITE.name}`, description: "This page does not exist.", path: "/404", ld: firmLd })}\n${header()}\n<main id="main"><section class="hero hero-page"><div class="wrap page-hero"><div><h1 class="display hero-title">This page could not be found</h1><p class="tagline">Return to the <a href="/">group home</a>.</p></div></div></section></main>\n${footer()}`);
console.log(`group: wrote ${pages.length} pages to dist/`);
