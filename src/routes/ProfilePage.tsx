import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui';
import {
    Edit, Save, X, LogOut, Lock, User, GraduationCap, Mail,
    Phone, MapPin, BadgeInfo, Bell, Briefcase, ShieldCheck,
    CheckCircle2, Globe, Building, Award, Clock, ChevronRight
} from 'lucide-react';

const inputCls = "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all sm:text-sm font-semibold";
const labelCls = "block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1";

export const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const logout = useLogout();

    const userRole = user?.roles?.[0]?.toLowerCase() || 'student';

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingRoleInfo, setIsEditingRoleInfo] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // --- Form States ---
    const [personalForm, setPersonalForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        address: '',
        phoneNumber: ''
    });

    // بيانات تختلف حسب الـ Role
    const [roleForm, setRoleForm] = useState({
        // Student fields
        program: 'Computer Science',
        graduationYear: '2025',
        // Instructor fields
        title: 'Senior AI Instructor',
        specialization: 'Machine Learning & Neural Networks',
        experience: '8 Years',
        // Admin fields
        department: 'Academic Operations',
        adminLevel: 'Super Admin'
    });

    const handleSignOut = async () => {
        try {
            await logout.mutateAsync();
            navigate(ROUTES.LOGIN);
        } catch (error) { console.error(error); }
    };

    const showStatus = (msg: string) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 4000);
    };

    // --- Role UI Config ---
    const roleConfig = useMemo(() => {
        switch (userRole) {
            case 'instructor':
                return { label: 'Instructor', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck };
            case 'admin':
                return { label: 'Administrator', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Briefcase };
            default:
                return { label: 'Student', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: GraduationCap };
        }
    }, [userRole]);

    return (
        <div className="min-h-screen p-6 sm:p-10 lg:p-16 max-w-[1920px] mx-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans pb-32 relative overflow-hidden">

            {/* Background Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>

            <div className="max-w-6xl mx-auto space-y-10 relative z-10 animate-in fade-in duration-700">

                {/* Status Toast */}
                {statusMessage && (
                    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8">
                        <div className="rounded-2xl border border-emerald-500/30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl px-8 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 shadow-2xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5" /> {statusMessage}
                        </div>
                    </div>
                )}

                {/* Profile Hero Header */}
                <div className="relative rounded-[3rem] overflow-hidden bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 shadow-xl backdrop-blur-md">
                    <div className="h-40 sm:h-60 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 relative">
                        <div className="absolute inset-0 bg-black/10 opacity-40"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/10"></div>
                    </div>

                    <div className="px-8 sm:px-12 pb-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 -mt-20 sm:-mt-24 relative z-10 text-center sm:text-left">
                            {/* Avatar */}
                            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[3rem] bg-white dark:bg-slate-800 p-2.5 shadow-2xl ring-4 ring-black/5 dark:ring-white/5 transform transition-hover hover:scale-105 duration-500">
                                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-gray-100 dark:border-slate-600">
                                    <User className="w-16 h-16 opacity-50" />
                                </div>
                            </div>

                            {/* User Main Info */}
                            <div className="space-y-3 mb-2">
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                        {personalForm.firstName} {personalForm.lastName}
                                    </h1>
                                    <div className={`px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                                        <roleConfig.icon className="w-3.5 h-3.5" />
                                        {roleConfig.label}
                                    </div>
                                </div>
                                <p className="text-gray-500 dark:text-slate-400 font-bold text-lg flex items-center justify-center sm:justify-start gap-2">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    {userRole === 'instructor' ? roleForm.title : (userRole === 'admin' ? roleForm.department : 'Undergraduate Student')}
                                </p>
                            </div>
                        </div>

                        <button onClick={handleSignOut} className="flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-2xl font-black text-sm transition-all hover:shadow-lg active:scale-95">
                            <LogOut className="w-5 h-5" /> SIGN OUT
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                    {/* --- LEFT COLUMN: Form Sections --- */}
                    <div className="xl:col-span-2 space-y-10">

                        {/* Personal Details */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8 sm:p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-inner">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Personal Information</h2>
                                            <p className="text-sm font-semibold text-gray-500">Contact and identity settings</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditingPersonal(!isEditingPersonal)} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-blue-600">
                                        {isEditingPersonal ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {[
                                        { id: 'firstName', label: 'First Name', icon: User },
                                        { id: 'lastName', label: 'Last Name', icon: User },
                                        { id: 'email', label: 'Email Address', icon: Mail },
                                        { id: 'phoneNumber', label: 'Phone Number', icon: Phone },
                                    ].map((f) => (
                                        <div key={f.id} className="space-y-3">
                                            <label className={labelCls}>{f.label}</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors">
                                                    <f.icon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    disabled={!isEditingPersonal}
                                                    value={(personalForm as any)[f.id]}
                                                    onChange={(e) => setPersonalForm({ ...personalForm, [f.id]: e.target.value })}
                                                    className={`${inputCls} ${!isEditingPersonal && 'border-transparent bg-gray-50/30 dark:bg-slate-900/20 cursor-default opacity-80'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isEditingPersonal && (
                                    <div className="mt-10 flex justify-end">
                                        <button onClick={() => { setIsEditingPersonal(false); showStatus('Profile updated successfully! ✨'); }} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95">
                                            SAVE CHANGES
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* --- DYNAMIC SECTION BASED ON ROLE --- */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8 sm:p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${roleConfig.bg} flex items-center justify-center ${roleConfig.color} shadow-inner`}>
                                            <roleConfig.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{userRole === 'student' ? 'Academic Records' : 'Professional Profile'}</h2>
                                            <p className="text-sm font-semibold text-gray-500">Official {userRole} credentials</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditingRoleInfo(!isEditingRoleInfo)} className={`p-3 rounded-2xl hover:opacity-80 transition-all ${roleConfig.bg} ${roleConfig.color}`}>
                                        {isEditingRoleInfo ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {userRole === 'student' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Degree Program</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><GraduationCap className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.program} className={inputCls} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Expected Graduation</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Clock className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.graduationYear} className={inputCls} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {userRole === 'instructor' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Academic Title</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Award className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.title} className={inputCls} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Years of Experience</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Briefcase className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.experience} className={inputCls} />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <label className={labelCls}>Primary Specialization</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><CheckCircle2 className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.specialization} className={inputCls} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {userRole === 'admin' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Operational Department</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Building className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.department} className={inputCls} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className={labelCls}>Admin Access Level</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><ShieldCheck className="w-5 h-5 text-gray-400" /></div>
                                                    <input disabled={!isEditingRoleInfo} value={roleForm.adminLevel} className={inputCls} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- RIGHT COLUMN: Settings Sidebar --- */}
                    <div className="space-y-10">
                        {/* Security Quick Link */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shadow-inner">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Security</h2>
                                </div>
                                <Link to={ROUTES.CHANGE_PASSWORD} className="group flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 hover:border-blue-400/50 transition-all">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Change Password</h3>
                                        <p className="text-xs font-semibold text-gray-500">Secure your account</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Preferences Toggle */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8 text-center sm:text-left">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shadow-inner">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Preferences</h2>
                                </div>
                                <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white">Emails</h3>
                                        <p className="text-xs font-semibold text-gray-500">Activity alerts</p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`w-14 h-8 rounded-full transition-all relative ${emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${emailNotifications ? 'left-7' : 'left-1'}`}></div>
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