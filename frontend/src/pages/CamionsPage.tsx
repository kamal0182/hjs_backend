import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { CamionForm } from "../components/gestion/CamionForm";
import {
  ActionError,
  GestionHeader,
  PrimaryButton,
  RowActions,
  SearchInput,
} from "../components/gestion/GestionParts";
import { errorMessage } from "../components/gestion/gestionUtils";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../components/ui/QueryStates";
import { useGestionList } from "../hooks/useGestionList";
import { gestionService } from "../services/gestion";
import type { ManagedCamion } from "../types/gestion";

type FormState = { mode: "create" } | { mode: "edit"; camion: ManagedCamion } | null;

export function CamionsPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useGestionList(
    gestionService.getCamions,
    "Impossible de charger les camions. Veuillez réessayer.",
  );

  async function handleDelete(camion: ManagedCamion) {
    if (!window.confirm(`Supprimer le camion ${camion.matricule} et ses commentaires ?`)) return;
    setActionError(null);
    try {
      await gestionService.deleteCamion(camion.id);
      list.retry();
    } catch (err) {
      // 409 when the truck still has fill-up records.
      setActionError(errorMessage(err, "Impossible de supprimer le camion."));
    }
  }

  return (
    <div className="space-y-6">
      <GestionHeader
        title="Gestion des camions"
        description="Flotte de camions identifiés par leur matricule."
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setForm({ mode: "create" })}>
              <Plus size={16} />
              Ajouter un camion
            </PrimaryButton>
          )
        }
      />

      {actionError && <ActionError message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
          <SearchInput
            value={list.searchInput}
            onChange={list.setSearchInput}
            placeholder="Rechercher un matricule…"
          />
          <span className="text-sm text-slate-500">
            {list.total} résultat{list.total > 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-4" />

        {list.isLoading ? (
          <TableLoadingState message="Chargement des camions…" />
        ) : list.error ? (
          <TableErrorState message={list.error} onRetry={list.retry} />
        ) : list.items.length === 0 ? (
          <TableEmptyState title="Aucun camion trouvé" description="Essayez une autre recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Matricule</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((camion) => (
                  <tr key={camion.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{camion.matricule}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <RowActions
                          onEdit={() => setForm({ mode: "edit", camion })}
                          onDelete={() => handleDelete(camion)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!list.isLoading && !list.error && list.items.length > 0 && (
          <Pagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
        )}
      </div>

      {form && (
        <Modal title={form.mode === "edit" ? "Modifier le camion" : "Ajouter un camion"} onClose={() => setForm(null)}>
          <CamionForm
            camion={form.mode === "edit" ? form.camion : undefined}
            onCancel={() => setForm(null)}
            onSuccess={() => {
              setForm(null);
              list.retry();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
