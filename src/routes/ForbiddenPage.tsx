import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { ShieldAlert } from 'lucide-react';

export const ForbiddenPage = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-100 text-danger-600 mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h1 className="text-6xl font-bold text-secondary-900 mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-secondary-800 mb-2">Access Forbidden</h2>
                <p className="text-secondary-600 mb-8 max-w-md mx-auto">
                    You don't have permission to access this page. Please contact an administrator if you
                    believe this is an error.
                </p>
                <Link to={ROUTES.DASHBOARD}>
                    <Button>Back to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
};

