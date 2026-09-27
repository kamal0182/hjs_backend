import { useEffect, useState } from "react";
import { gazoilService } from "../../services/gazoil";
import type { GazoilComment } from "../../types/gazoil";
import { formatDate } from "../../utils/formatDate";
import { Modal } from "../ui/Modal";
import { TableEmptyState, TableErrorState, TableLoadingState } from "../ui/QueryStates";

interface GazoilCommentsListModalProps {
  matricule: string;
  onClose: () => void;
}

export function GazoilCommentsListModal({ matricule, onClose }: GazoilCommentsListModalProps) {
  const [comments, setComments] = useState<GazoilComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setComments(null);
    setError(null);
    gazoilService
      .getCommentsForMatricule(matricule)
      .then(setComments)
      .catch(() => setError("Impossible de charger les commentaires. Veuillez réessayer."));
  }

  useEffect(load, [matricule]);

  return (
    <Modal title={`Commentaires — ${matricule}`} onClose={onClose}>
      {comments === null && !error && <TableLoadingState message="Chargement des commentaires…" />}
      {error && <TableErrorState message={error} onRetry={load} />}

      {comments && !error && (
        <>
          {comments.length === 0 ? (
            <TableEmptyState
              title="Aucun commentaire"
              description="Ce camion n'a aucun commentaire enregistré pour le moment."
            />
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-1 text-xs font-medium text-slate-400">{formatDate(c.date)}</p>
                  <p className="text-sm text-slate-700">{c.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
