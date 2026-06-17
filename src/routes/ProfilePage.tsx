import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLogout, useChangePhoto, useDeletePhoto } from '@/features/auth/api';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, ConfirmDialog } from '@/components/ui';
import {
    Edit, Save, X, LogOut, Lock, User as UserIcon, GraduationCap, Mail,
    Phone, MapPin, BadgeInfo, Bell, Briefcase, ShieldCheck,
    CheckCircle2, Globe, Building, Award, Clock, ChevronRight,
    Camera, Trash2, Image as ImageIcon
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // --- Form States ---
    const [personalForm, setPersonalForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        address: '',
        phoneNumber: ''
    });

    const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const changePhotoMutation = useChangePhoto();
    const deletePhotoMutation = useDeletePhoto();

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsAvatarDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        // Reset input value so same file can be selected again
        e.target.value = '';

        if (!file) {
            toast.error('Image is required.');
            return;
        }

        // 1. File Size Validation (Max 2MB)
        const MAX_FILE_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image size must not exceed 2MB.');
            return;
        }

        // 2. Content Type Validation (JPEG or PNG)
        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            toast.error('Only JPEG and PNG images are allowed.');
            return;
        }

        // 3. File Name Validation
        if (!file.name || file.name.trim() === '') {
            toast.error('File name is required.');
            return;
        }

        const toastId = toast.loading('Uploading profile photo...');
        changePhotoMutation.mutate(file, {
            onSuccess: () => {
                setIsAvatarDropdownOpen(false);
                toast.success('Photo updated successfully! 📸', { id: toastId });
            },
            onError: (error: any) => {
                console.error('Failed to change photo:', error);
                toast.error('Failed to update photo. Please try again. ❌', { id: toastId });
            }
        });
    };

    const handleDeletePhoto = () => {
        const toastId = toast.loading('Removing profile photo...');
        deletePhotoMutation.mutate(undefined, {
            onSuccess: () => {
                setIsAvatarDropdownOpen(false);
                setIsDeleteDialogOpen(false);
                toast.success('Photo removed! 🗑️', { id: toastId });
            },
            onError: (error: any) => {
                console.error('Failed to delete photo:', error);
                toast.error('Failed to remove photo. ❌', { id: toastId });
            }
        });
    };

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
        <>
            <div className="min-h-screen p-6 md:p-8 lg:p-12 xl:p-16 max-w-[1920px] mx-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans pb-32 relative">

            {/* Background Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>

            <div className="max-w-6xl mx-auto space-y-10 relative z-10 animate-in fade-in duration-700">

                {/* Profile Hero Header */}
                <div className="relative z-50 rounded-[2.5rem] sm:rounded-[3rem] bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 shadow-xl backdrop-blur-md">
                    <div className="h-32 sm:h-60 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 relative overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[3rem]">
                        <div className="absolute inset-0 bg-black/10 opacity-40"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/10"></div>
                    </div>

                    <div className="px-6 md:px-8 lg:px-10 xl:px-12 pb-8 lg:pb-10 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 lg:gap-6 xl:gap-8">
                        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-6 xl:gap-8 -mt-16 lg:-mt-24 relative z-[60] text-center lg:text-left w-full lg:w-auto">
                            {/* Avatar */}
                            <div className="relative group shrink-0" ref={dropdownRef}>
                                <div 
                                    className="w-32 h-32 lg:w-48 lg:h-48 rounded-[2.5rem] lg:rounded-[3rem] bg-white dark:bg-slate-800 p-2 lg:p-2.5 shadow-2xl ring-4 ring-black/5 dark:ring-white/5 transform transition-hover hover:scale-105 duration-500 cursor-pointer overflow-hidden"
                                    onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                                >
                                    <div className="w-full h-full rounded-[2.2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-gray-100 dark:border-slate-600">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-12 h-12 lg:w-16 lg:h-16 opacity-50" />
                                        )}
                                    </div>
                                    
                                    {/* Edit Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] lg:rounded-[3rem] pointer-events-none">
                                        <Camera className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                                    </div>
                                </div>

                                {/* Avatar Management Dropdown */}
                                {isAvatarDropdownOpen && (
                                    <div className="absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 top-[calc(100%+12px)] w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-[2rem] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4">
                                        <div className="p-3 space-y-1">
                                            {user?.avatar && (
                                                <button 
                                                    onClick={() => { setViewingImage(true); setIsAvatarDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                    DISPLAY PHOTO
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={changePhotoMutation.isPending}
                                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black text-gray-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left disabled:opacity-50 group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <Camera className={`w-5 h-5 ${changePhotoMutation.isPending ? 'animate-pulse' : ''}`} /> 
                                                </div>
                                                {changePhotoMutation.isPending ? 'UPLOADING...' : (user?.avatar ? 'CHANGE PHOTO' : 'ADD PHOTO')}
                                            </button>
                                            {user?.avatar && (
                                                <button 
                                                    onClick={() => setIsDeleteDialogOpen(true)}
                                                    disabled={deletePhotoMutation.isPending}
                                                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left disabled:opacity-50 group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                                        <Trash2 className={`w-5 h-5 ${deletePhotoMutation.isPending ? 'animate-pulse' : ''}`} /> 
                                                    </div>
                                                    {deletePhotoMutation.isPending ? 'DELETING...' : 'DELETE PHOTO'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />


                            {/* User Main Info */}
                            <div className="space-y-2 sm:space-y-3 mb-2 flex-1">
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4">
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                        {personalForm.firstName} {personalForm.lastName}
                                    </h1>
                                    <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl border-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                                        <roleConfig.icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                        {roleConfig.label}
                                    </div>
                                </div>
                                <p className="text-gray-500 dark:text-slate-400 font-bold text-base sm:text-lg flex items-center justify-center lg:justify-start gap-2">
                                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                    {userRole === 'instructor' ? roleForm.title : (userRole === 'admin' ? roleForm.department : 'Undergraduate Student')}
                                </p>
                            </div>
                        </div>

                        <button onClick={handleSignOut} className="w-full lg:w-auto shrink-0 whitespace-nowrap flex items-center justify-center gap-3 px-8 py-4 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-2xl font-black text-sm transition-all hover:shadow-lg active:scale-95">
                            <LogOut className="w-5 h-5" /> SIGN OUT
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                    {/* --- LEFT COLUMN: Form Sections --- */}
                    <div className="xl:col-span-2 space-y-10">

                        {/* Personal Details */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 sm:mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Personal Information</h2>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-500">Contact and identity settings</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditingPersonal(!isEditingPersonal)} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-blue-600 sm:self-start">
                                        {isEditingPersonal ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                                    </button>
                                </div>
 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                    {[
                                        { id: 'firstName', label: 'First Name', icon: UserIcon },
                                        { id: 'lastName', label: 'Last Name', icon: UserIcon },
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
                                                    disabled={!isEditingPersonal || f.id === 'email'}
                                                    value={(personalForm as any)[f.id]}
                                                    onChange={(e) => setPersonalForm({ ...personalForm, [f.id]: e.target.value })}
                                                    className={`${inputCls} ${(!isEditingPersonal || f.id === 'email') && 'border-transparent bg-gray-50/30 dark:bg-slate-900/20 cursor-default opacity-80'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isEditingPersonal && (
                                    <div className="mt-10 flex justify-end">
                                        <button 
                                            onClick={() => { 
                                                setIsEditingPersonal(false); 
                                                toast.success('Profile updated successfully! ✨'); 
                                            }} 
                                            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95"
                                        >
                                            SAVE CHANGES
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* --- DYNAMIC SECTION BASED ON ROLE --- */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 sm:mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${roleConfig.bg} flex items-center justify-center ${roleConfig.color} shadow-inner shrink-0`}>
                                            <roleConfig.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{userRole === 'student' ? 'Academic Records' : 'Professional Profile'}</h2>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-500">Official {userRole} credentials</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditingRoleInfo(!isEditingRoleInfo)} className={`p-3 rounded-2xl hover:opacity-80 transition-all ${roleConfig.bg} ${roleConfig.color} sm:self-start`}>
                                        {isEditingRoleInfo ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
                                            <div className="sm:col-span-2 space-y-3">
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
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shadow-inner shrink-0">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Security</h2>
                                </div>
                                <div className="space-y-4">
                                    <Link to={ROUTES.CHANGE_PASSWORD} className="group flex items-center justify-between p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 hover:border-blue-400/50 transition-all">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Change Password</h3>
                                            <p className="text-xs font-semibold text-gray-500">Secure your account</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                                    </Link>
                                    <Link to={ROUTES.CHANGE_EMAIL} className="group flex items-center justify-between p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 hover:border-blue-400/50 transition-all">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Change Email</h3>
                                            <p className="text-xs font-semibold text-gray-500">Update primary email</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preferences Toggle */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Preferences</h2>
                                </div>
                                <div className="flex items-center justify-between p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white">Emails</h3>
                                        <p className="text-xs font-semibold text-gray-500">Activity alerts</p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
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
        {/* Full Screen Image Viewer Modal */}
        {viewingImage && user?.avatar && (
            <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-[20px] animate-in fade-in duration-500"
                onClick={() => setViewingImage(false)}
            >
                <div 
                    className="relative max-w-[95vw] max-h-[95vh] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img 
                        src={user.avatar} 
                        alt="Full Profile" 
                        className="w-auto h-auto max-w-full max-h-[90vh] object-contain shadow-2xl"
                    />
                    <button 
                        onClick={() => setViewingImage(false)}
                        className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                    >
                        <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        <h3 className="text-white font-black text-2xl tracking-tight">{user.fullName}</h3>
                        <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Verified Profile Identity</p>
                    </div>
                </div>
            </div>
        )}

        {/* Confirmation Dialog for Photo Deletion */}
        <ConfirmDialog 
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeletePhoto}
            isPending={deletePhotoMutation.isPending}
            title="Delete profile photo?"
            description="Are you sure you want to remove your profile photo? This action cannot be undone."
            confirmText="Remove Photo"
            cancelText="Keep Photo"
            variant="danger"
            icon={Trash2}
        />
    </>
    );
};