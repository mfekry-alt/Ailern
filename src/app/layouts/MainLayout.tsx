import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AIBot } from '@/components/AIBot';
import { APP_NAME, ROUTES } from '@/lib/constants';

export const MainLayout = () => {
    const location = useLocation();
    const isHomePage = location.pathname === ROUTES.HOME || location.pathname === '/home';

    if (isHomePage) {
        // For landing page, render without header/footer
        return (
            <div className="min-h-screen">
                <Outlet />
                <AIBot />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
                <Outlet />
            </main>
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600">
                        © 2025 {APP_NAME}. All rights reserved.
                    </p>
                </div>
            </footer>
            <AIBot />
        </div>
    );
};

