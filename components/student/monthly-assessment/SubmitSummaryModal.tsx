"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  goalLabel: string;
  weightKg: number;
  weeklyDays: number;
  waterSummary: string;
  photosReady: boolean;
};

export function SubmitSummaryModal({
  open,
  onClose,
  onConfirm,
  confirming,
  goalLabel,
  weightKg,
  weeklyDays,
  waterSummary,
  photosReady,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="sum-title">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Kapat" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-pf-card p-5 shadow-xl">
        <h2 id="sum-title" className="text-lg font-semibold text-white">
          Koçuna gönder
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Bu ayki değerlendirmeni koçuna göndermek üzeresin. Özet:</p>
        <ul className="mt-4 space-y-2 rounded-xl border border-white/10 bg-pf-void/40 px-3 py-3 text-sm text-zinc-200">
          <li>
            <span className="text-zinc-500">Hedef:</span> {goalLabel}
          </li>
          <li>
            <span className="text-zinc-500">Kilo:</span> {Number.isFinite(weightKg) ? `${weightKg} kg` : "—"}
          </li>
          <li>
            <span className="text-zinc-500">Haftalık antrenman:</span> {weeklyDays} gün
          </li>
          <li>
            <span className="text-zinc-500">Su:</span> {waterSummary || "—"}
          </li>
          <li>
            <span className="text-zinc-500">Fotoğraflar:</span> {photosReady ? "5/5 tamam" : "Eksik var"}
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="rounded-xl bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "Gönderiliyor…" : "Onayla ve gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
