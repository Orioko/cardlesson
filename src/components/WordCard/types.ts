/**
 * Поддерживаемые языки в приложении.
 */
export type Lang = 'ru' | 'en' | 'ko';

/**
 * Данные слова с переводами на разные языки.
 */
export interface WordData {
  ru: string;
  en: string;
  ko: string;
  translations: Record<Lang, string>;
}

/**
 * Пропсы компонента WordCard.
 *
 * @prop wordKey - Ключ слова из файла переводов (для дефолтных слов)
 * @prop wordData - Данные слова с переводами
 * @prop wordId - Уникальный идентификатор слова
 * @prop onEdit - Обработчик редактирования слова
 * @prop onDelete - Обработчик удаления слова
 * @prop showActions - Показывать ли кнопки действий (редактирование/удаление)
 */
export interface WordCardProps {
  wordKey?: string;
  wordData?: WordData;
  wordId?: string;
  onEdit?: (id: string, data: WordData) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}
