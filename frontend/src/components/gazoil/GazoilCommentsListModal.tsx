import { useEffect, useState } from "react";
import { gazoilService } from "../../services/gazoil";
import type { GazoilComment } from "../../types/gazoil";
import { formatDate } from "../../utils/formatDate";
import { ActionError, RowActions } from "../gestion/GestionParts";
import { errorMessage } from "../gestion/gestionUtils";
import { Modal } from "../ui/Modal";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";
import { GazoilCommentForm } from "./GazoilCommentForm";

interface GazoilCommentsListModalProps {
  matricule: string;
  onClose: () => void;
  // Omitted for read-only users: comments cannot be edited or deleted.
  // Called after a comment changes so the page can refresh its counts.
  onChanged?: () => void;
}

export function GazoilCommentsListModal({ matricule, onClose, onChanged }: GazoilCommentsListModalProps) {
  const [comments, setComments] = useState<GazoilComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setComments(null);
    setError(null);
    gazoilService
      .getCommentsForMatricule(matricule)
      .then(setComments)
      .catch(() => setError("Impossible de charger les commentaires. Veuillez réessayer."));
  }

  useEffect(load, [matricule]);

  function handleChanged() {
    load();
    onChanged?.();
  }

  async function handleDelete(comment: GazoilComment) {
    if (!window.confirm(`Supprimer le commentaire du ${formatDate(comment.date)} ?`)) return;
    setActionError(null);
    try {
      await gazoilService.deleteComment(comment.id);
      handleChanged();
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de supprimer le commentaire."));
    }
  }

  return (
    <Modal title={`Commentaires — ${matricule}`} onClose={onClose}>
      {comments === null && !error && <TableLoadingState message="Chargement des commentaires…" />}
      {error && <TableErrorState message={error} onRetry={load} />}

      {comments && !error && (
        <>
          {actionError && (
            <div className="mb-4">
              <ActionError message={actionError} onDismiss={() => setActionError(null)} />
            </div>
          )}

          {comments.length === 0 ? (
            <TableEmptyState
              title="Aucun commentaire"
              description="Ce camion n'a aucun commentaire enregistré pour le moment."
            />
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                  {editingId === c.id ? (
                    <GazoilCommentForm
                      matricule={matricule}
                      comment={c}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => {
                        setEditingId(null);
                        handleChanged();
                      }}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-slate-400">{formatDate(c.date)}</p>
                        <p className="whitespace-pre-line break-words text-sm text-slate-700">{c.comment}</p>
                      </div>
                      {onChanged && (
                        <RowActions
                          onEdit={() => {
                            setActionError(null);
                            setEditingId(c.id);
                          }}
                          onDelete={() => handleDelete(c)}
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
