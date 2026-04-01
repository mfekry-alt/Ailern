import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ROUTES, ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useChangePassword } from '@/features/auth/api';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

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
    const changePassword = useChangePassword();
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            return { label: 'Strong', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', bar: 'bg-emerald-500', score };
        }
        if (score >= 50) {
            return { label: 'Medium', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', bar: 'bg-amber-500', score };
        }
        return { label: 'Weak', badge: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', bar: 'bg-red-500', score };
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

        try {
            await changePassword.mutateAsync({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setSuccess(true);
            reset();
            setTimeout(() => {
                navigate(ROUTES.PROFILE);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-gray-200/70 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-wider">
                                    {roleLabel} Account
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Change Password</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Keep your account secure with a strong password.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(backRoute)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {backRoute === ROUTES.PROFILE ? 'Profile' : 'Dashboard'}
                    </button>
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid lg:grid-cols-[1.8fr_1fr] gap-6 sm:gap-8">

                    {/* --- Form Card --- */}
                    <Card className="border-gray-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#0c0c0e] rounded-[1.5rem] overflow-hidden">
                        <CardContent className="p-6 sm:p-8 space-y-8">

                            {/* Alerts */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                        Password changed successfully! Redirecting you safely...
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Current Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="Enter your current password"
                                            className="w-full px-4 py-3.5 text-sm bg-gray-50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-zinc-100 transition-all pr-12"
                                            {...register('currentPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.currentPassword && (
                                        <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> {errors.currentPassword.message}
                                        </p>
                                    )}
                                </div>

                                <hr className="border-gray-100 dark:border-zinc-800/80" />

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">New Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            className="w-full px-4 py-3.5 text-sm bg-gray-50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-zinc-100 transition-all pr-12"
                                            {...register('newPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Strength Indicator */}
                                    {newPasswordValue.length > 0 && (
                                        <div className="mt-4 space-y-2 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-gray-500 dark:text-zinc-400">Password strength</span>
                                                <span className={`px-2 py-0.5 rounded-full border ${passwordStrength.badge}`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${passwordStrength.bar} transition-all duration-500 ease-out rounded-full`} style={{ width: `${passwordStrength.score}%` }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {errors.newPassword && (
                                        <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> {errors.newPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Confirm New Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Type your new password again"
                                            className="w-full px-4 py-3.5 text-sm bg-gray-50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-zinc-100 transition-all pr-12"
                                            {...register('confirmPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(ROUTES.PROFILE)}
                                        className="w-full sm:w-[40%] px-4 py-3.5 bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={changePassword.isPending}
                                        className="w-full sm:w-[60%] px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {changePassword.isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Updating Security...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* --- Sidebar Area --- */}
                    <div className="space-y-6">
                        {/* Requirements Card */}
                        <Card className="border-gray-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#0c0c0e] rounded-[1.5rem] overflow-hidden">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Password Requirements
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {passwordRequirements.map((item) => (
                                        <div
                                            key={item.label}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 border ${item.met
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700/50 text-gray-600 dark:text-zinc-400'
                                                }`}
                                        >
                                            {item.met ? (
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-300 dark:border-zinc-600 shrink-0" />
                                            )}
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Tips Card */}
                        <Card className="border-transparent bg-blue-50/50 dark:bg-blue-500/5 rounded-[1.5rem] overflow-hidden">
                            <CardContent className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-blue-100 dark:border-blue-900/30 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Security Tips</h3>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">Best practices for safety.</p>
                                    </div>
                                </div>
                                <ul className="space-y-3.5 text-sm text-gray-700 dark:text-zinc-300 font-medium">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        Use a unique password that you don't use on any other websites.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        Consider turning on Multi-Factor Authentication (MFA).
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        Sign out of shared or public devices after changing your password.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};