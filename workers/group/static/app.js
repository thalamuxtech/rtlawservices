// Small interactions for group.rtlawservices.com: the header on scroll, scroll
// reveals, a pointer glow on the hero, card tilt, magnetic buttons and the
// orbit highlight. Each one is skipped for visitors who ask for reduced motion.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // Header: solid once the page scrolls.
  const header = document.querySelector("[data-header]");
  const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal sections as they enter the screen.
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !calm) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add("in"));

  if (calm) return;

  // Hero: a gold glow follows the pointer; the rosette drifts slightly.
  document.querySelectorAll("[data-hero]").forEach((hero) => {
    const layers = hero.querySelectorAll("[data-parallax]");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      hero.style.setProperty("--mx", `${x * 100}%`);
      hero.style.setProperty("--my", `${y * 100}%`);
      layers.forEach((l) => {
        const k = Number(l.dataset.parallax) * 100;
        l.style.transform = `translate(${(x - 0.5) * -k}px, ${(y - 0.5) * -k}px)`;
      });
    });
  });

  if (!fine) return;

  // Cards tilt toward the pointer, with a glow where it rests.
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", `${(x - 0.5) * 7}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
      card.style.setProperty("--gx", `${x * 100}%`);
      card.style.setProperty("--gy", `${y * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  // Buttons lean toward the pointer.
  document.querySelectorAll(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    b.addEventListener("pointerleave", () => (b.style.transform = ""));
  });

  // Orbit: hovering a business in the list lights its node.
  const nodes = document.querySelectorAll("[data-node]");
  document.querySelectorAll("[data-node-link]").forEach((a) => {
    const n = nodes[Number(a.dataset.nodeLink)];
    a.addEventListener("pointerenter", () => n && n.classList.add("on"));
    a.addEventListener("pointerleave", () => n && n.classList.remove("on"));
    a.addEventListener("focus", () => n && n.classList.add("on"));
    a.addEventListener("blur", () => n && n.classList.remove("on"));
  });
})();
