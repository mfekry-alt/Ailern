import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/features/auth/api';
import { Button, Input, Card } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';

const setPasswordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export const SetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const navigate = useNavigate();
    const resetPassword = useResetPassword();
    const [error, setError] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SetPasswordFormData>({
        resolver: zodResolver(setPasswordSchema),
    });

    const onSubmit = async (data: SetPasswordFormData) => {
        setError('');
        try {
            await resetPassword.mutateAsync({ token, password: data.password, email });
            navigate(ROUTES.LOGIN, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to set password. Please try again.');
        }
    };

    return (
        <Card variant="elevated" padding="lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-zinc-100 mb-2">Set Password</h1>
                <p className="text-secondary-600 dark:text-zinc-400">Create a new password to complete setup.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-50 dark:bg-red-900/20 border border-danger-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-danger-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    className="w-full px-[13px] py-[11px] text-[15px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 transition-all"
                    label="New Password"
                    type="password"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <Input
                    className="w-full px-[13px] py-[11px] text-[15px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 transition-all"
                    label="Confirm Password"
                    type="password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <Button type="submit" className="w-full hover:scale-100 text-white font-semibold text-[14px] leading-5 py-[13px] px-[17px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#0d7ff2' }} isLoading={resetPassword.isPending} disabled={!token}>
                    Save & Continue
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-secondary-600 dark:text-zinc-400">
                Back to{' '}
                <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
                    Login
                </Link>
            </p>
        </Card>
    );
};
