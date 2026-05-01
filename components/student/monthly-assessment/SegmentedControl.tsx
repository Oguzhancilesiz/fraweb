"use client";

type Opt = { value: number; label: string };

type Props = {
  options: Opt[];
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  className?: string;
};

export function SegmentedControl({ options, value, onChange, ariaLabel, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap gap-1 rounded-xl border border-white/10 bg-pf-void/40 p-1 ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(o.value)}
            className={`min-h-[40px] min-w-[2.25rem] flex-1 rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange-bright/60 sm:text-sm ${
              sel ? "bg-pf-orange-bright text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
