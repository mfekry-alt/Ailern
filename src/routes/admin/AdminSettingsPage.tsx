import { useState } from 'react';
import {
    Settings, Globe, Shield, Mail, Server,
    Save, Bell, Lock, Database, AlertTriangle,
    CheckCircle2, RefreshCw
} from 'lucide-react';

export const AdminSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // --- System Settings State ---
    const [settings, setSettings] = useState({
        // General
        platformName: 'Ailern Exam & LMS',
        supportEmail: 'support@ailern.com',
        timeZone: 'Africa/Cairo (EET)',
        maxUploadSize: '50',

        // Security
        allowRegistration: true,
        requireEmailVerification: true,
        enforceTwoFactor: false,
        sessionTimeout: '120', // minutes

        // Email / SMTP
        smtpHost: 'smtp.mailgun.org',
        smtpPort: '587',
        smtpUser: 'postmaster@ailern.com',

        // Advanced
        maintenanceMode: false,
        debugMode: false,
    });

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API Call
        setTimeout(() => {
            setIsSaving(false);
            showToast('System settings updated successfully.');
        }, 1000);
    };

    const handleClearCache = () => {
        if (window.confirm('Are you sure you want to clear the system cache? This might temporarily slow down the platform.')) {
            showToast('System cache cleared successfully.');
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    // --- UI Helpers ---
    const ToggleSwitch = ({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: (val: boolean) => void }) => (
        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl transition-colors">
            <div className="pr-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{label}</h4>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    const tabs = [
        { id: 'general', label: 'General', icon: Globe, desc: 'Basic platform info' },
        { id: 'security', label: 'Security & Auth', icon: Shield, desc: 'Access control' },
        { id: 'email', label: 'SMTP & Email', icon: Mail, desc: 'Notification server' },
        { id: 'advanced', label: 'Advanced', icon: Server, desc: 'Maintenance & cache' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>

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
                            <Settings className="w-8 h-8 text-blue-600" /> System Settings
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Configure platform behavior, security protocols, and server variables.
                        </p>
                    </div>
                    <div className="w-full lg:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 text-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

                    {/* --- Sidebar Navigation --- */}
                    <aside className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-6 shadow-sm h-fit">
                        <div className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${activeTab === tab.id
                                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 border shadow-sm'
                                            : 'bg-transparent border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 border hover:border-gray-200 dark:hover:border-slate-700/50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300'
                                        }`}>
                                        <tab.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight">{tab.label}</p>
                                        <p className="text-[10px] font-semibold opacity-70 uppercase tracking-widest mt-1">{tab.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* --- Content Area --- */}
                    <main className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 sm:p-10 shadow-sm min-h-[500px]">

                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">General Details</h2>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Update your platform's basic information.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Platform Name</label>
                                        <input
                                            value={settings.platformName}
                                            onChange={e => handleChange('platformName', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                                        <input
                                            value={settings.supportEmail}
                                            onChange={e => handleChange('supportEmail', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Default Time Zone</label>
                                        <select
                                            value={settings.timeZone}
                                            onChange={e => handleChange('timeZone', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                                        >
                                            <option>Africa/Cairo (EET)</option>
                                            <option>UTC (Coordinated Universal Time)</option>
                                            <option>America/New_York (EST)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Max Upload Size (MB)</label>
                                        <input
                                            type="number"
                                            value={settings.maxUploadSize}
                                            onChange={e => handleChange('maxUploadSize', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-500" /> Security & Authentication</h2>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Manage user access and safety protocols.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ToggleSwitch
                                        label="Allow New Registrations"
                                        description="Enable or disable public signups."
                                        checked={settings.allowRegistration}
                                        onChange={(val) => handleChange('allowRegistration', val)}
                                    />
                                    <ToggleSwitch
                                        label="Require Email Verification"
                                        description="Force users to verify emails before login."
                                        checked={settings.requireEmailVerification}
                                        onChange={(val) => handleChange('requireEmailVerification', val)}
                                    />
                                    <ToggleSwitch
                                        label="Enforce 2FA (Admins)"
                                        description="Require Two-Factor Auth for admin accounts."
                                        checked={settings.enforceTwoFactor}
                                        onChange={(val) => handleChange('enforceTwoFactor', val)}
                                    />
                                    <div className="space-y-2 p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl">
                                        <label className="block text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Session Timeout (Minutes)</label>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-3">Auto-logout inactive users.</p>
                                        <input
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={e => handleChange('sessionTimeout', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Tab */}
                        {activeTab === 'email' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" /> SMTP Configuration</h2>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Setup outbound email server for system notifications.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">SMTP Host</label>
                                        <input
                                            value={settings.smtpHost}
                                            onChange={e => handleChange('smtpHost', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.smtpPort}
                                            onChange={e => handleChange('smtpPort', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner font-mono"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">SMTP Username / Email</label>
                                        <input
                                            value={settings.smtpUser}
                                            onChange={e => handleChange('smtpUser', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all shadow-inner font-mono"
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-4">
                                        <button className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700 shadow-sm">
                                            Send Test Email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Tab */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-1 flex items-center gap-2"><Database className="w-5 h-5" /> Danger Zone & Advanced</h2>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">System critical operations. Proceed with caution.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest">Maintenance Mode</h4>
                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400/80 mt-1">Temporarily disable public access to the platform. Admins can still login.</p>
                                        </div>
                                        <button
                                            onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shrink-0 focus:outline-none border-2 ${settings.maintenanceMode ? 'bg-amber-500 border-amber-500' : 'bg-amber-200 dark:bg-slate-800 border-transparent dark:border-slate-700'}`}
                                        >
                                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-black text-red-900 dark:text-red-500 uppercase tracking-widest">Clear System Cache</h4>
                                            <p className="text-sm font-semibold text-red-700 dark:text-red-400/80 mt-1">Frees up server memory. Platform may be slightly slower for a few minutes.</p>
                                        </div>
                                        <button onClick={handleClearCache} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 shrink-0">
                                            Clear Cache
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};