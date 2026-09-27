import { useEffect, useState } from "react";
import { clientsMoneyService } from "../../services/clientsMoney";
import type { ClientMoneyRecord, PaymentRecord } from "../../types/clientsMoney";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { Modal } from "../ui/Modal";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface ClientMoneyDetailsModalProps {
  recordId: string;
  clientName: string;
  onClose: () => void;
}

interface Details {
  record: ClientMoneyRecord;
  payments: PaymentRecord[];
}

export function ClientMoneyDetailsModal({ recordId, clientName, onClose }: ClientMoneyDetailsModalProps) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setDetails(null);
    setError(null);
    Promise.all([clientsMoneyService.getRecord(recordId), clientsMoneyService.getPayments(recordId)])
      .then(([record, payments]) => setDetails({ record, payments }))
      .catch(() => setError("Impossible de charger les paiements. Veuillez réessayer."));
  }

  useEffect(load, [recordId]);

  const totalPayments = details?.payments.reduce((sum, p) => sum + p.price, 0) ?? 0;

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
