import type { ChargeRecord } from "../../types/charges";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface ChargesTableProps {
  charges: ChargeRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ChargesTable({ charges, isLoading, error, onRetry }: ChargesTableProps) {
  if (isLoading) return <TableLoadingState message="Chargement des charges…" />;
  if (error) return <TableErrorState message={error} onRetry={onRetry} />;
  if (charges.length === 0) {
    return (
      <TableEmptyState
        title="Aucune charge trouvée"
        description="Ajoutez une nouvelle charge pour commencer."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-[15%] px-4 py-3">Date</th>
            <th className="w-[60%] px-4 py-3">Commentaire</th>
            <th className="w-[25%] px-4 py-3">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {charges.map((charge) => (
            <tr key={charge.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(charge.date)}</td>
              <td className="px-4 py-3 text-slate-600">
                <p className="line-clamp-2" title={charge.comment}>
                  {charge.comment}
                </p>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(charge.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
