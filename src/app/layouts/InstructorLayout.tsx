import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AIBot } from '@/components/AIBot';

export const InstructorLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 transition-colors">
            <Header />
            <main>
                <Outlet />
            </main>
            <AIBot />
        </div>
    );
};

