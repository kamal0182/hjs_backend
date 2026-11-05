import { useState } from "react";
import { chargesService } from "../../services/charges";
import type { ChargeRecord } from "../../types/charges";
import { errorMessage } from "../gestion/gestionUtils";

interface ChargeFormProps {
  charge?: ChargeRecord; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChargeForm({ charge, onSuccess, onCancel }: ChargeFormProps) {
  const [date, setDate] = useState(() => charge?.date ?? new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState(charge?.comment ?? "");
  const [montant, setMontant] = useState(charge ? String(charge.montant) : "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const numericMontant = Number(montant);
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }
    if (!comment.trim()) {
      setFormError("Veuillez indiquer un commentaire.");
      return;
    }
    if (!montant || Number.isNaN(numericMontant) || numericMontant <= 0) {
      setFormError("Veuillez indiquer un montant supérieur à 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input = { date, comment: comment.trim(), montant: numericMontant };
      if (charge) await chargesService.updateCharge(charge.id, input);
      else await chargesService.createCharge(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer la charge. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Commentaire</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="ex: Réparation moteur camion 45210-B-9"
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Montant (DH)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="ex: 1200"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
