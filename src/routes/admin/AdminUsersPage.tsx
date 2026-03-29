import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Search, Edit, Shield, Filter, Download, MoreVertical,
    User, Calendar, ShieldCheck, Trash2, Plus, X, Lock, CheckCircle2 ,AlertTriangle, Users,
} from 'lucide-react';

// --- Mock Data ---
const initialUsers = [
    { id: 1, name: 'Alice Freeman', email: 'alice@ailern.com', role: 'Student', status: 'Active', joinedDate: '2023-10-15', lastActive: '2 hrs ago', courses: 4, avatar: 'AF' },
    { id: 2, name: 'Bob Smith', email: 'bob.instructor@ailern.com', role: 'Instructor', status: 'Active', joinedDate: '2022-05-20', lastActive: '5 mins ago', courses: 12, avatar: 'BS' },
    { id: 3, name: 'Charlie Doe', email: 'charlie@ailern.com', role: 'Student', status: 'Restricted', joinedDate: '2024-01-10', lastActive: '1 week ago', courses: 1, avatar: 'CD' },
    { id: 4, name: 'Diana Prince', email: 'diana@ailern.com', role: 'Admin', status: 'Active', joinedDate: '2021-08-01', lastActive: 'Just now', courses: 0, avatar: 'DP' },
    { id: 5, name: 'Evan Wright', email: 'evan@ailern.com', role: 'Student', status: 'Pending', joinedDate: '2024-03-25', lastActive: 'Never', courses: 0, avatar: 'EW' },
    { id: 6, name: 'Fiona Gallagher', email: 'fiona.inst@ailern.com', role: 'Instructor', status: 'Active', joinedDate: '2023-11-05', lastActive: '1 day ago', courses: 3, avatar: 'FG' },
];

export const AdminUsersPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [onlyActive, setOnlyActive] = useState(false);

    const [users, setUsers] = useState(initialUsers);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const [userForm, setUserForm] = useState({
        name: '', email: '', role: 'Student', status: 'Active', courses: 0,
    });

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const openEditUser = (u: (typeof users)[number]) => {
        setEditingUserId(u.id);
        setUserForm({ name: u.name, email: u.email, role: u.role, status: u.status, courses: u.courses });
    };

    const saveUser = () => {
        if (!userForm.name.trim() || !userForm.email.trim()) return;
        if (editingUserId) {
            setUsers((prev) => prev.map((u) => u.id === editingUserId ? {
                ...u,
                name: userForm.name.trim(),
                email: userForm.email.trim(),
                role: userForm.role,
                status: userForm.status,
                courses: userForm.courses,
                avatar: userForm.name.trim().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(''),
            } : u));
            showToast('User profile updated successfully.');
        }
        setEditingUserId(null);
    };

    const cycleRole = (id: number) => {
        const roles = ['Student', 'Instructor', 'Admin'] as const;
        setUsers((prev) => prev.map((u) => {
            if (u.id !== id) return u;
            const idx = roles.indexOf(u.role as any);
            return { ...u, role: roles[(idx + 1) % roles.length] };
        }));
        showToast('User role updated.');
    };

    const toggleActive = (id: number) => {
        setUsers((prev) => prev.map((u) => {
            if (u.id !== id) return u;
            return { ...u, status: u.status === 'Active' ? 'Restricted' : 'Active' };
        }));
        showToast('User status changed.');
    };

    const deleteUser = (id: number) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showToast('User deleted successfully.', 'error');
    };

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return users.filter((u) => {
            const roleMatch = selectedRole === 'all' || u.role === selectedRole;
            const activeMatch = !onlyActive || u.status === 'Active';
            const searchMatch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            return roleMatch && activeMatch && searchMatch;
        });
    }, [onlyActive, searchQuery, selectedRole, users]);

    const exportUsers = () => {
        const rows = [
            ['id', 'name', 'email', 'role', 'status', 'joinedDate', 'lastActive', 'courses'],
            ...filteredUsers.map((u) => [String(u.id), `"${u.name}"`, `"${u.email}"`, u.role, u.status, u.joinedDate, u.lastActive, String(u.courses)]),
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "ailern_users_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Export downloaded successfully.');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Instructor': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
            case 'Admin': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20';
            default: return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400';
            case 'Restricted': return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
            case 'Pending': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
            default: return 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400';
        }
    };

    const stats = [
        { label: 'Total Users', value: users.length, icon: User, color: 'blue' },
        { label: 'Active Now', value: users.filter((u) => u.status === 'Active').length, icon: ShieldCheck, color: 'emerald' },
        { label: 'New This Month', value: 24, icon: Calendar, color: 'purple' },
        { label: 'Instructors', value: users.filter((u) => u.role === 'Instructor').length, icon: Shield, color: 'amber' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Toast Notification --- */}
                {statusMessage && (
                    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
                        <div className={`px-6 py-3 rounded-full border backdrop-blur-md font-bold text-sm flex items-center gap-2 shadow-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {statusMessage.text}
                        </div>
                    </div>
                )}

                {/* --- Header --- */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" /> User Directory
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Manage all students, instructors, and administrators on the platform.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button onClick={exportUsers} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-2xl font-bold transition-all text-sm shadow-sm">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={() => navigate(ROUTES.ADMIN_USER_CREATE)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 text-sm active:scale-95">
                            <Plus className="w-4 h-4" /> Add User
                        </button>
                    </div>
                </div>

                {/* --- Stats Grid --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4 group hover:shadow-lg hover:border-blue-500/30 transition-all">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Search & Filters --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all cursor-pointer shadow-sm appearance-none min-w-[120px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="Student">Students</option>
                            <option value="Instructor">Instructors</option>
                            <option value="Admin">Admins</option>
                        </select>

                        <button
                            onClick={() => setOnlyActive(!onlyActive)}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-2 shadow-sm ${onlyActive ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {onlyActive && <CheckCircle2 className="w-4 h-4" />} Active Only
                        </button>

                        <button className="px-4 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                    </div>
                </div>

                {/* --- Users Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Activity</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-inner ${user.role === 'Admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        user.role === 'Instructor' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold ${getStatusBadge(user.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Restricted' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-600 dark:text-slate-300">Joined: {user.joinedDate}</p>
                                            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 mt-0.5">Last active: {user.lastActive}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditUser(user)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 rounded-xl transition-colors" title="Edit Profile">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => cycleRole(user.id)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-600 rounded-xl transition-colors" title="Change Role">
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => toggleActive(user.id)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 rounded-xl transition-colors" title="Toggle Access">
                                                    <Lock className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteUser(user.id)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 text-gray-500 rounded-xl transition-colors" title="Delete User">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-20 bg-gray-50/30 dark:bg-slate-900/30">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No users found</h3>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Edit User Modal --- */}
            {editingUserId !== null && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in-95">

                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                    <Edit className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Edit User Profile</h2>
                                </div>
                            </div>
                            <button onClick={() => setEditingUserId(null)} className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    value={userForm.name}
                                    onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-bold text-gray-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-bold text-gray-900 dark:text-white transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-bold text-gray-900 dark:text-white transition-all cursor-pointer"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Instructor">Instructor</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Status</label>
                                    <select
                                        value={userForm.status}
                                        onChange={(e) => setUserForm((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-bold text-gray-900 dark:text-white transition-all cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Restricted">Restricted</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button onClick={() => setEditingUserId(null)} className="flex-1 py-3.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={saveUser} disabled={!userForm.name.trim() || !userForm.email.trim()} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};