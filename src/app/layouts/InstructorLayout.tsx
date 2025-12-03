import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export const InstructorLayout = () => {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

