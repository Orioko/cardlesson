/**
 * Пропсы компонента Header.
 * 
 * @prop title - Заголовок страницы
 * @prop showExitButton - Показывать ли кнопку выхода
 * @prop showNavigation - Показывать ли кнопки навигации
 */
export interface HeaderProps {
    title: string;
    showExitButton?: boolean;
    showNavigation?: boolean;
}

