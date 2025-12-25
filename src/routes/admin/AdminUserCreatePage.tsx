import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/lib/constants';

export const AdminUserCreatePage = () => {
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: 'Student',
        password: '',
    });

    const canSave = form.name.trim() && form.email.trim() && form.password.trim();

    const save = async () => {
        if (!canSave) return;
        // Simulate API call
        await new Promise((r) => setTimeout(r, 600));
        setStatusMessage('User created successfully.');
        setTimeout(() => navigate(ROUTES.ADMIN_USERS), 1200);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[30px] font-bold text-gray-900">Create User</h1>
                        <p className="text-[16px] text-gray-600">Add a new user to the platform</p>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.ADMIN_USERS)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-50"
                    >
                        Back to Users
                    </button>
                </div>

                {statusMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                        {statusMessage}
                    </div>
                )}

                <Card variant="elevated">
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <label className="block text-[14px] font-medium text-gray-700 mb-2">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-gray-700 mb-2">Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Student">Student</option>
                                <option value="Instructor">Instructor</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                disabled={!canSave}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
