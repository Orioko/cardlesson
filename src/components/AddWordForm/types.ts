export interface WordData {
  ru: string;
  en: string;
  ko: string;
  translations: {
    ru: string;
    en: string;
    ko: string;
  };
}

export interface AddWordFormProps {
  visible: boolean;
  onHide: () => void;
  onWordAdded?: (updatedWord?: { id: string; data: WordData }) => void;
  editWordId?: string;
  editWordData?: WordData;
}
