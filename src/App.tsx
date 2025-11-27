import { lazy, Suspense, useEffect, useState } from 'react';
import './App.css';
import { getCurrentUser, onAuthChange } from './utils/localAuth';

const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const MainPage = lazy(() => import('./pages/MainPage/MainPage'));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'));

type Page = 'main' | 'dictionary';

function App() {
    const [user, setUser] = useState<{ id: string } | null>(() => {
        if (typeof window !== 'undefined') {
            try {
                return getCurrentUser();
            } catch (error) {
                console.error('Ошибка инициализации пользователя:', error);
                return null;
            }
        }
        return null;
    });
    const [currentPage, setCurrentPage] = useState<Page>('main');

    useEffect(() => {
        try {
            const unsubscribe = onAuthChange((user) => {
                setUser(user);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Ошибка подписки на изменения аутентификации:', error);
            return () => {};
        }
    }, []);

    if (!user) {
        return (
            <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>}>
                <LoginPage />
            </Suspense>
        );
    }

    return (
        <div className="app-container">
            <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>}>
                {currentPage === 'main' && (
                    <MainPage onNavigateToDictionary={() => setCurrentPage('dictionary')} />
                )}
                {currentPage === 'dictionary' && (
                    <DictionaryPage onNavigateToMain={() => setCurrentPage('main')} />
                )}
            </Suspense>
        </div>
    );
}

export default App;
