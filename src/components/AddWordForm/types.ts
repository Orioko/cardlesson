import type { WordInput } from '../../types/word';

export interface AddWordFormProps {
  visible: boolean;
  onHide: () => void;
  onWordAdded?: (updatedWord?: { id: string; data: WordInput }) => void;
  editWordId?: string;
  editWordData?: WordInput;
}
