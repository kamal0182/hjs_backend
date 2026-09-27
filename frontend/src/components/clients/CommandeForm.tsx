import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { clientsService } from "../../services/clients";
import { gestionService } from "../../services/gestion";
import type { Category, ClientOption, CommandeLine } from "../../types/commande";

interface CommandeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Quantity is kept as the typed text while editing, so "", "2." or "2,5" stay possible.
interface LineDraft extends Omit<CommandeLine, "quantity"> {
  quantity: string;
}

function firstUnusedCategory(categories: Category[], lines: LineDraft[]): Category {
  const used = new Set(lines.map((l) => l.category));
  return categories.find((c) => !used.has(c)) ?? categories[0] ?? "";
}

/** Digits with at most one decimal separator ("," becomes ".") and 2 decimals. */
function sanitizeQuantity(raw: string): string {
  const cleaned = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [whole, ...decimals] = cleaned.split(".");
  return decimals.length ? `${whole}.${decimals.join("").slice(0, 2)}` : whole;
}

export function CommandeForm({ onSuccess, onCancel }: CommandeFormProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ category: "", quantity: "1" }]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    clientsService
      .getClients()
      .then(setClients)
      .finally(() => setIsLoadingClients(false));

    clientsService
      .getCities()
      .then(setCities)
      .finally(() => setIsLoadingCities(false));

    gestionService
      .getLookups("categories")
      .then((items) => {
        const names = items.map((item) => item.name);
        setCategories(names);
        setLines((prev) => prev.map((line) => (line.category ? line : { ...line, category: names[0] ?? "" })));
      })
      .catch(() => setCategories([]));
  }, []);

  function updateLine(index: number, changes: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...changes } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { category: firstUnusedCategory(categories, prev), quantity: "1" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!clientId) {
      setFormError("Veuillez sélectionner un client.");
      return;
    }
    if (!city) {
      setFormError("Veuillez sélectionner une ville.");
      return;
    }
    if (!address.trim()) {
      setFormError("Veuillez indiquer une adresse.");
      return;
    }
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }
    if (lines.some((l) => !l.category)) {
      setFormError("Veuillez choisir une catégorie (à créer dans Gestion > Catégories).");
      return;
    }
    const parsedLines: CommandeLine[] = lines.map((l) => ({ category: l.category, quantity: Number(l.quantity) }));
    if (parsedLines.length === 0 || parsedLines.some((l) => !Number.isFinite(l.quantity) || l.quantity <= 0)) {
      setFormError("Chaque catégorie doit avoir une quantité supérieure à 0 (ex: 5 ou 2.5).");
      return;
    }
    const categoriesUsed = new Set(lines.map((l) => l.category));
    if (categoriesUsed.size !== lines.length) {
      setFormError("Chaque catégorie ne peut être ajoutée qu'une seule fois.");
      return;
    }

    setIsSubmitting(true);
    try {
      await clientsService.createCommande({
        clientId,
        lines: parsedLines,
        date,
        city,
        address: address.trim(),
        comment: comment.trim(),
      });
      onSuccess();
    } catch {
      setFormError("Impossible d'enregistrer la commande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={isLoadingClients}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">{isLoadingClients ? "Chargement…" : "Sélectionner un client"}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} — {client.company}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Catégories</label>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={line.category}
                onChange={(e) => updateLine(index, { category: e.target.value })}
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {categories.length === 0 && <option value="">Aucune catégorie</option>}
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: sanitizeQuantity(e.target.value) })}
                placeholder="Qté"
                aria-label={`Quantité ${line.category}`}
                className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={lines.length === 1}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Supprimer cette catégorie"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          disabled={lines.length >= categories.length}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={15} />
          Ajouter une catégorie
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoadingCities}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">{isLoadingCities ? "Chargement…" : "Sélectionner une ville"}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ex: 12 Rue Ibn Sina"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Commentaire</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Informations complémentaires (optionnel)"
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {formError && <p className="text-sm text-rose-600">{formError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer la commande"}
        </button>
      </div>
    </form>
  );
}
