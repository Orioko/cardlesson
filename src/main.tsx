import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { cleanupDuplicates } from './utils/cleanupDuplicates';
import { initializeDefaultUser } from './utils/userStorage';

import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';

const initApp = async () => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        console.error('Root element not found');
        return;
    }

    const root = ReactDOM.createRoot(rootElement);

    try {
        initializeDefaultUser();
        
        const i18nPromise = import('../i18n');
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
        
        await Promise.race([i18nPromise, timeoutPromise]);
        
        cleanupDuplicates();
    } catch (error) {
        console.error('Ошибка загрузки i18n:', error);
    }

    root.render(
        <React.StrictMode>
            <PrimeReactProvider>
                <App />
            </PrimeReactProvider>
        </React.StrictMode>
    );
};

initApp().catch((error) => {
    console.error('Критическая ошибка инициализации приложения:', error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">Ошибка загрузки приложения. Пожалуйста, обновите страницу.</div>';
    }
});
