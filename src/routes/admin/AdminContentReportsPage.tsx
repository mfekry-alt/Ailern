/**
 * Admin Content Reports Page
 * 
 * A premium moderation dashboard for administrators to manage content reports.
 * Uses real API data from GET /api/Users/admin/content-reports
 * and supports resolving/approving reports via PUT /api/Users/admin/content-reports?reportid={reportId}
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer } from '@/components/ui/Drawer';
import { getContentReports, getContentReportDetails, rejectContentReport } from '@/api/services/content-reports.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Loader2,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Flag,
  RefreshCw,
  Sparkles,
  HelpCircle,
  BookOpen,
  Search,
  ShieldAlert,
  MessageSquareX,
  Users,
  Copyright,
  Scale,
  ShieldCheck,
  HeartCrack,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useReportsDashboard, useApproveReport } from '@/hooks/useContentReports';
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

// --- Helper Components & drawer for Content Reports Table ---

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" /></td>
        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto" /></td>
        <td className="px-6 py-4 hidden xl:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28 mx-auto" /></td>
        <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36 mx-auto" /></td>
        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mx-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-16 mx-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-28 mx-auto" /></td>
        <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-8 ml-auto" /></td>
    </tr>
);const StatusBadge = ({ status }: { status: string }) => {
    let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    const cleanStatus = status.replace(/\s+/g, '').toLowerCase();
    if (cleanStatus === 'pending') {
        styles = 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
    } else if (cleanStatus === 'underreview') {
        styles = 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
    } else if (cleanStatus === 'approved') {
        styles = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    } else if (cleanStatus === 'rejected') {
        styles = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles}`}>
            {status}
        </span>
    );
};

const MaterialIcon = ({ filename }: { filename?: string }) => {
    const ext = filename?.toLowerCase().split('.').pop() || '';
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
        return <Video className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-emerald-500" />;
};
const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    disabled?: boolean;
}

const PageSizeSelector = ({ pageSize, onPageSizeChange, disabled }: PageSizeSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = [5, 10, 25, 50];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-[10px] font-black text-gray-700 dark:text-slate-200 hover:border-[#21A9FF]/50 transition-all shadow-sm group disabled:opacity-50"
            >
                {pageSize} / page
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onPageSizeChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-black transition-all ${pageSize === option
                                    ? 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {option} / page
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

interface ReportDrawerProps {
    report: any;
    isOpen: boolean;
    onClose: () => void;
    onAction: () => void;
}

const ReportDrawer = ({ report, isOpen, onClose, onAction }: ReportDrawerProps) => {
    const { data: detail, isLoading, error } = useQuery({
        queryKey: ['report-detail', report?.reportId],
        queryFn: () => report ? getContentReportDetails(report.reportId) : null,
        enabled: !!report && isOpen,
    });

    const [isMutating, setIsMutating] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    useEffect(() => {
        setPreviewError(false);
    }, [report?.reportId]);

    const handleReject = async () => {
        if (!report) return;
        setIsMutating(true);
        try {
            await rejectContentReport(report.reportId);
            toast.success('Report rejected successfully (content kept).');
            onAction();
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to reject report.');
        } finally {
            setIsMutating(false);
        }
    };

    const approveMutation = useApproveReport();

    const handleApprove = async () => {
        if (!report) return;
        setIsMutating(true);
        approveMutation.mutate(report.reportId, {
            onSuccess: () => {
                toast.success('Report resolved/approved successfully.');
                onAction();
                onClose();
            },
            onError: (err: any) => {
                toast.error(err?.message || 'Failed to resolve report.');
            },
            onSettled: () => {
                setIsMutating(false);
            }
        });
    };

    const formatDetailedDate = (dateString?: string) => {
        if (!dateString) return '—';
        try {
            const d = new Date(dateString);
            return d.toLocaleString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ' at');
        } catch (e) {
            return dateString;
        }
    };

    const renderDetailedStatus = (status: string) => {
        let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        let Icon = Clock;
        const cleanStatus = status.replace(/\s+/g, '').toLowerCase();
        
        if (cleanStatus === 'pending') {
            styles = 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
            Icon = Clock;
        } else if (cleanStatus === 'underreview') {
            styles = 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
            Icon = Eye;
        } else if (cleanStatus === 'approved') {
            styles = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
            Icon = CheckCircle;
        } else if (cleanStatus === 'rejected') {
            styles = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
            Icon = XCircle;
        }
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles}`}>
                <Icon className="w-3.5 h-3.5" />
                {status}
            </span>
        );
    };

    const customTitle = (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-100 dark:border-amber-900/30">
                <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">Report Details</h2>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 block">
                    {report?.reportId}
                </span>
            </div>
        </div>
    );

    const ext = detail?.materialName?.toLowerCase().split('.').pop() || '';
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isVideo = ['mp4', 'mkv', 'avi', 'mov'].includes(ext);

    const footerContent = detail ? (
        <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Moderation Actions
            </span>
            <div className="flex gap-3">
                <button
                    onClick={handleReject}
                    disabled={isMutating}
                    className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                    {isMutating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCircle className="w-4 h-4" />
                    )}
                    Keep Content
                </button>
                <button
                    onClick={handleApprove}
                    disabled={isMutating}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                >
                    {isMutating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <XCircle className="w-4 h-4" />
                    )}
                    Remove Content
                </button>
            </div>
        </div>
    ) : null;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={customTitle} footer={footerContent}>
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <p className="text-sm font-semibold text-red-500">Failed to load details.</p>
                ) : detail ? (
                    <div className="space-y-6">
                        {/* Current Status Row */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Current Status
                            </span>
                            {renderDetailedStatus(detail.reportStatus || 'Under Review')}
                        </div>

                        {/* Report Information Card */}
                        <div className="p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
                            <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 text-xs tracking-wider border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-1">
                                <Flag className="w-4 h-4 text-rose-500" />
                                <span>REPORT INFORMATION</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Report ID
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {detail.reportId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Date Submitted
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {formatDetailedDate(detail.submittedAt)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Reason
                                </p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {detail.reportType}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Additional Comment
                                </p>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/20 dark:border-slate-800/30 leading-relaxed">
                                    {detail.reportComment || 'No additional details provided.'}
                                </p>
                            </div>
                        </div>

                        {/* Reporter Card */}
                        <div className="p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
                            <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 text-xs tracking-wider border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-1">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span>REPORTER</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Name
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {detail.reporterName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Email
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={detail.reporterEmail}>
                                        {detail.reporterEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reported Material Card */}
                        <div className="p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
                            <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 text-xs tracking-wider border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-1">
                                <FileText className="w-4 h-4 text-violet-500" />
                                <span>REPORTED MATERIAL</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                                    Material Name
                                </p>
                                <div className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/20 dark:border-slate-800/30">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                                        isPdf 
                                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' 
                                            : isVideo 
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' 
                                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        <MaterialIcon filename={detail.materialName} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={detail.materialName}>
                                        {detail.materialName}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Material Type
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {detail.materialType}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Course Name
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {detail.courseName}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Instructor Name
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {detail.instructorName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Instructor Email
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={detail.instructorEmail}>
                                        {detail.instructorEmail || '—'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                    Preview
                                </p>
                                {isImage && detail.previewMaterialUrl && !previewError ? (
                                    <div className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 flex justify-center items-center">
                                        <img 
                                            src={detail.previewMaterialUrl} 
                                            alt="Preview of flagged material" 
                                            className="max-h-48 max-w-full rounded-lg object-contain shadow-sm"
                                            onError={() => setPreviewError(true)}
                                        />
                                    </div>
                                ) : isVideo && detail.previewMaterialUrl && !previewError ? (
                                    <div className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-2 flex justify-center items-center">
                                        <video 
                                            src={detail.previewMaterialUrl} 
                                            controls 
                                            className="w-full rounded-lg object-contain shadow-sm max-h-60 bg-black focus:outline-none"
                                            onError={() => setPreviewError(true)}
                                        />
                                    </div>
                                ) : isPdf && detail.previewMaterialUrl && !previewError ? (
                                    <div className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-2 flex flex-col gap-2">
                                        <iframe 
                                            src={detail.previewMaterialUrl} 
                                            title="PDF Preview"
                                            className="w-full h-60 rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
                                            onError={() => setPreviewError(true)}
                                        />
                                        <a 
                                            href={detail.previewMaterialUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg text-center transition-colors block border border-slate-200 dark:border-slate-700"
                                        >
                                            Open PDF in New Tab
                                        </a>
                                    </div>
                                ) : (
                                    <div className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                            isPdf 
                                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' 
                                                : isVideo 
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' 
                                                    : isImage 
                                                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                                                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                            {isPdf ? (
                                                <FileText className="w-6 h-6" />
                                            ) : isVideo ? (
                                                <Video className="w-6 h-6" />
                                            ) : isImage ? (
                                                <ImageIcon className="w-6 h-6" />
                                            ) : (
                                                <File className="w-6 h-6" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {isPdf ? 'PDF Document' : isVideo ? 'Video Document' : isImage ? 'Image File' : 'Document File'}
                                        </span>
                                        {detail.previewMaterialUrl && (
                                            <a 
                                                href={detail.previewMaterialUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200/50 dark:border-slate-700/50"
                                            >
                                                Open/Download Material
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No report details available.</p>
                )}
            </div>
        </Drawer>
    );
};

const REPORT_TYPE_OPTIONS = [
    { value: 'All Types', label: 'All Types', icon: Flag },
    { value: 'SexualContent', label: 'Sexual Content', icon: HeartCrack },
    { value: 'HateSpeech', label: 'Hate Speech', icon: MessageSquareX },
    { value: 'ReligiousInsult', label: 'Religious Insult', icon: AlertCircle },
    { value: 'Bullying', label: 'Bullying', icon: Users },
    { value: 'Misinformation', label: 'Misinformation', icon: HelpCircle },
    { value: 'CopyrightViolation', label: 'Copyright Violation', icon: Copyright },
    { value: 'IllegalActivities', label: 'Illegal Activities', icon: Scale },
    { value: 'Terrorism', label: 'Terrorism', icon: ShieldAlert },
    { value: 'ChildSafetyConcerns', label: 'Child Safety Concerns', icon: ShieldCheck },
    { value: 'Other', label: 'Other', icon: HelpCircle },
];

export const AdminContentReportsPage = () => {
    const { data, isLoading, error, refetch, isFetching } = useReportsDashboard();
    // States for individual content reports table
    const [pageNo, setPageNo] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch individual reports with pagination and filtering
    const {
        data: reportsData,
        isLoading: isReportsLoading,
        error: reportsError,
        refetch: fetchReports,
    } = useQuery({
        queryKey: ['content-reports', pageNo, pageSize, typeFilter],
        queryFn: () => getContentReports({
            pageNo,
            pageSize,
            type: typeFilter === 'All Types' ? null : typeFilter
        }),
    });

    const filteredReports = useMemo(() => {
        const items = reportsData?.items || [];
        if (!searchTerm.trim()) return items;
        return items.filter(report => 
            report.material.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
    }, [reportsData, searchTerm]);
    const pagination = reportsData || null;
    const reportsErrorMessage = reportsError ? (reportsError instanceof Error ? reportsError.message : 'Failed to fetch content reports') : null;

    const openDrawer = (report: any) => {
        setSelectedReport(report);
        setIsDrawerOpen(true);
    };

    const handleReportAction = () => {
        fetchReports();
        refetch();
    };

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


        {/* ─── Filters & Search ───────────────────────────────────────── */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/20 dark:bg-slate-900/20">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-500" /> Individual Reports
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Browse and manage individual content report submissions
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
              {/* Search by Material Name */}
              <div className="w-full sm:w-72">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Search Material
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by material name..."
                    className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all shadow-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Report Type Dropdown */}
              <div className="w-full sm:w-72 relative">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Report Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-left shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const Icon = REPORT_TYPE_OPTIONS.find(opt => opt.value === typeFilter)?.icon || Flag;
                        return <Icon className="w-4 h-4 text-indigo-500 shrink-0" />;
                      })()}
                      {REPORT_TYPE_OPTIONS.find(opt => opt.value === typeFilter)?.label || typeFilter}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Overlay to close when clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      
                      {/* Menu Dropdown Container */}
                      <div className="absolute top-full right-0 mt-2 w-full min-w-[240px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl z-50 p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in-50 slide-in-from-top-2 duration-150">
                        {REPORT_TYPE_OPTIONS.map((option) => {
                          const isSelected = option.value === typeFilter;
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setTypeFilter(option.value);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                                {option.label}
                              </span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Reports Table ──────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full" id="content-reports-table">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Reason
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">
                    Reporter
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Comment
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48">
                    Moderation Actions
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isReportsLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <SkeletonRow key={idx} />
                    ))}
                  </>
                ) : reportsErrorMessage ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{reportsErrorMessage}</p>
                        <button
                          onClick={() => fetchReports()}
                          className="mt-2 px-5 py-2.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-2xl font-bold hover:bg-red-200 dark:hover:bg-red-500/30 transition-all active:scale-95 shadow-sm"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          No reports found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Try adjusting your filters or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.reportId}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                      onClick={() => openDrawer(report)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                            <MaterialIcon filename={report.material} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {report.material}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 truncate max-w-[150px]">
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden xl:table-cell">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {report.reporter}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                          {report.comment || 'No comment'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(report.date)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(report);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 border-none"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(report);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
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

          {/* --- Pagination --- */}
          {!isReportsLoading && !reportsErrorMessage && pagination && filteredReports.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-4 border-t border-slate-200/50 dark:border-slate-800/50 gap-4 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Results
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Showing{' '}
                    <span className="text-[#21A9FF]">
                      {pagination.start} - {pagination.end}
                    </span>{' '}
                    of{' '}
                    <span className="text-slate-900 dark:text-white font-black">
                      {pagination.totalResults}
                    </span>{' '}
                    reports
                  </p>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <PageSizeSelector
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  disabled={isReportsLoading}
                />
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                <button
                  onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                  disabled={pageNo === 1 || isReportsLoading}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="px-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Page
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{pageNo}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    of
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {pagination.pagesCount}
                  </span>
                </div>

                <button
                  onClick={() => setPageNo((p) => Math.min(pagination.pagesCount, p + 1))}
                  disabled={pageNo === pagination.pagesCount || isReportsLoading}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
