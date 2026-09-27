import { Pencil, Search, Trash2 } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { INPUT_CLASS } from "./gestionUtils";

// Small building blocks shared by the Gestion pages (users, clients, trucks).

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, ...inputProps }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input {...inputProps} className={INPUT_CLASS} />
    </div>
  );
}

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  error: string | null;
}

export function FormActions({ isSubmitting, onCancel, error }: FormActionsProps) {
  return (
    <>
      {error && <p className="text-sm text-rose-600">{error}</p>}
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
    </>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pl-9`}
      />
    </div>
  );
}

interface RowActionsProps {
  onEdit: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

export function RowActions({ onEdit, onDelete, deleteLabel = "Supprimer" }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        title="Modifier"
        aria-label="Modifier"
        className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Pencil size={16} />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={deleteLabel}
          aria-label={deleteLabel}
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

interface GestionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function GestionHeader({ title, description, action }: GestionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      {children}
    </button>
  );
}

export function ActionError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p>{message}</p>
      <button type="button" onClick={onDismiss} className="font-medium hover:underline">
        Fermer
      </button>
    </div>
  );
}
