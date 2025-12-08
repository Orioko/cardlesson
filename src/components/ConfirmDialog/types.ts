export interface ConfirmDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  header?: string;
  message?: string;
  confirmLabel?: string;
}
