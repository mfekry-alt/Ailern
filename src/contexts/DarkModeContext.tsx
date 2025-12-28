import { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

interface DarkModeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};

interface DarkModeProviderProps {
    children: React.ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = storage.get<boolean>('darkMode');
        if (typeof saved === 'boolean') {
            return saved;
        }
        // Default to light mode unless the user explicitly toggles dark mode in settings.
        return false;
    });

    useEffect(() => {
        // Persist when dark mode changes (safe wrapper)
        storage.set('darkMode', isDarkMode);

        // Update document class for Tailwind dark mode
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
