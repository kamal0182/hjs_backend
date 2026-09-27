import { useState } from "react";
import { gestionService } from "../../services/gestion";
import type { ManagedClient } from "../../types/gestion";
import { Field, FormActions } from "./GestionParts";
import { errorMessage } from "./gestionUtils";

interface ClientFormProps {
  client?: ManagedClient; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Veuillez indiquer un nom.");
      return;
    }
    const input = { name: name.trim(), company: company.trim() };

    setIsSubmitting(true);
    try {
      if (client) await gestionService.updateClient(client.id, input);
      else await gestionService.createClient(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer le client. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Mohamed Alaoui" />
      <Field
        label="Société (optionnel)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="ex: Atlas Négoce"
      />

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} error={formError} />
    </form>
  );
}
