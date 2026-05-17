/**
 * Q&A Board — Zustand Store
 * Manages Q&A state with real API integration and optimistic updates.
 */
import { create } from 'zustand';
import { toast } from 'sonner';
import type { QnAQuestion, QnAFilterState, QnASortMode } from '../types/qna.types';
import * as api from '../api/qna.service';

interface QnAState {
    /* data */
    questions: QnAQuestion[];
    selectedQuestion: QnAQuestion | null;
    isLoading: boolean;
    isDetailLoading: boolean;

    /* filters */
    filter: QnAFilterState;
    setSort: (sort: QnASortMode) => void;
    setSearch: (search: string) => void;

    /* actions */
    loadQuestions: (courseId: number) => Promise<void>;
    selectQuestion: (questionId: string | null) => Promise<void>;
    toggleVote: (courseId: number, questionId: string) => Promise<void>;
    togglePin: (courseId: number, questionId: string) => Promise<void>;
    markAnswered: (questionId: string, answered: boolean) => Promise<void>;
    submitReply: (courseId: number, questionId: string, html: string) => Promise<void>;
    createQuestion: (courseId: number, title: string, content: string, tagIds?: string[]) => Promise<void>;
    updateQuestion: (courseId: number, questionId: string, title: string, content: string) => Promise<void>;
    deleteQuestion: (courseId: number, questionId: string) => Promise<void>;
    goBackToList: () => void;
}

export const useQnAStore = create<QnAState>((set, get) => ({
    questions: [],
    selectedQuestion: null,
    isLoading: false,
    isDetailLoading: false,

    filter: { search: '', sort: 'votes' },

    setSort: (sort) => {
        set((s) => ({ filter: { ...s.filter, sort } }));
    },

    setSearch: (search) => {
        set((s) => ({ filter: { ...s.filter, search } }));
    },

    loadQuestions: async (courseId) => {
        set({ isLoading: true });
        try {
            const { filter } = get();
            const data = await api.fetchQuestions(courseId, filter.sort, filter.search);
            set({ questions: data, isLoading: false });
        } catch (error) {
            console.error('Failed to load questions:', error);
            toast.error('Failed to load discussions');
            set({ isLoading: false });
        }
    },

    selectQuestion: async (questionId) => {
        if (!questionId) {
            set({ selectedQuestion: null });
            return;
        }
        
        // Find in current list first for instant feel
        const { questions } = get();
        const existing = questions.find(q => q.id === questionId);
        if (existing) {
            set({ selectedQuestion: existing });
        }

        set({ isDetailLoading: true });
        try {
            // Re-fetch to get latest replies (assuming the question object in list has courseId)
            const courseId = existing?.courseId || questions[0]?.courseId;
            if (courseId) {
                const q = await api.fetchQuestion(questionId, courseId);
                if (q) set({ selectedQuestion: q });
            }
        } catch (error) {
            console.error('Failed to fetch question detail:', error);
        } finally {
            set({ isDetailLoading: false });
        }
    },

    /* Optimistic vote toggle */
    toggleVote: async (courseId, questionId) => {
        const { questions, selectedQuestion } = get();
        const question = questions.find(q => q.id === questionId) || selectedQuestion;
        if (!question) return;

        const isUpvote = !question.votedByMe;

        // Optimistic update
        set((s) => ({
            questions: s.questions.map((q) =>
                q.id === questionId
                    ? { ...q, votedByMe: !q.votedByMe, votes: q.votes + (q.votedByMe ? -1 : 1) }
                    : q
            ),
            selectedQuestion:
                s.selectedQuestion?.id === questionId
                    ? {
                          ...s.selectedQuestion,
                          votedByMe: !s.selectedQuestion.votedByMe,
                          votes:
                              s.selectedQuestion.votes +
                              (s.selectedQuestion.votedByMe ? -1 : 1),
                      }
                    : s.selectedQuestion,
        }));

        try {
            await api.toggleVote(courseId, questionId, isUpvote);
        } catch (error) {
            console.error('Vote failed:', error);
            toast.error('Failed to update vote');
            // Revert
            const { filter } = get();
            const data = await api.fetchQuestions(courseId, filter.sort, filter.search);
            set({ questions: data });
        }
    },

    /* Optimistic pin */
    togglePin: async (courseId, questionId) => {
        const { questions, selectedQuestion } = get();
        const question = questions.find(q => q.id === questionId) || selectedQuestion;
        if (!question) return;

        const newPinStatus = !question.isPinned;

        set((s) => ({
            questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, isPinned: newPinStatus } : q,
            ),
            selectedQuestion:
                s.selectedQuestion?.id === questionId
                    ? { ...s.selectedQuestion, isPinned: newPinStatus }
                    : s.selectedQuestion,
        }));
        
        try {
            await api.togglePin(courseId, questionId, newPinStatus);
            toast.success(newPinStatus ? 'Discussion pinned' : 'Discussion unpinned');
        } catch (error) {
            console.error('Pin failed:', error);
            toast.error('Failed to update pin status');
            // Revert
            const { filter } = get();
            const data = await api.fetchQuestions(courseId, filter.sort, filter.search);
            set({ questions: data });
        }
    },

    /* Optimistic mark answered */
    markAnswered: async (questionId, answered) => {
        const newStatus = answered ? 'answered' : 'unanswered';
        set((s) => ({
            questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, status: newStatus } : q,
            ),
            selectedQuestion:
                s.selectedQuestion?.id === questionId
                    ? { ...s.selectedQuestion, status: newStatus }
                    : s.selectedQuestion,
        }));
        try {
            await api.markAnswered(questionId, answered);
        } catch (error) {
            console.error('Mark answered failed:', error);
        }
    },

    submitReply: async (courseId, questionId, html) => {
        try {
            await api.submitReply(courseId, questionId, html);
            toast.success('Reply submitted');
            
            // Reload question to get new reply list
            const updatedQ = await api.fetchQuestion(questionId, courseId);
            if (updatedQ) {
                set((s) => ({
                    selectedQuestion: updatedQ,
                    questions: s.questions.map(q => q.id === questionId ? updatedQ : q)
                }));
            }
        } catch (error) {
            console.error('Submit reply failed:', error);
            toast.error('Failed to submit reply');
        }
    },

    createQuestion: async (courseId, title, content, tagIds) => {
        try {
            const newQ = await api.createQuestion(courseId, title, content, tagIds);
            set((s) => ({ questions: [newQ, ...s.questions] }));
            toast.success('Discussion created');
            
            // Refresh to ensure correct sorting
            const { filter } = get();
            const data = await api.fetchQuestions(courseId, filter.sort, filter.search);
            set({ questions: data });
        } catch (error) {
            console.error('Create discussion failed:', error);
            toast.error('Failed to create discussion');
            throw error;
        }
    },

    updateQuestion: async (courseId, questionId, title, content) => {
        try {
            const updatedQ = await api.updateQuestion(courseId, questionId, title, content);
            set((s) => ({
                questions: s.questions.map(q => q.id === questionId ? updatedQ : q),
                selectedQuestion: s.selectedQuestion?.id === questionId ? updatedQ : s.selectedQuestion
            }));
            toast.success('Discussion updated');
        } catch (error) {
            console.error('Update discussion failed:', error);
            toast.error('Failed to update discussion');
            throw error;
        }
    },

    deleteQuestion: async (courseId, questionId) => {
        try {
            await api.deleteQuestion(courseId, questionId);
            set((s) => ({
                questions: s.questions.filter(q => q.id !== questionId),
                selectedQuestion: s.selectedQuestion?.id === questionId ? null : s.selectedQuestion
            }));
            toast.success('Discussion deleted');
        } catch (error) {
            console.error('Delete discussion failed:', error);
            toast.error('Failed to delete discussion');
            throw error;
        }
    },

    goBackToList: () => {
        set({ selectedQuestion: null });
    },
}));
