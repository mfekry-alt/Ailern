import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { APP_NAME, ROUTES } from '@/lib/constants';

export const MainLayout = () => {
    const location = useLocation();
    const isHomePage = location.pathname === ROUTES.HOME || location.pathname === '/home';

    if (isHomePage) {
        // For landing page, render without header/footer
        return (
            <div className="min-h-screen">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors">
            <Header />
            <main>
                <Outlet />
            </main>
            <footer className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600 dark:text-zinc-400">
                        © 2025 {APP_NAME}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

