import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { BodyText, MutedText, SectionTitle } from '../components/Typography';
import { getStorageItem, setStorageItem } from '../shared/storage/asyncStorage';
import { theme } from '../shared/theme/theme';

type Tab = 'practice' | 'table';

const FORM_LABEL_KEYS: Record<VerbForm, string> = {
  base: 'verbFormBase',
  past: 'verbFormPast',
  participle: 'verbFormParticiple',
};

const SETTINGS_KEY = 'cardlesson_mobile_verbs_settings';

interface PracticeSettings {
  forms: VerbForm[];
  size: number;
}

const DEFAULT_SETTINGS: PracticeSettings = { forms: ['past', 'participle'], size: 10 };

const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const VerbQuestion = ({
  verb,
  forms,
  onAnswered,
}: {
  verb: IrregularVerb;
  forms: VerbForm[];
  onAnswered: (correct: boolean) => void;
}) => {
  const { t, i18n } = useTranslation();
  const [answers, setAnswers] = useState<VerbAnswers>({});
  const [check, setCheck] = useState<VerbCheck | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const passed = check ? isCheckPassed(check) : false;
  const canCheck = forms.some((f) => (answers[f] ?? '').trim());

  const handleCheck = () => {
    if (canCheck) {
      setCheck(checkVerbAnswers(verb, forms, answers));
    }
  };

  return (
    <SectionCard>
      <View style={styles.prompt}>
        <Text style={styles.promptLabel}>{t('verbTranslation')}</Text>
        <Text style={styles.translation}>{getVerbTranslation(verb, i18n.language)}</Text>
        {!forms.includes('base') && <Text style={styles.givenForm}>{verb.base}</Text>}
      </View>

      {forms.map((form, index) => {
        const state = check ? (check[form] ? 'correct' : 'incorrect') : 'idle';
        const isLast = index === forms.length - 1;
        return (
          <View key={form} style={styles.field}>
            <Text style={styles.fieldLabel}>{t(FORM_LABEL_KEYS[form])}</Text>
            <TextInput
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={answers[form] ?? ''}
              onChangeText={(value) => setAnswers((prev) => ({ ...prev, [form]: value }))}
              editable={!check}
              autoFocus={index === 0}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={isLast ? 'done' : 'next'}
              blurOnSubmit={isLast}
              onSubmitEditing={() => {
                if (isLast) {
                  handleCheck();
                } else {
                  inputRefs.current[index + 1]?.focus();
                }
              }}
              style={[
                styles.input,
                state === 'correct' && styles.inputCorrect,
                state === 'incorrect' && styles.inputIncorrect,
              ]}
            />
            {state === 'incorrect' && (
              <Text style={styles.expected}>{t('correctAnswer', { value: verb[form] })}</Text>
            )}
          </View>
        );
      })}

      {check && (
        <Text style={passed ? styles.resultOk : styles.resultBad}>
          {passed ? t('verbCorrect') : t('verbIncorrect')}
        </Text>
      )}

      {check ? (
        <PrimaryButton label={t('nextVerb')} onPress={() => onAnswered(passed)} />
      ) : (
        <View style={styles.row}>
          <View style={styles.flex}>
            <PrimaryButton label={t('check')} onPress={handleCheck} disabled={!canCheck} />
          </View>
          <View style={styles.flex}>
            <PrimaryButton
              label={t('dontKnow')}
              variant="neutral"
              onPress={() => setCheck(Object.fromEntries(forms.map((f) => [f, false])))}
            />
          </View>
        </View>
      )}
    </SectionCard>
  );
};

const Practice = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<VerbSession | null>(null);
  const [round, setRound] = useState(0);

  // Последний выбор форм и размера тренировки запоминается на устройстве.
  useEffect(() => {
    void getStorageItem<PracticeSettings>(SETTINGS_KEY).then((stored) => {
      const forms = (stored?.forms ?? []).filter((f) => VERB_FORMS.includes(f));
      if (forms.length > 0) {
        const size = VERB_SESSION_SIZES.includes(stored?.size as 0) ? (stored?.size as number) : 10;
        setSettings({ forms, size });
      }
    });
  }, []);

  const toggleForm = (form: VerbForm) => {
    setSettings((prev) => ({
      ...prev,
      forms: prev.forms.includes(form)
        ? prev.forms.filter((f) => f !== form)
        : VERB_FORMS.filter((f) => f === form || prev.forms.includes(f)),
    }));
  };

  const start = (verbs: readonly IrregularVerb[], size: number) => {
    void setStorageItem(SETTINGS_KEY, settings);
    setSession(createVerbSession(verbs, size));
    setRound((r) => r + 1);
  };

  if (!session) {
    return (
      <SectionCard>
        <SectionTitle>{t('verbFormsToPractice')}</SectionTitle>
        <View style={styles.chips}>
          {VERB_FORMS.map((form) => (
            <Chip
              key={form}
              label={t(FORM_LABEL_KEYS[form])}
              active={settings.forms.includes(form)}
              onPress={() => toggleForm(form)}
            />
          ))}
        </View>
        {settings.forms.length === 0 && (
          <Text style={styles.warning}>{t('selectAtLeastOneForm')}</Text>
        )}
        <SectionTitle>{t('verbsCount')}</SectionTitle>
        <View style={styles.chips}>
          {VERB_SESSION_SIZES.map((size) => (
            <Chip
              key={size}
              label={size === 0 ? t('allVerbs', { count: IRREGULAR_VERBS.length }) : String(size)}
              active={settings.size === size}
              onPress={() => setSettings((prev) => ({ ...prev, size }))}
            />
          ))}
        </View>
        <PrimaryButton
          label={t('startPractice')}
          disabled={settings.forms.length === 0}
          onPress={() => start(IRREGULAR_VERBS, settings.size)}
        />
      </SectionCard>
    );
  }

  const current = session.queue[0];

  if (!current) {
    return (
      <SectionCard>
        <SectionTitle>{t('verbsDone')}</SectionTitle>
        <BodyText>
          {t('verbsFirstTry', {
            count: session.total - session.mistakes.length,
            total: session.total,
          })}
        </BodyText>
        {session.mistakes.map((verb) => (
          <Text key={verb.base} style={styles.mistake}>
            {verb.base} — {verb.past} — {verb.participle}
          </Text>
        ))}
        {session.mistakes.length > 0 && (
          <PrimaryButton
            label={t('repeatMistakes', { count: session.mistakes.length })}
            onPress={() => start(session.mistakes, 0)}
          />
        )}
        <PrimaryButton
          label={t('newPractice')}
          variant="neutral"
          onPress={() => setSession(null)}
        />
      </SectionCard>
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
      <View style={styles.progress}>
        <Text style={styles.progressMain}>
          {t('progress', { current: session.correctCount, total: session.total })}
        </Text>
        <MutedText>{t('mistakesCount', { count: session.mistakes.length })}</MutedText>
        <Pressable onPress={() => setSession(null)} accessibilityRole="button">
          <Text style={styles.link}>{t('newPractice')}</Text>
        </Pressable>
      </View>
    </>
  );
};

const VerbsTable = () => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const verbs = useMemo(() => searchVerbs(IRREGULAR_VERBS, query), [query]);

  return (
    <SectionCard>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('searchVerb')}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {verbs.length === 0 ? (
        <MutedText>{t('nothingFound')}</MutedText>
      ) : (
        verbs.map((verb) => (
          <View key={verb.base} style={styles.tableRow}>
            <Text style={styles.tableForms}>
              <Text style={styles.tableBase}>{verb.base}</Text> · {verb.past} · {verb.participle}
            </Text>
            <Text style={styles.tableTranslation}>{getVerbTranslation(verb, i18n.language)}</Text>
          </View>
        ))
      )}
    </SectionCard>
  );
};

export const VerbsScreen = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('practice');

  return (
    <AppScreen currentScreen="Verbs">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          <Chip
            label={t('verbsPractice')}
            active={tab === 'practice'}
            onPress={() => setTab('practice')}
          />
          <Chip label={t('verbsTable')} active={tab === 'table'} onPress={() => setTab('table')} />
        </View>
        {/* обе вкладки остаются смонтированными: подсмотреть в таблицу, не сбросив тренировку */}
        <View style={tab === 'practice' ? styles.tabPanel : styles.hidden}>
          <Practice />
        </View>
        <View style={tab === 'table' ? styles.tabPanel : styles.hidden}>
          <VerbsTable />
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  tabPanel: {
    gap: theme.spacing.lg,
  },
  hidden: {
    display: 'none',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.textOnPrimary,
  },
  warning: {
    color: theme.colors.danger,
  },
  prompt: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
  },
  promptLabel: {
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  translation: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  givenForm: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    fontSize: theme.fontSize.md,
  },
  inputCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  inputIncorrect: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  expected: {
    color: '#059669',
    fontWeight: '700',
  },
  resultOk: {
    color: '#047857',
    fontWeight: '700',
  },
  resultBad: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  progress: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 4,
    alignItems: 'center',
  },
  progressMain: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: theme.fontSize.lg,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
    paddingTop: 4,
  },
  mistake: {
    color: '#991b1b',
    fontWeight: '600',
  },
  tableRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableForms: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
  },
  tableBase: {
    fontWeight: '700',
  },
  tableTranslation: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
});
