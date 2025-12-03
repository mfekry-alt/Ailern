import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/features/auth/api';
import { Button, Input, Card } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';

const registerSchema = z
    .object({
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const register = useRegister();
    const [error, setError] = useState<string>('');

    const {
        register: registerField,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setError('');
        try {
            await register.mutateAsync(data);
            navigate(ROUTES.DASHBOARD, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <Card variant="elevated" padding="lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h1>
                <p className="text-secondary-600">Sign up to start your learning journey</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-sm text-danger-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        placeholder="John"
                        error={errors.firstName?.message}
                        {...registerField('firstName')}
                    />
                    <Input
                        label="Last Name"
                        placeholder="Doe"
                        error={errors.lastName?.message}
                        {...registerField('lastName')}
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...registerField('email')}
                />

                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...registerField('password')}
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    {...registerField('confirmPassword')}
                />

                <Button type="submit" fullWidth isLoading={register.isPending}>
                    Create Account
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-secondary-600">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                </Link>
            </p>
        </Card>
    );
};

