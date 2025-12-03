import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { APP_NAME } from '@/lib/constants';

export const MainLayout = () => {
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
        </div>
    );
};

