"use client";

type AdminPagerProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (nextPage: number) => void;
};

export function AdminPager({ page, pageSize, totalCount, onPageChange }: AdminPagerProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
      <p className="text-xs text-zinc-500">
        Toplam <span className="font-semibold text-zinc-300">{totalCount}</span> kayıt — sayfa {page}/{totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-40"
        >
          Önceki
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-40"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
