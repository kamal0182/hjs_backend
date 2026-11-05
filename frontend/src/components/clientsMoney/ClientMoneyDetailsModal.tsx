import { useEffect, useState } from "react";
import { clientsMoneyService } from "../../services/clientsMoney";
import type { ClientMoneyRecord, PaymentRecord } from "../../types/clientsMoney";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { ActionError, RowActions } from "../gestion/GestionParts";
import { errorMessage } from "../gestion/gestionUtils";
import { Modal } from "../ui/Modal";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";
import { PaymentForm } from "./PaymentForm";

interface ClientMoneyDetailsModalProps {
  recordId: string;
  clientName: string;
  onClose: () => void;
  // Omitted for read-only users: payments cannot be edited or deleted.
  // Called after a payment changes so the page can refresh its totals.
  onChanged?: () => void;
}

interface Details {
  record: ClientMoneyRecord;
  payments: PaymentRecord[];
}

export function ClientMoneyDetailsModal({ recordId, clientName, onClose, onChanged }: ClientMoneyDetailsModalProps) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setDetails(null);
    setError(null);
    Promise.all([clientsMoneyService.getRecord(recordId), clientsMoneyService.getPayments(recordId)])
      .then(([record, payments]) => setDetails({ record, payments }))
      .catch(() => setError("Impossible de charger les paiements. Veuillez réessayer."));
  }

  useEffect(load, [recordId]);

  function handleChanged() {
    load();
    onChanged?.();
  }

  async function handleDelete(payment: PaymentRecord) {
    if (!window.confirm(`Supprimer le paiement du ${formatDate(payment.date)} (${formatCurrency(payment.price)}) ?`)) {
      return;
    }
    setActionError(null);
    try {
      await clientsMoneyService.deletePayment(payment.id);
      handleChanged();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de supprimer le paiement."));
    }
  }

  const totalPayments = details?.payments.reduce((sum, p) => sum + p.price, 0) ?? 0;

  if (editingPayment) {
    return (
      <Modal title={`Modifier le paiement — ${clientName}`} onClose={() => setEditingPayment(null)}>
        <PaymentForm
          recordId={recordId}
          payment={editingPayment}
          onCancel={() => setEditingPayment(null)}
          onSuccess={() => {
            setEditingPayment(null);
            handleChanged();
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal title={`Paiements — ${clientName}`} onClose={onClose}>
      {details === null && !error && <TableLoadingState message="Chargement des paiements…" />}
      {error && <TableErrorState message={error} onRetry={load} />}

      {details && !error && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Montant initial</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(details.record.montant)}</p>
              <p className="text-xs text-slate-500">le {formatDate(details.record.date)}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 px-4 py-3">
              <p className="text-xs text-indigo-600">
                Total des paiements ({details.payments.length})
              </p>
              <p className="text-lg font-semibold text-indigo-700">{formatCurrency(totalPayments)}</p>
            </div>
          </div>

          {actionError && (
            <div className="mb-4">
              <ActionError message={actionError} onDismiss={() => setActionError(null)} />
            </div>
          )}

          {details.payments.length === 0 ? (
            <TableEmptyState
              title="Aucun paiement"
              description="Aucun paiement n'a encore été ajouté pour ce client."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    {onChanged && <th className="px-3 py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(payment.date)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {payment.paymentType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {formatCurrency(payment.price)}
                      </td>
                      {onChanged && (
                        <td className="px-3 py-2">
                          <RowActions
                            onEdit={() => {
                              setActionError(null);
                              setEditingPayment(payment);
                            }}
                            onDelete={() => handleDelete(payment)}
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
