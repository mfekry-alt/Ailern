import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AIBot } from '@/components/AIBot';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors">
            <Header />
            <main>
                <Outlet />
            </main>
            <AIBot />
        </div>
    );
};

