import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui';
import { Edit, Save, X, LogOut, Lock, Image as ImageIcon } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

export const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const logout = useLogout();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingAcademic, setIsEditingAcademic] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Form state for personal information
    const [personalForm, setPersonalForm] = useState({
        firstName: user?.firstName || 'Alex',
        lastName: user?.lastName || 'Doe',
        email: user?.email || 'alex.doe@university.edu',
        address: '123 University Ave, Learnington, USA 12345',
        studentId: 'S12345678',
        phoneNumber: '+1 (555) 123-4567'
    });

    // Form state for academic information
    const [academicForm, setAcademicForm] = useState({
        program: 'Bachelor of Science in Computer Science',
        expectedGraduationYear: 'May 2025',
        enrollmentDate: 'August 20, 2021'
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
        // Reset form to original values
        setPersonalForm({
            firstName: user?.firstName || 'Alex',
            lastName: user?.lastName || 'Doe',
            email: user?.email || 'alex.doe@university.edu',
            address: '123 University Ave, Learnington, USA 12345',
            studentId: 'S12345678',
            phoneNumber: '+1 (555) 123-4567'
        });
    };

    const cancelAcademicEdit = () => {
        setIsEditingAcademic(false);
        setStatusMessage('');
        // Reset form to original values
        setAcademicForm({
            program: 'Bachelor of Science in Computer Science',
            expectedGraduationYear: 'May 2025',
            enrollmentDate: 'August 20, 2021'
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg border border-blue-200 overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-7 h-7" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                                Profile
                            </h1>
                            <p className="text-[16px] leading-[24px] text-gray-600">
                                Manage your personal and academic information.
                            </p>
                        </div>
                    </div>
                    {/* Sign Out Button */}
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                {statusMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                        {statusMessage}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Personal Information */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[24px] font-bold text-gray-900">
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
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                type="text"
                                                value={personalForm.firstName}
                                                onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {personalForm.firstName}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                type="text"
                                                value={personalForm.lastName}
                                                onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {personalForm.lastName}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                type="email"
                                                value={personalForm.email}
                                                onChange={(e) => handlePersonalChange('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {personalForm.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        {isEditingPersonal ? (
                                            <textarea
                                                value={personalForm.address}
                                                onChange={(e) => handlePersonalChange('address', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {personalForm.address}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Student ID
                                        </label>
                                        <p className="text-[16px] text-gray-900">
                                            {personalForm.studentId}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        {isEditingPersonal ? (
                                            <input
                                                type="tel"
                                                value={personalForm.phoneNumber}
                                                onChange={(e) => handlePersonalChange('phoneNumber', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {personalForm.phoneNumber}
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
                                <h2 className="text-[24px] font-bold text-gray-900">
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
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Program
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                type="text"
                                                value={academicForm.program}
                                                onChange={(e) => handleAcademicChange('program', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {academicForm.program}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Expected Graduation Year
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                type="text"
                                                value={academicForm.expectedGraduationYear}
                                                onChange={(e) => handleAcademicChange('expectedGraduationYear', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {academicForm.expectedGraduationYear}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Enrollment Date
                                        </label>
                                        {isEditingAcademic ? (
                                            <input
                                                type="date"
                                                value={academicForm.enrollmentDate}
                                                onChange={(e) => handleAcademicChange('enrollmentDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-[16px] text-gray-900">
                                                {academicForm.enrollmentDate}
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
                            <h2 className="text-[24px] font-bold text-gray-900 mb-6">
                                Security
                            </h2>

                            <div className="space-y-4">
                                <Link
                                    to={ROUTES.CHANGE_PASSWORD}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-medium text-gray-900">Change Password</h3>
                                            <p className="text-[14px] text-gray-600">Update your password to keep your account secure</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
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
                            <h2 className="text-[24px] font-bold text-gray-900 mb-6">
                                Preferences
                            </h2>

                            <div className="space-y-6">
                                {/* Dark Mode */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[16px] font-medium text-gray-900 mb-1">
                                            Dark Mode
                                        </h3>
                                        <p className="text-[14px] text-gray-600">
                                            Switch between light and dark theme.
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Email Notifications */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[16px] font-medium text-gray-900 mb-1">
                                            Email Notifications
                                        </h3>
                                        <p className="text-[14px] text-gray-600">
                                            Receive updates and reminders via email.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
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

