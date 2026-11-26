import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IRREGULAR_VERBS, type IrregularVerb } from '../../../shared/constants/irregularVerbs';
import {
  VERB_FORMS,
  VERB_SESSION_SIZES,
  answerVerbSession,
  checkVerbAnswers,
  createVerbSession,
  getVerbTranslation,
  isCheckPassed,
  searchVerbs,
  type VerbAnswers,
  type VerbCheck,
  type VerbForm,
  type VerbSession,
} from '../../../shared/utils/irregularVerbsPractice';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import styles from './VerbsPage.module.scss';

type Tab = 'practice' | 'table';

const FORM_LABEL_KEYS: Record<VerbForm, string> = {
  base: 'verbFormBase',
  past: 'verbFormPast',
  participle: 'verbFormParticiple',
};

const SETTINGS_KEY = 'verbs_practice_settings';

interface PracticeSettings {
  forms: VerbForm[];
  size: number;
}

// Последний выбор форм и размера тренировки запоминается в браузере.
const loadSettings = (): PracticeSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PracticeSettings>) : {};
    const forms = (parsed.forms ?? []).filter((f): f is VerbForm => VERB_FORMS.includes(f));
    const size = VERB_SESSION_SIZES.includes(parsed.size as 0) ? (parsed.size as number) : 10;
    return { forms: forms.length > 0 ? forms : ['past', 'participle'], size };
  } catch {
    return { forms: ['past', 'participle'], size: 10 };
  }
};

const saveSettings = (settings: PracticeSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // без localStorage просто не запоминаем
  }
};

const useSpeakVerb = () => {
  const { isSupported, speak } = useSpeechSynthesis();
  const speakVerb = useCallback(
    (verb: IrregularVerb) => {
      speak([verb.base, verb.past, verb.participle].join(', ').replace(/\//g, ' or '), {
        lang: 'en-US',
        rate: 0.9,
      });
    },
    [speak]
  );
  return { isSupported, speakVerb };
};

interface QuestionProps {
  verb: IrregularVerb;
  forms: VerbForm[];
  onAnswered: (correct: boolean) => void;
}

const VerbQuestion = ({ verb, forms, onAnswered }: QuestionProps) => {
  const { t, i18n } = useTranslation();
  const { isSupported, speakVerb } = useSpeakVerb();
  const [answers, setAnswers] = useState<VerbAnswers>({});
  const [check, setCheck] = useState<VerbCheck | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Если инфинитив не спрашиваем, он показывается вместе с переводом как подсказка.
  const showBase = !forms.includes('base');
  const passed = check ? isCheckPassed(check) : false;
  const canCheck = forms.some((f) => (answers[f] ?? '').trim());

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // После проверки фокус на «Дальше»: следующий глагол открывается тем же Enter.
  useEffect(() => {
    if (check) {
      actionsRef.current?.querySelector('button')?.focus();
    }
  }, [check]);

  const handleCheck = () => {
    if (!canCheck) {
      return;
    }
    setCheck(checkVerbAnswers(verb, forms, answers));
  };

  const handleDontKnow = () => {
    setCheck(Object.fromEntries(forms.map((f) => [f, false])));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheck();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.prompt}>
        <span className={styles.promptLabel}>{t('verbTranslation')}</span>
        <span className={styles.translation}>{getVerbTranslation(verb, i18n.language)}</span>
        {showBase && <span className={styles.givenForm}>{verb.base}</span>}
      </div>

      <div className={styles.fields}>
        {forms.map((form, index) => {
          const state = check ? (check[form] ? 'correct' : 'incorrect') : 'idle';
          return (
            <label key={form} className={styles.field}>
              <span className={styles.fieldLabel}>{t(FORM_LABEL_KEYS[form])}</span>
              <InputText
                ref={index === 0 ? firstInputRef : undefined}
                value={answers[form] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [form]: e.target.value }))}
                onKeyDown={handleKeyDown}
                disabled={Boolean(check)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className={`${styles.input} ${styles[state]}`}
              />
              {state === 'incorrect' && (
                <span className={styles.expected}>{t('correctAnswer', { value: verb[form] })}</span>
              )}
            </label>
          );
        })}
      </div>

      {check && (
        <div className={passed ? styles.resultOk : styles.resultBad}>
          {passed ? t('verbCorrect') : t('verbIncorrect')}
          {isSupported && (
            <Button
              icon="pi pi-volume-up"
              text
              rounded
              aria-label={t('pronounce')}
              title={t('pronounce')}
              onClick={() => speakVerb(verb)}
            />
          )}
        </div>
      )}

      <div className={styles.actions} ref={actionsRef}>
        {check ? (
          <Button
            label={t('nextVerb')}
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={() => onAnswered(passed)}
          />
        ) : (
          <>
            <Button
              label={t('checkSpelling')}
              icon="pi pi-check"
              onClick={handleCheck}
              disabled={!canCheck}
            />
            <Button label={t('dontKnow')} severity="secondary" outlined onClick={handleDontKnow} />
          </>
        )}
      </div>
    </div>
  );
};

const Practice = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PracticeSettings>(loadSettings);
  const [session, setSession] = useState<VerbSession | null>(null);
  const [round, setRound] = useState(0); // ключ вопроса: новый глагол — новые поля ввода

  const toggleForm = (form: VerbForm) => {
    setSettings((prev) => {
      const forms = prev.forms.includes(form)
        ? prev.forms.filter((f) => f !== form)
        : VERB_FORMS.filter((f) => f === form || prev.forms.includes(f));
      return { ...prev, forms };
    });
  };

  const start = (verbs: readonly IrregularVerb[], size: number) => {
    saveSettings(settings);
    setSession(createVerbSession(verbs, size));
    setRound((r) => r + 1);
  };

  if (!session) {
    const sizeOptions = VERB_SESSION_SIZES.map((size) => ({
      label: size === 0 ? t('allVerbs', { count: IRREGULAR_VERBS.length }) : String(size),
      value: size,
    }));
    return (
      <div className={styles.card}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('verbFormsToPractice')}</div>
          {VERB_FORMS.map((form) => (
            <label key={form} className={styles.checkboxRow}>
              <Checkbox checked={settings.forms.includes(form)} onChange={() => toggleForm(form)} />
              <span>{t(FORM_LABEL_KEYS[form])}</span>
            </label>
          ))}
          {settings.forms.length === 0 && (
            <span className={styles.warning}>{t('selectAtLeastOneForm')}</span>
          )}
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('verbsCount')}</div>
          <SelectButton
            value={settings.size}
            options={sizeOptions}
            onChange={(e) => {
              if (e.value !== null && e.value !== undefined) {
                setSettings((prev) => ({ ...prev, size: e.value as number }));
              }
            }}
            allowEmpty={false}
          />
        </div>
        <GradientButton
          icon="pi pi-play"
          label={t('startPractice')}
          onClick={() => {
            if (settings.forms.length > 0) {
              start(IRREGULAR_VERBS, settings.size);
            }
          }}
          className={styles.startButton}
        />
      </div>
    );
  }

  const current = session.queue[0];

  if (!current) {
    const firstTry = session.total - session.mistakes.length;
    return (
      <div className={styles.card}>
        <div className={styles.doneTitle}>{t('verbsDone')}</div>
        <div className={styles.doneStats}>
          {t('verbsFirstTry', { count: firstTry, total: session.total })}
        </div>
        {session.mistakes.length > 0 && (
          <div className={styles.mistakesList}>
            {session.mistakes.map((verb) => (
              <span key={verb.base} className={styles.mistakeChip}>
                {verb.base} — {verb.past} — {verb.participle}
              </span>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          {session.mistakes.length > 0 && (
            <GradientButton
              icon="pi pi-replay"
              label={t('repeatMistakes', { count: session.mistakes.length })}
              onClick={() => start(session.mistakes, 0)}
            />
          )}
          <Button
            label={t('newPractice')}
            severity="secondary"
            outlined
            onClick={() => setSession(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <VerbQuestion
        key={round}
        verb={current}
        forms={settings.forms}
        onAnswered={(correct) => {
          setSession((prev) => (prev ? answerVerbSession(prev, correct) : prev));
          setRound((r) => r + 1);
        }}
      />
      <div className={styles.progress}>
        <span className={styles.progressMain}>
          {t('progress', { current: session.correctCount, total: session.total })}
        </span>
        <span className={styles.progressSecondary}>
          {t('mistakesCount', { count: session.mistakes.length })}
        </span>
        <Button label={t('newPractice')} text size="small" onClick={() => setSession(null)} />
      </div>
    </>
  );
};

const VerbsTable = () => {
  const { t, i18n } = useTranslation();
  const { isSupported, speakVerb } = useSpeakVerb();
  const [query, setQuery] = useState('');
  const verbs = useMemo(() => searchVerbs(IRREGULAR_VERBS, query), [query]);

  return (
    <div className={styles.tableCard}>
      <InputText
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchVerb')}
        className={styles.searchInput}
      />
      {verbs.length === 0 ? (
        <div className={styles.empty}>{t('nothingFound')}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>V1</th>
                <th>V2</th>
                <th>V3</th>
                <th>{t('verbTranslation')}</th>
                {isSupported && <th aria-label={t('pronounce')} />}
              </tr>
            </thead>
            <tbody>
              {verbs.map((verb) => (
                <tr key={verb.base}>
                  <td className={styles.base}>{verb.base}</td>
                  <td>{verb.past}</td>
                  <td>{verb.participle}</td>
                  <td className={styles.translationCell}>
                    {getVerbTranslation(verb, i18n.language)}
                  </td>
                  {isSupported && (
                    <td className={styles.speakCell}>
                      <Button
                        icon="pi pi-volume-up"
                        text
                        rounded
                        size="small"
                        aria-label={t('pronounce')}
                        title={t('pronounce')}
                        onClick={() => speakVerb(verb)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const VerbsPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('practice');
  const tabOptions = [
    { label: t('verbsPractice'), value: 'practice' },
    { label: t('verbsTable'), value: 'table' },
  ];

  return (
    <div className={styles.container}>
      <Header title={t('irregularVerbs')} showNavigation={true} />
      <div className={styles.content}>
        <SelectButton
          value={tab}
          options={tabOptions}
          onChange={(e) => {
            if (e.value) {
              setTab(e.value as Tab);
            }
          }}
          allowEmpty={false}
          className={styles.tabs}
        />
        {/* обе вкладки остаются смонтированными: подсмотреть в таблицу, не сбросив тренировку */}
        <div className={tab === 'practice' ? styles.tabPanel : styles.hidden}>
          <Practice />
        </div>
        <div className={tab === 'table' ? styles.tabPanel : styles.hidden}>
          <VerbsTable />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerbsPage;
