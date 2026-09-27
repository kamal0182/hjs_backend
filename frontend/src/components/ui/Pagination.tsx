import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageWindow(page: number, totalPages: number): number[] {
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = getPageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-2 py-3 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      <div className="flex items-center gap-1">
        {pages[0] > 1 && <span className="px-1.5 text-sm text-slate-400">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={[
              "h-8 w-8 rounded-md text-sm font-medium transition-colors",
              p === page
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <span className="px-1.5 text-sm text-slate-400">…</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
