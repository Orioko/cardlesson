export interface Word {
  id: string;
  ru: string;
  en: string;
  ko: string;
  translations: {
    ru: string;
    en: string;
    ko: string;
  };
}

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export interface RepeatState {
  currentIndex: number;
  wordsQueue: Word[];
  isCompleted: boolean;
  correctWords: Set<string>;
  incorrectCount: number;
}

export const initializeRepeatState = (words: Word[]): RepeatState => {
  return {
    currentIndex: 0,
    wordsQueue: words.length > 0 ? shuffleArray([...words]) : [],
    isCompleted: false,
    correctWords: new Set(),
    incorrectCount: 0,
  };
};

export interface HandleCorrectResult {
  newState: RepeatState;
  shouldComplete: boolean;
}

export const handleCorrectAnswer = (
  currentWord: Word | null,
  state: RepeatState,
  allWords: Word[]
): HandleCorrectResult => {
  if (!currentWord) {
    return { newState: state, shouldComplete: false };
  }

  const newCorrectWords = new Set(state.correctWords);
  newCorrectWords.add(currentWord.id);

  if (newCorrectWords.size >= allWords.length) {
    return {
      newState: {
        ...state,
        correctWords: newCorrectWords,
        isCompleted: true,
      },
      shouldComplete: true,
    };
  }

  const newQueue = state.wordsQueue.filter((w) => w.id !== currentWord.id);

  if (newQueue.length === 0) {
    const remainingWords = allWords.filter((w) => !newCorrectWords.has(w.id));
    if (remainingWords.length > 0) {
      return {
        newState: {
          ...state,
          wordsQueue: shuffleArray(remainingWords),
          currentIndex: 0,
          correctWords: newCorrectWords,
        },
        shouldComplete: false,
      };
    }
    return {
      newState: {
        ...state,
        correctWords: newCorrectWords,
        isCompleted: true,
      },
      shouldComplete: true,
    };
  }

  let newIndex = state.currentIndex;
  if (newIndex >= newQueue.length) {
    newIndex = 0;
  }

  return {
    newState: {
      ...state,
      wordsQueue: newQueue,
      currentIndex: newIndex,
      correctWords: newCorrectWords,
    },
    shouldComplete: false,
  };
};

export interface HandleIncorrectResult {
  newState: RepeatState;
}

export const handleIncorrectAnswer = (
  currentWord: Word | null,
  state: RepeatState
): HandleIncorrectResult => {
  if (!currentWord || state.wordsQueue.length === 0) {
    return { newState: state };
  }

  const newQueue = [...state.wordsQueue];
  const wordToMove = newQueue.splice(state.currentIndex, 1)[0];
  newQueue.push(wordToMove);

  let newIndex = state.currentIndex;
  if (newIndex >= newQueue.length - 1) {
    newIndex = 0;
  }

  return {
    newState: {
      ...state,
      wordsQueue: newQueue,
      currentIndex: newIndex,
      incorrectCount: state.incorrectCount + 1,
    },
  };
};

export const resetRepeatState = (words: Word[]): RepeatState => {
  return initializeRepeatState(words);
};

export interface HandleWordUpdateResult {
  newState: RepeatState;
}

export const handleWordUpdate = (
  wordId: string,
  updatedWord: Word,
  state: RepeatState
): HandleWordUpdateResult => {
  const newQueue = state.wordsQueue.map((w) => (w.id === wordId ? updatedWord : w));

  if (newQueue.length === 0) {
    return {
      newState: {
        ...state,
        wordsQueue: newQueue,
        isCompleted: true,
      },
    };
  }

  let newIndex = state.currentIndex;
  if (newIndex >= newQueue.length - 1) {
    newIndex = 0;
  } else {
    newIndex += 1;
  }

  return {
    newState: {
      ...state,
      wordsQueue: newQueue,
      currentIndex: newIndex,
    },
  };
};
