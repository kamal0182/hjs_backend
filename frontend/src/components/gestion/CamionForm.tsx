import { useState } from "react";
import { gestionService } from "../../services/gestion";
import type { ManagedCamion } from "../../types/gestion";
import { Field, FormActions } from "./GestionParts";
import { errorMessage } from "./gestionUtils";

interface CamionFormProps {
  camion?: ManagedCamion; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function CamionForm({ camion, onSuccess, onCancel }: CamionFormProps) {
  const [matricule, setMatricule] = useState(camion?.matricule ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!matricule.trim()) {
      setFormError("Veuillez indiquer un matricule.");
      return;
    }

    const input = { matricule: matricule.trim() };

    setIsSubmitting(true);
    try {
      if (camion) await gestionService.updateCamion(camion.id, input);
      else await gestionService.createCamion(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer le camion. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Matricule"
        value={matricule}
        onChange={(e) => setMatricule(e.target.value)}
        placeholder="ex: 45210-B-9"
      />

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} error={formError} />
    </form>
  );
}
