import { Fuel, Plus, Receipt, Search, Truck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { AddGazoilCommentModal } from "../components/gazoil/AddGazoilCommentModal";
import { GazoilCommentsListModal } from "../components/gazoil/GazoilCommentsListModal";
import { GazoilDetailsModal } from "../components/gazoil/GazoilDetailsModal";
import { GazoilForm } from "../components/gazoil/GazoilForm";
import { GazoilTable } from "../components/gazoil/GazoilTable";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { useGazoilData } from "../hooks/useGazoilData";
import { formatCurrency } from "../utils/formatCurrency";

export function GazoilPage() {
  const { isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMatricule, setSelectedMatricule] = useState<string | null>(null);
  const [commentTargetMatricule, setCommentTargetMatricule] = useState<string | null>(null);
  const [viewCommentsMatricule, setViewCommentsMatricule] = useState<string | null>(null);

  const {
    camions,
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
  } = useGazoilData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gazoil</h1>
          <p className="mt-1 text-sm text-slate-500">Suivi des pleins de gazoil par camion.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Nouveau plein
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 *:last:col-span-2 sm:grid-cols-3 sm:gap-4 sm:*:last:col-span-1">
        {stats ? (
          <>
            <StatCard
              label="Total dépenses gazoil"
              value={formatCurrency(stats.totalPriceAll)}
              icon={Receipt}
              accent="indigo"
            />
            <StatCard label="Total camions" value={stats.totalCamions} icon={Truck} accent="sky" />
            <StatCard label="Total pleins" value={stats.totalRecords} icon={Fuel} accent="amber" />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <h2 className="text-base font-semibold text-slate-900">Camions</h2>
          <span className="text-sm text-slate-500">{total} résultat{total > 1 ? "s" : ""}</span>
        </div>

        <div className="border-b border-slate-200 p-4 sm:p-6">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par matricule…"
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <GazoilTable
          camions={camions}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onViewDetails={setSelectedMatricule}
          onAddComment={isAdmin ? setCommentTargetMatricule : undefined}
          onViewComments={setViewCommentsMatricule}
        />

        {!isLoading && !error && camions.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {isFormOpen && (
        <Modal title="Nouveau plein" onClose={() => setIsFormOpen(false)}>
          <GazoilForm
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              refreshAll();
            }}
          />
        </Modal>
      )}

      {selectedMatricule && (
        <GazoilDetailsModal matricule={selectedMatricule} onClose={() => setSelectedMatricule(null)} />
      )}

      {commentTargetMatricule && (
        <AddGazoilCommentModal
          matricule={commentTargetMatricule}
          onClose={() => setCommentTargetMatricule(null)}
          onAdded={() => {
            setCommentTargetMatricule(null);
            retry();
          }}
        />
      )}

      {viewCommentsMatricule && (
        <GazoilCommentsListModal
          matricule={viewCommentsMatricule}
          onClose={() => setViewCommentsMatricule(null)}
        />
      )}
    </div>
  );
}
