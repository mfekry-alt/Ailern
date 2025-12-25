import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';

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

    // Redirect based on user role after login - all roles go to their dashboard
    const getRedirectPath = (user: any) => {
        if (user?.roles?.includes('Admin')) return ROUTES.ADMIN;
        if (user?.roles?.includes('Instructor')) return ROUTES.INSTRUCTOR;
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
            const result = await login.mutateAsync(data);
            const redirectPath = from || getRedirectPath(result.user);
            console.log('Login successful, redirecting to:', redirectPath, 'User roles:', result.user?.roles);
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
        <div className="min-h-screen flex items-center justify-center px-8 py-12" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="w-full max-w-[448px]">
                <div className="bg-white rounded-xl px-8 pt-8 pb-12" style={{ boxShadow: '0px 10px 25px -5px rgba(0,0,0,0.05), 0px 10px 10px -5px rgba(0,0,0,0.05)' }}>
                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="font-bold text-[30px] leading-[37.5px] tracking-[-0.75px]" style={{ color: '#111318' }}>
                            Login
                        </h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-md border" style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca' }}>
                            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
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
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm" style={{ color: '#dc2626' }}>{errors.email.message}</p>
                            )}

                            {/* Password Input */}
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all"
                                {...register('password')}
                            />
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
                            <label htmlFor="rememberMe" className="ml-2 text-[14px] leading-5" style={{ color: '#60758a' }}>
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

