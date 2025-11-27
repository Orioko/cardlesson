import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { lazy, Suspense, useEffect, useState } from 'react';
import './App.css';
import { auth } from './firebase';

const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const MainPage = lazy(() => import('./pages/MainPage/MainPage'));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'));

type Page = 'main' | 'dictionary';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('main');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    if (!user) {
        return (
            <Suspense fallback={<div>Загрузка...</div>}>
                <LoginPage />
            </Suspense>
        );
    }

    return (
        <div className="app-container">
            <Suspense fallback={<div>Загрузка...</div>}>
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
