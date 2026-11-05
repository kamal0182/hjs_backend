import { useState } from "react";
import { clientsMoneyService } from "../../services/clientsMoney";
import type { ClientMoneyRecord } from "../../types/clientsMoney";
import { errorMessage } from "../gestion/gestionUtils";

interface ClientMoneyRecordFormProps {
  record?: ClientMoneyRecord; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientMoneyRecordForm({ record, onSuccess, onCancel }: ClientMoneyRecordFormProps) {
  const [clientName, setClientName] = useState(record?.clientName ?? "");
  const [montant, setMontant] = useState(record ? String(record.montant) : "");
  const [date, setDate] = useState(() => record?.date ?? new Date().toISOString().slice(0, 10));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const numericMontant = Number(montant);
    if (!clientName.trim()) {
      setFormError("Veuillez indiquer le nom du client.");
      return;
    }
    if (!montant || Number.isNaN(numericMontant) || numericMontant <= 0) {
      setFormError("Veuillez indiquer un montant supérieur à 0.");
      return;
    }
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input = { clientName: clientName.trim(), montant: numericMontant, date };
      if (record) await clientsMoneyService.updateRecord(record.id, input);
      else await clientsMoneyService.createRecord(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer le client. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nom du client</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="ex: John Doe"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Montant (DH)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="ex: 2000"
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
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
