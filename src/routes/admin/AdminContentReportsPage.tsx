/**
 * Admin Content Reports Page
 * 
 * A comprehensive moderation dashboard for administrators to manage
 * content reports submitted by students. Features:
 * - Dashboard statistics with cards
 * - Filterable & searchable reports table
 * - Right-side detail drawer
 * - Moderation action buttons with confirmation dialogs
 * - Charts for report distribution
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Search, Filter, ChevronDown, ChevronRight, 
    FileText, Video, Image as ImageIcon, File, X, Eye, 
    CheckCircle, XCircle, Clock, Shield, Loader2,
    BarChart3, TrendingUp, AlertCircle, Flag
} from 'lucide-react';
import { toast } from 'sonner';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    mockContentReports, getReportStats, getUniqueCourses,
    REPORT_REASONS,
    type ContentReport, type ReportStatus, type ReportReason, type MaterialType
} from '@/mocks/contentReports';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, { color: string; bg: string; icon: React.ElementType }> = {
    Pending: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20', icon: Clock },
    'Under Review': { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/20', icon: Eye },
    Approved: { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20', icon: CheckCircle },
    Rejected: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20', icon: XCircle },
};

const StatusBadge = ({ status }: { status: ReportStatus }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};

// ─── Material Type Icon ──────────────────────────────────────────────────────

const MaterialIcon = ({ type }: { type: MaterialType }) => {
    const icons: Record<MaterialType, { icon: React.ElementType; color: string; bg: string }> = {
        Video: { icon: Video, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        PDF: { icon: FileText, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
        Document: { icon: File, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        Image: { icon: ImageIcon, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    };
    const config = icons[type];
    const Icon = config.icon;
    return (
        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center ${config.color}`}>
            <Icon className="w-4.5 h-4.5" />
        </div>
    );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    trend?: string;
}

const StatCard = ({ label, value, icon: Icon, color, bgColor, trend }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all group"
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {label}
                </p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h3>
                {trend && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {trend}
                    </p>
                )}
            </div>
            <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center ${color} group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    </motion.div>
);

// ─── Report Detail Drawer ────────────────────────────────────────────────────

interface ReportDrawerProps {
    report: ContentReport | null;
    isOpen: boolean;
    onClose: () => void;
    onAction: (reportId: string, newStatus: ReportStatus) => void;
}

const ReportDrawer = ({ report, isOpen, onClose, onAction }: ReportDrawerProps) => {
    const [confirmAction, setConfirmAction] = useState<{ status: ReportStatus; title: string; description: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Lock body scroll when open to prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleConfirmAction = async () => {
        if (!report || !confirmAction) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onAction(report.id, confirmAction.status);
        setIsProcessing(false);
        setConfirmAction(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && report && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/50 z-[100]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            Report Details
                                        </h2>
                                        <p className="text-xs font-semibold text-slate-400">{report.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Status</span>
                                    <StatusBadge status={report.status} />
                                </div>

                                {/* Report Information */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-red-500" />
                                        Report Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Report ID</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Date Submitted</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(report.submittedDate)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Reason</p>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-500/20">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {report.reason}
                                            </span>
                                        </div>
                                        {report.additionalComment && (
                                            <div className="col-span-2">
                                                <p className="text-xs font-bold text-slate-400 mb-1">Additional Comment</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                                    {report.additionalComment}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reporter Info */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        Reporter
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Name</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.reporterName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Email</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{report.reporterEmail}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reported Material */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        Reported Material
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Material Name</p>
                                            <div className="flex items-center gap-3">
                                                <MaterialIcon type={report.materialType} />
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.materialName}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Material Type</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.materialType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Course Name</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.courseName}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Instructor Name</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.instructorName}</p>
                                        </div>
                                    </div>

                                    {/* Preview Section */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-2">Preview</p>
                                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
                                            {report.materialType === 'Video' && (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-purple-500" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400">Video Thumbnail</p>
                                                </>
                                            )}
                                            {report.materialType === 'PDF' && (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                                                        <FileText className="w-8 h-8 text-red-500" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400">PDF Document</p>
                                                </>
                                            )}
                                            {report.materialType === 'Document' && (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                                        <File className="w-8 h-8 text-blue-500" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400">Document Preview</p>
                                                </>
                                            )}
                                            {report.materialType === 'Image' && (
                                                <>
                                                    <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-emerald-500" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400">Image Preview</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                    Moderation Actions
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {report.status !== 'Under Review' && (
                                        <button
                                            onClick={() => setConfirmAction({
                                                status: 'Under Review',
                                                title: 'Mark Under Review',
                                                description: 'This report will be marked as under review. The content will remain available while being reviewed.',
                                            })}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Mark Under Review
                                        </button>
                                    )}
                                    {report.status !== 'Rejected' && (
                                        <button
                                            onClick={() => setConfirmAction({
                                                status: 'Rejected',
                                                title: 'Keep Content',
                                                description: 'This action means the content does not violate our guidelines. The report will be marked as rejected.',
                                            })}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Keep Content
                                        </button>
                                    )}
                                    {report.status !== 'Approved' && (
                                        <button
                                            onClick={() => setConfirmAction({
                                                status: 'Approved',
                                                title: 'Remove Content',
                                                description: 'This action means the content violates our guidelines and should be removed. This action cannot be undone.',
                                            })}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all active:scale-95"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Remove Content
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.title || ''}
                description={confirmAction?.description || ''}
                confirmText={confirmAction?.status === 'Approved' ? 'Remove Content' : 'Confirm'}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                isPending={isProcessing}
                variant={confirmAction?.status === 'Approved' ? 'danger' : confirmAction?.status === 'Under Review' ? 'info' : 'warning'}
                icon={confirmAction?.status === 'Approved' ? XCircle : confirmAction?.status === 'Under Review' ? Eye : CheckCircle}
            />
        </>
    );
};

// ─── Chart Colors ────────────────────────────────────────────────────────────

const CHART_COLORS = {
    pending: '#F59E0B',
    underReview: '#3B82F6',
    approved: '#10B981',
    rejected: '#EF4444',
};

const REASON_COLORS = [
    '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7',
];

// ─── Main Page Component ─────────────────────────────────────────────────────

export const AdminContentReportsPage = () => {
    const [reports, setReports] = useState<ContentReport[]>(mockContentReports);
    const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'All'>('All');
    const [reasonFilter, setReasonFilter] = useState<ReportReason | 'All'>('All');
    const [courseFilter, setCourseFilter] = useState<string>('All');
    const [showFilters, setShowFilters] = useState(false);

    const stats = useMemo(() => getReportStats(reports), [reports]);
    const uniqueCourses = useMemo(() => getUniqueCourses(reports), [reports]);

    // Filter reports
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesSearch = searchQuery
                ? report.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  report.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  report.id.toLowerCase().includes(searchQuery.toLowerCase())
                : true;
            const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
            const matchesReason = reasonFilter === 'All' || report.reason === reasonFilter;
            const matchesCourse = courseFilter === 'All' || report.courseName === courseFilter;
            return matchesSearch && matchesStatus && matchesReason && matchesCourse;
        });
    }, [reports, searchQuery, statusFilter, reasonFilter, courseFilter]);

    // Handle report status change
    const handleReportAction = (reportId: string, newStatus: ReportStatus) => {
        setReports(prev =>
            prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
        setSelectedReport(prev => prev?.id === reportId ? { ...prev, status: newStatus } : prev);
        const statusMessages: Record<ReportStatus, string> = {
            'Under Review': 'Report marked as under review.',
            'Approved': 'Content has been flagged for removal.',
            'Rejected': 'Report rejected — content kept.',
            'Pending': '',
        };
        toast.success(statusMessages[newStatus]);
    };

    // Chart data: Status Distribution
    const statusChartData = [
        { name: 'Pending', value: stats.pending, color: CHART_COLORS.pending },
        { name: 'Under Review', value: stats.underReview, color: CHART_COLORS.underReview },
        { name: 'Approved', value: stats.approved, color: CHART_COLORS.approved },
        { name: 'Rejected', value: stats.rejected, color: CHART_COLORS.rejected },
    ].filter(item => item.value > 0);

    // Chart data: Reason Distribution (top 6)
    const reasonChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach(r => {
            counts[r.reason] = (counts[r.reason] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name: name.split(' / ')[0].split(' or ')[0], value }));
    }, [reports]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const openDrawer = (report: ContentReport) => {
        setSelectedReport(report);
        setIsDrawerOpen(true);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setReasonFilter('All');
        setCourseFilter('All');
    };

    const hasActiveFilters = statusFilter !== 'All' || reasonFilter !== 'All' || courseFilter !== 'All' || searchQuery !== '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* ─── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-amber-500" /> Content Reports
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Review and moderate reported course materials to maintain platform safety.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm font-bold">
                            {stats.pending} Pending
                        </span>
                    </div>
                </div>

                {/* ─── Stats Cards ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Reports"
                        value={stats.total}
                        icon={BarChart3}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                    />
                    <StatCard
                        label="Pending Reports"
                        value={stats.pending}
                        icon={Clock}
                        color="text-amber-500"
                        bgColor="bg-amber-500/10"
                        trend="Needs attention"
                    />
                    <StatCard
                        label="Approved (Removed)"
                        value={stats.approved}
                        icon={CheckCircle}
                        color="text-green-500"
                        bgColor="bg-green-500/10"
                    />
                    <StatCard
                        label="Rejected (Kept)"
                        value={stats.rejected}
                        icon={XCircle}
                        color="text-red-500"
                        bgColor="bg-red-500/10"
                    />
                </div>

                {/* ─── Charts ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Status Distribution</h2>
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                                Breakdown of reports by current status
                            </p>
                        </div>
                        <div className="h-[280px] w-full">
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={3}
                                            dataKey="value"
                                            animationDuration={1000}
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: '12px',
                                                border: 'none',
                                                color: '#fff',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={10}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reason Distribution */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Top Report Reasons</h2>
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                                Most common reasons for content reports
                            </p>
                        </div>
                        <div className="h-[280px] w-full">
                            {reasonChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reasonChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: '12px',
                                                border: 'none',
                                                color: '#fff',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Bar dataKey="value" name="Reports" radius={[0, 8, 8, 0]} animationDuration={1000}>
                                            {reasonChartData.map((_entry, index) => (
                                                <Cell key={`bar-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Filters & Search ───────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-slate-700/50">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            {/* Search */}
                            <div className="relative w-full lg:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by material name..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 dark:focus:border-blue-500/30 transition-all"
                                    id="content-reports-search"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                {/* Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                                        showFilters
                                            ? 'border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                </button>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Dropdowns */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'All')}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                id="filter-status"
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>

                                        {/* Reason Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Report Type</label>
                                            <select
                                                value={reasonFilter}
                                                onChange={(e) => setReasonFilter(e.target.value as ReportReason | 'All')}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                id="filter-reason"
                                            >
                                                <option value="All">All Types</option>
                                                {REPORT_REASONS.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Course Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Course</label>
                                            <select
                                                value={courseFilter}
                                                onChange={(e) => setCourseFilter(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                id="filter-course"
                                            >
                                                <option value="All">All Courses</option>
                                                {uniqueCourses.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ─── Reports Table ──────────────────────────────────────── */}
                    <div className="overflow-x-auto">
                        <table className="w-full" id="content-reports-table">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/50">
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Report ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Material</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Course</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Reason</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">Reporter</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <AlertCircle className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-500 dark:text-slate-400">No reports found</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">Try adjusting your filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                            onClick={() => openDrawer(report)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{report.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <MaterialIcon type={report.materialType} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                                                            {report.materialName}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 lg:hidden">{report.courseName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <p className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate max-w-[180px]">
                                                    {report.courseName}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 truncate max-w-[150px] block">
                                                    {report.reason}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden xl:table-cell">
                                                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                                    {report.reporterName}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <p className="text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                    {formatDate(report.submittedDate)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={report.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDrawer(report); }}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    {filteredReports.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                Showing {filteredReports.length} of {reports.length} reports
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Detail Drawer */}
            <ReportDrawer
                report={selectedReport}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onAction={handleReportAction}
            />
        </div>
    );
};
