import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import './App.css';
import { auth } from './firebase';
import DictionaryPage from './pages/DictionaryPage';
import LoginPage from './pages/LoginPage/LoginPage';
import MainPage from './pages/MainPage/MainPage';

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
        return <LoginPage />;
    }

    return (
        <div className="app-container">
            {currentPage === 'main' && (
                <MainPage onNavigateToDictionary={() => setCurrentPage('dictionary')} />
            )}
            {currentPage === 'dictionary' && (
                <DictionaryPage onNavigateToMain={() => setCurrentPage('main')} />
            )}
        </div>
    );
}

export default App;
