import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkEmailConfirmationStatus } from '@/api/services/auth.service';
import { Card, CardContent } from '@/components/ui';
import { ROUTES, ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useChangeEmail, useLogout } from '@/features/auth/api';
import { Mail, ShieldCheck, CheckCircle, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const changeEmailSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newEmail: z.string().email('Please enter a valid email address'),
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export const ChangeEmailPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const changeEmail = useChangeEmail();
    const logoutMutation = useLogout();
    type FlowState = 'idle' | 'waiting' | 'success';
    const [flowState, setFlowState] = useState<FlowState>('idle');
    const [error, setError] = useState<string>('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ChangeEmailFormData>({
        resolver: zodResolver(changeEmailSchema),
    });

    const primaryRole = user?.roles?.[0];
    const roleLabel = primaryRole === ROLES.ADMIN ? 'Admin' : primaryRole === ROLES.INSTRUCTOR ? 'Instructor' : 'Student';
    const backRoute = primaryRole === ROLES.ADMIN ? ROUTES.ADMIN : primaryRole === ROLES.INSTRUCTOR ? ROUTES.INSTRUCTOR : ROUTES.PROFILE;

    const onSubmit = async (data: ChangeEmailFormData) => {
        setError('');

        try {
            await changeEmail.mutateAsync({
                currentPassword: data.currentPassword,
                newEmail: data.newEmail,
            });
            setFlowState('waiting');
            reset();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change email. Please try again.');
        }
    };


    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'emailConfirmed' && e.newValue === 'true') {
                localStorage.removeItem('emailConfirmed');
                setFlowState('success');
                setTimeout(() => {
                    logoutMutation.mutate();
                }, 2500);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [logoutMutation]);

    useEffect(() => {
        if (flowState !== 'waiting') return;

        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const response = await checkEmailConfirmationStatus();
                if (response.isConfirmed) {
                    setFlowState('success');
                    clearInterval(intervalId);
                    setTimeout(() => {
                        logoutMutation.mutate();
                    }, 2500);
                }
            } catch (err) {
                // Ignore silent polling errors to prevent spamming UI with alerts
                console.error('Polling error', err);
            }
        };

        intervalId = setInterval(checkStatus, 3500);

        return () => clearInterval(intervalId);
    }, [flowState, logoutMutation]);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-gray-200/70 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-wider">
                                    {roleLabel} Account
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Change Email</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Update your primary email address.</p>
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

                            {flowState === 'idle' && error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed">{error}</p>
                                </div>
                            )}

                            {flowState === 'waiting' && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                                        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        Waiting for confirmation...
                                    </h3>
                                    <p className="text-gray-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                        Please confirm your new email from the link sent to your inbox. We are securely monitoring your confirmation status.
                                    </p>
                                </div>
                            )}


                            {flowState === 'success' && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        Email Confirmed Successfully!
                                    </h3>
                                    <p className="text-gray-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                        Your email has been successfully updated. Redirecting you to sign in securely...
                                    </p>
                                </div>
                            )}

                            {flowState === 'idle' && (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                {/* Current Email (readonly context) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Current Email</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            disabled
                                            value={user?.email || ''}
                                            className="w-full px-4 py-3.5 text-sm bg-gray-100 dark:bg-zinc-800/80 border border-transparent rounded-xl focus:outline-none text-gray-500 dark:text-zinc-400 transition-all opacity-80 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <hr className="border-gray-100 dark:border-zinc-800/80" />

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

                                {/* New Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">New Email Address</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            placeholder="Enter your new email address"
                                            className="w-full px-4 py-3.5 text-sm bg-gray-50 focus:bg-white dark:bg-zinc-900/50 dark:focus:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-zinc-100 transition-all pr-12"
                                            {...register('newEmail')}
                                        />
                                    </div>
                                    {errors.newEmail && (
                                        <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> {errors.newEmail.message}
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
                                        disabled={changeEmail.isPending}
                                        className="w-full sm:w-[60%] px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {changeEmail.isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Updating Email...
                                            </>
                                        ) : (
                                            'Update Email'
                                        )}
                                    </button>
                                </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- Sidebar Area --- */}
                    <div className="space-y-6">
                        {/* Security Tips Card */}
                        <Card className="border-transparent bg-blue-50/50 dark:bg-blue-500/5 rounded-[1.5rem] overflow-hidden">
                            <CardContent className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-blue-100 dark:border-blue-900/30 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Email Updates</h3>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">Important notices.</p>
                                    </div>
                                </div>
                                <ul className="space-y-3.5 text-sm text-gray-700 dark:text-zinc-300 font-medium">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        Make sure you have access to your new email account.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        Important notifications will be sent to the new email address immediately after the update.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        You may need to log in again after changing your email.
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
