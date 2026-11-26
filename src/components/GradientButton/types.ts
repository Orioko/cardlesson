export interface GradientButtonProps {
  onClick?: () => void;
  label: string;
  icon?: string;
  className?: string;
  // submit — кнопка отправки формы (Enter в полях формы нажимает её)
  type?: 'button' | 'submit';
  disabled?: boolean;
}
