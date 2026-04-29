import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    ArrowLeft, Users, Target, CheckCircle2, XCircle,
    TrendingUp, BarChart2, PieChart as PieChartIcon,
    Clock, RefreshCw, Loader2, AlertCircle, HelpCircle, ClipboardCheck,
} from 'lucide-react';
import { useQuizDashboard } from '@/features/quizzes/useQuizDashboard';
import { useQuiz } from '@/features/quizzes/api';
import type { DashboardMode } from '@/types/quiz-dashboard.types';
import { ROUTES } from '@/lib/constants';

// ── Color palette ─────────────────────────────────────────────────────────
// Primary: #21A9FF (app main color)
// Using cohesive blue-based palette with accessible variations
const COLORS = {
    // Status colors (standard semantic colors)
    pass:    '#10b981', // emerald-500 - success/pass (accessible green)
    fail:    '#f43f5e', // rose-500 - fail/danger (softer red, better for dark mode)

    // Primary blues (main app color #21A9FF and variations)
    primary:      '#21A9FF', // main app blue
    primaryDark:  '#0094F2', // hover/active state
    primaryLight: '#7DD3FC', // lighter variant
    secondary:    '#0EA5E9', // sky-500 - complementary
    tertiary:     '#38BDF8', // sky-400 - lighter complement

    // Gradient palette for multi-segment charts (attempts distribution)
    // Blues that work together and maintain accessibility
    attempt: [
        '#21A9FF', // primary blue
        '#0EA5E9', // sky-500
        '#38BDF8', // sky-400
        '#7DD3FC', // sky-300
        '#BAE6FD', // sky-200 (lighter for variety)
    ],

    // For question bars - alternating subtle variations
    bar:  '#21A9FF', // primary
    bar2: '#0EA5E9', // slightly different for contrast

    // Neutral/Submission time
    neutral: '#64748B', // slate-500 - subtle, professional
};

// ── Re-usable skeleton block ──────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700/60 ${className}`} />
);

// ── Custom pie label ──────────────────────────────────────────────────────
const renderCustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            fontSize={12} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ── Mode selector button ──────────────────────────────────────────────────
interface ModeBtnProps {
    label: DashboardMode;
    active: boolean;
    onClick: () => void;
}
const ModeBtn = ({ label, active, onClick }: ModeBtnProps) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50
            ${active
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
    >
        {label}
    </button>
);

// ── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: 'indigo' | 'emerald' | 'red' | 'blue' | 'amber';
    extra?: React.ReactNode;
}

const colorMap: Record<KpiCardProps['color'], string> = {
    indigo:  'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    red:     'from-red-500 to-rose-600',
    blue:    'from-blue-500 to-indigo-600',
    amber:   'from-amber-500 to-orange-500',
};
const iconBgMap: Record<KpiCardProps['color'], string> = {
    indigo:  'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    red:     'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    blue:    'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
};

const KpiCard = ({ title, value, subtitle, icon: Icon, color, extra }: KpiCardProps) => (
    <div className="relative bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
        {/* accent top-bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorMap[color]}`} />
        <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 truncate">{title}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>}
                {extra && <div className="mt-3">{extra}</div>}
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300 ${iconBgMap[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
);

// ── Chart wrapper card ────────────────────────────────────────────────────
const ChartCard = ({ title, icon: Icon, children, className = '' }: {
    title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) => (
    <div className={`bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Icon className="w-5 h-5 text-indigo-500" />
            {title}
        </h3>
        {children}
    </div>
);

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════
export const QuizDashboardPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [mode, setMode] = useState<DashboardMode>('Avg');

    const { data, isLoading, isError, refetch } = useQuizDashboard(quizId ?? '');
    const { data: quizMeta } = useQuiz(quizId ?? '');

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    {/* mode pills */}
                    <Skeleton className="h-12 w-64 rounded-2xl" />
                    {/* KPI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
                    </div>
                    {/* charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
                    </div>
                    <div className="flex flex-col items-center justify-center pt-10 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading analytics…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────
    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800/60 border border-red-200 dark:border-red-500/30 rounded-3xl p-10 text-center max-w-md shadow-xl">
                    <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Failed to load analytics</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                        Could not fetch quiz dashboard data. Make sure the quiz ID is correct and try again.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go back
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Derived values ────────────────────────────────────────────────────
    const modeKeyMap: Record<DashboardMode, 'minAverage' | 'avgAverage' | 'maxAverage'> = {
        Min: 'minAverage',
        Avg: 'avgAverage',
        Max: 'maxAverage',
    };
    const avgScoreValue = data.averageScore[modeKeyMap[mode]];

    const passFailData = data.passesFalis[mode];
    const piePassFail = [
        { name: 'Passes', value: passFailData.passes },
        { name: 'Fails',  value: passFailData.fails  },
    ];

    const atRatio = data.numberOfStudents / (data.studentsInCourse || 1); // 0–1
    const ratioPercent = Math.round(atRatio * 100);

    const attemptsData = data.attemptsDistributions.map((a) => ({
        name:  `Attempt ${a.attemptNumber}`,
        value: a.studentsCount,
    }));

    const questionBarData = data.questionStatistics.map((q, idx) => ({
        name:  q.questionText.length > 22 ? q.questionText.slice(0, 22) + '…' : q.questionText,
        fullText: q.questionText,
        count: q.correctAnswersCount,
        idx: idx + 1,
    }));

    const submissionTimeData = data.submissionTimeDistribution.map((s) => ({
        name:  s.label,
        value: s.submissionsCount,
    }));

    // ── Empty-state helper ─────────────────────────────────────────────────
    const EmptyChart = ({ msg }: { msg: string }) => (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
            <HelpCircle className="w-10 h-10 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400 dark:text-slate-500 font-medium">{msg}</p>
        </div>
    );

    // ── Tooltip styles ─────────────────────────────────────────────────────
    // Using blue-based theme colors for consistency
    const tooltipStyle = {
        contentStyle: {
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(33, 169, 255, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
        labelStyle:  { color: '#f8fafc', fontWeight: 700, fontSize: 12 },
        itemStyle:   { color: '#7DD3FC', fontWeight: 600, fontSize: 12 },
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                            title="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <BarChart2 className="w-6 h-6 text-indigo-500" />
                                Quiz Analytics Dashboard
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                                Quiz : <span className="text-gray-700 dark:text-slate-200 font-semibold">{quizMeta?.title ?? quizId}</span>
                            </p>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                if (!quizId) return;
                                navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quizId));
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            Submissions
                        </button>
                        <span className="pl-2 pr-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 whitespace-nowrap">View:</span>
                        {(['Min', 'Avg', 'Max'] as DashboardMode[]).map((m) => (
                            <ModeBtn key={m} label={m} active={mode === m} onClick={() => setMode(m)} />
                        ))}
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                    {/* Students ratio card */}
                    <KpiCard
                        title="Students Submitted / Enrolled"
                        value={`${data.numberOfStudents} / ${data.studentsInCourse}`}
                        subtitle={`${ratioPercent}% participation rate`}
                        icon={Users}
                        color="blue"
                        extra={
                            <div className="space-y-1">
                                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(ratioPercent, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                    {data.studentsInCourse - data.numberOfStudents} haven't submitted
                                </p>
                            </div>
                        }
                    />

                    {/* Average score card */}
                    <KpiCard
                        title={`Average Score (${mode})`}
                        value={avgScoreValue.toFixed(1)}
                        subtitle="Points — based on selected mode"
                        icon={Target}
                        color="indigo"
                        extra={
                            <div className="flex gap-3 text-xs font-semibold">
                                {(['Min','Avg','Max'] as DashboardMode[]).map((m) => {
                                    const k = modeKeyMap[m];
                                    return (
                                        <span key={m} className={`px-2 py-0.5 rounded-lg border ${m === mode ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>
                                            {m}: {data.averageScore[k].toFixed(1)}
                                        </span>
                                    );
                                })}
                            </div>
                        }
                    />

                    {/* Pass/Fail summary card */}
                    <KpiCard
                        title={`Pass / Fail Overview (${mode})`}
                        value={passFailData.passes + passFailData.fails}
                        subtitle="Total evaluated students"
                        icon={TrendingUp}
                        color="emerald"
                        extra={
                            <div className="flex gap-4 text-xs font-bold">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Pass: {passFailData.passes}
                                </span>
                                <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Fail: {passFailData.fails}
                                </span>
                            </div>
                        }
                    />
                </div>

                {/* ── Charts grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1 — Pass / Fail Distribution (Pie) */}
                    <ChartCard title={`Pass/Fail Distribution (${mode})`} icon={PieChartIcon}>
                        {piePassFail.every(d => d.value === 0) ? (
                            <EmptyChart msg="No pass/fail data available" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={piePassFail}
                                        cx="50%" cy="50%"
                                        outerRadius={100}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                    >
                                        <Cell key="pass" fill={COLORS.pass} />
                                        <Cell key="fail" fill={COLORS.fail} />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipStyle.contentStyle}
                                        labelStyle={tooltipStyle.labelStyle}
                                        itemStyle={tooltipStyle.itemStyle}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={9}
                                        formatter={(value) => (
                                            <span
                                                style={{
                                                    color: value === 'Passes' ? COLORS.pass : COLORS.fail,
                                                    fontWeight: 700,
                                                    fontSize: 13
                                                }}
                                            >
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* 2 — Attempts Distribution (Pie) */}
                    <ChartCard title="Attempts Distribution" icon={RefreshCw}>
                        {attemptsData.length === 0 || attemptsData.every(d => d.value === 0) ? (
                            <EmptyChart msg="No attempts data available" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={attemptsData}
                                        cx="50%" cy="50%"
                                        outerRadius={100}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                    >
                                        {attemptsData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.attempt[index % COLORS.attempt.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipStyle.contentStyle}
                                        labelStyle={tooltipStyle.labelStyle}
                                        itemStyle={tooltipStyle.itemStyle}
                                        formatter={(value, name) => [value, name]}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={9}
                                        formatter={(value, entry: any) => (
                                            <span style={{ color: entry.color, fontWeight: 700, fontSize: 13 }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* 3 — Question Statistics (Bar) */}
                    <ChartCard
                        title="Question Correct Answers"
                        icon={BarChart2}
                        className="lg:col-span-2"
                    >
                        {questionBarData.length === 0 ? (
                            <EmptyChart msg="No question statistics available" />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={questionBarData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 169, 255, 0.15)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#a3aebfff', fontWeight: 600 }}
                                        interval={0}
                                        angle={-30}
                                        textAnchor="end"
                                        height={70}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={tooltipStyle.contentStyle}
                                        labelStyle={tooltipStyle.labelStyle}
                                        itemStyle={tooltipStyle.itemStyle}
                                        formatter={(value, _name, props) => [value, props.payload.fullText || props.payload.name]}
                                        labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullText || _label}
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Correct Answers"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={56}
                                    >
                                        {questionBarData.map((_, index) => (
                                            <Cell
                                                key={`qcell-${index}`}
                                                fill={index % 2 === 0 ? COLORS.bar : COLORS.bar2}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* 4 — Submission Time Distribution (Bar) */}
                    <ChartCard
                        title="Submission Time Distribution"
                        icon={Clock}
                        className="lg:col-span-2"
                    >
                        {submissionTimeData.length === 0 ? (
                            <EmptyChart msg="No submission time data available" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={submissionTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 169, 255, 0.15)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={tooltipStyle.contentStyle}
                                        labelStyle={tooltipStyle.labelStyle}
                                        itemStyle={tooltipStyle.itemStyle}
                                    />
                                    <Bar
                                        dataKey="value"
                                        name="Submissions"
                                        fill={COLORS.neutral}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={72}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                {/* ── Footer spacer ── */}
                <div className="pb-8" />
            </div>
        </div>
    );
};
