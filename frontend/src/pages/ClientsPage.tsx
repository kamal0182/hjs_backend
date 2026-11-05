import { ClipboardList, MapPin, Plus, ShoppingCart, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ClientsFilters } from "../components/clients/ClientsFilters";
import { ClientsTable } from "../components/clients/ClientsTable";
import { CommandeForm } from "../components/clients/CommandeForm";
import { ActionError } from "../components/gestion/GestionParts";
import { errorMessage } from "../components/gestion/gestionUtils";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { useClientsData } from "../hooks/useClientsData";
import { clientsService } from "../services/clients";
import type { Commande } from "../types/commande";

type FormState = { mode: "create" } | { mode: "edit"; commande: Commande } | null;

export function ClientsPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    commandes,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    city,
    setCity,
    date,
    setDate,
    cities,
    stats,
    isLoading,
    error,
    retry,
    refreshAll,
  } = useClientsData();

  async function handleDelete(commande: Commande) {
    if (!window.confirm(`Supprimer la commande ${commande.commandeRef} de « ${commande.clientName} » ?`)) return;
    setActionError(null);
    try {
      await clientsService.deleteCommande(commande.id);
      retry();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de supprimer la commande."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Client Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue d'ensemble des clients et de leurs commandes.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setForm({ mode: "create" })}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Nouvelle commande
          </button>
        )}
      </div>

      {actionError && <ActionError message={actionError} onDismiss={() => setActionError(null)} />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Total Clients" value={stats.totalClients} icon={Users} accent="indigo" />
            <StatCard label="Total Commandes" value={stats.totalCommandes} icon={ShoppingCart} accent="emerald" />
            <StatCard
              label="Commandes aujourd'hui"
              value={stats.commandesAujourdhui}
              icon={ClipboardList}
              accent="amber"
            />
            <StatCard label="Villes couvertes" value={stats.villesCouvertes} icon={MapPin} accent="sky" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <h2 className="text-base font-semibold text-slate-900">Clients</h2>
          <span className="text-sm text-slate-500">{total} résultat{total > 1 ? "s" : ""}</span>
        </div>

        <ClientsFilters
          search={search}
          onSearchChange={setSearch}
          city={city}
          onCityChange={setCity}
          cities={cities}
          date={date}
          onDateChange={setDate}
        />

        <ClientsTable
          commandes={commandes}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onEdit={isAdmin ? (commande) => setForm({ mode: "edit", commande }) : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />

        {!isLoading && !error && commandes.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {form && (
        <Modal
          title={form.mode === "edit" ? `Modifier la commande ${form.commande.commandeRef}` : "Nouvelle commande"}
          onClose={() => setForm(null)}
        >
          <CommandeForm
            commande={form.mode === "edit" ? form.commande : undefined}
            onCancel={() => setForm(null)}
            onSuccess={() => {
              // A new commande shows up on page 1; an edited one stays where it is.
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
