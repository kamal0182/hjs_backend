import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  ActionError,
  GestionHeader,
  PrimaryButton,
  RowActions,
  SearchInput,
} from "../components/gestion/GestionParts";
import { errorMessage } from "../components/gestion/gestionUtils";
import { LookupForm } from "../components/gestion/LookupForm";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../components/ui/QueryStates";
import { useGestionList } from "../hooks/useGestionList";
import { gestionService } from "../services/gestion";
import type { GestionQueryParams, LookupItem, LookupKind } from "../types/gestion";

interface LookupConfig {
  title: string;
  description: string;
  label: string; // form field + column label
  placeholder: string;
  addLabel: string;
  emptyTitle: string;
  fetchPage: (params: GestionQueryParams) => ReturnType<typeof pageLookups>;
}

// Lookup lists are small: fetch them whole, then search/page in the browser.
async function pageLookups(kind: LookupKind, params: GestionQueryParams) {
  const search = params.search?.toLowerCase();
  const all = (await gestionService.getLookups(kind)).filter(
    (item) => !search || item.name.toLowerCase().includes(search),
  );
  const start = (params.page - 1) * params.pageSize;
  return { data: all.slice(start, start + params.pageSize), total: all.length, page: params.page, pageSize: params.pageSize };
}

// Module-level fetchers keep a stable reference for useGestionList.
const LOOKUPS: Record<LookupKind, LookupConfig> = {
  categories: {
    title: "Catégories",
    description: "Catégories proposées sur les lignes de commande.",
    label: "Catégorie",
    placeholder: "ex: Ramla",
    addLabel: "Ajouter une catégorie",
    emptyTitle: "Aucune catégorie trouvée",
    fetchPage: (params) => pageLookups("categories", params),
  },
  villes: {
    title: "Villes",
    description: "Villes de livraison proposées dans les commandes.",
    label: "Ville",
    placeholder: "ex: Casablanca",
    addLabel: "Ajouter une ville",
    emptyTitle: "Aucune ville trouvée",
    fetchPage: (params) => pageLookups("villes", params),
  },
  paymentTypes: {
    title: "Types de paiement",
    description: "Moyens de paiement proposés dans Clients Money.",
    label: "Type de paiement",
    placeholder: "ex: Virement",
    addLabel: "Ajouter un type",
    emptyTitle: "Aucun type de paiement trouvé",
    fetchPage: (params) => pageLookups("paymentTypes", params),
  },
};

type FormState = { mode: "create" } | { mode: "edit"; item: LookupItem } | null;

export function LookupPage({ kind }: { kind: LookupKind }) {
  // Remount per kind so search/page state does not leak between lists.
  return <LookupManager key={kind} kind={kind} />;
}

function LookupManager({ kind }: { kind: LookupKind }) {
  const config = LOOKUPS[kind];
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useGestionList(config.fetchPage, "Impossible de charger la liste. Veuillez réessayer.");

  async function handleDelete(item: LookupItem) {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    setActionError(null);
    try {
      await gestionService.deleteLookup(kind, item.id);
      list.retry();
    } catch (err) {
      // 409 when the value is still used by commandes / clients / paiements.
      setActionError(errorMessage(err, "Suppression impossible."));
    }
  }

  return (
    <div className="space-y-6">
      <GestionHeader
        title={config.title}
        description={config.description}
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setForm({ mode: "create" })}>
              <Plus size={16} />
              {config.addLabel}
            </PrimaryButton>
          )
        }
      />

      {actionError && <ActionError message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
          <SearchInput value={list.searchInput} onChange={list.setSearchInput} placeholder="Rechercher…" />
          <span className="text-sm text-slate-500">
            {list.total} résultat{list.total > 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-4" />

        {list.isLoading ? (
          <TableLoadingState message="Chargement…" />
        ) : list.error ? (
          <TableErrorState message={list.error} onRetry={list.retry} />
        ) : list.items.length === 0 ? (
          <TableEmptyState title={config.emptyTitle} description="Ajoutez-en une ou modifiez votre recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">{config.label}</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <RowActions
                          onEdit={() => setForm({ mode: "edit", item })}
                          onDelete={() => handleDelete(item)}
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
        <Modal
          title={form.mode === "edit" ? `Modifier — ${form.item.name}` : config.addLabel}
          onClose={() => setForm(null)}
        >
          <LookupForm
            kind={kind}
            label={config.label}
            placeholder={config.placeholder}
            item={form.mode === "edit" ? form.item : undefined}
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
