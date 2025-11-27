import { Button } from 'primereact/button';
import styles from './GradientButton.module.scss';

interface GradientButtonProps {
    onClick: () => void;
    label: string;
    icon?: string;
    className?: string;
}

const GradientButton = ({ onClick, label, icon, className }: GradientButtonProps) => {
    return (
        <Button
            onClick={onClick}
            icon={icon}
            label={label}
            className={`${styles.gradientButton} ${className || ''}`}
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white'
            }}
        />
    );
};

export default GradientButton;

