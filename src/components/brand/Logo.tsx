"use client";

/* ============================================================
   Meaify — Brand mark
   ------------------------------------------------------------
   Editorial direction: no decorative logo, no gradients.
   Just the wordmark in Instrument Serif, with the tagline
   "Multimodal Education AI" as a small-caps eyebrow below.
   ============================================================ */

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-display text-[1.4rem] leading-none tracking-tight text-foreground">
        Meaify
      </span>
    </span>
  );
}

export function LogoWordmark({
  className,
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-display text-[1.4rem] leading-none tracking-tight text-foreground">
        Meaify
      </span>
      {withTagline && (
        <span className="eyebrow mt-1.5 text-[0.55rem]">
          Multimodal Education AI
        </span>
      )}
    </span>
  );
}
