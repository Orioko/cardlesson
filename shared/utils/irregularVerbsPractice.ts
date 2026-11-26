import type { IrregularVerb } from '../constants/irregularVerbs';
import { shuffleArray } from './repeatUtils';

// Тренировка неправильных глаголов — общая логика для веба и мобильной версии.

export type VerbForm = 'base' | 'past' | 'participle';

export const VERB_FORMS: readonly VerbForm[] = ['base', 'past', 'participle'];

// Сколько глаголов брать в тренировку; 0 — все.
export const VERB_SESSION_SIZES = [10, 20, 0] as const;

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

// Варианты формы: «was/were» → ['was', 'were'].
export const getFormVariants = (expected: string): string[] =>
  expected.split('/').map(normalize).filter(Boolean);

// isVerbFormCorrect засчитывает любой из вариантов, а также несколько вариантов сразу
// («was/were», «was, were», «was or were») — если каждый из них правильный.
export const isVerbFormCorrect = (answer: string, expected: string): boolean => {
  const variants = getFormVariants(expected);
  const parts = normalize(answer)
    .split(/\s*(?:\/|,|\bor\b)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 && parts.every((part) => variants.includes(part));
};

export type VerbAnswers = Partial<Record<VerbForm, string>>;
export type VerbCheck = Partial<Record<VerbForm, boolean>>;

export const checkVerbAnswers = (
  verb: IrregularVerb,
  forms: readonly VerbForm[],
  answers: VerbAnswers
): VerbCheck => {
  const result: VerbCheck = {};
  for (const form of forms) {
    result[form] = isVerbFormCorrect(answers[form] ?? '', verb[form]);
  }
  return result;
};

export const isCheckPassed = (check: VerbCheck): boolean =>
  Object.values(check).every((ok) => ok === true);

// Перевод глагола на языке интерфейса: корейский для корейского, иначе русский.
export const getVerbTranslation = (verb: IrregularVerb, appLanguage: string): string =>
  appLanguage === 'ko' ? verb.ko : verb.ru;

export interface VerbSession {
  queue: IrregularVerb[]; // первый — текущий глагол; ошибка отправляет его в конец
  total: number;
  correctCount: number;
  mistakes: IrregularVerb[]; // глаголы, в которых ошибались хотя бы раз
}

export const createVerbSession = (verbs: readonly IrregularVerb[], size: number): VerbSession => {
  const shuffled = shuffleArray([...verbs]);
  const queue = size > 0 ? shuffled.slice(0, size) : shuffled;
  return { queue, total: queue.length, correctCount: 0, mistakes: [] };
};

// answerVerbSession — следующий шаг тренировки после ответа на текущий глагол.
export const answerVerbSession = (session: VerbSession, correct: boolean): VerbSession => {
  const [current, ...rest] = session.queue;
  if (!current) {
    return session;
  }
  if (correct) {
    return { ...session, queue: rest, correctCount: session.correctCount + 1 };
  }
  const mistakes = session.mistakes.some((v) => v.base === current.base)
    ? session.mistakes
    : [...session.mistakes, current];
  return { ...session, queue: [...rest, current], mistakes };
};

// searchVerbs — поиск для таблицы: по любой форме и переводу.
export const searchVerbs = (
  verbs: readonly IrregularVerb[],
  query: string
): readonly IrregularVerb[] => {
  const q = normalize(query);
  if (!q) {
    return verbs;
  }
  return verbs.filter((verb) =>
    [verb.base, verb.past, verb.participle, verb.ru, verb.ko].some((value) =>
      value.toLowerCase().includes(q)
    )
  );
};
