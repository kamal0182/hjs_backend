import { useEffect, useState } from "react";
import { clientsMoneyService } from "../../services/clientsMoney";
import { gestionService } from "../../services/gestion";
import type { PaymentRecord, PaymentType } from "../../types/clientsMoney";
import { errorMessage } from "../gestion/gestionUtils";

interface PaymentFormProps {
  recordId: string;
  payment?: PaymentRecord; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ recordId, payment, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>(payment?.paymentType ?? "");
  const [price, setPrice] = useState(payment ? String(payment.price) : "");
  const [date, setDate] = useState(() => payment?.date ?? new Date().toISOString().slice(0, 10));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    gestionService
      .getLookups("paymentTypes")
      .then((items) => {
        const names = items.map((item) => item.name);
        setPaymentTypes(names);
        setPaymentType((current) => current || names[0] || "");
      })
      .catch(() => setPaymentTypes([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!paymentType) {
      setFormError("Veuillez choisir un type de paiement (à créer dans Gestion > Types de paiement).");
      return;
    }

    const numericPrice = Number(price);
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError("Veuillez indiquer un montant supérieur à 0.");
      return;
    }
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input = { recordId, paymentType, price: numericPrice, date };
      if (payment) await clientsMoneyService.updatePayment(payment.id, input);
      else await clientsMoneyService.createPayment(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer le paiement. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type de paiement</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {paymentTypes.length === 0 && <option value="">Chargement…</option>}
          {paymentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Montant (DH)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="ex: 1500"
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
          {isSubmitting ? "Enregistrement…" : payment ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
