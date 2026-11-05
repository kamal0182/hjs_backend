import { useEffect, useState } from "react";
import { gazoilService } from "../../services/gazoil";
import type { GazoilRecord } from "../../types/gazoil";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { ActionError, RowActions } from "../gestion/GestionParts";
import { errorMessage } from "../gestion/gestionUtils";
import { Modal } from "../ui/Modal";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";
import { GazoilForm } from "./GazoilForm";

interface GazoilDetailsModalProps {
  matricule: string;
  onClose: () => void;
  // Omitted for read-only users: pleins cannot be edited or deleted.
  // Called after a plein changes so the page can refresh its totals.
  onChanged?: () => void;
}

export function GazoilDetailsModal({ matricule, onClose, onChanged }: GazoilDetailsModalProps) {
  const [records, setRecords] = useState<GazoilRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<GazoilRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setRecords(null);
    setError(null);
    gazoilService
      .getHistoryForMatricule(matricule)
      .then(setRecords)
      .catch(() => setError("Impossible de charger l'historique. Veuillez réessayer."));
  }

  useEffect(load, [matricule]);

  function handleChanged() {
    load();
    onChanged?.();
  }

  async function handleDelete(record: GazoilRecord) {
    if (!window.confirm(`Supprimer le plein du ${formatDate(record.date)} (${formatCurrency(record.price)}) ?`)) {
      return;
    }
    setActionError(null);
    try {
      await gazoilService.deleteRecord(record.id);
      handleChanged();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de supprimer le plein."));
    }
  }

  const total = records?.reduce((sum, r) => sum + r.price, 0) ?? 0;

  if (editingRecord) {
    return (
      <Modal title={`Modifier le plein — ${matricule}`} onClose={() => setEditingRecord(null)}>
        <GazoilForm
          record={editingRecord}
          onCancel={() => setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null);
            handleChanged();
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal title={`Historique — ${matricule}`} onClose={onClose}>
      {records === null && !error && <TableLoadingState message="Chargement de l'historique…" />}
      {error && <TableErrorState message={error} onRetry={load} />}

      {records && !error && (
        <>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
            <span className="text-sm font-medium text-indigo-700">Total de tous les pleins</span>
            <span className="text-lg font-semibold text-indigo-700">{formatCurrency(total)}</span>
          </div>

          {actionError && (
            <div className="mb-4">
              <ActionError message={actionError} onDismiss={() => setActionError(null)} />
            </div>
          )}

          {records.length === 0 ? (
            <TableEmptyState
              title="Aucun enregistrement"
              description="Ce camion n'a aucun plein enregistré pour le moment."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Prix</th>
                    {onChanged && <th className="px-3 py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{formatCurrency(record.price)}</td>
                      {onChanged && (
                        <td className="px-3 py-2">
                          <RowActions
                            onEdit={() => {
                              setActionError(null);
                              setEditingRecord(record);
                            }}
                            onDelete={() => handleDelete(record)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
