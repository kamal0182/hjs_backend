import { AlertTriangle, PackageSearch, RefreshCw } from "lucide-react";

interface TableLoadingStateProps {
  message?: string;
}

export function TableLoadingState({ message = "Chargement des clients…" }: TableLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface TableErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function TableErrorState({ message, onRetry }: TableErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertTriangle size={22} />
      </div>
      <p className="text-sm font-medium text-slate-900">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw size={14} />
        Réessayer
      </button>
    </div>
  );
}

interface TableEmptyStateProps {
  title?: string;
  description?: string;
}

export function TableEmptyState({
  title = "Aucun client trouvé",
  description = "Essayez de modifier votre recherche ou vos filtres pour voir plus de résultats.",
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <PackageSearch size={22} />
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="max-w-xs text-sm text-slate-500">{description}</p>
    </div>
  );
}
