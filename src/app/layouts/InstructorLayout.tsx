import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AIBot } from '@/components/AIBot';

export const InstructorLayout = () => {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
            <Header />
            <main>
                <Outlet />
            </main>
            <AIBot />
        </div>
    );
};

