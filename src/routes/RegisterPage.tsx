import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';

const registerSchema = z
    .object({
        userType: z.enum(['student', 'instructor', 'admin']),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
        studentId: z
            .union([z.string().min(1, 'Student ID is required'), z.literal('')])
            .optional(),
        phoneNumber: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
    .refine((data) => (data.userType === 'student' ? Boolean(data.studentId) : true), {
        message: 'Student ID is required',
        path: ['studentId'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const registerMutation = useRegister();
    const [error, setError] = useState<string>('');

    const {
        register,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            userType: 'student',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            studentId: '',
            phoneNumber: '',
        },
    });

    const userType = watch('userType');

    const onSubmit = async (data: RegisterFormData) => {
        setError('');
        try {
            await registerMutation.mutateAsync(data);
            navigate(ROUTES.DASHBOARD, { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-8 py-12 bg-gray-50 dark:bg-zinc-950"
        >
            <div className="w-full max-w-[448px]">
                <div
                    className="bg-white dark:bg-zinc-900 rounded-xl px-8 pt-8 pb-12 shadow-figma dark:shadow-lg dark:border dark:border-zinc-800"
                >
                    <div className="text-center mb-8">
                        <h1
                            className="font-bold text-[30px] leading-[37.5px] tracking-[-0.75px] text-gray-900 dark:text-zinc-100"
                        >
                            Create Account
                        </h1>
                    </div>

                    {error && (
                        <div
                            className="mb-6 p-4 rounded-md border bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        >
                            <p className="text-sm text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <select
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('userType')}
                            >
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="admin">Admin</option>
                            </select>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        placeholder="First name"
                                        className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                        {...register('firstName')}
                                    />
                                    {errors.firstName && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.firstName.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <input
                                        placeholder="Last name"
                                        className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                        {...register('lastName')}
                                    />
                                    {errors.lastName && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.lastName.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.email.message}
                                </p>
                            )}

                            {userType === 'student' && (
                                <>
                                    <input
                                        placeholder="Student ID"
                                        className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                        {...register('studentId')}
                                    />
                                    {errors.studentId && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.studentId.message}
                                        </p>
                                    )}
                                </>
                            )}

                            <input
                                placeholder="Phone number (optional)"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('phoneNumber')}
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.password.message}
                                </p>
                            )}

                            <input
                                type="password"
                                placeholder="Confirm password"
                                className="w-full px-[13px] py-[15px] text-[14px] bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-500 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all"
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="w-full text-white font-semibold text-[14px] leading-5 py-[13px] px-[17px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#0d7ff2' }}
                        >
                            {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                        </button>

                        <div className="text-center">
                            <Link
                                to={ROUTES.LOGIN}
                                className="text-[14px] leading-5 font-medium transition-colors"
                                style={{ color: '#0d7ff2' }}
                            >
                                Already have an account? Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
