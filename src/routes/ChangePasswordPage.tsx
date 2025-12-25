import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ROUTES, ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

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
            return { label: 'Strong', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500', score };
        }
        if (score >= 50) {
            return { label: 'Medium', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', score };
        }
        return { label: 'Weak', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500', score };
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
            // Basic field presence check to use form data and satisfy TS noUnusedLocals
            if (!data.currentPassword || !data.newPassword) {
                throw new Error('Please fill in all required fields');
            }
            // TODO: Replace with actual API call
            // await changePassword.mutateAsync({
            //     currentPassword: data.currentPassword,
            //     newPassword: data.newPassword,
            // });

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setSuccess(true);
            reset();
            setTimeout(() => {
                navigate(ROUTES.PROFILE);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Security • {roleLabel} account</p>
                            <h1 className="text-[30px] font-bold text-gray-900 leading-tight">Change Password</h1>
                            <p className="text-[16px] text-gray-600">Keep your account safe with a strong, unique password.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(backRoute)}
                        className="inline-flex items-center justify-center px-4 py-3 text-[14px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        Back to {backRoute === ROUTES.PROFILE ? 'profile' : 'dashboard'}
                    </button>
                </div>

                <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
                    <Card variant="elevated">
                        <CardContent className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">Password changed successfully! Redirecting to profile...</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-gray-900">Credentials</p>
                                    <p className="text-sm text-gray-600">Enter your current password, then choose a strong new one.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                placeholder="Enter your current password"
                                                className="w-full px-[13px] py-[15px] text-[14px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all pr-10"
                                                {...register('currentPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.currentPassword && (
                                            <p className="text-sm text-red-600 mt-1">{errors.currentPassword.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="Enter your new password (min. 8 characters)"
                                                className="w-full px-[13px] py-[15px] text-[14px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all pr-10"
                                                {...register('newPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${passwordStrength.badge}`}>
                                                {passwordStrength.label}
                                            </span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${passwordStrength.bar}`} style={{ width: `${passwordStrength.score}%` }}></div>
                                            </div>
                                        </div>
                                        {errors.newPassword && (
                                            <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm your new password"
                                                className="w-full px-[13px] py-[15px] text-[14px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all pr-10"
                                                {...register('confirmPassword')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-gray-900">Password requirements</p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {passwordRequirements.map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-gray-50"
                                            >
                                                {item.met ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span className="text-sm text-gray-700">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(ROUTES.PROFILE)}
                                        className="w-full sm:w-1/2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full sm:w-1/2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Changing Password...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card variant="bordered">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Security tips</p>
                                    <p className="text-sm text-gray-600">These reminders keep your account safe.</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-start gap-2">
                                    <KeyRound className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <p>Use a unique password you have not used on other accounts.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5" />
                                    <p>Turn on MFA in your profile settings for extra protection.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                    <p>Sign out on shared devices after updating your password.</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                                If you did not request this change, please contact support immediately.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

