import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ERROR_MESSAGES } from '../../../shared/constants/errors';
import { LANGS, type Lang } from '../../../shared/types/lang';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { BodyText, SectionTitle } from '../components/Typography';
import {
  getAppLanguage,
  getFrontCardLanguage,
  getSelectedLanguages,
  saveAppLanguage,
  saveFrontCardLanguage,
  saveSelectedLanguages,
  type AppLanguage,
} from '../shared/storage/languageSettings';
import {
  checkAndRemoveDuplicates,
  exportWordsToJson,
  fixWordsLanguages,
  importWordsFromPickedFile,
} from '../shared/storage/wordsOperations';
import { theme } from '../shared/theme/theme';

type FrontLangOption = Lang | 'random';

const getLangLabelKey = (lang: FrontLangOption): string => {
  if (lang === 'ru') {
    return 'russian';
  }
  if (lang === 'en') {
    return 'english';
  }
  if (lang === 'ko') {
    return 'korean';
  }
  return 'random';
};

export const SettingsScreen = () => {
  const { i18n, t } = useTranslation();

  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(LANGS);
  const [frontLang, setFrontLang] = useState<FrontLangOption>('random');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('ru');
  const [isSavedVisible, setIsSavedVisible] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const loadSettings = async () => {
      const [loadedSelectedLangs, loadedFrontLang, loadedAppLanguage] = await Promise.all([
        getSelectedLanguages(),
        getFrontCardLanguage(),
        getAppLanguage(),
      ]);

      setSelectedLangs(loadedSelectedLangs);
      setFrontLang(loadedFrontLang ?? 'random');
      setAppLanguage(loadedAppLanguage);
      setLoading(false);
    };

    void loadSettings();
  }, []);

  const handleToggleLang = (lang: Lang) => {
    setSelectedLangs((prevState) => {
      if (prevState.includes(lang)) {
        if (prevState.length <= 2) {
          return prevState;
        }

        return prevState.filter((item) => item !== lang);
      }

      return [...prevState, lang];
    });
    setError('');
  };

  const handleSave = async () => {
    try {
      await saveSelectedLanguages(selectedLangs);
      await saveFrontCardLanguage(frontLang === 'random' ? null : frontLang);
      await saveAppLanguage(appLanguage);
      await i18n.changeLanguage(appLanguage);
      setError('');
      setIsSavedVisible(true);
    } catch {
      setError(t('minTwoLanguagesRequired'));
    }
  };

  const handleExportWords = async () => {
    setError('');
    setStatusMessage('');

    try {
      await exportWordsToJson();
      setStatusMessage(t('exportSuccess'));
    } catch {
      setError(t('errorExportingWords'));
    }
  };

  const handleImportWords = async () => {
    setError('');
    setStatusMessage('');

    try {
      const result = await importWordsFromPickedFile();

      if (!result) {
        return;
      }

      const messageParts: string[] = [];
      if (result.addedCount > 0) {
        messageParts.push(t('wordsImported', { count: result.addedCount }));
      }
      if (result.duplicatesCount > 0) {
        messageParts.push(t('duplicatesSkipped', { count: result.duplicatesCount }));
      }
      if (result.errorCount > 0) {
        messageParts.push(t('errorsDuringImport', { count: result.errorCount }));
      }

      if (messageParts.length > 0) {
        setStatusMessage(messageParts.join('. '));
      } else {
        setError(t('noWordsImported'));
      }
    } catch (error) {
      if (error instanceof Error && error.message === ERROR_MESSAGES.INVALID_FILE_FORMAT) {
        setError(t('invalidFileFormat'));
        return;
      }

      setError(t('errorImportingWords'));
    }
  };

  const handleCheckDuplicates = async () => {
    setError('');
    setStatusMessage('');

    try {
      const result = await checkAndRemoveDuplicates();
      if (result.duplicatesCount > 0) {
        setStatusMessage(t('duplicatesRemoved', { count: result.duplicatesCount }));
        return;
      }

      setStatusMessage(t('noDuplicatesFound'));
    } catch {
      setError(t('errorCheckingDuplicates'));
    }
  };

  const handleFixWordsLanguages = async () => {
    setError('');
    setStatusMessage('');

    try {
      const result = await fixWordsLanguages();
      if (result.fixedCount > 0) {
        setStatusMessage(t('wordsLanguagesFixed', { count: result.fixedCount }));
      } else {
        setStatusMessage(t('noWordsToFix'));
      }

      if (result.errorCount > 0) {
        setError(t('errorsDuringFix', { count: result.errorCount }));
      }
    } catch {
      setError(t('errorFixingWordsLanguages'));
    }
  };

  useEffect(() => {
    if (!isSavedVisible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSavedVisible(false);
    }, 1800);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSavedVisible]);

  if (loading) {
    return (
      <AppScreen currentScreen="Settings">
        <BodyText>{t('loading')}</BodyText>
      </AppScreen>
    );
  }

  return (
    <AppScreen currentScreen="Settings">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionCard>
          <SectionTitle>{t('languageSettings')}</SectionTitle>
          <BodyText>{t('selectLanguagesForCards')}</BodyText>

          <View style={styles.group}>
            {LANGS.map((lang) => {
              const isSelected = selectedLangs.includes(lang);

              return (
                <Pressable
                  key={lang}
                  onPress={() => handleToggleLang(lang)}
                  style={[styles.option, isSelected && styles.optionActive]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {t(getLangLabelKey(lang))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <BodyText>{t('appLanguage')}</BodyText>
          <View style={styles.group}>
            {(['ru', 'en'] as AppLanguage[]).map((lang) => {
              const isSelected = appLanguage === lang;

              return (
                <Pressable
                  key={lang}
                  onPress={() => setAppLanguage(lang)}
                  style={[styles.option, isSelected && styles.optionActive]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {lang === 'ru' ? 'Русский' : 'English'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <BodyText>{t('selectFrontCardLanguage')}</BodyText>

          <View style={styles.group}>
            {(['random', ...LANGS] as FrontLangOption[]).map((lang) => {
              const isSelected = frontLang === lang;

              return (
                <Pressable
                  key={lang}
                  onPress={() => setFrontLang(lang)}
                  style={[styles.option, isSelected && styles.optionActive]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {t(getLangLabelKey(lang))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <SectionTitle>{t('wordOperations')}</SectionTitle>
          <View style={styles.actionsGroup}>
            <PrimaryButton
              label={t('importWords')}
              onPress={() => void handleImportWords()}
              variant="neutral"
            />
            <PrimaryButton
              label={t('exportWords')}
              onPress={() => void handleExportWords()}
              variant="neutral"
            />
            <PrimaryButton
              label={t('checkDuplicates')}
              onPress={() => void handleCheckDuplicates()}
              variant="neutral"
            />
            <PrimaryButton
              label={t('fixWordsLanguages')}
              onPress={() => void handleFixWordsLanguages()}
              variant="neutral"
            />
          </View>
        </SectionCard>

        {Boolean(statusMessage) && <Text style={styles.status}>{statusMessage}</Text>}
        {Boolean(error) && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label={t('save')} onPress={() => void handleSave()} />
      </ScrollView>

      {isSavedVisible && (
        <View style={styles.savedAlert}>
          <Text style={styles.savedAlertText}>{t('changesSaved')}</Text>
        </View>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  optionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: theme.colors.textOnPrimary,
  },
  actionsGroup: {
    gap: theme.spacing.sm,
  },
  status: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  savedAlert: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  savedAlertText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
});
