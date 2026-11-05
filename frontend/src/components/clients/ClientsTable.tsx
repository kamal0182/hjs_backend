import type { Commande } from "../../types/commande";
import { formatDate } from "../../utils/formatDate";
import { RowActions } from "../gestion/GestionParts";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface ClientsTableProps {
  commandes: Commande[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  // Omitted for read-only users: the Actions column is hidden.
  onEdit?: (commande: Commande) => void;
  onDelete?: (commande: Commande) => void;
}

const COLUMNS = ["Nom du client", "Commande", "Date", "Commentaire", "Ville"];

export function ClientsTable({ commandes, isLoading, error, onRetry, onEdit, onDelete }: ClientsTableProps) {
  if (isLoading) return <TableLoadingState />;
  if (error) return <TableErrorState message={error} onRetry={onRetry} />;
  if (commandes.length === 0) return <TableEmptyState />;

  const canManage = Boolean(onEdit);

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${canManage ? "min-w-[900px]" : "min-w-[820px]"} table-fixed text-left text-sm`}>
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className={`${canManage ? "w-[17%]" : "w-[18%]"} px-4 py-3`}>{COLUMNS[0]}</th>
            <th className="w-[20%] px-4 py-3">{COLUMNS[1]}</th>
            <th className="w-[11%] px-4 py-3">{COLUMNS[2]}</th>
            <th className={`${canManage ? "w-[28%]" : "w-[35%]"} px-4 py-3`}>{COLUMNS[3]}</th>
            <th className={`${canManage ? "w-[14%]" : "w-[16%]"} px-4 py-3`}>{COLUMNS[4]}</th>
            {canManage && <th className="w-[10%] px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {commandes.map((commande) => (
            <tr key={commande.id} className="hover:bg-slate-50">
              <td className="truncate px-4 py-3 font-medium text-slate-900">
                {commande.clientName}
              </td>
              <td className="px-4 py-3">
                <p className="mb-1 text-xs font-medium text-slate-400">{commande.commandeRef}</p>
                <div className="flex flex-wrap gap-1">
                  {commande.lines.map((line) => (
                    <span
                      key={line.category}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {line.category}: {line.quantity}
                    </span>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(commande.date)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p className="line-clamp-2" title={commande.comment || undefined}>
                  {commande.comment || <span className="text-slate-400">—</span>}
                </p>
              </td>
              <td className="truncate px-4 py-3 text-slate-600">{commande.city}</td>
              {onEdit && (
                <td className="px-4 py-3">
                  <RowActions onEdit={() => onEdit(commande)} onDelete={onDelete && (() => onDelete(commande))} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
