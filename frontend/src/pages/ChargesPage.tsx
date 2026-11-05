import { ClipboardList, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ChargeForm } from "../components/charges/ChargeForm";
import { ChargesTable } from "../components/charges/ChargesTable";
import { ActionError } from "../components/gestion/GestionParts";
import { errorMessage } from "../components/gestion/gestionUtils";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { useChargesData } from "../hooks/useChargesData";
import { chargesService } from "../services/charges";
import type { ChargeRecord } from "../types/charges";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

type FormState = { mode: "create" } | { mode: "edit"; charge: ChargeRecord } | null;

export function ChargesPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { charges, total, totalPages, page, setPage, stats, isLoading, error, retry, refreshAll } =
    useChargesData();

  async function handleDelete(charge: ChargeRecord) {
    if (!window.confirm(`Supprimer la charge du ${formatDate(charge.date)} (${formatCurrency(charge.montant)}) ?`)) {
      return;
    }
    setActionError(null);
    try {
      await chargesService.deleteCharge(charge.id);
      retry();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de supprimer la charge."));
    }
  }

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
            onClick={() => setForm({ mode: "create" })}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Nouvelle charge
          </button>
        )}
      </div>

      {actionError && <ActionError message={actionError} onDismiss={() => setActionError(null)} />}

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

        <ChargesTable
          charges={charges}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onEdit={isAdmin ? (charge) => setForm({ mode: "edit", charge }) : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />

        {!isLoading && !error && charges.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {form && (
        <Modal title={form.mode === "edit" ? "Modifier la charge" : "Nouvelle charge"} onClose={() => setForm(null)}>
          <ChargeForm
            charge={form.mode === "edit" ? form.charge : undefined}
            onCancel={() => setForm(null)}
            onSuccess={() => {
              // A new charge shows up on page 1; an edited one stays where it is.
              const wasEdit = form.mode === "edit";
              setForm(null);
              if (wasEdit) retry();
              else refreshAll();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
