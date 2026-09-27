import { useState } from "react";
import { gestionService } from "../../services/gestion";
import type { UserRole } from "../../types/auth";
import type { ManagedUser } from "../../types/gestion";
import { Field, FormActions } from "./GestionParts";
import { errorMessage, INPUT_CLASS } from "./gestionUtils";

interface UserFormProps {
  user?: ManagedUser; // present when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEdit = Boolean(user);
  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Veuillez indiquer un email.");
      return;
    }
    if (!isEdit && !password) {
      setFormError("Veuillez indiquer un mot de passe.");
      return;
    }

    const input = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      isActive,
      password: password || undefined,
    };

    setIsSubmitting(true);
    try {
      if (user) await gestionService.updateUser(user.id, input);
      else await gestionService.createUser(input);
      onSuccess();
    } catch (err) {
      setFormError(errorMessage(err, "Impossible d'enregistrer l'utilisateur. Veuillez réessayer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Field label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ex: nom@exemple.com"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={INPUT_CLASS}>
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>

      <Field
        label={isEdit ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Compte actif
        </label>
      )}

      <FormActions isSubmitting={isSubmitting} onCancel={onCancel} error={formError} />
    </form>
  );
}
