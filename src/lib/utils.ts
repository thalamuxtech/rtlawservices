import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * After a multi-step form changes step, moves keyboard and screen reader focus
 * to the new step's heading, once its entrance animation has mounted it.
 */
export function focusStep() {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>("[data-step-root] legend, [data-step-root] h2");
    if (!el) return;
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
  }, 450);
}
