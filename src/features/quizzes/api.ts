import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { quizService, attemptsService } from '@/api/services';
import type { CreateQuizBody, QuestionUpsertRequest, UpdateQuizBody } from '@/types/api.types';
import type { GradeSubmissionPayload } from '@/api/services/attempts.service';

/**
 * Fetch all quizzes for a course
 */
export const useCourseQuizzes = (courseId: string) =>
    useQuery({
        queryKey: QUERY_KEYS.QUIZZES(courseId),
        queryFn: () => quizService.getCourseQuizzes(courseId, 1, 100),
        enabled: !!courseId,
    });

/**
 * Fetch a single quiz by ID
 */
export const useQuiz = (id: string) =>
    useQuery({
        queryKey: QUERY_KEYS.QUIZ(id),
        queryFn: () => quizService.getQuiz(id),
        enabled: !!id,
    });

/**
 * Create a new quiz
 */
export const useCreateQuiz = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cmd: CreateQuizBody) => quizService.createQuiz(courseId, cmd),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
        },
    });
};

/**
 * Update an existing quiz
 */
export const useUpdateQuiz = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, cmd }: { id: string; cmd: UpdateQuizBody }) =>
            quizService.updateQuiz(id, cmd),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(vars.id) });
        },
    });
};

/**
 * Delete a quiz
 */
export const useDeleteQuiz = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => quizService.deleteQuiz(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
        },
    });
};

/**
 * PUT /Quizzes/{id}/update-status — Draft | Published
 */
export const useUpdateQuizStatus = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ quizId, status }: { quizId: string; status: 'Draft' | 'Published' }) =>
            quizService.updateQuizStatus(quizId, status),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(vars.quizId) });
        },
    });
};

/**
 * Upsert (create/update) questions for a quiz
 * Allows updating just the questions without updating entire quiz
 */
export const useUpsertQuizQuestions = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (questions: QuestionUpsertRequest[]) =>
            quizService.upsertQuizQuestions(quizId, questions),
        onSuccess: () => {
            // Invalidate the quiz query to refetch full quiz data
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(quizId) });
        },
    });
};

/**
 * Fetch quiz submissions for instructor grading
 * Supports filtering by status and pagination
 */
export const useQuizSubmissions = (
    quizId: string,
    status?: 'InProgress' | 'Submitted' | 'Graded' | null,
    pageNo: number = 1,
    pageSize: number = 10
) =>
    useQuery({
        queryKey: [...QUERY_KEYS.QUIZ_SUBMISSIONS(quizId, status), pageNo, pageSize],
        queryFn: () => quizService.getQuizSubmissions(quizId, status, pageNo, pageSize),
        enabled: !!quizId,
    });

/**
 * Trigger AI grading for one or more attempts
 */
export const useAIGradeQuiz = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attemptIds: string[]) =>
            quizService.aiGradeQuiz(quizId, attemptIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ_SUBMISSIONS(quizId) });
        },
    });
};

/**
 * Grade a quiz submission
 * Allows instructor to assign scores and feedback to submitted attempts
 */
export const useGradeSubmission = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ attemptId, payload }: { attemptId: string; payload: GradeSubmissionPayload }) =>
            attemptsService.gradeSubmission(attemptId, payload),
        onSuccess: (_data, vars) => {
            // Invalidate related queries
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ_SUBMISSIONS(quizId) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTEMPT_GRADE(vars.attemptId) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTEMPT(vars.attemptId) });
        },
    });
};

/**
 * Fetch AI-generated questions pending acceptance
 */
export const useAiGeneratedQuestions = (quizId: string) =>
    useQuery({
        queryKey: ['ai-generated-questions', quizId],
        queryFn: () => quizService.getAiGeneratedQuestions(quizId),
        enabled: !!quizId,
    });

/**
 * Accept a single AI-generated question (adds it to the quiz)
 */
export const useAcceptAiGeneratedQuestion = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (questionId: string) => quizService.acceptAiGeneratedQuestion(quizId, questionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ai-generated-questions', quizId] });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(quizId) });
        },
    });
};

/**
 * Reject (delete) a single AI-generated question
 */
export const useRejectAiGeneratedQuestion = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (questionId: string) => quizService.rejectAiGeneratedQuestion(quizId, questionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ai-generated-questions', quizId] });
        },
    });
};

/**
 * Accept all pending AI-generated questions
 */
export const useAcceptAllAiGeneratedQuestions = (quizId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => quizService.acceptAllAiGeneratedQuestions(quizId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ai-generated-questions', quizId] });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(quizId) });
        },
    });
};
