export type Lang = 'ru' | 'en' | 'ko';

export interface WordData {
  ru: string;
  en: string;
  ko: string;
  translations: Record<Lang, string>;
}

export interface WordCardProps {
  wordKey?: string;
  wordData?: WordData;
  wordId?: string;
  onEdit?: (id: string, data: WordData) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  displayLang?: Lang;
}
