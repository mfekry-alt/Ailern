import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/api';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
    const forgotPassword = useForgotPassword();
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setError('');
        setSuccess(false);
        try {
            // Always respond with a generic success message so we never reveal
            // whether the email exists in the system.
            await forgotPassword.mutateAsync(data.email);
            setSuccess(true);
        } catch (err: any) {
            const apiMessage = err.response?.data?.message as string | undefined;
            const apiCode = err.response?.data?.code as string | undefined;

            if (apiCode === 'USER_NOT_FOUND') {
                // Security: treat "user not found" as success as well
                setSuccess(true);
                return;
            }

            setError(apiMessage || 'Failed to send reset email. Please try again.');
        }
    };

    const inputClass =
        'w-full px-4 py-3.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F5A9C]/20 focus:border-[#0F5A9C] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all';

    const errorClass = 'text-xs text-red-500 mt-1 font-medium';

    // Success state
    if (success) {
        return (
            <div className="w-full max-w-[450px] mx-auto">
                {/* Back to Home */}
                <Link
                    to={ROUTES.HOME}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-[#0F5A9C] dark:hover:text-blue-400 transition-colors duration-200 mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    Back to Home
                </Link>

                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl px-8 pt-8 pb-10 shadow-xl shadow-black/5 dark:shadow-black/30 border border-white/60 dark:border-zinc-700/50">
                    <div className="text-center">
                        <Link to={ROUTES.HOME} className="inline-flex items-center justify-center gap-3 mb-5 group">
                            <img
                                src="/logo-removebg.png"
                                alt={`${APP_NAME} logo`}
                                className="w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                        </Link>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                            <MailCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Check your email
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                            If an account exists with this email, a reset link has been sent. Follow the instructions in that email to
                            set a new password and then log in to your dashboard.
                        </p>
                        <Link
                            to={ROUTES.LOGIN}
                            className="inline-flex items-center justify-center w-full py-3.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 ease-out bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 active:scale-[0.98]"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[450px] mx-auto">
            {/* Back to Home */}
            <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-[#0F5A9C] dark:hover:text-blue-400 transition-colors duration-200 mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Home
            </Link>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl px-8 pt-8 pb-10 shadow-xl shadow-black/5 dark:shadow-black/30 border border-white/60 dark:border-zinc-700/50">

                {/* Logo + Heading */}
                <div className="text-center">
                    <Link to={ROUTES.HOME} className="inline-flex items-center justify-center gap-3 mb-5 group">
                        <img
                            src="/logo-removebg.png"
                            alt={`${APP_NAME} logo`}
                            className="w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Forgot Password
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Enter your email to receive a reset link
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Email address
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className={inputClass}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className={errorClass}>{errors.email.message}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={forgotPassword.isPending}
                        className="w-full py-3.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 active:scale-[0.98] mt-2"
                    >
                        {forgotPassword.isPending
                            ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Sending...
                                </span>
                            )
                            : 'Send Reset Link'
                        }
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-6">
                    Remember your password?{' '}
                    <Link
                        to={ROUTES.LOGIN}
                        className="font-semibold text-[#0F5A9C] hover:text-[#0a4a7a] dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};