import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ROUTES, ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'New password must be different from current password',
        path: ['newPassword'],
    });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const newPasswordValue = watch('newPassword', '');

    const primaryRole = user?.roles?.[0];
    const roleLabel = primaryRole === ROLES.ADMIN ? 'Admin' : primaryRole === ROLES.INSTRUCTOR ? 'Instructor' : 'Student';
    const backRoute = primaryRole === ROLES.ADMIN ? ROUTES.ADMIN : primaryRole === ROLES.INSTRUCTOR ? ROUTES.INSTRUCTOR : ROUTES.PROFILE;

    const passwordStrength = (() => {
        let score = 0;
        if (newPasswordValue.length >= 8) score += 30;
        if (/[A-Z]/.test(newPasswordValue)) score += 20;
        if (/[a-z]/.test(newPasswordValue)) score += 20;
        if (/[0-9]/.test(newPasswordValue)) score += 15;
        if (/[^A-Za-z0-9]/.test(newPasswordValue)) score += 15;

        if (score >= 80) {
            return { label: 'Strong', badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', bar: 'bg-green-500', score };
        }
        if (score >= 50) {
            return { label: 'Medium', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', bar: 'bg-amber-500', score };
        }
        if (newPasswordValue.length > 0) {
            return { label: 'Weak', badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', bar: 'bg-red-500', score };
        }
        return { label: 'Empty', badge: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400', bar: 'bg-gray-200 dark:bg-slate-700', score: 0 };
    })();

    const passwordRequirements = [
        { label: 'At least 8 characters', met: newPasswordValue.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(newPasswordValue) },
        { label: 'One lowercase letter', met: /[a-z]/.test(newPasswordValue) },
        { label: 'One number', met: /[0-9]/.test(newPasswordValue) },
        { label: 'One symbol', met: /[^A-Za-z0-9]/.test(newPasswordValue) },
    ];

    const onSubmit = async (data: ChangePasswordFormData) => {
        setError('');
        setSuccess(false);
        setIsSubmitting(true);

        try {
            if (!data.currentPassword || !data.newPassword) {
                throw new Error('Please fill in all required fields');
            }

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setSuccess(true);
            reset();
            setTimeout(() => {
                navigate(backRoute);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-blue-500/30">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                            <Lock className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{roleLabel} Security</p>
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Change Password</h1>
                            <p className="text-gray-500 dark:text-slate-400 mt-1">Keep your account safe with a strong, unique password.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(backRoute)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-all hover:shadow-sm w-full md:w-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {backRoute === ROUTES.PROFILE ? 'Profile' : 'Dashboard'}
                    </button>
                </div>

                <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6 xl:gap-8">
                    {/* Main Form Form */}
                    <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 sm:p-8 space-y-8">

                            {/* Alerts */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-700 dark:text-green-300">Password changed successfully! Redirecting securely...</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-6">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                placeholder="Enter your current password"
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none sm:text-sm"
                                                {...register('currentPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.currentPassword && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.currentPassword.message}</p>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px w-full bg-gray-100 dark:bg-slate-700/50"></div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="Enter your new password"
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none sm:text-sm"
                                                {...register('newPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Strength Bar */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden flex">
                                                <div className={`h-full transition-all duration-500 ease-out ${passwordStrength.bar}`} style={{ width: `${passwordStrength.score}%` }}></div>
                                            </div>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${passwordStrength.badge} transition-colors duration-300`}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>

                                        {errors.newPassword && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.newPassword.message}</p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm your new password"
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none sm:text-sm"
                                                {...register('confirmPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password Requirements Checklist */}
                                <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Password must contain:</p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {passwordRequirements.map((item) => (
                                            <div
                                                key={item.label}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${item.met
                                                        ? 'bg-green-50/50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-50/50 dark:bg-slate-900/30 border-gray-100 dark:border-slate-700/50 text-gray-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                {item.met ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-dashed border-gray-300 dark:border-slate-600 shrink-0" />
                                                )}
                                                <span className="text-xs font-medium">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            reset();
                                            navigate(backRoute);
                                        }}
                                        className="w-full sm:w-1/2 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || passwordStrength.score < 80}
                                        className="w-full sm:w-1/2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 text-sm"
                                    >
                                        {isSubmitting ? 'Updating Securely...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                                        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security Tips</h2>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Keep your account safe</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                                        <KeyRound className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed">Use a unique password you haven't used on other websites or accounts.</p>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                                        <Lock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed">Avoid using personal information like birthdays or names in your password.</p>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed">Always sign out when using a public or shared computer device.</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 p-4">
                                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed text-center">
                                        If you suspect your account has been compromised, please contact support immediately.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};