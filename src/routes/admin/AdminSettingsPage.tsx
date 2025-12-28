import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { ROUTES } from '@/lib/constants';

export const AdminSettingsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Profile state
    const [firstName, setFirstName] = useState<string>(user?.firstName || '');
    const [lastName, setLastName] = useState<string>(user?.lastName || '');
    const [email, setEmail] = useState<string>(user?.email || '');
    const [phone, setPhone] = useState<string>('');

    // Preferences
    const [language, setLanguage] = useState<string>('en');
    const [timezone, setTimezone] = useState<string>('UTC');
    const [notifEmail, setNotifEmail] = useState<boolean>(true);
    const [notifInApp, setNotifInApp] = useState<boolean>(true);

    // Security
    const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
    const [sessionTimeout, setSessionTimeout] = useState<number>(30);
    const [requireUppercase, setRequireUppercase] = useState<boolean>(true);
    const [requireMinLength, setRequireMinLength] = useState<boolean>(true);

    const handleSave = () => {
        // Simulate save and show message
        setStatusMessage('Profile settings saved.');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    return (
        <div className="p-8 max-w-[1920px] mx-auto dark:bg-zinc-950">
            <div className="flex flex-col gap-8 items-start w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3">
                    <div>
                        <h1 className="font-bold text-[36px] leading-[40px] tracking-[-0.9px] text-azure-8 dark:text-zinc-100">
                            Profile Settings
                        </h1>
                        <p className="text-[16px] leading-[24px] text-azure-46 dark:text-zinc-400 mt-2">
                            Manage your admin profile, preferences, and security
                        </p>
                        {statusMessage && (
                            <div className="mt-4 w-full rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                                {statusMessage}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.ADMIN)}
                        className="px-4 py-2 bg-white border border-azure-88 rounded-lg text-azure-8 font-medium hover:bg-gray-50 cursor-pointer"
                    >
                        Back to dashboard
                    </button>
                </div>

                {/* Settings Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* Profile Information */}
                    <div className="bg-white dark:bg-zinc-900 border border-azure-88 dark:border-zinc-800 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 dark:text-zinc-100 mb-4">
                            Profile Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                    {firstName?.[0] || 'A'}{lastName?.[0] || ''}
                                </div>
                                <button className="px-4 py-2 bg-white border border-azure-88 rounded-lg text-azure-8 font-medium hover:bg-gray-50 cursor-pointer">
                                    Upload avatar
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white dark:bg-zinc-900 border border-azure-88 dark:border-zinc-800 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 dark:text-zinc-100 mb-4">
                            Preferences
                        </h2>
                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    >
                                        <option value="en">English</option>
                                        <option value="ar">Arabic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Timezone</label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Africa/Cairo">Africa/Cairo</option>
                                        <option value="Europe/London">Europe/London</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[14px] font-medium text-azure-8">Display Mode</label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                    <span className="text-[14px] text-azure-8 dark:text-zinc-200">Dark Mode</span>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[14px] font-medium text-azure-8">Notifications</label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notifEmail}
                                        onChange={(e) => setNotifEmail(e.target.checked)}
                                        className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50 cursor-pointer"
                                    />
                                    <span className="ml-2 text-[14px] text-azure-8">Email notifications</span>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notifInApp}
                                        onChange={(e) => setNotifInApp(e.target.checked)}
                                        className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50 cursor-pointer"
                                    />
                                    <span className="ml-2 text-[14px] text-azure-8">In-app notifications</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white dark:bg-zinc-900 border border-azure-88 dark:border-zinc-800 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 dark:text-zinc-100 mb-4">
                            Security
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[14px] font-medium text-azure-8">Multi-factor authentication (MFA)</label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={mfaEnabled}
                                        onChange={(e) => setMfaEnabled(e.target.checked)}
                                        className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50 cursor-pointer"
                                    />
                                    <span className="ml-2 text-[14px] text-azure-8">Enable MFA</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">Session Timeout (minutes)</label>
                                <input
                                    type="number"
                                    value={sessionTimeout}
                                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">Password Requirements</label>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={requireMinLength}
                                            onChange={(e) => setRequireMinLength(e.target.checked)}
                                            className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50 cursor-pointer"
                                        />
                                        <span className="ml-2 text-[14px] text-azure-8">Minimum 8 characters</span>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={requireUppercase}
                                            onChange={(e) => setRequireUppercase(e.target.checked)}
                                            className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50 cursor-pointer"
                                        />
                                        <span className="ml-2 text-[14px] text-azure-8">Require uppercase letter</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium cursor-pointer"
                                >
                                    Change Password
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-azure-8 rounded-md font-medium cursor-pointer"
                                >
                                    Save Security
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end w-full">
                    <button
                        onClick={handleSave}
                        className="bg-azure-50 hover:bg-[#0b6dd4] text-white font-medium text-[14px] leading-5 px-6 py-2 rounded-md transition-colors shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
