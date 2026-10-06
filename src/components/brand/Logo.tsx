"use client";

/* ============================================================
   Brand Logo — gradient brand mark.
   ------------------------------------------------------------
   Two stacked chevrons suggest a stack of exam papers / grades.
   The gradient runs sky→yellow and matches the .brand-gradient-bg
   utility class defined in globals.css.
   ============================================================ */

import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="brand-gradient-bg absolute inset-0 rounded-[28%]"
        style={{
          boxShadow: "var(--shadow-soft-md)",
        }}
      />
      <svg
        viewBox="0 0 32 32"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        className="relative z-10"
      >
        {/* Top sheet — slight upward sweep */}
        <path
          d="M6 13 L16 9 L26 13 L16 17 Z"
          fill="white"
          opacity="0.96"
          strokeLinejoin="round"
        />
        {/* Bottom sheet */}
        <path
          d="M6 19 L16 15 L26 19 L16 23 Z"
          fill="white"
          opacity="0.7"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo size={32} />
      <span className="font-display text-xl tracking-tight">
        <span className="brand-gradient-text">MEAIFY</span>
      </span>
    </span>
  );
}
