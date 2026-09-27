import { ApiError } from "../../lib/apiClient";

export const INPUT_CLASS =
  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

/** Prefer the backend's own message (e.g. "Ce matricule existe déjà."). */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
