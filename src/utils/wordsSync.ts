import { getUserId } from './localAuth';
import { fetchWords } from './wordsApi';
import { getWordsCacheTimestampKey, saveWordsToCache } from './wordsCache';

interface WordData {
    id: string;
    ru: string;
    en: string;
    ko: string;
    translations: {
        ru: string;
        en: string;
        ko: string;
    };
    userId?: string;
    createdAt?: string | number | Date;
}

const SYNC_INTERVAL = 60000;
const CACHE_MAX_AGE = 300000;

export const syncWordsFromServer = async (userId: string): Promise<WordData[] | null> => {
    const currentUserId = getUserId();
    if (!currentUserId || currentUserId !== userId) {
        return null;
    }

    try {
        const { loadWordsFromCache } = await import('./wordsCache');
        const localWords = loadWordsFromCache(userId) || [];
        const localWordsMap = new Map<string, WordData>();
        const tempWords: WordData[] = [];

        localWords.forEach((word) => {
            if (word.id.startsWith('temp_')) {
                tempWords.push(word);
            } else {
                localWordsMap.set(word.id, word);
            }
        });

        const serverWords = await fetchWords();
        const serverWordsMap = new Map<string, WordData>();
        
        serverWords.forEach((word: WordData) => {
            serverWordsMap.set(word.id, word);
        });

        const mergedWords: WordData[] = [];
        
        tempWords.forEach((tempWord) => {
            const serverWord = Array.from(serverWordsMap.values()).find(
                (sw) => sw.ru === tempWord.ru && sw.en === tempWord.en && sw.ko === tempWord.ko
            );
            if (serverWord) {
                mergedWords.push(serverWord);
                serverWordsMap.delete(serverWord.id);
            } else {
                mergedWords.push(tempWord);
            }
        });

        serverWordsMap.forEach((word) => {
            mergedWords.push(word);
        });

        mergedWords.sort((a, b) => {
            const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                         typeof a.createdAt === 'number' ? a.createdAt : 
                         a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
            const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                         typeof b.createdAt === 'number' ? b.createdAt : 
                         b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
            return bDate - aDate;
        });

        saveWordsToCache(userId, mergedWords);
        return mergedWords;
    } catch (error) {
        console.error('Ошибка синхронизации слов с сервером:', error);
        return null;
    }
};

export const shouldSyncFromServer = (userId: string): boolean => {
    try {
        const timestampKey = getWordsCacheTimestampKey(userId);
        const timestamp = localStorage.getItem(timestampKey);
        
        if (!timestamp) {
            return true;
        }

        const cacheAge = Date.now() - Number.parseInt(timestamp, 10);
        return cacheAge > CACHE_MAX_AGE;
    } catch (error) {
        console.error('Ошибка проверки необходимости синхронизации:', error);
        return true;
    }
};

export const initializeWordsSync = (userId: string, onSyncComplete?: (words: WordData[]) => void): (() => void) => {
    let syncInterval: ReturnType<typeof setInterval> | null = null;
    let isSyncing = false;

    const performSync = async () => {
        const currentUserId = getUserId();
        if (isSyncing || !currentUserId || currentUserId !== userId) {
            return;
        }

        isSyncing = true;
        try {
            const words = await syncWordsFromServer(userId);
            if (words && onSyncComplete) {
                onSyncComplete(words);
            }
        } catch (error) {
            console.error('Ошибка периодической синхронизации:', error);
        } finally {
            isSyncing = false;
        }
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && shouldSyncFromServer(userId)) {
            performSync();
        }
    };

    const handleFocus = () => {
        if (shouldSyncFromServer(userId)) {
            performSync();
        }
    };

    if (shouldSyncFromServer(userId)) {
        performSync();
    }

    syncInterval = setInterval(() => {
        if (shouldSyncFromServer(userId)) {
            performSync();
        }
    }, SYNC_INTERVAL);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
    };
};

