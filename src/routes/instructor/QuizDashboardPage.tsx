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
const COLORS = {
    // Professional SaaS palette (Stripe / Linear style)
    pass:    '#10B981', // emerald-500 (Success)
    fail:    '#F43F5E', // rose-500 (Danger)
    
    // Indigo-based primary palette
    attempt: [
        '#6366F1', // indigo-500
        '#818CF8', // indigo-400
        '#A5B4FC', // indigo-300
        '#C7D2FE', // indigo-200
        '#E0E7FF', // indigo-100
    ],

    bar:  '#6366F1', // indigo-500
    bar2: '#A5B4FC', // indigo-300

    neutral: '#94A3B8', // slate-400
    gridLine: 'rgba(148, 163, 184, 0.15)', // subtle slate
};

// ── Re-usable skeleton block ──────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 ${className}`} />
);

// ── Custom pie label ──────────────────────────────────────────────────────
const renderCustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central"
            fontSize={12} fontWeight={600} className="drop-shadow-sm">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ── Custom Tooltip for Charts ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 min-w-[160px] animate-in fade-in zoom-in duration-200">
                {label && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider">{label}</p>}
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => {
                        const value = formatter ? formatter(entry.value, entry.name, entry)[0] : entry.value;
                        const name = formatter ? formatter(entry.value, entry.name, entry)[1] : entry.name;
                        return (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{value}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

// ── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: 'indigo' | 'emerald' | 'red' | 'blue' | 'amber';
    extra?: React.ReactNode;
}

const iconBgMap: Record<KpiCardProps['color'], string> = {
    indigo:  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    red:     'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400',
    blue:    'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400',
    amber:   'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400',
};

const KpiCard = ({ title, value, subtitle, icon: Icon, color, extra }: KpiCardProps) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
        <div className="flex items-start justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
            <div className={`p-2.5 rounded-xl ${iconBgMap[color]} group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
            {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {extra && <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">{extra}</div>}
    </div>
);

// ── Chart wrapper card ────────────────────────────────────────────────────
const ChartCard = ({ title, icon: Icon, children, className = '' }: {
    title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) => (
    <div className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col ${className}`}>
        <div className="flex items-center gap-2.5 mb-6">
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                {title}
            </h3>
        </div>
        <div className="flex-1">
            {children}
        </div>
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <Skeleton className="h-12 w-64" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
                    </div>
                    <div className="flex flex-col items-center justify-center pt-10 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-sm font-semibold text-slate-500">Loading analytics…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────
    if (isError || !data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-10 text-center max-w-md shadow-xl">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to load analytics</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                        Could not fetch quiz dashboard data. Make sure the quiz ID is correct and try again.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go back
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
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

    const atRatio = data.numberOfStudents / (data.studentsInCourse || 1);
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
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
                <HelpCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{msg}</p>
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                            title="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <BarChart2 className="w-6 h-6 text-indigo-500" />
                                Analytics Dashboard
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Quiz: <span className="text-slate-700 dark:text-slate-200 font-semibold">{quizMeta?.title ?? quizId}</span>
                            </p>
                        </div>
                    </div>

                    {/* Actions & Mode Selector */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                if (!quizId) return;
                                navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quizId));
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            Submissions
                        </button>

                        <div className="flex items-center p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl">
                            {(['Min', 'Avg', 'Max'] as DashboardMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        mode === m
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Students ratio card */}
                    <KpiCard
                        title="Participation Rate"
                        value={`${data.numberOfStudents} / ${data.studentsInCourse}`}
                        subtitle={`${ratioPercent}% students submitted`}
                        icon={Users}
                        color="blue"
                        extra={
                            <div className="space-y-2">
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 dark:bg-blue-500 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(ratioPercent, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    {data.studentsInCourse - data.numberOfStudents} haven't submitted yet
                                </p>
                            </div>
                        }
                    />

                    {/* Average score card */}
                    <KpiCard
                        title={`Average Score (${mode})`}
                        value={avgScoreValue.toFixed(1)}
                        subtitle="Points based on selected mode"
                        icon={Target}
                        color="indigo"
                        extra={
                            <div className="flex gap-2 text-xs font-semibold">
                                {(['Min','Avg','Max'] as DashboardMode[]).map((m) => {
                                    const k = modeKeyMap[m];
                                    return (
                                        <span key={m} className={`px-2 py-1 rounded-md border transition-colors ${m === mode ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                            {m}: {data.averageScore[k].toFixed(1)}
                                        </span>
                                    );
                                })}
                            </div>
                        }
                    />

                    {/* Pass/Fail summary card */}
                    <KpiCard
                        title={`Evaluation Overview (${mode})`}
                        value={passFailData.passes + passFailData.fails}
                        subtitle="Total evaluated students"
                        icon={TrendingUp}
                        color="emerald"
                        extra={
                            <div className="flex gap-4 text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Pass: {passFailData.passes}
                                </span>
                                <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                                    <XCircle className="w-4 h-4" />
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
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                        stroke="none"
                                    >
                                        <Cell key="pass" fill={COLORS.pass} />
                                        <Cell key="fail" fill={COLORS.fail} />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
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
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                        stroke="none"
                                    >
                                        {attemptsData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.attempt[index % COLORS.attempt.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatter={(value: any, name: any) => [value, name]} />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
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
                        title="Correct Answers per Question"
                        icon={BarChart2}
                        className="lg:col-span-2"
                    >
                        {questionBarData.length === 0 ? (
                            <EmptyChart msg="No question statistics available" />
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={questionBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={{ stroke: COLORS.gridLine }}
                                        interval={0}
                                        angle={-30}
                                        textAnchor="end"
                                        height={70}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                                        content={<CustomTooltip formatter={(value: any, _name: any, props: any) => [value, props.payload.fullText || props.payload.name]} />}
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Correct Answers"
                                        radius={[4, 4, 0, 0]}
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={submissionTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={{ stroke: COLORS.gridLine }}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                                        content={<CustomTooltip />}
                                    />
                                    <Bar
                                        dataKey="value"
                                        name="Submissions"
                                        fill={COLORS.neutral}
                                        radius={[4, 4, 0, 0]}
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
