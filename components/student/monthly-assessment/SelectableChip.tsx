"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = {
  selected: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function SelectableChip({ selected, children, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange-bright/70 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-void ${
        selected
          ? "border-pf-orange bg-pf-orange/15 text-white shadow-[0_0_20px_rgba(249,115,22,0.12)]"
          : "border-white/15 bg-pf-void/50 text-zinc-300 hover:border-white/25 hover:text-white"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
