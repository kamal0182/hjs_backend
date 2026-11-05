import { Modal } from "../ui/Modal";
import { GazoilCommentForm } from "./GazoilCommentForm";

interface AddGazoilCommentModalProps {
  matricule: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddGazoilCommentModal({ matricule, onClose, onAdded }: AddGazoilCommentModalProps) {
  return (
    <Modal title={`Ajouter un commentaire — ${matricule}`} onClose={onClose}>
      <GazoilCommentForm matricule={matricule} onCancel={onClose} onSuccess={onAdded} />
    </Modal>
  );
}
