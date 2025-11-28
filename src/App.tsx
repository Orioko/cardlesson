import { ProgressSpinner } from 'primereact/progressspinner';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import styles from './App.module.scss';
import ProtectedRoute from './components/ProtectedRoute';
import { WordsProvider } from './contexts/WordsProvider';

const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const MainPage = lazy(() => import('./pages/MainPage/MainPage'));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'));

const App = () => {
  return (
    <BrowserRouter basename="/cardlesson">
      <WordsProvider>
        <div className={styles.appContainer}>
          <Suspense
            fallback={
              <div className={styles.fallback}>
                <ProgressSpinner />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dictionary"
                element={
                  <ProtectedRoute>
                    <DictionaryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </WordsProvider>
    </BrowserRouter>
  );
};

export default App;
