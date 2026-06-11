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
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import {
  getReportStats,
  REPORT_REASONS,
  type ContentReport,
  type ReportStatus,
  type ReportReason,
  type MaterialType,
} from '@/mocks/contentReports';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  getContentReports,
  getContentReportDetails,
  rejectContentReport,
} from '@/api/services/content-reports.service';
import type { ApiContentReportDetail } from '@/api/services/content-reports.service';
import { handleApiError } from '@/api/client';

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, { color: string; bg: string; icon: React.ElementType }> =
  {
    Pending: {
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20',
      icon: Clock,
    },
    'Under Review': {
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/20',
      icon: Eye,
    },
    Approved: {
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20',
      icon: CheckCircle,
    },
    Rejected: {
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20',
      icon: XCircle,
    },
  };

const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

// ─── Material Type Icon ──────────────────────────────────────────────────────

const MaterialIcon = ({ type }: { type: MaterialType }) => {
  const icons: Record<MaterialType, { icon: React.ElementType; color: string; bg: string }> = {
    Video: {
      icon: Video,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
    },
    PDF: {
      icon: FileText,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
    Document: {
      icon: File,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    Image: {
      icon: ImageIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
  };
  const config = icons[type];
  const Icon = config.icon;
  return (
    <div
      className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center ${config.color}`}
    >
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
      <div
        className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center ${color} group-hover:scale-110 transition-transform shadow-inner`}
      >
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
  const [confirmAction, setConfirmAction] = useState<{
    status: ReportStatus;
    title: string;
    description: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // API integration for details
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailedReport, setDetailedReport] = useState<ApiContentReportDetail | null>(null);

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

  // Fetch details on report selection
  useEffect(() => {
    if (isOpen && report) {
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const data = await getContentReportDetails(report.id);
          setDetailedReport(data);
        } catch (err) {
          const apiError = handleApiError(err);
          setDetailsError(apiError.message);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchDetails();
    } else {
      setDetailedReport(null);
      setDetailsError(null);
      setIsLoadingDetails(false);
    }
  }, [isOpen, report]);

  const handleConfirmAction = async () => {
    if (!report || !confirmAction) return;
    setIsProcessing(true);
    try {
      if (confirmAction.status === 'Rejected') {
        await rejectContentReport(report.id);
        toast.success('Report rejected — content kept.');
        onAction(report.id, 'Rejected');
        onClose();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        onAction(report.id, confirmAction.status);
        onClose();
      }
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
                {isLoadingDetails ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-500">Loading details...</p>
                  </div>
                ) : detailsError ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Failed to load details
                    </p>
                    <p className="text-xs text-slate-500">{detailsError}</p>
                  </div>
                ) : detailedReport ? (
                  <>
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current Status
                      </span>
                      <StatusBadge status={mapStatusFromApi(detailedReport.reportStatus)} />
                    </div>

                    {/* Report Information */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-500" />
                        Report Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Date Submitted</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatDate(detailedReport.submittedAt)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-bold text-slate-400 mb-1">Reason</p>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {mapReasonFromApi(detailedReport.reportType)}
                          </span>
                        </div>
                        {detailedReport.reportComment && (
                          <div className="col-span-2">
                            <p className="text-xs font-bold text-slate-400 mb-1">
                              Additional Comment
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                              {detailedReport.reportComment}
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
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {detailedReport.reporterName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Email</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {detailedReport.reporterEmail}
                          </p>
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
                            <MaterialIcon type={getMaterialType(detailedReport.materialName)} />
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {detailedReport.materialName}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Material Type</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {detailedReport.materialType}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">Course Name</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {detailedReport.courseName}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-bold text-slate-400 mb-1">Instructor Name</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {detailedReport.instructorName}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-bold text-slate-400 mb-1">Instructor Email</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {detailedReport.instructorEmail}
                          </p>
                        </div>
                      </div>

                      {/* Preview Section */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2">Preview</p>
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center overflow-hidden">
                          {detailedReport.previewMaterialUrl ? (
                            <>
                              {getMaterialType(detailedReport.materialName) === 'Video' && (
                                <video
                                  src={detailedReport.previewMaterialUrl}
                                  controls
                                  className="w-full h-full object-contain bg-slate-950"
                                />
                              )}
                              {getMaterialType(detailedReport.materialName) === 'PDF' && (
                                <iframe
                                  src={detailedReport.previewMaterialUrl}
                                  title={detailedReport.materialName}
                                  className="w-full h-full border-none bg-white"
                                />
                              )}
                              {getMaterialType(detailedReport.materialName) === 'Image' && (
                                <img
                                  src={detailedReport.previewMaterialUrl}
                                  alt={detailedReport.materialName}
                                  className="w-full h-full object-contain bg-slate-900"
                                />
                              )}
                              {getMaterialType(detailedReport.materialName) === 'Document' && (
                                <iframe
                                  src={detailedReport.previewMaterialUrl}
                                  title={detailedReport.materialName}
                                  className="w-full h-full border-none bg-white"
                                />
                              )}
                            </>
                          ) : (
                            <p className="text-xs font-semibold text-slate-400">
                              No Preview Available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer Actions */}
              {detailedReport && !isLoadingDetails && !detailsError && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Moderation Actions
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {detailedReport.reportStatus !== 'UnderReview' && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            status: 'Under Review',
                            title: 'Mark Under Review',
                            description:
                              'This report will be marked as under review. The content will remain available while being reviewed.',
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        Mark Under Review
                      </button>
                    )}
                    {detailedReport.reportStatus !== 'Rejected' && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            status: 'Rejected',
                            title: 'Keep Content',
                            description:
                              'This action means the content does not violate our guidelines. The report will be marked as rejected.',
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Keep Content
                      </button>
                    )}
                    {detailedReport.reportStatus !== 'Approved' && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            status: 'Approved',
                            title: 'Remove Content',
                            description:
                              'This action means the content violates our guidelines and should be removed. This action cannot be undone.',
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        Remove Content
                      </button>
                    )}
                  </div>
                </div>
              )}
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
        variant={
          confirmAction?.status === 'Approved'
            ? 'danger'
            : confirmAction?.status === 'Under Review'
              ? 'info'
              : 'warning'
        }
        icon={
          confirmAction?.status === 'Approved'
            ? XCircle
            : confirmAction?.status === 'Under Review'
              ? Eye
              : CheckCircle
        }
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
  '#8B5CF6',
  '#EC4899',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#A855F7',
];

// --- Page Size Selector Component ---
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
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
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
                className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-black transition-all ${
                  pageSize === option
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

// Skeleton row component for loading state
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
      </div>
    </td>
    <td className="py-4 px-6 hidden md:table-cell">
      <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
    </td>
    <td className="py-4 px-6 hidden xl:table-cell">
      <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
    </td>
    <td className="py-4 px-6 hidden lg:table-cell">
      <div className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
    </td>
    <td className="py-4 px-6 hidden md:table-cell">
      <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
    </td>
    <td className="py-4 px-6">
      <div className="flex justify-end">
        <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>
    </td>
  </tr>
);

const getMaterialType = (fileName: string): MaterialType => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) return 'Video';
  if (ext === 'pdf') return 'PDF';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'Image';
  return 'Document';
};

const mapReasonToApi = (reason: string): string | undefined => {
  switch (reason) {
    case 'Pornographic / Sexual Content':
      return 'SexualContent';
    case 'Hate Speech':
      return 'HateSpeech';
    case 'Religious Insult':
      return 'ReligiousInsult';
    case 'Harassment or Bullying':
      return 'Bullying';
    case 'Misinformation':
      return 'Misinformation';
    case 'Copyright Violation':
      return 'CopyrightViolation';
    case 'Dangerous or Illegal Activities':
      return 'IllegalActivities';
    case 'Terrorism or Extremism':
      return 'Terrorism';
    case 'Child Safety Concerns':
      return 'ChildSafetyConcerns';
    case 'Other':
      return 'Other';
    default:
      return undefined;
  }
};

const mapReasonFromApi = (apiReason: string): ReportReason => {
  switch (apiReason) {
    case 'SexualContent':
      return 'Pornographic / Sexual Content';
    case 'HateSpeech':
      return 'Hate Speech';
    case 'ReligiousInsult':
      return 'Religious Insult';
    case 'Bullying':
      return 'Harassment or Bullying';
    case 'Misinformation':
      return 'Misinformation';
    case 'CopyrightViolation':
      return 'Copyright Violation';
    case 'IllegalActivities':
      return 'Dangerous or Illegal Activities';
    case 'Terrorism':
      return 'Terrorism or Extremism';
    case 'ChildSafetyConcerns':
      return 'Child Safety Concerns';
    case 'Other':
      return 'Other';
    default:
      return 'Other';
  }
};

const mapStatusFromApi = (status: string): ReportStatus => {
  if (status === 'UnderReview') return 'Under Review';
  if (status === 'Pending') return 'Pending';
  if (status === 'Approved') return 'Approved';
  if (status === 'Rejected') return 'Rejected';
  return 'Pending';
};

// ─── Main Page Component ─────────────────────────────────────────────────────

export const AdminContentReportsPage = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('All Types');

  // API integration states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<{
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
  } | null>(null);

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiType = typeFilter !== 'All Types' ? typeFilter : null;
      const data = await getContentReports({
        pageNo,
        pageSize,
        type: apiType,
      });

      // Map API items to ContentReport shape
      const mappedItems = data.items.map((item) => ({
        id: item.reportId,
        materialName: item.material,
        materialType: getMaterialType(item.material),
        courseName: 'N/A',
        courseId: 0,
        instructorName: 'N/A',
        reason: mapReasonFromApi(item.reason),
        additionalComment: item.comment,
        reporterName: item.reporter,
        reporterEmail: 'N/A',
        reporterId: '',
        submittedDate: item.date,
        status: mapStatusFromApi(item.status),
      }));

      setReports(mappedItems);
      setPagination({
        totalResults: data.totalResults,
        pagesCount: data.pagesCount,
        start: data.start,
        end: data.end,
      });
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }, [pageNo, pageSize, typeFilter]);

  // Fetch on parameter changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset to page 1 on filter or page size change
  useEffect(() => {
    setPageNo(1);
  }, [typeFilter, pageSize]);

  const stats = useMemo(() => {
    const pageStats = getReportStats(reports);
    if (pagination) {
      return {
        ...pageStats,
        total: pagination.totalResults,
      };
    }
    return pageStats;
  }, [reports, pagination]);

  const filteredReports = reports;

  // Handle report status change — refresh from API to stay in sync
  const handleReportAction = (_reportId: string, _newStatus: ReportStatus) => {
    // Re-fetch the list to reflect the server-side change.
    // Current pageNo, pageSize, and typeFilter are preserved automatically.
    fetchReports();
  };

  // Chart data: Status Distribution
  const statusChartData = [
    { name: 'Pending', value: stats.pending, color: CHART_COLORS.pending },
    { name: 'Under Review', value: stats.underReview, color: CHART_COLORS.underReview },
    { name: 'Approved', value: stats.approved, color: CHART_COLORS.approved },
    { name: 'Rejected', value: stats.rejected, color: CHART_COLORS.rejected },
  ].filter((item) => item.value > 0);

  // Chart data: Reason Distribution (top 6)
  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
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
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Status Distribution
              </h2>
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
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
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
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Top Report Reasons
              </h2>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                Most common reasons for content reports
              </p>
            </div>
            <div className="h-[280px] w-full">
              {reasonChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reasonChartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#334155"
                      opacity={0.2}
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Reports"
                      radius={[0, 8, 8, 0]}
                      animationDuration={1000}
                    >
                      {reasonChartData.map((_entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={REASON_COLORS[index % REASON_COLORS.length]}
                        />
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full sm:w-72">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Report Type
                </label>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-10"
                    id="filter-type"
                  >
                    <option value="All Types">All Types</option>
                    <option value="SexualContent">SexualContent</option>
                    <option value="HateSpeech">HateSpeech</option>
                    <option value="ReligiousInsult">ReligiousInsult</option>
                    <option value="Bullying">Bullying</option>
                    <option value="Misinformation">Misinformation</option>
                    <option value="CopyrightViolation">CopyrightViolation</option>
                    <option value="IllegalActivities">IllegalActivities</option>
                    <option value="Terrorism">Terrorism</option>
                    <option value="ChildSafetyConcerns">ChildSafetyConcerns</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Reports Table ──────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full" id="content-reports-table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/50">
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Reason
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">
                    Reporter
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Comment
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <SkeletonRow key={idx} />
                    ))}
                  </>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                        <button
                          onClick={fetchReports}
                          className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
                          No reports found
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Try adjusting your filters or search query.
                        </p>
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
                        <div className="flex items-center gap-3">
                          <MaterialIcon type={report.materialType} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                              {report.materialName}
                            </p>
                          </div>
                        </div>
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
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate max-w-[200px]">
                          {report.additionalComment || 'No comment'}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(report);
                          }}
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

          {/* --- Pagination --- */}
          {!isLoading && !error && pagination && filteredReports.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-slate-700/50 gap-4 bg-gray-50/30 dark:bg-slate-900/5">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Results
                  </p>
                  <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                    Showing{' '}
                    <span className="text-[#21A9FF]">
                      {pagination.start} - {pagination.end}
                    </span>{' '}
                    of{' '}
                    <span className="text-gray-900 dark:text-white font-black">
                      {pagination.totalResults}
                    </span>{' '}
                    reports
                  </p>
                </div>
                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
                <PageSizeSelector
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                <button
                  onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                  disabled={pageNo === 1 || isLoading}
                  className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-blue-600 hover:bg-blue-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="px-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Page
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">{pageNo}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    of
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">
                    {pagination.pagesCount}
                  </span>
                </div>

                <button
                  onClick={() => setPageNo((p) => Math.min(pagination.pagesCount, p + 1))}
                  disabled={pageNo === pagination.pagesCount || isLoading}
                  className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-blue-600 hover:bg-blue-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
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
