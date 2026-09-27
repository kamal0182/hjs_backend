import { useState } from "react";
import { gestionService } from "../../services/gestion";
import type { LookupItem, LookupKind } from "../../types/gestion";
import { Field, FormActions } from "./GestionParts";
import { errorMessage } from "./gestionUtils";

interface LookupFormProps {
  kind: LookupKind;
  label: string; // e.g. "Catégorie"
  placeholder: string;
  item?: LookupItem; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function LookupForm({ kind, label, placeholder, item, onSuccess, onCancel }: LookupFormProps) {
  const [name, setName] = useState(item?.name ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Veuillez indiquer un nom.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (item) await gestionService.updateLookup(kind, item.id, name.trim());
      else await gestionService.createLookup(kind, name.trim());
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={label} value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
      {item && (
        <p className="text-xs text-slate-500">
          Le nouveau nom sera appliqué à tous les enregistrements qui utilisent « {item.name} ».
        </p>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} error={formError} />
    </form>
  );
}
