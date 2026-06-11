/**
 * Admin Content Reports Page
 * 
 * A premium moderation dashboard for administrators to manage content reports.
 * Uses real API data from GET /api/Users/admin/content-reports
 * and supports resolving/approving reports via PUT /api/Users/admin/content-reports?reportid={reportId}
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, RefreshCw, BarChart3, Clock, CheckCircle, 
    XCircle, Shield, Loader2, BookOpen, AlertCircle, Sparkles, HelpCircle, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useReportsDashboard, useApproveReport } from '@/hooks/useContentReports';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { REPORT_TYPE_LABELS } from '@/types/api.types';

// ─── Stat Card Component ─────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description?: string;
    glowColor: string;
}

const StatCard = ({ label, value, icon: Icon, color, bgColor, description, glowColor }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 relative group overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity duration-300 -mr-10 -mt-10 ${glowColor}`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {label}
                </p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                {description && (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        {description}
                    </p>
                )}
            </div>
            <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center ${color} group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    </motion.div>
);

// ─── Skeleton Loader Component ───────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-32 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50" />
);

const SkeletonChart = () => (
    <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-[380px] rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50" />
);

const SkeletonTable = () => (
    <div className="space-y-4">
        <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-12 rounded-xl" />
        <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-16 rounded-xl" />
        <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-16 rounded-xl" />
        <div className="bg-slate-100/50 dark:bg-slate-800/30 animate-pulse h-16 rounded-xl" />
    </div>
);

// ─── Chart Colors ────────────────────────────────────────────────────────────

const CHART_COLORS = {
    pending: '#F59E0B',      // Amber
    underReview: '#3B82F6',  // Blue
    approved: '#10B981',     // Green
    rejected: '#EF4444',     // Red
};

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-1">
                <p className="font-black text-white truncate max-w-xs">{payload[0].name}</p>
                <p className="font-bold text-indigo-400">
                    Count: <span className="text-white text-sm font-black">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const AdminContentReportsPage = () => {
    const { data, isLoading, error, refetch, isFetching } = useReportsDashboard();
    const approveMutation = useApproveReport();

    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // ─── Chart Data Formatting ───────────────────────────────────────────────

    const statusChartData = useMemo(() => {
        if (!data) return [];
        return [
            { name: 'Pending', value: data.pendingReports || 0, color: CHART_COLORS.pending },
            { name: 'Under Review', value: data.underReviewReports || 0, color: CHART_COLORS.underReview },
            { name: 'Approved', value: data.approvedReports || 0, color: CHART_COLORS.approved },
            { name: 'Rejected', value: data.rejectedReports || 0, color: CHART_COLORS.rejected },
        ].filter(item => item.value > 0);
    }, [data]);

    const reasonChartData = useMemo(() => {
        if (!data?.topReportReasons) return [];
        return Object.entries(data.topReportReasons)
            .map(([reason, count]) => {
                const friendlyLabel = REPORT_TYPE_LABELS[reason as keyof typeof REPORT_TYPE_LABELS] || reason;
                return { name: friendlyLabel, value: count };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [data]);

    const topMaterialsChartData = useMemo(() => {
        if (!data?.topReportForMaterial) return [];
        return Object.entries(data.topReportForMaterial)
            .map(([material, count]) => ({ name: material, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [data]);

    // Materials list for the table
    const materialsList = useMemo(() => {
        if (!data?.topReportForMaterial) return [];
        return Object.entries(data.topReportForMaterial)
            .map(([materialName, count]) => ({ materialName, count }))
            .sort((a, b) => b.count - a.count); // Show most reported at the top
    }, [data]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const handleApproveClick = (materialName: string) => {
        setSelectedMaterial(materialName);
        setIsConfirmOpen(true);
    };

    const handleConfirmApprove = () => {
        if (!selectedMaterial) return;

        approveMutation.mutate(selectedMaterial, {
            onSuccess: () => {
                toast.success(`Content report for "${selectedMaterial}" resolved successfully.`);
                setIsConfirmOpen(false);
                setSelectedMaterial(null);
            },
            onError: (err: any) => {
                const message = err?.response?.data?.message || err?.message || 'Failed to resolve report.';
                toast.error(message);
            }
        });
    };

    // ─── Render States ───────────────────────────────────────────────────────

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl"
                >
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        Failed to Load Dashboard
                    </h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">
                        An error occurred while fetching content reports data. Please try again.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all mx-auto shadow-lg shadow-blue-500/25 active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Loading
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-amber-500" /> Content Reports
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
                            Review and moderate reported course materials using aggregated real-time metrics.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading || isFetching}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <StatCard
                                label="Total Reports"
                                value={data?.totalReports || 0}
                                icon={BarChart3}
                                color="text-blue-500"
                                bgColor="bg-blue-500/10"
                                glowColor="bg-blue-500"
                            />
                            <StatCard
                                label="Under Review"
                                value={data?.underReviewReports || 0}
                                icon={Eye}
                                color="text-amber-500"
                                bgColor="bg-amber-500/10"
                                description="Currently reviewing"
                                glowColor="bg-amber-500"
                            />
                            <StatCard
                                label="Rejected (Kept)"
                                value={data?.rejectedReports || 0}
                                icon={XCircle}
                                color="text-red-500"
                                bgColor="bg-red-500/10"
                                glowColor="bg-red-500"
                            />
                        </>
                    )}
                </div>

                {/* Dashboard Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {isLoading ? (
                        <>
                            <SkeletonChart />
                            <SkeletonChart />
                            <SkeletonChart />
                        </>
                    ) : (
                        <>
                            {/* Status Distribution */}
                            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Status Distribution</h2>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 mb-6">
                                        Breakdown of reports by current status
                                    </p>
                                </div>
                                <div className="h-[260px] w-full">
                                    {statusChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={65}
                                                    outerRadius={95}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    animationDuration={1000}
                                                >
                                                    {statusChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
                                            <p className="text-sm font-medium">No status data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Report Reasons */}
                            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Top Report Reasons</h2>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 mb-6">
                                        Most common reasons content is flagged
                                    </p>
                                </div>
                                <div className="h-[260px] w-full">
                                    {reasonChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={reasonChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} layout="vertical">
                                                <defs>
                                                    <linearGradient id="reasonGrad" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#6366F1" />
                                                        <stop offset="100%" stopColor="#EC4899" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} width={140} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" name="Reports" radius={[0, 8, 8, 0]} fill="url(#reasonGrad)" animationDuration={1000} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
                                            <p className="text-sm font-medium">No reasons statistics available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Most Reported Materials Premium Chart */}
                            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                                        Most Reported
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 mb-6">
                                        Materials with highest report volume
                                    </p>
                                </div>
                                <div className="h-[260px] w-full">
                                    {topMaterialsChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topMaterialsChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} layout="vertical">
                                                <defs>
                                                    <linearGradient id="materialGrad" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#3B82F6" />
                                                        <stop offset="100%" stopColor="#10B981" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} width={140} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" name="Reports count" radius={[0, 8, 8, 0]} fill="url(#materialGrad)" animationDuration={1000} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
                                            <p className="text-sm font-medium">No reported materials data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Most Reported Materials Table */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/20 dark:bg-slate-900/20">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Flagged Course Materials</h2>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                Summary of content pieces pending review sorted by frequency
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-2xl">
                            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                Aggregated view - actions apply to the material resource
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8">
                                <SkeletonTable />
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                                        <th className="text-left px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Material Description / File Name</th>
                                        <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40">Active Reports Count</th>
                                        <th className="text-right px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48">Moderation Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {materialsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                                        <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">All clean!</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">There are no reports submitted for any course materials currently.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        materialsList.map(({ materialName, count }) => (
                                            <tr
                                                key={materialName}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                                            <BookOpen className="w-4.5 h-4.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xl">
                                                                {materialName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                                        {count} reports
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveClick(materialName)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Resolve / Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Approval Dialog */}
            <ConfirmDialog
                open={isConfirmOpen}
                title="Approve & Resolve Material Reports"
                description={`This action approves and resolves all outstanding content reports for "${selectedMaterial}". Proceeding will signal compliance validation for this resource.`}
                confirmText="Resolve Reports"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmApprove}
                isPending={approveMutation.isPending}
                variant="info"
                icon={CheckCircle}
            />
        </div>
    );
};
