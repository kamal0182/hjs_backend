import { Plus } from "lucide-react";
import type { CamionSummary } from "../../types/gazoil";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface GazoilTableProps {
  camions: CamionSummary[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetails: (matricule: string) => void;
  // Omitted for read-only users: the "Ajouter" button is hidden.
  onAddComment?: (matricule: string) => void;
  onViewComments: (matricule: string) => void;
}

export function GazoilTable({
  camions,
  isLoading,
  error,
  onRetry,
  onViewDetails,
  onAddComment,
  onViewComments,
}: GazoilTableProps) {
  if (isLoading) return <TableLoadingState message="Chargement des camions…" />;
  if (error) return <TableErrorState message={error} onRetry={onRetry} />;
  if (camions.length === 0) {
    return (
      <TableEmptyState
        title="Aucun camion trouvé"
        description="Essayez de modifier votre recherche, ou ajoutez un nouveau plein."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-[22%] px-4 py-3">Matricule</th>
            <th className="w-[18%] px-4 py-3">Prix (dernier plein)</th>
            <th className="w-[15%] px-4 py-3">Date (dernier plein)</th>
            <th className="w-[25%] px-4 py-3">Commentaires</th>
            <th className="w-[20%] px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {camions.map((camion) => (
            <tr key={camion.matricule} className="hover:bg-slate-50">
              <td className="truncate px-4 py-3 font-medium text-slate-900">{camion.matricule}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(camion.latestPrice)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(camion.latestDate)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {onAddComment && (
                    <button
                      type="button"
                      onClick={() => onAddComment(camion.matricule)}
                      className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={13} />
                      Ajouter
                    </button>
                  )}
                  {camion.commentsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onViewComments(camion.matricule)}
                      className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      {camion.commentsCount} commentaire{camion.commentsCount > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onViewDetails(camion.matricule)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
