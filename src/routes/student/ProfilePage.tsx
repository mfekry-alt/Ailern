import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
// Adjusted import path to match your UI folder
import { Card, CardContent } from '@/components/ui/Card';
import { Edit, Save, X, LogOut, Lock, Image as ImageIcon } from 'lucide-react';

export const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const logout = useLogout();

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingAcademic, setIsEditingAcademic] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Form state for personal information
    const [personalForm, setPersonalForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        address: '',
        studentId: '',
        phoneNumber: ''
    });

    // Form state for academic information
    const [academicForm, setAcademicForm] = useState({
        program: '',
        expectedGraduationYear: '',
        enrollmentDate: ''
    });

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await logout.mutateAsync();
            navigate(ROUTES.LOGIN);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Handle personal form changes
    const handlePersonalChange = (field: string, value: string) => {
        setPersonalForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle academic form changes
    const handleAcademicChange = (field: string, value: string) => {
        setAcademicForm(prev => ({ ...prev, [field]: value }));
    };

    // Save personal information
    const savePersonalInfo = () => {
        setIsEditingPersonal(false);
        setStatusMessage('Personal information saved.');
    };

    // Save academic information
    const saveAcademicInfo = () => {
        setIsEditingAcademic(false);
        setStatusMessage('Academic information saved.');
    };

    // Cancel editing
    const cancelPersonalEdit = () => {
        setIsEditingPersonal(false);
        setStatusMessage('');
        setPersonalForm({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            address: '',
            studentId: '',
            phoneNumber: ''
        });
    };

    const cancelAcademicEdit = () => {
        setIsEditingAcademic(false);
        setStatusMessage('');
        setAcademicForm({
            program: '',
            expectedGraduationYear: '',
            enrollmentDate: ''
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100 min-h-screen transition-colors duration-300">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg border border-blue-200 overflow-hidden shrink-0">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-7 h-7" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                                Profile
                            </h1>
                            <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400">
                                Manage your personal and academic information.
                            </p>
                        </div>
                    </div>
                    {/* Sign Out Button */}
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                {statusMessage && (
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-[14px] text-green-800 dark:text-green-200">
                        {statusMessage}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Personal Information */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">
                                    Personal Information
                                </h2>
                                <div className="flex gap-2">
                                    {isEditingPersonal ? (
                                        <>
                                            <button
                                                onClick={savePersonalInfo}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelPersonalEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingPersonal(true)}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            First Name
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                id="firstName"
                                                type="text"
                                                value={personalForm.firstName}
                                                onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {personalForm.firstName || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Last Name
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                id="lastName"
                                                type="text"
                                                value={personalForm.lastName}
                                                onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {personalForm.lastName || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Email
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                id="email"
                                                type="email"
                                                value={personalForm.email}
                                                onChange={(e) => handlePersonalChange('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {personalForm.email || '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="address" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Address
                                        </label>
                                        {isEditingPersonal ? (
                                            <textarea
                                                id="address"
                                                value={personalForm.address}
                                                onChange={(e) => handlePersonalChange('address', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {personalForm.address || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Student ID
                                        </div>
                                        <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                            {personalForm.studentId || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Phone Number
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                id="phoneNumber"
                                                type="tel"
                                                value={personalForm.phoneNumber}
                                                onChange={(e) => handlePersonalChange('phoneNumber', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {personalForm.phoneNumber || '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">
                                    Academic Information
                                </h2>
                                <div className="flex gap-2">
                                    {isEditingAcademic ? (
                                        <>
                                            <button
                                                onClick={saveAcademicInfo}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelAcademicEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingAcademic(true)}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="program" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Program
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                id="program"
                                                type="text"
                                                value={academicForm.program}
                                                onChange={(e) => handleAcademicChange('program', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {academicForm.program || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="expectedGraduationYear" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Expected Graduation Year
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                id="expectedGraduationYear"
                                                type="text"
                                                value={academicForm.expectedGraduationYear}
                                                onChange={(e) => handleAcademicChange('expectedGraduationYear', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {academicForm.expectedGraduationYear || '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="enrollmentDate" className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Enrollment Date
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                id="enrollmentDate"
                                                type="date"
                                                value={academicForm.enrollmentDate}
                                                onChange={(e) => handleAcademicChange('enrollmentDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900 dark:text-zinc-100">
                                                {academicForm.enrollmentDate || '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-6">
                                Security
                            </h2>

                            <div className="space-y-4">
                                <Link
                                    to={ROUTES.CHANGE_PASSWORD}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-medium text-gray-900 dark:text-zinc-100">Change Password</h3>
                                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Update your password to keep your account secure</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-6">
                                Preferences
                            </h2>

                            <div className="space-y-6">
                                {/* Email Notifications */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[16px] font-medium text-gray-900 dark:text-zinc-100 mb-1">
                                            Email Notifications
                                        </h3>
                                        <p className="text-[14px] text-gray-600 dark:text-zinc-400">
                                            Receive updates and reminders via email.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                                            }`}
                                        aria-label="Toggle Email Notifications"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
};