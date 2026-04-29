import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/features/auth/api';
import { authService } from '@/api/services';
import { normalizeRole, ROLES, ROUTES, APP_NAME } from '@/lib/constants';
import { useState, useCallback } from 'react';
import { Eye, EyeOff, ArrowLeft, MailCheck } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/** Backend may use different codes/messages for unverified email */
function isEmailNotVerifiedError(err: unknown): boolean {
    const e = err as { response?: { data?: { code?: string; message?: string } } };
    const code = e.response?.data?.code;
    if (
        code === 'EMAIL_NOT_VERIFIED'
        || code === 'EmailNotConfirmed'
        || code === 'EmailNotVerified'
    ) {
        return true;
    }
    const msg = (e.response?.data?.message || '').toString().toLowerCase();
    if (!msg) return false;
    if (msg.includes('not confirmed') || msg.includes('not verified')) return true;
    if (msg.includes('verify your email') || msg.includes('email not verified')) return true;
    if (msg.includes('confirm') && msg.includes('email')) return true;
    return false;
}

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useLogin();
    const [error, setError] = useState('');
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState('');

    const getRedirectPath = (role: string) => {
        const userRole = normalizeRole(role);
        if (userRole === ROLES.ADMIN) return ROUTES.ADMIN;
        if (userRole === ROLES.INSTRUCTOR) return ROUTES.INSTRUCTOR;
        return ROUTES.DASHBOARD;
    };

    const from = (location.state as any)?.from?.pathname;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // Watch email and password fields to clear error when user starts typing again
    const watchedEmail = watch('email');
    const watchedPassword = watch('password');

    // Clear error when user modifies input (not on submit)
    const clearErrorOnInputChange = useCallback(() => {
        if (error) setError('');
        if (unverifiedEmail) setUnverifiedEmail('');
    }, [error, unverifiedEmail]);

    // Effect to clear errors when user modifies input fields
    useState(() => {
        clearErrorOnInputChange();
    });

    const onSubmit = async (data: LoginFormData, event?: React.BaseSyntheticEvent) => {
        // Prevent any default form submission behavior
        event?.preventDefault();

        // Only clear resend-related states on submit, NOT the main error
        setResendSuccess(false);
        setResendError('');

        try {
            const loginResponse = await login.mutateAsync(data);
            const redirectPath = from || getRedirectPath(loginResponse.role);
            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            if (isEmailNotVerifiedError(err)) {
                setUnverifiedEmail(data.email);
                setError('');
                return;
            }
            // Keep error visible until user changes input
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    const inputClass =
        'w-full px-4 py-3.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F5A9C]/20 focus:border-[#0F5A9C] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all';

    const errorClass = 'text-xs text-red-500 mt-1 font-medium';

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
                        Welcome Back
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className={inputClass}
                            {...register('email', { onChange: clearErrorOnInputChange })}
                        />
                        {errors.email && (
                            <p className={errorClass}>{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className={`${inputClass} pr-11`}
                                {...register('password', { onChange: clearErrorOnInputChange })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-200 cursor-pointer"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className={errorClass}>{errors.password.message}</p>
                        )}
                    </div>

                    {/* Remember Me + Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-[#0F5A9C] focus:ring-[#0F5A9C]/30 dark:bg-zinc-800 cursor-pointer"
                                {...register('rememberMe')}
                            />
                            <span className="text-sm text-slate-600 dark:text-zinc-400">Remember me</span>
                        </label>
                        <Link
                            to={ROUTES.FORGOT_PASSWORD}
                            className="text-sm font-medium text-[#0F5A9C] hover:text-[#0a4a7a] dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={login.isPending}
                        className="w-full py-3.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 active:scale-[0.98]"
                    >
                        {login.isPending
                            ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            )
                            : 'Sign In'
                        }
                    </button>
                </form>

                {/* Email not verified — show after failed login so it’s visible */}
                {unverifiedEmail && (
                    <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Email not confirmed
                        </p>
                        <p className="text-sm mt-1 text-amber-700 dark:text-amber-400">
                            We sent a verification link to <strong className="break-all">{unverifiedEmail}</strong>. Open the link in that email before signing in.
                        </p>
                        {resendSuccess ? (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                <MailCheck className="w-4 h-4 shrink-0" />
                                Confirmation email sent. Check your inbox.
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-3">
                                    Didn&apos;t get the email?
                                </p>
                                <button
                                    type="button"
                                    disabled={resending}
                                    onClick={async () => {
                                        setResendError('');
                                        setResending(true);
                                        try {
                                            await authService.resendConfirmationEmail({ email: unverifiedEmail });
                                            setResendSuccess(true);
                                        } catch {
                                            setResendError('Could not resend the email. Please try again in a moment.');
                                        } finally {
                                            setResending(false);
                                        }
                                    }}
                                    className="mt-2 w-full py-3 rounded-xl text-sm font-semibold border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 disabled:opacity-60 cursor-pointer transition-colors"
                                >
                                    {resending ? 'Sending…' : 'Resend confirmation email'}
                                </button>
                            </>
                        )}
                        {resendError && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">{resendError}</p>
                        )}
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link
                        to={ROUTES.SIGNUP}
                        className="font-semibold text-[#0F5A9C] hover:text-[#0a4a7a] dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};