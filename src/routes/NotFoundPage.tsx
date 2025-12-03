import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { FileQuestion } from 'lucide-react';

export const NotFoundPage = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-100 text-secondary-600 mb-6">
                    <FileQuestion className="w-10 h-10" />
                </div>
                <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-secondary-800 mb-2">Page Not Found</h2>
                <p className="text-secondary-600 mb-8 max-w-md mx-auto">
                    Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
                </p>
                <Link to={ROUTES.HOME}>
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </div>
    );
};

