import { useMemo, useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { Search, Edit, Shield, Filter, Download, MoreVertical, User, Calendar, ShieldCheck, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export const AdminUsersPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [onlyActive, setOnlyActive] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const [statusMessage, setStatusMessage] = useState<string>('');

    const [users, setUsers] = useState([
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            role: 'Student',
            status: 'Active',
            joinedDate: 'Jan 15, 2024',
            lastActive: '2 hours ago',
            courses: 3,
            avatar: 'JD'
        },
        {
            id: 2,
            name: 'Dr. Emily Carter',
            email: 'emily.carter@university.edu',
            role: 'Instructor',
            status: 'Active',
            joinedDate: 'Dec 20, 2023',
            lastActive: '1 day ago',
            courses: 5,
            avatar: 'EC'
        },
        {
            id: 3,
            name: 'Sarah Johnson',
            email: 'sarah.johnson@university.edu',
            role: 'Student',
            status: 'Inactive',
            joinedDate: 'Feb 10, 2024',
            lastActive: '1 week ago',
            courses: 2,
            avatar: 'SJ'
        },
        {
            id: 4,
            name: 'Prof. Michael Brown',
            email: 'michael.brown@university.edu',
            role: 'Instructor',
            status: 'Active',
            joinedDate: 'Nov 5, 2023',
            lastActive: '3 hours ago',
            courses: 7,
            avatar: 'MB'
        },
        {
            id: 5,
            name: 'Lisa Wang',
            email: 'lisa.wang@university.edu',
            role: 'Student',
            status: 'Active',
            joinedDate: 'Mar 1, 2024',
            lastActive: '30 minutes ago',
            courses: 4,
            avatar: 'LW'
        }
    ]);

    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: 'Student',
        status: 'Active',
        courses: 0,
    });

    const openEditUser = (u: (typeof users)[number]) => {
        setEditingUserId(u.id);
        setUserForm({
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            courses: u.courses,
        });
        setEditingUserId(u.id);
        setStatusMessage('');
    };

    const saveUser = () => {
        if (!userForm.name.trim() || !userForm.email.trim()) return;

        if (editingUserId) {
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUserId
                        ? {
                            ...u,
                            name: userForm.name.trim(),
                            email: userForm.email.trim(),
                            role: userForm.role,
                            status: userForm.status,
                            courses: userForm.courses,
                            avatar: userForm.name
                                .trim()
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p) => p[0]?.toUpperCase())
                                .join(''),
                        }
                        : u
                )
            );
            setStatusMessage('User updated.');
        }

        setEditingUserId(null);
    };

    const cycleRole = (id: number) => {
        const roles = ['Student', 'Instructor', 'Admin'] as const;
        setUsers((prev) =>
            prev.map((u) => {
                if (u.id !== id) return u;
                const idx = roles.indexOf(u.role as (typeof roles)[number]);
                const next = roles[(idx + 1) % roles.length];
                return { ...u, role: next };
            })
        );
    };

    const toggleActive = (id: number) => {
        setUsers((prev) =>
            prev.map((u) => {
                if (u.id !== id) return u;
                return { ...u, status: u.status === 'Active' ? 'Restricted' : 'Active' };
            })
        );
    };

    const deleteUser = (id: number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setStatusMessage('User deleted.');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return users.filter((u) => {
            const roleMatch = selectedRole === 'all' || u.role === selectedRole;
            const activeMatch = !onlyActive || u.status === 'Active';
            const searchMatch =
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q);
            return roleMatch && activeMatch && searchMatch;
        });
    }, [onlyActive, searchQuery, selectedRole, users]);

    const downloadText = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const exportUsers = () => {
        const rows = [
            ['id', 'name', 'email', 'role', 'status', 'joinedDate', 'lastActive', 'courses'],
            ...filteredUsers.map((u) => [
                String(u.id),
                u.name,
                u.email,
                u.role,
                u.status,
                u.joinedDate,
                u.lastActive,
                String(u.courses),
            ]),
        ];
        const csv = rows
            .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadText('users-export.csv', csv);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Student':
                return 'bg-blue-100 text-blue-800';
            case 'Instructor':
                return 'bg-green-100 text-green-800';
            case 'Admin':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Restricted':
                return 'bg-red-100 text-red-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = [
        { label: 'Total Users', value: String(users.length), icon: User, color: 'text-blue-600' },
        { label: 'Active Users', value: String(users.filter((u) => u.status === 'Active').length), icon: ShieldCheck, color: 'text-green-600' },
        { label: 'New This Month', value: String(users.length), icon: Calendar, color: 'text-purple-600' },
        { label: 'Instructors', value: String(users.filter((u) => u.role === 'Instructor').length), icon: Shield, color: 'text-orange-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900">User Management</h1>
                        <p className="text-[18px] text-gray-600 mt-1">Manage platform users and their roles</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={exportUsers}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="primary" onClick={() => navigate(ROUTES.ADMIN_USER_CREATE)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create User
                        </Button>
                    </div>
                </div>

                {statusMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                        {statusMessage}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[20px] font-bold text-gray-900">{stat.value}</p>
                                            <p className="text-[14px] text-gray-600">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Search and Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="Student">Students</option>
                                    <option value="Instructor">Instructors</option>
                                    <option value="Admin">Admins</option>
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedRole('Student')}
                                        className={`px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors ${selectedRole === 'Student' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Students
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole('Instructor')}
                                        className={`px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors ${selectedRole === 'Instructor' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Instructors
                                    </button>
                                </div>
                                <button
                                    onClick={() => setOnlyActive((v) => !v)}
                                    className={`px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors ${onlyActive
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Active Only
                                </button>
                                <Button variant="outline">
                                    <Filter className="w-4 h-4 mr-2" />
                                    More Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            User
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Role
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Status
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Joined
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Last Active
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Courses
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, index) => (
                                        <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === filteredUsers.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-[14px] font-semibold text-blue-700">{user.avatar}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[16px] font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-[14px] text-gray-600">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getStatusBadge(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[14px] text-gray-600">{user.joinedDate}</td>
                                            <td className="py-4 px-6 text-[14px] text-gray-600">{user.lastActive}</td>
                                            <td className="py-4 px-6 text-[14px] text-gray-600">{user.courses}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditUser(user)}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => cycleRole(user.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                    >
                                                        <Shield className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleActive(user.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(ROUTES.ADMIN_USER_EDIT.replace(':id', String(user.id)))}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                        title="Edit Page"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>

            {editingUserId !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[18px] font-bold text-gray-900">
                                    Edit User
                                </h2>
                                <p className="text-[14px] text-gray-600">Update user details and role.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingUserId(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    value={userForm.name}
                                    onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Instructor">Instructor</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={userForm.status}
                                        onChange={(e) => setUserForm((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Courses</label>
                                <input
                                    type="number"
                                    value={userForm.courses}
                                    onChange={(e) => setUserForm((p) => ({ ...p, courses: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setEditingUserId(null);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveUser}
                                    disabled={!userForm.name.trim() || !userForm.email.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

