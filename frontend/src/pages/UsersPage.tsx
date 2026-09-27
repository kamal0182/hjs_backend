import { Plus, ShieldAlert } from "lucide-react";
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
import { UserForm } from "../components/gestion/UserForm";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../components/ui/QueryStates";
import { useGestionList } from "../hooks/useGestionList";
import { gestionService } from "../services/gestion";
import type { ManagedUser } from "../types/gestion";
import { formatDate } from "../utils/formatDate";

type FormState = { mode: "create" } | { mode: "edit"; user: ManagedUser } | null;

export function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <ShieldAlert size={28} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-900">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return <UsersManager currentUserId={currentUser?.id} />;
}

function UsersManager({ currentUserId }: { currentUserId?: string }) {
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useGestionList(
    gestionService.getUsers,
    "Impossible de charger les utilisateurs. Veuillez réessayer.",
  );

  async function handleDeactivate(user: ManagedUser) {
    if (!window.confirm(`Désactiver le compte ${user.email} ? Il ne pourra plus se connecter.`)) return;
    setActionError(null);
    try {
      await gestionService.deactivateUser(user.id);
      list.retry();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de désactiver l'utilisateur."));
    }
  }

  return (
    <div className="space-y-6">
      <GestionHeader
        title="Utilisateurs"
        description="Comptes ayant accès à l'application."
        action={
          <PrimaryButton onClick={() => setForm({ mode: "create" })}>
            <Plus size={16} />
            Ajouter un utilisateur
          </PrimaryButton>
        }
      />

      {actionError && <ActionError message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
          <SearchInput
            value={list.searchInput}
            onChange={list.setSearchInput}
            placeholder="Rechercher par nom ou email…"
          />
          <span className="text-sm text-slate-500">
            {list.total} résultat{list.total > 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-4" />

        {list.isLoading ? (
          <TableLoadingState message="Chargement des utilisateurs…" />
        ) : list.error ? (
          <TableErrorState message={list.error} onRetry={list.retry} />
        ) : list.items.length === 0 ? (
          <TableEmptyState title="Aucun utilisateur trouvé" description="Essayez une autre recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Inscrit le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          user.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                        ].join(" ")}
                      >
                        {user.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(user.dateJoined.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        onEdit={() => setForm({ mode: "edit", user })}
                        onDelete={
                          user.isActive && user.id !== currentUserId ? () => handleDeactivate(user) : undefined
                        }
                        deleteLabel="Désactiver"
                      />
                    </td>
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
          title={form.mode === "edit" ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
          onClose={() => setForm(null)}
        >
          <UserForm
            user={form.mode === "edit" ? form.user : undefined}
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
