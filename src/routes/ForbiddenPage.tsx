import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { ShieldAlert } from 'lucide-react';

type ForbiddenLocationState = {
    title?: string;
    message?: string;
    backTo?: string;
};

export const ForbiddenPage = () => {
    const location = useLocation();
    const s = (location.state as ForbiddenLocationState | null) ?? null;
    const title = s?.title ?? 'Access Forbidden';
    const message =
        s?.message ??
        "You don't have permission to access this page. Please contact an administrator if you believe this is an error.";
    const backTo = s?.backTo ?? ROUTES.DASHBOARD;
    const backLabel = s?.backTo ? 'Go back' : 'Back to Dashboard';

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-100 dark:bg-red-900/30 text-danger-600 dark:text-red-400 mb-6">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h1 className="text-6xl font-bold text-secondary-900 dark:text-zinc-100 mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-secondary-800 dark:text-zinc-200 mb-2">{title}</h2>
                <p className="text-secondary-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">{message}</p>
                <Link to={backTo}>
                    <Button>{backLabel}</Button>
                </Link>
            </div>
        </div>
    );
};

