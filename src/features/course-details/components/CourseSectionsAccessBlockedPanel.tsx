import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, HelpCircle } from 'lucide-react';

type CourseSectionsAccessBlockedPanelProps = {
    courseId: string;
    /** Quiz id to resume, if known */
    activeQuizId?: string;
    /** Optional: link to course quizzes list */
    quizListPath: string;
};

export const CourseSectionsAccessBlockedPanel = ({
    courseId,
    activeQuizId,
    quizListPath,
}: CourseSectionsAccessBlockedPanelProps) => {
    const navigate = useNavigate();

    const handleResume = () => {
        if (activeQuizId) {
            navigate(`/quizzes/${activeQuizId}/attempt`, {
                state: { resume: true, courseId },
            });
        } else {
            navigate(quizListPath);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 animate-fade-in">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-200/80 dark:border-amber-500/20 mb-6">
                <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                Course materials are temporarily locked
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
                You have a quiz in progress for this course. Finish or submit the attempt to unlock
                sections and other course content again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={handleResume}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-md shadow-blue-500/20"
                >
                    {activeQuizId ? 'Resume quiz' : 'Go to quizzes'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => navigate(quizListPath)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <HelpCircle className="w-4 h-4" />
                    View all quizzes
                </button>
            </div>
        </div>
    );
};
