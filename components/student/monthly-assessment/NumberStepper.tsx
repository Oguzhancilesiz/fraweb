"use client";

type Props = {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  disabled?: boolean;
  ariaLabel: string;
};

function roundTo(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function NumberStepper({ value, onChange, min, max, step, decimals = 0, disabled, ariaLabel }: Props) {
  const dec = decimals;
  const bump = (dir: 1 | -1) => {
    const next = roundTo(value + dir * step, dec);
    const clamped = Math.min(max, Math.max(min, next));
    onChange(clamped);
  };
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-white/15 bg-pf-void/80" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => bump(-1)}
        className="px-3 py-2 text-lg font-semibold text-zinc-300 hover:bg-white/5 hover:text-white disabled:opacity-30"
        aria-label="Azalt"
      >
        −
      </button>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => bump(1)}
        className="px-3 py-2 text-lg font-semibold text-zinc-300 hover:bg-white/5 hover:text-white disabled:opacity-30"
        aria-label="Arttır"
      >
        +
      </button>
    </div>
  );
}
