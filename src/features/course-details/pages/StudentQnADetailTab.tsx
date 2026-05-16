/**
 * Q&A Board Detail — Student Route Page
 * Displays a single discussion and its replies for students.
 */
import { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQnAStore } from '@/features/qna/store/qna.store';
import { QnADetail } from '@/features/qna/components/QnADetail';
import { MessageSquareText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export function StudentQnADetailTab() {
    const { questionId } = useParams<{ questionId: string }>();
    const { numericCourseId } = useOutletContext<CourseContext>();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isInstructor = hasRole(ROLES.INSTRUCTOR) || hasRole(ROLES.ADMIN);

    const {
        selectedQuestion,
        selectQuestion,
        toggleVote,
        togglePin,
        markAnswered,
        submitReply,
        deleteQuestion,
    } = useQnAStore();

    useEffect(() => {
        if (questionId && numericCourseId) {
            selectQuestion(questionId);
        }
    }, [questionId, numericCourseId, selectQuestion]);

    const handleBack = () => {
        navigate(`/courses/${numericCourseId}/qna`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this discussion?')) {
            await deleteQuestion(numericCourseId!, id);
            handleBack();
        }
    };

    if (!selectedQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin" />
                <p className="text-slate-400 text-sm">Loading discussion...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#21A9FF]/15 to-[#0094F2]/10 dark:from-[#21A9FF]/20 dark:to-[#0094F2]/15 flex items-center justify-center">
                        <MessageSquareText className="w-5 h-5 text-[#21A9FF]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Discussion Detail
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ask questions, upvote, and learn from instructor replies.
                        </p>
                    </div>
                </div>
            </div>

            <QnADetail
                question={selectedQuestion}
                isInstructor={isInstructor}
                onBack={handleBack}
                onVote={(id) => toggleVote(numericCourseId!, id)}
                onTogglePin={(id) => togglePin(numericCourseId!, id)}
                onMarkAnswered={markAnswered}
                onEdit={() => {}} // Students usually can't edit or we haven't implemented it here yet
                onDelete={handleDelete}
                onSubmitReply={(id, html) => submitReply(numericCourseId!, id, html)}
            />
        </div>
    );
}
