import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmail } from '@/api/services/auth.service';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export const ConfirmEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!email || !token) {
            setStatus('error');
            setErrorMessage('Invalid confirmation link. Missing email or token.');
            return;
        }

        let cancelled = false;

        const verify = async () => {
            try {
                await confirmEmail({ Email: email, Token: token });
                if (!cancelled) setStatus('success');
            } catch (err: any) {
                if (cancelled) return;
                const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.errors?.[0] ||
                    'Email confirmation failed. The link may have expired or already been used.';
                setErrorMessage(msg);
                setStatus('error');
            }
        };

        verify();
        return () => { cancelled = true; };
    }, [email, token]);

    return (
        <div className="w-full flex flex-col items-start">
            <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-[#0F5A9C] dark:hover:text-blue-400 transition-colors duration-200 mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Home
            </Link>

            <div className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl px-8 pt-8 pb-10 shadow-xl shadow-black/5 dark:shadow-black/30 border border-white/60 dark:border-zinc-700/50">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <img
                        src="/logo-removebg.svg"
                        alt={`${APP_NAME} logo`}
                        className="w-14 h-14"
                    />
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#0F5A9C] to-[#74388B] bg-clip-text text-transparent">
                        {APP_NAME}
                    </span>
                </div>

                {status === 'loading' && (
                    <div className="flex flex-col items-center py-10 gap-5">
                        <div className="w-16 h-16 rounded-full bg-[#0F5A9C]/10 dark:bg-[#0F5A9C]/20 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#0F5A9C] dark:text-blue-400 animate-spin" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Verifying your email...
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                                Please wait while we confirm your email address.
                            </p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center py-10 gap-5">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Email Confirmed!
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                                Your email has been verified successfully. You can now sign in to your account.
                            </p>
                        </div>
                        <Link
                            to={ROUTES.LOGIN}
                            className="mt-2 w-full max-w-xs py-3 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 transition-all duration-300"
                        >
                            Sign In
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center py-10 gap-5">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Confirmation Failed
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                                {errorMessage}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-xs">
                            <Link
                                to={ROUTES.LOGIN}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center border-2 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:border-[#0F5A9C] hover:text-[#0F5A9C] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all duration-300"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={ROUTES.SIGNUP}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 transition-all duration-300"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};