import { useEffect, useState } from "react";
import { gazoilService } from "../../services/gazoil";

interface GazoilFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function GazoilForm({ onSuccess, onCancel }: GazoilFormProps) {
  const [matricules, setMatricules] = useState<string[]>([]);
  const [matricule, setMatricule] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    gazoilService.getMatricules().then(setMatricules);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedMatricule = matricule.trim();
    const numericPrice = Number(price);

    if (!trimmedMatricule) {
      setFormError("Veuillez indiquer la matricule du camion.");
      return;
    }
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError("Veuillez indiquer un prix supérieur à 0.");
      return;
    }
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await gazoilService.createRecord({ matricule: trimmedMatricule, price: numericPrice, date });
      onSuccess();
    } catch {
      setFormError("Impossible d'enregistrer le plein. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Matricule</label>
        <input
          type="text"
          list="gazoil-matricules"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          placeholder="ex: 12345-A-6"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <datalist id="gazoil-matricules">
          {matricules.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-slate-400">
          Choisissez un camion existant ou tapez une nouvelle matricule.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Prix (DH)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="ex: 550"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
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
          {isSubmitting ? "Enregistrement…" : "Enregistrer le plein"}
        </button>
      </div>
    </form>
  );
}
