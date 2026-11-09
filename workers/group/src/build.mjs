// Builds group.rtlawservices.com into ../dist: plain HTML, one stylesheet and
// one small script, with no third-party requests. Run: node src/build.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUSINESSES, DISCLAIMER, SITE, TEAM } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, "static"), DIST, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (f) => readFileSync(join(ROOT, "static", f), "utf8").replace(/<\?xml[^>]*>/, "").replace(/\s(width|height)="[^"]*"/g, "");
const LOGO_DARK = inline("brand/logo-dark.svg").replace("<svg ", '<svg class="logo" role="img" aria-label="RT Law Services" ');
const year = new Date().getFullYear();

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

const ICONS = {
  // Two continents joined by an arc.
  bridge: `<circle cx="32" cy="32" r="22"/><path d="M10 32h44"/><path d="M32 10c7 6 10 14 10 22s-3 16-10 22c-7-6-10-14-10-22s3-16 10-22z"/><path d="M6 46c8-10 18-14 26-14s18 4 26 14"/>`,
  // A shield with a key line.
  shield: `<path d="M32 6l20 8v16c0 13-8 22-20 28C20 52 12 43 12 30V14z"/><circle cx="32" cy="27" r="6"/><path d="M32 33v12M32 39h5M32 43h4"/>`,
  // A path rising to a horizon.
  path: `<path d="M8 50h48"/><path d="M20 50c4-10 8-18 12-30 4 12 8 20 12 30"/><path d="M32 20v-8M27 14l5-5 5 5"/><circle cx="48" cy="18" r="5"/>`,
  // A compass rose.
  compass: `<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="3"/><path d="M32 8v6M32 50v6M8 32h6M50 32h6"/><path d="M40 24l-5 11-11 5 5-11z"/>`,
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
      ${link("/#leadership", "Leadership")}
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
        <li><a href="${SITE.firmUrl}/team/">Our team</a></li>
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
        <div class="orbit" data-orbit aria-hidden="true">
          <div class="orbit-ring r1"></div><div class="orbit-ring r2"></div><div class="orbit-ring r3"></div>
          <div class="orbit-core">${rosette()}<span>RT</span></div>
          ${BUSINESSES.map((b, i) => `<span class="orbit-node" style="--a:${i * 90 - 135}deg" data-node="${i}">${icon(b.icon)}</span>`).join("")}
        </div>
        <ol class="orbit-list">
          ${BUSINESSES.map((b, i) => `<li><a href="${href(b)}"${ext(b)} data-node-link="${i}"><span class="num">${b.number}</span><span><strong>${esc(b.name)}</strong><em>${esc(b.tagline)}</em></span>${ARROW}</a></li>`).join("")}
        </ol>
      </div>
      <div class="biz-grid">${BUSINESSES.map(card).join("")}</div>
    </div>
  </section>

  <section class="section dark" id="leadership">
    ${rosette()}
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">Leadership</p>
        <h2 class="display">Led by people who work across borders</h2>
      </div>
      <div class="team-grid">
        ${TEAM.map((m, i) => `<a class="person reveal" style="--d:${i * 90}ms" href="${SITE.firmUrl}/team/#${m.slug}">
          <span class="medal" aria-hidden="true"><span>${m.initials}</span></span>
          <span class="person-role">${esc(m.role)}</span>
          <span class="person-name">${esc(m.name)}</span>
          <span class="person-text">${esc(m.summary)}</span>
          <span class="biz-go">Full biography ${ARROW}</span>
        </a>`).join("")}
      </div>
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
