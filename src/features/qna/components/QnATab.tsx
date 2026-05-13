/**
 * Q&A Board — Main Tab Container
 * Manages the split between List view and Detail view.
 */
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';
import { useQnAStore } from '../store/qna.store';
import type { QnAQuestion } from '../types/qna.types';
import { QnAList } from './QnAList';
import { AddQuestionModal } from './AddQuestionModal';
import { MessageSquareText } from 'lucide-react';

interface QnATabProps {
    courseId: number;
}

export function QnATab({ courseId }: QnATabProps) {
    const { hasRole } = useAuth();
    const isInstructor = hasRole(ROLES.INSTRUCTOR) || hasRole(ROLES.ADMIN);

    const {
        createQuestion,
        updateQuestion,
        loadQuestions,
    } = useQnAStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QnAQuestion | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateQuestion = useCallback(
        async (title: string, content: string, tagIds: string[]) => {
            setIsCreating(true);
            try {
                await createQuestion(courseId, title, content, tagIds);
                setModalOpen(false);
                // Reload to get sorted
                await loadQuestions(courseId);
            } finally {
                setIsCreating(false);
            }
        },
        [courseId, createQuestion, loadQuestions],
    );


    const handleEditQuestion = useCallback(
        async (title: string, content: string, _tagIds: string[]) => {
            if (!editingQuestion) {
                await handleCreateQuestion(title, content, _tagIds);
                return;
            }
            setIsCreating(true);
            try {
                await updateQuestion(courseId, editingQuestion.id, title, content);
                setEditingQuestion(null);
                setModalOpen(false);
            } finally {
                setIsCreating(false);
            }
        },
        [courseId, editingQuestion, updateQuestion, handleCreateQuestion],
    );

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
                            Q&A Board
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isInstructor
                                ? 'Review student questions, reply, and manage discussions.'
                                : 'Ask questions, upvote, and learn from instructor replies.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content: List always */}
            <QnAList
                courseId={courseId}
                isInstructor={isInstructor}
                onOpenModal={() => setModalOpen(true)}
            />

            {/* Add Question Modal */}
            <AddQuestionModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingQuestion(null);
                }}
                onSubmit={handleEditQuestion}
                isSubmitting={isCreating}
                initialData={editingQuestion ? {
                    title: editingQuestion.title,
                    content: editingQuestion.content,
                    tagIds: editingQuestion.tags.map(t => t.id)
                } : undefined}
            />
        </div>
    );
}
