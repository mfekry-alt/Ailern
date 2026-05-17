import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { getUsersWithRole, deleteUser as deleteUserApi, getUserCounts, type GetUsersWithRoleParams } from '@/api/services/user.service';
import type { GetUsersByRoleDto, GetUsersByRoleDtoPaginationResult, GetUserCountsDto } from '@/types/api.types';
import { handleApiError } from '@/api/client';
import {
    Search, Edit, Shield, Download, Trash2, X, CheckCircle2, AlertTriangle,
    Users, ChevronLeft, ChevronRight, User, ShieldCheck, GraduationCap, Crown,
    LayoutGrid, ChevronDown
} from 'lucide-react';

// Skeleton row component for loading state
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="py-4 px-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700" />
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        </td>
        <td className="py-4 px-6"><div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg" /></td>
        <td className="py-4 px-6"><div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded" /></td>
        <td className="py-4 px-6"><div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" /></td>
        <td className="py-4 px-6"><div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-lg" /></td>
        <td className="py-4 px-6"><div className="flex justify-center gap-2"><div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-xl" /></div></td>
    </tr>
);

// Generate avatar initials from full name
const getAvatarInitials = (fullName: string): string => {
    return fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
};

// Stat Card Component
interface StatCardProps {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => (
    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4 group hover:shadow-lg hover:border-blue-500/30 transition-all">
        <div
            className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-500/10 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform shadow-inner shrink-0`}
        >
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                {value}
            </p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                {label}
            </p>
        </div>
    </div>
);

// --- Role Filter Component ---
interface RoleFilterProps {
    selectedRole: string;
    onRoleChange: (role: string) => void;
    disabled?: boolean;
}

const RoleFilter = ({ selectedRole, onRoleChange, disabled }: RoleFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const roles = [
        { id: 'all', label: 'All Roles', icon: LayoutGrid },
        { id: 'Student', label: 'Students', icon: GraduationCap },
        { id: 'Instructor', label: 'Instructors', icon: ShieldCheck },
        { id: 'Admin', label: 'Admins', icon: Crown },
    ];

    const currentRole = roles.find((r) => r.id === selectedRole) || roles[0];
    const Icon = currentRole.icon;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:border-[#21A9FF]/50 transition-all shadow-sm min-w-[180px] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="w-8 h-8 rounded-lg bg-[#21A9FF]/10 flex items-center justify-center text-[#21A9FF] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">{currentRole.label}</span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-[240px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl z-50 p-2 overflow-hidden animate-in zoom-in-95 duration-200">
                        {roles.map((role) => {
                            const RoleIcon = role.icon;
                            const isSelected = selectedRole === role.id;
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                        onRoleChange(role.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${isSelected
                                        ? 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <RoleIcon
                                        className={`w-4 h-4 ${isSelected ? 'text-[#21A9FF]' : 'text-gray-400'
                                            }`}
                                    />
                                    {role.label}
                                    {isSelected && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-[#21A9FF] rounded-full shadow-[0_0_8px_rgba(33,169,255,0.5)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Page Size Selector Component ---
interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    disabled?: boolean;
}

const PageSizeSelector = ({ pageSize, onPageSizeChange, disabled }: PageSizeSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = [5, 10, 25, 50];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-[10px] font-black text-gray-700 dark:text-slate-200 hover:border-[#21A9FF]/50 transition-all shadow-sm group disabled:opacity-50"
            >
                {pageSize} / page
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onPageSizeChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-black transition-all ${pageSize === option
                                    ? 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {option} / page
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const AdminUsersPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Data state
    const [users, setUsers] = useState<GetUsersByRoleDto[]>([]);
    const [pagination, setPagination] = useState<GetUsersByRoleDtoPaginationResult | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Delete modal state
    const [deletingUser, setDeletingUser] = useState<GetUsersByRoleDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [counts, setCounts] = useState<GetUserCountsDto | null>(null);

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params: GetUsersWithRoleParams = {
                pageNo: currentPage,
                pageSize: pageSize,
                role: selectedRole === 'all' ? null : selectedRole,
            };

            const result = await getUsersWithRole(params);
            setUsers(result.items);
            setPagination(result);
        } catch (err) {
            const apiError = handleApiError(err);
            setError(apiError.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, selectedRole]);

    // Fetch counts from API
    const fetchCounts = useCallback(async () => {
        try {
            const data = await getUserCounts();
            setCounts(data);
        } catch (err) {
            console.error('Failed to fetch user counts:', err);
        }
    }, []);

    // Fetch users on mount and when dependencies change
    useEffect(() => {
        fetchUsers();
        fetchCounts();
    }, [fetchUsers, fetchCounts]);

    // Reset to page 1 when role filter or page size changes (not search - it's client-side now)
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRole, pageSize]);

    // Client-side search filter with startsWith logic (fullName and userName only)
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;

        const query = searchQuery.trim().toLowerCase();

        return users.filter((user) => {
            const fullName = user.fullName?.toLowerCase() ?? '';
            const userName = user.userName?.toLowerCase() ?? '';

            return fullName.startsWith(query) || userName.startsWith(query);
        });
    }, [users, searchQuery]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const openDeleteUser = (user: GetUsersByRoleDto) => {
        setDeletingUser(user);
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            await deleteUserApi(deletingUser.id);
            showToast('User deleted successfully.');
            fetchUsers();
            fetchCounts(); // Refresh counts after deletion
        } catch (err) {
            const apiError = handleApiError(err);
            showToast(apiError.message, 'error');
        } finally {
            setIsDeleting(false);
            setDeletingUser(null);
        }
    };

    const exportUsers = () => {
        const rows = [
            ['id', 'fullName', 'userName', 'email', 'phoneNumber', 'role'],
            ...filteredUsers.map((u) => [
                String(u.id),
                `"${u.fullName}"`,
                `"${u.userName}"`,
                `"${u.email}"`,
                u.phoneNumber ? `"${u.phoneNumber}"` : '—',
                u.role,
            ]),
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'ailern_users_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Export downloaded successfully.');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Instructor':
                return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
            case 'Admin':
                return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20';
            default:
                return 'bg-[#21A9FF]/10 text-[#21A9FF] dark:bg-[#21A9FF]/10 dark:text-[#21A9FF] border border-[#21A9FF]/20 dark:border-[#21A9FF]/20';
        }
    };

    const getRoleAvatarColor = (role: string) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Instructor':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            default:
                return 'bg-[#21A9FF]/10 text-[#21A9FF] dark:bg-[#21A9FF]/30 dark:text-[#21A9FF]';
        }
    };

    // Stats - from API counts
    const stats: StatCardProps[] = [
        {
            label: 'Total Users',
            value: counts?.totalUsers ?? 0,
            icon: Users,
            color: 'amber',
        },
        {
            label: 'Students',
            value: counts?.totalStudent ?? 0,
            icon: GraduationCap,
            color: 'blue',
        },
        {
            label: 'Instructors',
            value: counts?.totalInstructors ?? 0,
            icon: ShieldCheck,
            color: 'emerald',
        },
        {
            label: 'Admins',
            value: counts?.totalAdmins ?? 0,
            icon: Crown,
            color: 'purple',
        },
    ];

    const totalPages = pagination?.pagesCount ?? 1;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Toast Notification - Moved to root to escape stacking context */}
            {statusMessage && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-8 duration-500">
                    <div className={`px-8 py-4 rounded-[3rem] border shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[320px] justify-center ${statusMessage.type === 'success'
                        ? 'bg-[#E0E7FF]/90 border-[#C7D2FE] text-slate-900'
                        : 'bg-red-50/90 border-red-200 text-red-900'
                        }`}>
                        {statusMessage.type === 'success' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
                                <AlertTriangle className="w-4 h-4 stroke-[3]" />
                            </div>
                        )}
                        <span className="font-black text-base tracking-tight">{statusMessage.text}</span>
                    </div>
                </div>
            )}

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Header --- */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-[#21A9FF]" /> User Directory
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Manage all students, instructors, and administrators on the platform.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button
                            onClick={exportUsers}
                            disabled={isLoading || filteredUsers.length === 0}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-2xl font-bold transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* --- Search & Filters --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row gap-4 items-center relative z-30">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#21A9FF] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#21A9FF]/30 outline-none text-gray-900 dark:text-white transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="flex w-full lg:w-auto gap-3">
                        <RoleFilter
                            selectedRole={selectedRole}
                            onRoleChange={setSelectedRole}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* --- Stats Grid (4 cards: Total Users, Students, Instructors, Admins) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} {...stat} />
                    ))}
                </div>

                {/* --- Error State --- */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[2rem] p-6 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                        <button
                            onClick={fetchUsers}
                            className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* --- Users Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        Full Name
                                    </th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        Username
                                    </th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        Email
                                    </th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        Phone Number
                                    </th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        Role
                                    </th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {isLoading ? (
                                    // Loading skeleton rows
                                    <>
                                        {Array.from({ length: 5 }).map((_, idx) => (
                                            <SkeletonRow key={idx} />
                                        ))}
                                    </>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-inner overflow-hidden ${!user.imageUrl ? getRoleAvatarColor(user.role) : ''}`}
                                                    >
                                                        {user.imageUrl ? (
                                                            <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            getAvatarInitials(user.fullName)
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-[#21A9FF] transition-colors">
                                                        {user.fullName}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                                    {user.userName}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                                    {user.phoneNumber || '—'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getRoleBadge(
                                                        user.role
                                                    )}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openDeleteUser(user)}
                                                        className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 text-gray-500 rounded-xl transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Empty State --- */}
                    {!isLoading && !error && filteredUsers.length === 0 && (
                        <div className="text-center py-20 bg-gray-50/30 dark:bg-slate-900/30">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {searchQuery.trim() ? 'No matching users' : 'No users found'}
                            </h3>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                {searchQuery.trim()
                                    ? `No users start with "${searchQuery.trim()}". Try a different search.`
                                    : 'Try adjusting your filters or refresh the page.'}
                            </p>
                        </div>
                    )}

                    {/* --- Pagination --- */}
                    {!isLoading && !error && pagination && filteredUsers.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-slate-700/50 gap-4 bg-gray-50/30 dark:bg-slate-900/5">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Results</p>
                                    <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                                        Showing <span className="text-[#21A9FF]">{filteredUsers.length}</span> users
                                    </p>
                                </div>
                                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
                                <PageSizeSelector
                                    pageSize={pageSize}
                                    onPageSizeChange={setPageSize}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-[#21A9FF] hover:bg-[#21A9FF]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                <div className="px-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Page</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{currentPage}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">of</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{pagination.pagesCount}</span>
                                </div>

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(pagination.pagesCount, p + 1))}
                                    disabled={currentPage === pagination.pagesCount || isLoading}
                                    className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-[#21A9FF] hover:bg-[#21A9FF]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Delete Confirmation Modal --- */}
            {deletingUser !== null && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                                        Delete User
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setDeletingUser(null)}
                                disabled={isDeleting}
                                className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                                Are you sure you want to permanently delete <span className="font-bold text-gray-900 dark:text-white">{deletingUser.fullName}</span>? This action cannot be undone.
                            </p>
                        </div>

                        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Confirm Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};