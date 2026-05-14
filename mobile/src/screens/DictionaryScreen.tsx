import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGS, type Lang } from '../../../shared/types/lang';
import type { Word } from '../../../shared/types/word';
import { ERROR_MESSAGES } from '../../../shared/constants/errors';
import { createWordInput, getTodayWordsCount } from '../../../shared/utils/wordDataHelpers';
import { addWord, deleteWord, fetchWords, updateWord } from '../api/wordsApi';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { BodyText, MutedText } from '../components/Typography';
import { getFrontCardLanguage, getSelectedLanguages } from '../shared/storage/languageSettings';
import { theme } from '../shared/theme/theme';

type WordFormState = {
  ru: string;
  en: string;
  ko: string;
};

const initialFormState: WordFormState = {
  ru: '',
  en: '',
  ko: '',
};

const openFormSpringConfig = {
  damping: 18,
  mass: 0.8,
  stiffness: 180,
  useNativeDriver: true,
} as const;

type TranslationItem = {
  lang: Lang;
  value: string;
};

type WordCardProps = {
  item: Word;
  primaryText: string;
  translationItems: TranslationItem[];
  isFlipped: boolean;
  onFlip: () => void;
  onEdit: () => void;
  onDelete: () => void;
  translationNotSpecifiedLabel: string;
};

const WordCard = ({
  item,
  primaryText,
  translationItems,
  isFlipped,
  onFlip,
  onEdit,
  onDelete,
  translationNotSpecifiedLabel,
}: WordCardProps) => {
  const rotateAnimation = useState(() => new Animated.Value(isFlipped ? 180 : 0))[0];

  useEffect(() => {
    Animated.timing(rotateAnimation, {
      toValue: isFlipped ? 180 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, rotateAnimation]);

  const frontTransform = useMemo(
    () => [
      {
        rotateY: rotateAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
    [rotateAnimation]
  );

  const backTransform = useMemo(
    () => [
      {
        rotateY: rotateAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
    [rotateAnimation]
  );

  return (
    <Pressable onPress={onFlip}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.flipContent}>
          <Animated.View
            style={[styles.cardFace, styles.cardFaceFront, { transform: frontTransform }]}
          >
            <Text style={styles.cardPrimary}>{primaryText}</Text>
          </Animated.View>
          <Animated.View
            style={[styles.cardFace, styles.cardFaceBack, { transform: backTransform }]}
          >
            {translationItems.length > 0 ? (
              translationItems.map((translationItem) => (
                <Text key={`${item.id}_${translationItem.lang}`} style={styles.cardSecondary}>
                  {translationItem.lang.toUpperCase()}: {translationItem.value}
                </Text>
              ))
            ) : (
              <Text style={styles.cardSecondary}>{translationNotSpecifiedLabel}</Text>
            )}
          </Animated.View>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            style={styles.editButton}
          >
            <MaterialIcons
              name="edit"
              size={theme.wordCard.iconSize}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            style={styles.deleteButton}
          >
            <MaterialIcons
              name="close"
              size={theme.wordCard.iconSize}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export const DictionaryScreen = () => {
  const { t } = useTranslation();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState<boolean>(false);
  const [formState, setFormState] = useState<WordFormState>(initialFormState);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(LANGS);
  const [frontCardLang, setFrontCardLang] = useState<Lang | null>(null);
  const [flippedCardsMap, setFlippedCardsMap] = useState<Record<string, boolean>>({});
  const [isAddFormAnimating, setIsAddFormAnimating] = useState<boolean>(false);
  const [addFormOpenProgress] = useState(() => new Animated.Value(0));
  const [addButtonScale] = useState(() => new Animated.Value(1));
  const [searchButtonScale] = useState(() => new Animated.Value(1));

  const loadWordsData = useCallback(async () => {
    try {
      const [loadedWords, loadedSelectedLangs, loadedFrontCardLang] = await Promise.all([
        fetchWords(),
        getSelectedLanguages(),
        getFrontCardLanguage(),
      ]);

      setSelectedLangs(loadedSelectedLangs);
      setFrontCardLang(loadedFrontCardLang);
      setWords(loadedWords);
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWordsData();
    }, [loadWordsData])
  );

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return words;
    }

    return words.filter((word) => {
      const candidates = [
        word.ru,
        word.en,
        word.ko,
        word.translations?.ru,
        word.translations?.en,
        word.translations?.ko,
      ];

      return candidates.some((value) => {
        if (!value) {
          return false;
        }

        return value.toLowerCase().includes(query);
      });
    });
  }, [searchQuery, words]);
  const totalWordsCount = words.length;
  const todayWordsCount = useMemo(() => getTodayWordsCount(words), [words]);
  const isSaveDisabled = useMemo(() => {
    const filledFieldsCount = selectedLangs.filter((lang) =>
      Boolean(formState[lang].trim())
    ).length;

    return filledFieldsCount < 2;
  }, [formState, selectedLangs]);

  const placeholderByLang = useMemo(() => {
    return {
      ru: t('russianWord'),
      en: t('englishWord'),
      ko: t('koreanWord'),
    } satisfies Record<Lang, string>;
  }, [t]);

  const handleToggleSearch = () => {
    Animated.sequence([
      Animated.timing(searchButtonScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(searchButtonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setIsSearchVisible((prevState) => {
      const nextState = !prevState;

      if (!nextState) {
        setSearchQuery('');
      } else {
        setIsAddFormVisible(false);
        setEditingWordId(null);
        setFormState(initialFormState);
      }

      return nextState;
    });
  };

  const handleToggleAddForm = () => {
    if (isAddFormAnimating) {
      return;
    }

    if (isAddFormVisible) {
      setIsAddFormAnimating(true);
      Animated.parallel([
        Animated.timing(addButtonScale, {
          toValue: 0.97,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(addFormOpenProgress, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        addButtonScale.setValue(1);
        setFormState(initialFormState);
        setEditingWordId(null);
        setIsAddFormVisible(false);
        setIsAddFormAnimating(false);
      });
      return;
    }

    setIsSearchVisible(false);
    setSearchQuery('');
    setIsAddFormAnimating(true);
    setIsAddFormVisible(true);
    addFormOpenProgress.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(addButtonScale, {
          toValue: 0.96,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(addButtonScale, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(addFormOpenProgress, {
        toValue: 1,
        ...openFormSpringConfig,
      }),
    ]).start(() => {
      setIsAddFormAnimating(false);
    });
  };

  const handleSaveWord = async () => {
    if (isSaveDisabled) {
      return;
    }

    try {
      const wordInput = createWordInput(formState);

      if (editingWordId) {
        await updateWord(editingWordId, wordInput);
      } else {
        await addWord(wordInput);
      }

      const refreshedWords = await fetchWords();
      setWords(refreshedWords);
      setFormState(initialFormState);
      setIsAddFormVisible(false);
      setEditingWordId(null);
    } catch (error) {
      if (error instanceof Error && error.message === ERROR_MESSAGES.DUPLICATE_WORD) {
        Alert.alert(t('error'), t('duplicateWordError'));
        return;
      }

      Alert.alert(t('error'), t('failedSaveWord'));
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    try {
      await deleteWord(wordId);
      const refreshedWords = await fetchWords();
      setWords(refreshedWords);

      if (editingWordId === wordId) {
        setEditingWordId(null);
        setFormState(initialFormState);
        setIsAddFormVisible(false);
      }
    } catch {
      Alert.alert(t('error'), t('failedDeleteWord'));
    }
  };

  const handleStartEditWord = (word: Word) => {
    setFormState({
      ru: word.ru,
      en: word.en,
      ko: word.ko,
    });
    setEditingWordId(word.id);
    if (!isAddFormVisible) {
      setIsAddFormVisible(true);
      addFormOpenProgress.setValue(0);
      Animated.spring(addFormOpenProgress, {
        toValue: 1,
        ...openFormSpringConfig,
      }).start();
      return;
    }

    addFormOpenProgress.setValue(1);
  };

  const handleCancelEdit = () => {
    setEditingWordId(null);
    setFormState(initialFormState);
    setIsAddFormVisible(false);
  };

  const handleUpdateField = (field: keyof WordFormState, value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleToggleCardFlip = (wordId: string) => {
    setFlippedCardsMap((prevState) => ({
      ...prevState,
      [wordId]: Boolean(!prevState[wordId]),
    }));
  };

  const renderWordItem = ({ item }: { item: Word }) => {
    const primaryLang: Lang = frontCardLang ?? 'ru';
    const primaryText = item[primaryLang]?.trim() || item.ru || item.en || item.ko;
    const isFlipped = Boolean(flippedCardsMap[item.id]);

    const translationItems = LANGS.filter((lang) => lang !== primaryLang)
      .map((lang) => ({
        lang,
        value: item[lang]?.trim() || '',
      }))
      .filter((translationItem) => Boolean(translationItem.value));

    return (
      <WordCard
        item={item}
        primaryText={primaryText}
        translationItems={translationItems}
        isFlipped={isFlipped}
        onFlip={() => handleToggleCardFlip(item.id)}
        onEdit={() => handleStartEditWord(item)}
        onDelete={() => {
          void handleDeleteWord(item.id);
        }}
        translationNotSpecifiedLabel={t('translationNotSpecified')}
      />
    );
  };

  const addFormAnimatedStyle = useMemo(() => {
    return {
      opacity: addFormOpenProgress,
      transform: [
        {
          translateY: addFormOpenProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-14, 0],
          }),
        },
        {
          scale: addFormOpenProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    };
  }, [addFormOpenProgress]);

  return (
    <AppScreen currentScreen="Dictionary">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : theme.spacing.md}
      >
        <SectionCard>
          <View style={styles.statsRow}>
            <View style={styles.statsChip}>
              <BodyText>{t('totalWords', { count: totalWordsCount })}</BodyText>
            </View>
            <View style={styles.statsChip}>
              <BodyText>{t('wordsAddedToday', { count: todayWordsCount })}</BodyText>
            </View>
            <Animated.View style={{ transform: [{ scale: searchButtonScale }] }}>
              <Pressable
                onPress={handleToggleSearch}
                style={[styles.searchIconButton, isSearchVisible && styles.searchIconButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={isSearchVisible ? t('closeSearch') : t('openSearch')}
              >
                <MaterialIcons
                  name="search"
                  size={20}
                  color={isSearchVisible ? theme.colors.textOnPrimary : theme.colors.textPrimary}
                />
              </Pressable>
            </Animated.View>
          </View>
        </SectionCard>

        {isSearchVisible && (
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchWordsPlaceholder')}
            style={styles.searchInput}
          />
        )}

        <Animated.View style={[styles.addButtonWrap, { transform: [{ scale: addButtonScale }] }]}>
          <PrimaryButton
            label={isAddFormVisible ? t('closeForm') : t('addNewWord')}
            onPress={handleToggleAddForm}
            disabled={isAddFormAnimating}
          />
        </Animated.View>

        {isAddFormVisible && (
          <ScrollView
            contentContainerStyle={styles.addFormScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={addFormAnimatedStyle}>
              <SectionCard>
                {selectedLangs.map((lang) => (
                  <TextInput
                    key={lang}
                    value={formState[lang]}
                    onChangeText={(value) => handleUpdateField(lang, value)}
                    placeholder={placeholderByLang[lang]}
                    style={styles.field}
                    editable={true}
                    autoCapitalize="none"
                  />
                ))}
                <PrimaryButton
                  label={editingWordId ? t('update') : t('save')}
                  onPress={() => {
                    void handleSaveWord();
                  }}
                  disabled={isSaveDisabled}
                />
                {editingWordId && (
                  <PrimaryButton
                    label={t('cancelEdit')}
                    onPress={handleCancelEdit}
                    variant="neutral"
                  />
                )}
              </SectionCard>
            </Animated.View>
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" />
          </View>
        ) : isAddFormVisible ? null : (
          <FlatList
            data={filteredWords}
            keyExtractor={(item) => item.id}
            renderItem={renderWordItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<MutedText>{t('noWords')}</MutedText>}
          />
        )}
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  keyboardContainer: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIconButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  field: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  addButtonWrap: {
    width: '100%',
  },
  addFormScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: 24,
  },
  card: {
    borderRadius: theme.wordCard.borderRadius,
    padding: theme.wordCard.padding,
    gap: theme.spacing.sm,
    minHeight: theme.wordCard.minHeight,
  },
  flipContent: {
    flex: 1,
    minHeight: theme.wordCard.contentMinHeight,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: theme.wordCard.actionButtonSize + theme.spacing.sm * 2,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFaceFront: {
    zIndex: 2,
  },
  cardFaceBack: {
    zIndex: 1,
    gap: theme.wordCard.faceGap,
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cardPrimary: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.wordCard.frontFontSize,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardSecondary: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: theme.wordCard.backFontSize,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.radius.pill,
    width: theme.wordCard.actionButtonSize,
    height: theme.wordCard.actionButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.radius.pill,
    width: theme.wordCard.actionButtonSize,
    height: theme.wordCard.actionButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
