import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ClientForm } from "../components/gestion/ClientForm";
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
import type { ManagedClient } from "../types/gestion";

type FormState = { mode: "create" } | { mode: "edit"; client: ManagedClient } | null;

export function ClientsDirectoryPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useGestionList(
    gestionService.getClients,
    "Impossible de charger les clients. Veuillez réessayer.",
  );

  async function handleDelete(client: ManagedClient) {
    if (!window.confirm(`Supprimer le client « ${client.name} » ?`)) return;
    setActionError(null);
    try {
      await gestionService.deleteClient(client.id);
      list.retry();
    } catch (err) {
      // 409 when the client still has commandes.
      setActionError(errorMessage(err, "Impossible de supprimer le client."));
    }
  }

  return (
    <div className="space-y-6">
      <GestionHeader
        title="Gestion des clients"
        description="Répertoire des clients utilisés dans les commandes."
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setForm({ mode: "create" })}>
              <Plus size={16} />
              Ajouter un client
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
            placeholder="Rechercher par nom ou société…"
          />
          <span className="text-sm text-slate-500">
            {list.total} résultat{list.total > 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-4" />

        {list.isLoading ? (
          <TableLoadingState message="Chargement des clients…" />
        ) : list.error ? (
          <TableErrorState message={list.error} onRetry={list.retry} />
        ) : list.items.length === 0 ? (
          <TableEmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Société</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{client.name}</td>
                    <td className="px-4 py-3 text-slate-600">{client.company || "—"}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <RowActions
                          onEdit={() => setForm({ mode: "edit", client })}
                          onDelete={() => handleDelete(client)}
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
        <Modal title={form.mode === "edit" ? "Modifier le client" : "Ajouter un client"} onClose={() => setForm(null)}>
          <ClientForm
            client={form.mode === "edit" ? form.client : undefined}
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
