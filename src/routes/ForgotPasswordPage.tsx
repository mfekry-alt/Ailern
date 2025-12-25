import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/api';
import { Button, Input, Card } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
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

    if (success) {
        return (
            <Card variant="elevated" padding="lg">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary-900 mb-2">Check your email</h1>
                    <p className="text-secondary-600 mb-6">
                        If an account exists with this email, a reset link has been sent. Follow the instructions in that email to
                        set a new password and then log in to your dashboard.
                    </p>
                    <Link to={ROUTES.LOGIN}>
                        <Button fullWidth>Back to Login</Button>
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <Card variant="elevated" padding="lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">Forgot Password</h1>
                <p className="text-secondary-600">
                    Enter your email to receive a reset link.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-sm text-danger-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    className="w-full px-[13px] py-[11px] text-[15px] bg-white border border-[#dbe0e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d7ff2]/10 focus:border-[#0d7ff2] text-[#6b7280] transition-all"
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <Button type="submit" className="w-full hover:scale-100 text-white font-semibold text-[14px] leading-5 py-[13px] px-[17px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#0d7ff2' }} fullWidth isLoading={forgotPassword.isPending}>
                    Send Reset Link
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-secondary-600">
                Remember your password?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                </Link>
            </p>
        </Card>
    );
};

