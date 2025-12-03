

export const AdminSettingsPage = () => {
    return (
        <div className="p-8 max-w-[1920px] mx-auto">
            <div className="flex flex-col gap-8 items-start w-full">
                {/* Header */}
                <div className="flex flex-col items-start w-full">
                    <h1 className="font-bold text-[36px] leading-[40px] tracking-[-0.9px] text-azure-8">
                        Settings
                    </h1>
                    <p className="text-[16px] leading-[24px] text-azure-46 mt-2">
                        Manage system settings and configurations
                    </p>
                </div>

                {/* Settings Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* General Settings */}
                    <div className="bg-white border border-azure-88 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 mb-4">
                            General Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Site Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue="Ailern LMS"
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Site Description
                                </label>
                                <textarea
                                    rows={3}
                                    defaultValue="Learning Management System"
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Settings */}
                    <div className="bg-white border border-azure-88 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 mb-4">
                            User Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Default Role
                                </label>
                                <select className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50">
                                    <option value="Student">Student</option>
                                    <option value="Instructor">Instructor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Registration Enabled
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50"
                                    />
                                    <span className="ml-2 text-[14px] text-azure-8">Allow new user registration</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Settings */}
                    <div className="bg-white border border-azure-88 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 mb-4">
                            Email Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    SMTP Server
                                </label>
                                <input
                                    type="text"
                                    placeholder="smtp.example.com"
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    SMTP Port
                                </label>
                                <input
                                    type="number"
                                    placeholder="587"
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white border border-azure-88 rounded-lg p-6">
                        <h2 className="font-bold text-[24px] leading-[32px] tracking-[-0.6px] text-azure-8 mb-4">
                            Security Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Session Timeout (minutes)
                                </label>
                                <input
                                    type="number"
                                    defaultValue="30"
                                    className="w-full px-3 py-2 border border-azure-88 rounded-md focus:ring-2 focus:ring-azure-50 focus:border-azure-50"
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">
                                    Password Requirements
                                </label>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50"
                                        />
                                        <span className="ml-2 text-[14px] text-azure-8">Minimum 8 characters</span>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="w-4 h-4 text-azure-50 border-azure-88 rounded focus:ring-azure-50"
                                        />
                                        <span className="ml-2 text-[14px] text-azure-8">Require uppercase letter</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end w-full">
                    <button className="bg-azure-50 hover:bg-[#0b6dd4] text-white font-medium text-[14px] leading-5 px-6 py-2 rounded-md transition-colors shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
