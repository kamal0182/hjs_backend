import { ClipboardList, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ChargeForm } from "../components/charges/ChargeForm";
import { ChargesTable } from "../components/charges/ChargesTable";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { useChargesData } from "../hooks/useChargesData";
import { formatCurrency } from "../utils/formatCurrency";

export function ChargesPage() {
  const { isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { charges, total, totalPages, page, setPage, stats, isLoading, error, retry, refreshAll } =
    useChargesData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Charges</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi des charges et dépenses de l'entreprise.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Nouvelle charge
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats ? (
          <>
            <StatCard
              label="Total des charges"
              value={formatCurrency(stats.totalMontant)}
              icon={Wallet}
              accent="indigo"
            />
            <StatCard label="Total enregistrements" value={stats.totalRecords} icon={ClipboardList} accent="amber" />
          </>
        ) : (
          Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <h2 className="text-base font-semibold text-slate-900">Charges</h2>
          <span className="text-sm text-slate-500">{total} résultat{total > 1 ? "s" : ""}</span>
        </div>

        <div className="h-4" />

        <ChargesTable charges={charges} isLoading={isLoading} error={error} onRetry={retry} />

        {!isLoading && !error && charges.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {isFormOpen && (
        <Modal title="Nouvelle charge" onClose={() => setIsFormOpen(false)}>
          <ChargeForm
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              refreshAll();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
