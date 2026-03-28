import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/features/auth/api';
import { normalizeRole, ROLES, ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { useState } from 'react';
import { storage } from '@/lib/storage';
import type { User } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useLogin();
    const [error, setError] = useState<string>('');
    const [unverifiedEmail, setUnverifiedEmail] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect based on user role after login - all roles go to their dashboard
    const getRedirectPath = (user: any) => {
        const userRole = normalizeRole(user?.role || user?.roles?.[0]);
        if (userRole === ROLES.ADMIN) return ROUTES.ADMIN;
        if (userRole === ROLES.INSTRUCTOR) return ROUTES.INSTRUCTOR;
        return ROUTES.DASHBOARD;
    };

    const from = (location.state as any)?.from?.pathname;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        setUnverifiedEmail('');
        try {
            await login.mutateAsync(data);
            const storedUser = storage.get<User>(STORAGE_KEYS.USER);
            const redirectPath = from || getRedirectPath(storedUser);
            console.log('Login successful, redirecting to:', redirectPath, 'User roles:', storedUser?.roles);
            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            const apiCode = err.response?.data?.code as string | undefined;
            if (apiCode === 'EMAIL_NOT_VERIFIED') {
                setUnverifiedEmail(data.email);
                setError('');
                return;
            }
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-8 py-12 bg-gray-50 dark:bg-zinc-950">
            <div className="w-full max-w-[448px]">
                <div className="bg-white dark:bg-zinc-900 rounded-xl px-8 pt-8 pb-12 shadow-figma dark:shadow-lg dark:border dark:border-zinc-800">
                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="font-bold text-[30px] leading-[37.5px] tracking-[-0.75px] text-gray-900 dark:text-zinc-100">
                            Login
                        </h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-md border bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {unverifiedEmail && (
                        <div
                            className="mb-6 p-4 rounded-md border"
                            style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                                Verify your email to continue
                            </p>
                            <p className="text-sm mt-1" style={{ color: '#b45309' }}>
                                We can&apos;t log you in until your email is confirmed. Use the links below to finish verification.
                            </p>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <Link
                                    to={`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(unverifiedEmail)}`}
                                    className="text-[14px] font-medium underline"
                                    style={{ color: '#92400e' }}
                                >
                                    Verify your email
                                </Link>
                                <Link
                                    to={`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(unverifiedEmail)}`}
                                    className="text-[14px] font-medium underline"
                                    style={{ color: '#92400e' }}
                                >
                                    Resend confirmation
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm" style={{ color: '#dc2626' }}>{errors.email.message}</p>
                            )}

                            {/* Password Input with show/hide toggle */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    className="w-full px-[13px] py-[15px] pr-12 text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <span className="relative inline-block">
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 transition-all duration-300 ease-out opacity-90" />
                                        ) : (
                                            <Eye className="w-5 h-5 transition-all duration-300 ease-out opacity-100" />
                                        )}
                                    </span>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm" style={{ color: '#dc2626' }}>{errors.password.message}</p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 bg-white border rounded"
                                style={{ borderColor: '#dbe0e6', accentColor: '#0d7ff2' }}
                                {...register('rememberMe')}
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-[14px] leading-5 text-gray-500 dark:text-zinc-400">
                                Remember me
                            </label>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={login.isPending}
                            className="w-full text-white font-semibold text-[14px] leading-5 py-[13px] px-[17px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#0d7ff2' }}
                            onMouseEnter={(e) => {
                                if (!login.isPending) e.currentTarget.style.backgroundColor = '#0b6dd4';
                            }}
                            onMouseLeave={(e) => {
                                if (!login.isPending) e.currentTarget.style.backgroundColor = '#0d7ff2';
                            }}
                        >
                            {login.isPending ? 'Logging in...' : 'Login'}
                        </button>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <Link
                                to={ROUTES.FORGOT_PASSWORD}
                                className="text-[14px] leading-5 font-medium transition-colors"
                                style={{ color: '#0d7ff2' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#0b6dd4';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#0d7ff2';
                                }}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};