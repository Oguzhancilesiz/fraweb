"use client";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
  disabled?: boolean;
};

export function ToggleSwitch({ checked, onChange, id, label, disabled }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-pf-void/40 px-3 py-2.5">
      <label htmlFor={id} className="cursor-pointer text-sm text-zinc-300">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange-bright/70 ${
          checked ? "bg-pf-orange" : "bg-white/15"
        } disabled:opacity-40`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
