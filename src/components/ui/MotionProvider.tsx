"use client";

import { MotionConfig } from "motion/react";

/** Makes every Motion animation follow the visitor's reduced-motion setting. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
