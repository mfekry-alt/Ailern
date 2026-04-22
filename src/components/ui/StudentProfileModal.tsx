import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    X, TrendingUp, FileText, HelpCircle, 
    Award, Clock, CheckCircle2, AlertCircle,
    Loader2, Mail, GraduationCap,
    ChevronDown, Download, File
} from 'lucide-react';
import { courseService } from '@/api/services';
import type { 
    GetStudentsByCourseIdDto, 
    GetStudentProfileDto, 
    StudentProfileAssignmentDto, 
    StudentProfileQuizDto
} from '@/types/api.types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: GetStudentsByCourseIdDto | null;
    courseId: number | string;
}

type TabType = 'Overview' | 'Assignments' | 'Quizzes';

// --- Sub-components ---

const StatCard = ({ icon: Icon, title, value, colorClass, children }: any) => (
    <div className="bg-gray-50/50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700/50 hover:border-[#21A9FF]/30 transition-all text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-5 shadow-sm`}>
            <Icon className="w-7 h-7" />
        </div>
        <p className="text-4xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 tracking-[0.2em]">{title}</p>
        <div className="w-full mt-4 h-6 flex items-center justify-center">
            {children || <div className="h-1.5 w-24 bg-transparent" />}
        </div>
    </div>
);

const AssignmentAccordion = ({ assignment }: { assignment: StudentProfileAssignmentDto }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isSubmitted = assignment.submissionId !== 0;

    return (
        <div className="bg-white dark:bg-slate-800/40 rounded-3xl border border-gray-100 dark:border-slate-700/50 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubmitted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <Link 
                        to={ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':id', assignment.assignmentId.toString())}
                        className="font-bold text-gray-900 dark:text-white hover:text-[#21A9FF] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {assignment.assignmentName}
                    </Link>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 pt-0 border-t border-gray-50 dark:border-slate-700/30 space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isSubmitted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                                {isSubmitted ? 'Submitted' : 'Not Submitted'}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feedback</p>
                            <p className="text-sm text-gray-600 dark:text-slate-300 font-medium italic">
                                {assignment.submissionFeedback || 'No feedback yet'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Files</p>
                        {assignment.submissionFiles && assignment.submissionFiles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {assignment.submissionFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                                        <File className="w-4 h-4 text-[#21A9FF]" />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[150px]">{file.fileName}</span>
                                        {file.fileUrl && (
                                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <Download className="w-3.5 h-3.5 text-gray-500" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">No files uploaded</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuizAccordion = ({ quiz }: { quiz: StudentProfileQuizDto }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasAttempts = quiz.attempts && quiz.attempts.length > 0;

    return (
        <div className="bg-white dark:bg-slate-800/40 rounded-3xl border border-gray-100 dark:border-slate-700/50 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasAttempts ? 'bg-indigo-500/10 text-indigo-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <Link 
                        to={ROUTES.INSTRUCTOR_QUIZ_DASHBOARD.replace(':quizId', quiz.quizId)}
                        className="font-bold text-gray-900 dark:text-white hover:text-[#21A9FF] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {quiz.quizName}
                    </Link>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 pt-0 border-t border-gray-50 dark:border-slate-700/30 space-y-3 mt-4">
                    {hasAttempts ? (
                        quiz.attempts.map((attempt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                        #{attempt.attemptNumber}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Attempt {attempt.attemptNumber}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            {new Date(attempt.submittedAt).toLocaleDateString()} at {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{attempt.score}%</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 italic text-sm py-2">
                            <AlertCircle className="w-4 h-4" />
                            No attempts yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Modal Component ---

export function StudentProfileModal({ isOpen, onClose, student, courseId }: StudentProfileModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Overview');

    const { data: profile, isLoading, isError } = useQuery<GetStudentProfileDto>({
        queryKey: ['student-profile', courseId, student?.studentId],
        queryFn: () => courseService.getStudentProfile(courseId, student!.studentId),
        enabled: isOpen && !!student && !!courseId,
    });

    if (isError) {
        toast.error('Failed to load student profile');
        onClose();
        return null;
    }

    if (!isOpen || !student) return null;

    const handedInCount = profile?.assignments?.filter(a => a.submissionId !== 0).length || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                
                <header className="px-6 sm:px-10 py-8 bg-gradient-to-r from-[#21A9FF]/5 to-transparent dark:from-[#21A9FF]/10 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#21A9FF]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#21A9FF]/20 shrink-0 border-4 border-white dark:border-slate-800 rotate-3">
                            {student.fullName?.charAt(0) || 'S'}
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {student.fullName}
                            </h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-400">
                                    <Mail className="w-4 h-4 text-[#21A9FF]" />
                                    {student.email}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-400">
                                    <GraduationCap className="w-4 h-4 text-[#21A9FF]" />
                                    Active Student
                                </div>
                            </div>
                        </div>

                        <button onClick={onClose} className="absolute top-0 right-0 p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-400 hover:text-red-500 hover:shadow-lg transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <nav className="px-8 flex gap-2 border-b border-gray-100 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
                    {(['Overview', 'Assignments', 'Quizzes'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-black transition-all border-b-4 -mb-[1px] whitespace-nowrap ${
                                activeTab === tab 
                                    ? 'border-[#21A9FF] text-[#21A9FF]' 
                                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <main className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-[#21A9FF] animate-spin mb-4" />
                            <p className="font-bold text-gray-500">Fetching student profile...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                             {activeTab === 'Overview' && (
                                <div className="max-w-3xl mx-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <StatCard 
                                            icon={TrendingUp} 
                                            title="Course Progress" 
                                            value="75%" 
                                            colorClass="bg-[#21A9FF]/10 text-[#21A9FF]"
                                        >
                                            <div className="w-32 bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#21A9FF] transition-all duration-1000 shadow-[0_0_8px_rgba(33,169,255,0.5)]" style={{ width: `75%` }} />
                                            </div>
                                        </StatCard>

                                        <StatCard 
                                            icon={Award} 
                                            title="Average Score" 
                                            value={`${profile?.averageQuizzesScore || 0}%`} 
                                            colorClass="bg-emerald-500/10 text-emerald-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Assignments' && (
                                <div className="space-y-4">
                                    {profile?.assignments && profile.assignments.length > 0 ? (
                                        profile.assignments.map((a) => (
                                            <AssignmentAccordion key={a.assignmentId} assignment={a} />
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-500 font-bold">No assignments available.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Quizzes' && (
                                <div className="space-y-4">
                                    {profile?.quizzes && profile.quizzes.length > 0 ? (
                                        profile.quizzes.map((q) => (
                                            <QuizAccordion key={q.quizId} quiz={q} />
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                                            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-500 font-bold">No quizzes available.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="px-8 py-6 bg-gray-50/50 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Student Profile v2.0</p>
                    <button onClick={onClose} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-all">
                        Close Window
                    </button>
                </footer>
            </div>
        </div>
    );
}
