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

/**
 * Пропсы компонента AddWordForm.
 * 
 * @prop visible - Видимость диалога формы
 * @prop onHide - Обработчик закрытия формы
 * @prop onWordAdded - Коллбэк после успешного добавления/редактирования слова
 * @prop editWordId - ID редактируемого слова (если режим редактирования)
 * @prop editWordData - Данные редактируемого слова
 */
export interface AddWordFormProps {
    visible: boolean;
    onHide: () => void;
    onWordAdded?: () => void;
    editWordId?: string;
    editWordData?: WordData;
}

