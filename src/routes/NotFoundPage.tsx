import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { SearchX, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-8 transition-colors duration-300 font-sans relative overflow-hidden">

            {/* Decorative Background Elements (Glows) */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Glassmorphism Card */}
            <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200 dark:border-slate-700 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center z-10 animate-in fade-in zoom-in duration-500">

                {/* Icon */}
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100 dark:border-blue-500/20">
                    <SearchX className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>

                {/* 404 Text */}
                <h1 className="text-7xl sm:text-8xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">
                    404
                </h1>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Page Not Found
                </h2>

                <p className="text-gray-500 dark:text-slate-400 mb-10 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                    Oops! The page you are looking for seems to have wandered off into the digital void. Let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        to={ROUTES.DASHBOARD}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};