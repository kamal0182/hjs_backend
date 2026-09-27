import { Plus, Receipt, Search, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ClientMoneyDetailsModal } from "../components/clientsMoney/ClientMoneyDetailsModal";
import { ClientMoneyRecordForm } from "../components/clientsMoney/ClientMoneyRecordForm";
import { ClientsMoneyTable } from "../components/clientsMoney/ClientsMoneyTable";
import { PaymentForm } from "../components/clientsMoney/PaymentForm";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { useClientsMoneyData } from "../hooks/useClientsMoneyData";
import { formatCurrency } from "../utils/formatCurrency";

export function ClientsMoneyPage() {
  const { isAdmin } = useAuth();
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ id: string; name: string } | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<{ id: string; name: string } | null>(null);

  const {
    clients,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    stats,
    isLoading,
    error,
    retry,
    refreshAll,
  } = useClientsMoneyData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients Money</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi des paiements reçus par client.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsRecordFormOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Nouveau client
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 *:last:col-span-2 sm:grid-cols-3 sm:gap-4 sm:*:last:col-span-1">
        {stats ? (
          <>
            <StatCard
              label="Total encaissé"
              value={formatCurrency(stats.totalCollected)}
              icon={Wallet}
              accent="indigo"
            />
            <StatCard label="Total clients" value={stats.totalClients} icon={Users} accent="sky" />
            <StatCard label="Total paiements" value={stats.totalPayments} icon={Receipt} accent="amber" />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <h2 className="text-base font-semibold text-slate-900">Clients</h2>
          <span className="text-sm text-slate-500">{total} résultat{total > 1 ? "s" : ""}</span>
        </div>

        <div className="border-b border-slate-200 p-4 sm:p-6">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom de client…"
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <ClientsMoneyTable
          clients={clients}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onViewDetails={(recordId, name) => setDetailsTarget({ id: recordId, name })}
          onAddPayment={isAdmin ? (recordId, name) => setPaymentTarget({ id: recordId, name }) : undefined}
        />

        {!isLoading && !error && clients.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {isRecordFormOpen && (
        <Modal title="Nouveau client" onClose={() => setIsRecordFormOpen(false)}>
          <ClientMoneyRecordForm
            onCancel={() => setIsRecordFormOpen(false)}
            onSuccess={() => {
              setIsRecordFormOpen(false);
              refreshAll();
            }}
          />
        </Modal>
      )}

      {detailsTarget && (
        <ClientMoneyDetailsModal
          recordId={detailsTarget.id}
          clientName={detailsTarget.name}
          onClose={() => setDetailsTarget(null)}
        />
      )}

      {paymentTarget && (
        <Modal title={`Ajouter un paiement — ${paymentTarget.name}`} onClose={() => setPaymentTarget(null)}>
          <PaymentForm
            recordId={paymentTarget.id}
            onCancel={() => setPaymentTarget(null)}
            onSuccess={() => {
              setPaymentTarget(null);
              refreshAll();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
