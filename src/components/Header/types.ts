/**
 * Пропсы компонента Header.
 * 
 * @prop title - Заголовок страницы
 * @prop showExitButton - Показывать ли кнопку выхода
 * @prop onNavigateToDictionary - Обработчик навигации к словарю
 * @prop onNavigateToMain - Обработчик навигации на главную страницу
 * @prop showNavigation - Показывать ли кнопки навигации
 */
export interface HeaderProps {
    title: string;
    showExitButton?: boolean;
    onNavigateToDictionary?: () => void;
    onNavigateToMain?: () => void;
    showNavigation?: boolean;
}

