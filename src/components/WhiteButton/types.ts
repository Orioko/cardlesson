/**
 * Пропсы компонента WhiteButton.
 * 
 * @prop onClick - Обработчик клика по кнопке
 * @prop label - Текст кнопки
 * @prop icon - Иконка кнопки (опционально)
 * @prop className - Дополнительные CSS классы
 * @prop disabled - Состояние отключения кнопки
 */
export interface WhiteButtonProps {
    onClick: () => void;
    label: string;
    icon?: string;
    className?: string;
    disabled?: boolean;
}

