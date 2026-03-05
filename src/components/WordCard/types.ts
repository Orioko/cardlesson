import type { WordInput } from '../../types/word';

export type Lang = 'ru' | 'en' | 'ko';

export interface WordCardProps {
  wordKey?: string;
  wordData?: WordInput;
  wordId?: string;
  onEdit?: (id: string, data: WordInput) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  displayLang?: Lang;
}
