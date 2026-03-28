import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui';
import { Edit, Save, X, LogOut, Lock, Image as ImageIcon, User, GraduationCap, Mail, Phone, MapPin, BadgeInfo, Bell } from 'lucide-react';

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

    const handlePersonalChange = (field: string, value: string) => {
        setPersonalForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAcademicChange = (field: string, value: string) => {
        setAcademicForm(prev => ({ ...prev, [field]: value }));
    };

    const savePersonalInfo = () => {
        setIsEditingPersonal(false);
        showStatus('Personal information successfully updated ✨');
    };

    const saveAcademicInfo = () => {
        setIsEditingAcademic(false);
        showStatus('Academic records successfully updated ✨');
    };

    const showStatus = (msg: string) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 4000);
    };

    const cancelPersonalEdit = () => {
        setIsEditingPersonal(false);
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
        setAcademicForm({
            program: '',
            expectedGraduationYear: '',
            enrollmentDate: ''
        });
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Status Toast */}
                {statusMessage && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
                        <div className="rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-md px-6 py-3 text-sm font-medium text-green-600 dark:text-green-400 shadow-xl flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            {statusMessage}
                        </div>
                    </div>
                )}

                {/* Profile Hero Header */}
                <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    {/* Cover Gradient */}
                    <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    </div>

                    <div className="px-6 sm:px-10 pb-8 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 relative z-10 w-full sm:w-auto text-center sm:text-left">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-xl ring-1 ring-black/5 dark:ring-white/10 shrink-0 transform transition-transform hover:scale-105">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-gray-100 dark:border-slate-700">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 opacity-80" />
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="space-y-1 mb-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                    {personalForm.firstName} {personalForm.lastName || 'Student'}
                                </h1>
                                <p className="text-gray-500 dark:text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-2">
                                    <BadgeInfo className="w-4 h-4" />
                                    Computer Science Student
                                </p>
                            </div>
                        </div>

                        {/* Sign Out Action */}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl font-semibold transition-all hover:shadow-md shrink-0 w-full sm:w-auto justify-center"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Left Column (Forms) */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Personal Information */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Info</h2>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Update your contact details.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {isEditingPersonal ? (
                                            <>
                                                <button onClick={cancelPersonalEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
                                                    <X className="w-4 h-4" /> Cancel
                                                </button>
                                                <button onClick={savePersonalInfo} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5 font-medium text-sm">
                                                    <Save className="w-4 h-4" /> Save
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditingPersonal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
                                                <Edit className="w-4 h-4" /> Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'firstName', label: 'First Name', type: 'text', icon: User },
                                        { id: 'lastName', label: 'Last Name', type: 'text', icon: User },
                                        { id: 'email', label: 'Email Address', type: 'email', icon: Mail },
                                        { id: 'phoneNumber', label: 'Phone Number', type: 'tel', icon: Phone },
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                {field.label}
                                            </label>
                                            {isEditingPersonal ? (
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <field.icon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                                                    </div>
                                                    <input
                                                        id={field.id}
                                                        type={field.type}
                                                        value={(personalForm as any)[field.id]}
                                                        onChange={(e) => handlePersonalChange(field.id, e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none sm:text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-slate-200 sm:text-sm min-h-[44px] flex items-center gap-3">
                                                    <field.icon className="h-4 w-4 text-gray-400 dark:text-slate-500 shrink-0" />
                                                    <span className="truncate">{(personalForm as any)[field.id] || <span className="text-gray-400 dark:text-slate-500 italic">Not specified</span>}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="md:col-span-2 space-y-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Home Address
                                        </label>
                                        {isEditingPersonal ? (
                                            <div className="relative">
                                                <div className="absolute top-3 left-3 pointer-events-none">
                                                    <MapPin className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                                                </div>
                                                <textarea
                                                    id="address"
                                                    value={personalForm.address}
                                                    onChange={(e) => handlePersonalChange('address', e.target.value)}
                                                    rows={3}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none sm:text-sm resize-none custom-scrollbar"
                                                />
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-slate-200 sm:text-sm min-h-[80px] flex items-start gap-3">
                                                <MapPin className="h-4 w-4 text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
                                                <span>{personalForm.address || <span className="text-gray-400 dark:text-slate-500 italic">No address provided</span>}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Academic Information */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Academic Status</h2>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Manage your university details.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {isEditingAcademic ? (
                                            <>
                                                <button onClick={cancelAcademicEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
                                                    <X className="w-4 h-4" /> Cancel
                                                </button>
                                                <button onClick={saveAcademicInfo} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 font-medium text-sm">
                                                    <Save className="w-4 h-4" /> Save
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditingAcademic(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
                                                <Edit className="w-4 h-4" /> Edit Status
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'program', label: 'Degree Program', type: 'text' },
                                        { id: 'expectedGraduationYear', label: 'Expected Graduation', type: 'text' },
                                        { id: 'enrollmentDate', label: 'Enrollment Date', type: 'date' },
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                {field.label}
                                            </label>
                                            {isEditingAcademic ? (
                                                <input
                                                    id={field.id}
                                                    type={field.type}
                                                    value={(academicForm as any)[field.id]}
                                                    onChange={(e) => handleAcademicChange(field.id, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none sm:text-sm"
                                                />
                                            ) : (
                                                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-slate-200 sm:text-sm min-h-[44px] flex items-center">
                                                    <span className="truncate">{(academicForm as any)[field.id] || <span className="text-gray-400 dark:text-slate-500 italic">Not specified</span>}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Student ID <span className="text-xs text-gray-400 font-normal">(Read-only)</span>
                                        </label>
                                        <div className="px-4 py-2.5 bg-gray-100 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-500 dark:text-slate-400 sm:text-sm min-h-[44px] flex items-center font-mono opacity-80 cursor-not-allowed">
                                            {personalForm.studentId || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (Settings) */}
                    <div className="space-y-8">
                        {/* Security */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
                                </div>

                                <Link
                                    to={ROUTES.CHANGE_PASSWORD}
                                    className="group flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700/50 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-700/80 hover:border-blue-200 dark:hover:border-slate-600 transition-all cursor-pointer"
                                >
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Change Password</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Update credentials securely.</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Preferences */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700/50 rounded-xl bg-gray-50/50 dark:bg-slate-800/50">
                                    <div className="space-y-1 pr-4">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Get updates about assignments and grades.</p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                                            }`}
                                        aria-label="Toggle Email Notifications"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};