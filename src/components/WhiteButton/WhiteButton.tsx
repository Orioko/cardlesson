import { Button } from 'primereact/button';
import { WHITE_BUTTON_STYLES } from './constants';
import type { WhiteButtonProps } from './types';
import styles from './WhiteButton.module.scss';

const WhiteButton = ({ onClick, label, icon, className, disabled }: WhiteButtonProps) => {
  return (
    <Button
      onClick={onClick}
      icon={icon}
      label={label}
      className={`${styles.whiteButton} ${className || ''}`}
      disabled={disabled}
      style={WHITE_BUTTON_STYLES}
    />
  );
};

export default WhiteButton;
