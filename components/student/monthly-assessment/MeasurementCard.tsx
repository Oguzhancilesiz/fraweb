"use client";

import { useEffect, useRef, useState } from "react";
import type { MeasurementFieldKey } from "./assessmentEditorTypes";

type Props = {
  fieldKey: MeasurementFieldKey;
  label: string;
  hint: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  error?: boolean;
  /** Sunucu `previousMonthMeasurementsCm` ile doldurulursa gösterilir. */
  previousCm?: number | null;
};

/** Türkçe gösterim: ondalık ayırıcı virgül. */
function formatCm(n: number): string {
  if (!Number.isFinite(n)) return "";
  const s = String(n);
  return s.includes(".") ? s.replace(".", ",") : s;
}

/** Virgül veya nokta ile ondalık; boş → null; geçersiz → NaN. */
function parseCmInput(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "" || t === "." || t === "-" || t === "-.") return null;
  const dotCount = (t.match(/\./g) ?? []).length;
  if (dotCount > 1) return Number.NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function MeasurementCard({ fieldKey, label, hint, value, onChange, min, max, error, previousCm }: Props) {
  const [text, setText] = useState(() => (value != null && Number.isFinite(value) ? formatCm(value) : ""));
  const editingRef = useRef(false);

  useEffect(() => {
    if (editingRef.current) return;
    if (value == null || !Number.isFinite(value)) setText("");
    else setText(formatCm(value));
  }, [value, fieldKey]);

  const num = typeof value === "number" && Number.isFinite(value) ? value : null;
  const delta =
    num != null && previousCm != null && Number.isFinite(previousCm) ? round1(num - previousCm) : null;

  const commit = (raw: string) => {
    const n = parseCmInput(raw);
    if (n !== null && Number.isNaN(n)) {
      if (value != null && Number.isFinite(value)) setText(formatCm(value));
      else setText("");
      return;
    }
    onChange(n);
    if (n === null) setText("");
    else setText(formatCm(n));
  };

  const showError = !!error;

  return (
    <div
      className={`flex flex-col rounded-xl border bg-pf-void/40 p-3 ${
        showError ? "border-red-500/50" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <label htmlFor={`m-${fieldKey}`} className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </label>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{hint}</p>
        </div>
        <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500">cm</span>
      </div>
      <input
        id={`m-${fieldKey}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        lang="tr"
        aria-invalid={showError}
        aria-describedby={showError ? `m-${fieldKey}-err` : undefined}
        className={`mt-2 w-full rounded-lg border bg-pf-void/80 px-3 py-2 text-white ${
          showError ? "border-red-500/60" : "border-white/15"
        }`}
        value={text}
        onFocus={() => {
          editingRef.current = true;
        }}
        onChange={(e) => {
          const raw = e.target.value;
          const cleaned = raw.replace(/[^\d.,]/g, "");
          setText(cleaned);
          if (cleaned === "" || cleaned === "," || cleaned === ".") {
            onChange(null);
            return;
          }
          const n = parseCmInput(cleaned);
          if (n !== null && !Number.isNaN(n)) {
            onChange(n);
          }
        }}
        onBlur={() => {
          editingRef.current = false;
          commit(text);
        }}
      />
      {showError ? (
        <p id={`m-${fieldKey}-err`} className="mt-1.5 text-[11px] text-amber-200/90">
          Makul aralık: {min}–{max} cm (ondalık için virgül veya nokta kullanabilirsin).
        </p>
      ) : null}
      {delta != null ? (
        <p className="mt-1.5 text-xs text-pf-orange-bright/90">
          Geçen aya göre: {delta > 0 ? "+" : ""}
          {delta} cm
        </p>
      ) : null}
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
