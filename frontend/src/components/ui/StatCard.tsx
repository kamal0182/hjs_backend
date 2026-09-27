import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: "indigo" | "emerald" | "amber" | "sky";
}

const ACCENT_STYLES: Record<StatCardProps["accent"], string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
};

export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    // Icon above the value so cards stay readable when several share a row.
    <div className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${ACCENT_STYLES[accent]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 max-w-full">
        <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900 sm:text-xl lg:text-2xl">{value}</p>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-5">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:h-11 sm:w-11" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-12 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
