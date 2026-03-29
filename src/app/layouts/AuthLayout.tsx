import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 dark:from-[#0a0e1a] dark:via-[#0d1528] dark:to-[#120e24] transition-colors">
            {/* Decorative background blobs */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#0F5A9C]/[0.07] dark:bg-[#0F5A9C]/[0.12] blur-[100px]" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#74388B]/[0.07] dark:bg-[#74388B]/[0.12] blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#2D5F8B]/[0.04] dark:bg-[#2D5F8B]/[0.08] blur-[120px]" />
            </div>

            {/* Subtle grid pattern */}
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.015] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle, #0F5A9C 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};