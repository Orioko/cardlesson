/**
 * Пропсы компонента GradientButton.
 *
 * @prop onClick - Обработчик клика по кнопке
 * @prop label - Текст кнопки
 * @prop icon - Иконка кнопки (опционально)
 * @prop className - Дополнительные CSS классы
 */
export interface GradientButtonProps {
  onClick: () => void;
  label: string;
  icon?: string;
  className?: string;
}
