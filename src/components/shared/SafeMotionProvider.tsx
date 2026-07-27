"use client";

import { MotionConfig } from "motion/react";

/*
 * CleanNest previously launched hundreds of long-running transform animations
 * at once. Keeping reduced motion enabled at the application boundary makes
 * motion decorative instead of a requirement for rendering the page. Opacity,
 * colour, hover, and focus feedback remain available while expensive transform
 * and layout animation is avoided on laptops with limited graphics resources.
 */
export default function SafeMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="always">{children}</MotionConfig>;
}
