import { useState } from "react";
import { gazoilService } from "../../services/gazoil";
import { Modal } from "../ui/Modal";

interface AddGazoilCommentModalProps {
  matricule: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddGazoilCommentModal({ matricule, onClose, onAdded }: AddGazoilCommentModalProps) {
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!comment.trim()) {
      setFormError("Veuillez saisir un commentaire.");
      return;
    }
    if (!date) {
      setFormError("Veuillez indiquer une date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await gazoilService.addComment({ matricule, comment: comment.trim(), date });
      onAdded();
    } catch {
      setFormError("Impossible d'enregistrer le commentaire. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Ajouter un commentaire — ${matricule}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Commentaire</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="ex: Vidange effectuée en même temps que le plein."
            className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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

        {formError && <p className="text-sm text-rose-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Enregistrement…" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
