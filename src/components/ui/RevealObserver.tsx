"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startAnalytics } from "@/lib/analytics";

/**
 * Adds `is-in` to every [data-reveal] element as it enters the viewport.
 * Elements are visible by default, so content never depends on this script.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    startAnalytics().catch(() => {});
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () =>
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
