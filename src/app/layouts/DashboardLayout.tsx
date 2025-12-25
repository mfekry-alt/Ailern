import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AIBot } from '@/components/AIBot';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
                <Outlet />
            </main>
            <AIBot />
        </div>
    );
};

