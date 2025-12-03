import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

