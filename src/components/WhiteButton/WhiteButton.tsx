import { Button } from 'primereact/button';
import styles from './WhiteButton.module.scss';

interface WhiteButtonProps {
    onClick: () => void;
    label: string;
    icon?: string;
    className?: string;
    disabled?: boolean;
}

const WhiteButton = ({ onClick, label, icon, className, disabled }: WhiteButtonProps) => {
    return (
        <Button
            onClick={onClick}
            icon={icon}
            label={label}
            className={`${styles.whiteButton} ${className || ''}`}
            disabled={disabled}
            style={{
                background: 'white',
                border: 'none',
                color: '#333',
                borderRadius: '8px'
            }}
        />
    );
};

export default WhiteButton;

