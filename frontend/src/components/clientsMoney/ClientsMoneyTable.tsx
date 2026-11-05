import { Eye, Plus } from "lucide-react";
import type { ClientMoneySummary } from "../../types/clientsMoney";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { RowActions } from "../gestion/GestionParts";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface ClientsMoneyTableProps {
  clients: ClientMoneySummary[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetails: (recordId: string, clientName: string) => void;
  // Omitted for read-only users: the "Ajouter" button and Actions column are hidden.
  onAddPayment?: (recordId: string, clientName: string) => void;
  onEdit?: (client: ClientMoneySummary) => void;
  onDelete?: (client: ClientMoneySummary) => void;
}

export function ClientsMoneyTable({
  clients,
  isLoading,
  error,
  onRetry,
  onViewDetails,
  onAddPayment,
  onEdit,
  onDelete,
}: ClientsMoneyTableProps) {
  if (isLoading) return <TableLoadingState message="Chargement des clients…" />;
  if (error) return <TableErrorState message={error} onRetry={onRetry} />;
  if (clients.length === 0) {
    return (
      <TableEmptyState
        title="Aucun client trouvé"
        description="Ajoutez un nouveau client pour commencer."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${onEdit ? "min-w-[720px]" : "min-w-[640px]"} table-fixed text-left text-sm`}>
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-[30%] px-4 py-3">Nom du client</th>
            <th className="w-[18%] px-4 py-3">Montant</th>
            <th className="w-[16%] px-4 py-3">Date</th>
            {onAddPayment && <th className="w-[18%] px-4 py-3 text-center">Ajouter</th>}
            <th className="w-[18%] px-4 py-3 text-center">Détails</th>
            {onEdit && <th className="w-[12%] px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((client) => (
            <tr key={client.recordId} className="hover:bg-slate-50">
              <td className="truncate px-4 py-3 font-medium text-slate-900">{client.clientName}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(client.latestMontant)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(client.latestDate)}
              </td>
              {onAddPayment && (
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onAddPayment(client.recordId, client.clientName)}
                    className="mx-auto flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={13} />
                    Ajouter
                  </button>
                </td>
              )}
              <td className="px-4 py-3">
                {/* Nothing to show until at least one payment has been added. */}
                {client.paymentsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onViewDetails(client.recordId, client.clientName)}
                    className="mx-auto flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={13} />
                    Détails
                    <span className="rounded-full bg-indigo-50 px-1.5 text-[11px] font-semibold text-indigo-700">
                      {client.paymentsCount}
                    </span>
                  </button>
                ) : (
                  <span className="block text-center text-slate-300">—</span>
                )}
              </td>
              {onEdit && (
                <td className="px-4 py-3">
                  <RowActions onEdit={() => onEdit(client)} onDelete={onDelete && (() => onDelete(client))} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
