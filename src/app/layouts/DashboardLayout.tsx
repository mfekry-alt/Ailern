import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors">
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

