import { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { Search, Plus, Edit, Shield, Filter, Download, MoreVertical, User, Calendar, ShieldCheck } from 'lucide-react';

export const AdminUsersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');

    const users = [
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
    ];

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
            case 'Inactive':
                return 'bg-red-100 text-red-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = [
        { label: 'Total Users', value: '1,250', icon: User, color: 'text-blue-600' },
        { label: 'Active Users', value: '1,180', icon: ShieldCheck, color: 'text-green-600' },
        { label: 'New This Month', value: '45', icon: Calendar, color: 'text-purple-600' },
        { label: 'Instructors', value: '150', icon: Shield, color: 'text-orange-600' }
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
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </div>

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
                                    {users.map((user, index) => (
                                        <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === users.length - 1 ? 'border-b-0' : ''}`}>
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
                                                    <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                                                        <Shield className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                                                        <MoreVertical className="w-4 h-4 text-gray-600" />
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
                {users.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
                        <Button>Add First User</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

