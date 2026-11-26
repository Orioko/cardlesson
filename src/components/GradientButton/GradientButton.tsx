import { Button } from 'primereact/button';
import { GRADIENT_STYLES } from './constants';
import styles from './GradientButton.module.scss';
import type { GradientButtonProps } from './types';

const GradientButton = ({
  onClick,
  label,
  icon,
  className,
  type = 'button',
  disabled,
}: GradientButtonProps) => {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      icon={icon}
      label={label}
      className={`${styles.gradientButton} ${className || ''}`}
      style={GRADIENT_STYLES}
    />
  );
};

export default GradientButton;
