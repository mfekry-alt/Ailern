import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useRegister } from '@/features/auth/api';
import { authService } from '@/api/services';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { useState, useMemo } from 'react';
import { Eye, EyeOff, GraduationCap, BookOpenCheck, CheckCircle2, ArrowLeft, MailCheck } from 'lucide-react';

type UserType = 'student' | 'instructor';

const JOB_TITLES = ['Professor', 'Teacher', 'Teaching Assistant', 'Lecturer', 'Other'] as const;

const baseSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const instructorSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    jobTitle: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type StudentFormData = z.infer<typeof baseSchema>;
type InstructorFormData = z.infer<typeof instructorSchema>;

function PasswordStrength({ password }: { password: string }) {
    const strength = useMemo(() => {
        if (!password) return { level: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
        if (score <= 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
        return { level: 4, label: 'Strong', color: 'bg-green-500' };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-zinc-700'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength.level <= 1 ? 'text-red-500' :
                strength.level === 2 ? 'text-amber-500' :
                    strength.level === 3 ? 'text-blue-500' : 'text-green-500'
                }`}>
                {strength.label}
            </p>
        </div>
    );
}

export const SignupPage = () => {
    const registerMutation = useRegister();
    const [userType, setUserType] = useState<UserType>('student');
    const [error, setError] = useState('');
    /** Set in one update with email so resend always has the address */
    const [completedSignup, setCompletedSignup] = useState<{ email: string } | null>(null);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const studentForm = useForm<StudentFormData>({
        resolver: zodResolver(baseSchema),
        mode: 'onChange',
    });

    const instructorForm = useForm<InstructorFormData>({
        resolver: zodResolver(instructorSchema),
        mode: 'onChange',
    });

    const form = (userType === 'student' ? studentForm : instructorForm) as typeof instructorForm;
    const isPending = registerMutation.isPending;

    const watchedPassword = (form.watch() as unknown as { password: string }).password || '';

    const onSubmit = async (data: StudentFormData | InstructorFormData) => {
        setError('');
        try {
            const payload: Omit<import('@/types/api.types').RegisterUserCommand, 'userName'> = {
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                role: userType === 'student' ? 'Student' : 'Instructor',
            };
            if (userType === 'instructor' && 'jobTitle' in data && data.jobTitle) {
                payload.jobTitle = data.jobTitle as import('@/types/api.types').InstructorJobTitle;
            }
            await registerMutation.mutateAsync(payload);
            setCompletedSignup({ email: data.email });
        } catch (err: any) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.join(', ')
                || 'Registration failed. Please try again.';
            setError(msg);
        }
    };

    if (completedSignup) {
        const { email } = completedSignup;
        return (
            <div className="w-full max-w-[450px] mx-auto animate-fade-in">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30 border border-white/60 dark:border-zinc-700/50 text-center animate-scale-up">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created!</h2>
                    <p className="text-slate-500 dark:text-zinc-400 mb-1">
                        We&apos;ve sent a verification link to your email address.
                    </p>
                    <p className="text-sm text-slate-400 dark:text-zinc-500">
                        Please check your inbox and click the link to activate your account.
                    </p>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-4 break-all">
                        Sent to: <span className="font-semibold">{email}</span>
                    </p>

                    <Link
                        to={ROUTES.LOGIN}
                        className="inline-block mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 transition-all duration-300"
                    >
                        Go to Sign In
                    </Link>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-700">
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3">
                            Didn&apos;t receive the email?
                        </p>
                        {resendSuccess ? (
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                                <MailCheck className="w-4 h-4 shrink-0" />
                                Another confirmation email has been sent.
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={resending}
                                onClick={async () => {
                                    setResendError('');
                                    setResending(true);
                                    try {
                                        await authService.resendConfirmationEmail({ email });
                                        setResendSuccess(true);
                                    } catch {
                                        setResendError('Could not resend the email. Please try again in a moment.');
                                    } finally {
                                        setResending(false);
                                    }
                                }}
                                className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 dark:border-zinc-600 text-[#0F5A9C] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-60 cursor-pointer transition-colors"
                            >
                                {resending ? 'Sending…' : 'Resend confirmation email'}
                            </button>
                        )}
                        {resendError && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">{resendError}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const inputClass =
        'w-full px-4 py-3.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F5A9C]/20 focus:border-[#0F5A9C] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all';

    const errorClass = 'text-xs text-red-500 mt-1 font-medium';

    return (
        <div className="w-full max-w-[450px] mx-auto animate-fade-in">
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
                <div className="text-center mb-7">
                    <Link to={ROUTES.HOME} className="inline-flex items-center justify-center gap-3 mb-5 group">
                        <img
                            src="/logo-removebg.png"
                            alt={`${APP_NAME} logo`}
                            className="w-30 h-30 object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Create Your Account
                    </h1>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 mb-7">
                    {([
                        { key: 'student' as const, label: 'Student', icon: GraduationCap },
                        { key: 'instructor' as const, label: 'Instructor', icon: BookOpenCheck },
                    ]).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => { setUserType(key); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${userType === key
                                ? 'bg-white dark:bg-zinc-700 text-[#0F5A9C] dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 animate-[shake_0.4s_ease-in-out] flex items-center justify-center gap-2.5">
                        <svg className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className={inputClass}
                            {...form.register('fullName')}
                        />
                        {form.formState.errors.fullName && (
                            <p className={errorClass}>{form.formState.errors.fullName.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder={userType === 'instructor' ? 'name@university.edu' : 'you@example.com'}
                            className={inputClass}
                            {...form.register('email')}
                        />
                        {form.formState.errors.email && (
                            <p className={errorClass}>{form.formState.errors.email.message}</p>
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
                                placeholder="Min. 8 characters"
                                className={`${inputClass} pr-11`}
                                {...form.register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                        {form.formState.errors.password && (
                            <p className={errorClass}>{form.formState.errors.password.message}</p>
                        )}
                        <div className="mt-2">
                            <PasswordStrength password={watchedPassword || ''} />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                className={`${inputClass} pr-11`}
                                {...form.register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                        {form.formState.errors.confirmPassword && (
                            <p className={errorClass}>{form.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Job Title (instructor only) */}
                    {userType === 'instructor' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                                Job Title
                            </label>
                            <select
                                className={inputClass}
                                {...(form as ReturnType<typeof useForm<InstructorFormData>>).register('jobTitle')}
                                defaultValue=""
                            >
                                <option value="" disabled>Select your role</option>
                                {JOB_TITLES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {(form.formState.errors as any).jobTitle && (
                                <p className={errorClass}>{(form.formState.errors as any).jobTitle.message}</p>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending || !form.formState.isValid}
                        className="w-full py-3.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 active:scale-[0.98]"
                    >
                        {isPending
                            ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            )
                            : `Sign Up as ${userType === 'student' ? 'Student' : 'Instructor'}`
                        }
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-6">
                    Already have an account?{' '}
                    <Link
                        to={ROUTES.LOGIN}
                        className="font-semibold text-[#0F5A9C] hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};