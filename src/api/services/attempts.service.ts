/**
 * Quiz Attempts Service - Handles all quiz attempt-related API calls
 * Manages the complete quiz attempt workflow: start, fetch questions, save progress, submit
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';
import axios from 'axios';

/**
 * Represents a single question attempt with student's answer
 */
export interface QuestionAttempt {
    questionId: string;
    answer?: string;
    selectedOptions?: string[];
}

/**
 * Payload for saving quiz attempt progress
 */
export interface SaveAttemptPayload {
    answers: QuestionAttempt[];
}

/**
 * Represents the final result of a quiz attempt after grading
 */
export interface AttemptResult {
    quizId: string;
    score: number;        // achievedScore from backend
    totalScore: number;   // totalScore from backend
    percentage: number;
    status: string;
    studentId?: number;
    quizName?: string;
    submittedAt?: string;
    attemptNumber?: number;
}

/**
 * Represents a student's answer with correct answer for review
 */
export interface StudentAnswer {
    questionId: string;
    questionText: string;
    studentAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    points?: number;
    possiblePoints?: number;
}

/**
 * DTO for starting a quiz attempt
 * Maps to actual backend response structure
 */
export interface StartAttemptResponse {
    id: string;
    quizId: string;
    timeSpent: number;
    startAt: string;  // Backend field name (not startedAt)
    submittedAt?: string;  // Will be null/undefined for in-progress attempts
    status: 'InProgress' | 'Submitted' | 'In-Progress';
    score?: number | null;
    attemptNumber?: number;
    totalMarks?: number;
    duration?: number;
    // Note: timeLimit must be fetched from quiz separately, not from attempt
}

/**
 * DTO for quiz questions during attempt
 */
interface QuestionDto {
    id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    options?: { id: string; text: string }[];
    points?: number;
}

/**
 * Start a new quiz attempt
 * @param quizId - The ID of the quiz to start
 * @returns Promise with attempt details including attemptId
 */
export const startQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {
    try {
        const response = await api.post<ApiResponse<StartAttemptResponse>>(
            ENDPOINTS.ATTEMPTS.START(quizId),
            {}
        );
        console.log('✓ Quiz attempt started:', response.data.data);
        return response.data.data!;
    } catch (error) {
        console.error('✗ Failed to start quiz attempt:', error);
        throw error;
    }
};

/**
 * Get student's open/in-progress attempts for a quiz
 * Used to detect if student has an existing attempt to resume
 */
export const getStudentOpenAttempts = async (quizId: string): Promise<StartAttemptResponse[]> => {
    try {
        const response = await api.get<any>(
            ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId)
        );

        // -- التعديل هنا: قراءة الـ Array بشكل آمن لتجنب فشل الـ 409 --
        let allAttempts: any[] = [];
        if (Array.isArray(response.data)) {
            allAttempts = response.data;
        } else if (Array.isArray(response.data?.data)) {
            allAttempts = response.data.data;
        } else if (Array.isArray(response.data?.data?.attempts)) {
            allAttempts = response.data.data.attempts;
        } else if (Array.isArray(response.data?.items)) {
            allAttempts = response.data.items;
        }

        // -- التعديل هنا: الاعتماد على الـ status --
        const openAttempts = allAttempts.filter(
            (attempt: StartAttemptResponse) =>
                attempt.status === 'InProgress' ||
                attempt.status === 'In-Progress' ||
                !attempt.submittedAt
        );

        console.log('✓ Open attempts fetched:', openAttempts.length, 'from', allAttempts.length, 'total');
        return openAttempts;
    } catch (error) {
        console.warn('✗ Failed to fetch open attempts:', error);
        return [];
    }
};

/**
 * Start a new attempt or resume an existing in-progress attempt.
 */
export const startOrResumeQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {
    const openAttempts = await getStudentOpenAttempts(quizId);
    let resumableAttempt = openAttempts.find(
        (attempt) => attempt.status === 'InProgress' || attempt.status === 'In-Progress' || !attempt.submittedAt
    );

    if (resumableAttempt) {
        // Fix missing 'id' issue if backend uses 'attemptId'
        if (!resumableAttempt.id && (resumableAttempt as any).attemptId) {
            resumableAttempt.id = (resumableAttempt as any).attemptId;
        }
        console.log('✓ Resuming existing quiz attempt:', resumableAttempt.id);
        return resumableAttempt;
    }

    try {
        return await startQuizAttempt(quizId);
    } catch (error) {
        if (!axios.isAxiosError(error)) {
            throw error;
        }

        const status = error.response?.status;
        const message = String(error.response?.data?.message ?? '').toLowerCase();
        const isExistingAttemptConflict =
            status === 409 ||
            (status === 400 && (message.includes('in-progress') || message.includes('already created') || message.includes('attempt')));

        if (!isExistingAttemptConflict) {
            throw error;
        }

        console.warn('⚠ Attempt already exists. Fetching existing in-progress attempt...');
        const retryOpenAttempts = await getStudentOpenAttempts(quizId);
        resumableAttempt = retryOpenAttempts.find(
            (attempt) => attempt.status === 'InProgress' || attempt.status === 'In-Progress' || !attempt.submittedAt
        );

        if (resumableAttempt) {
            // Fix missing 'id' issue if backend uses 'attemptId'
            if (!resumableAttempt.id && (resumableAttempt as any).attemptId) {
                resumableAttempt.id = (resumableAttempt as any).attemptId;
            }
            console.log('✓ Recovered existing attempt after conflict:', resumableAttempt.id);
            return resumableAttempt;
        }

        throw error;
    }
};

/**
 * Get all questions for a quiz attempt
 * @param attemptId - The ID of the attempt
 * @returns Promise with array of questions
 */
export const getAttemptQuestions = async (attemptId: string): Promise<QuestionDto[]> => {
    try {
        const response = await api.get<ApiResponse<QuestionDto[]>>(
            ENDPOINTS.ATTEMPTS.GET_QUESTIONS(attemptId)
        );
        console.log('✓ Attempt questions fetched:', response.data.data?.length, 'questions');
        const rawQuestions = response.data.data ?? [];
        return normalizeQuestionsForViewer(rawQuestions);
    } catch (error) {
        console.error('✗ Failed to fetch attempt questions:', error);
        throw error;
    }
};

/**
 * Normalize questions from backend API response to frontend viewer format.
 * Handles multiple backend response structures.
 * Backend formats:
 * - { question, questionText } for text
 * - { options: [{option, optionNumber}, {optionText}] }
 * - { type, questionType } for type
 */
function normalizeQuestionsForViewer(questions: any[]): QuestionDto[] {
    return questions.map((q) => ({
        id: q.id,
        // Handle 'question' (from attempt responses), 'text', or 'questionText'
        text: q.question || q.text || q.questionText || '',
        // Handle both 'type' and 'questionType', normalize to standard format
        type: normalizeQuestionType(q.type || q.questionType || 'MCQ'),
        options: normalizeOptions(q.options || []),
        points: q.points || q.mark || 1,
    }));
}

/**
 * Normalize question type string to expected enum values.
 */
function normalizeQuestionType(type: any): 'MCQ' | 'TrueFalse' | 'Written' {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('true') || typeStr.includes('false')) return 'TrueFalse';
    if (typeStr.includes('written') || typeStr.includes('essay')) return 'Written';
    return 'MCQ';
}

/**
 * Normalize options array from backend format to service format.
 * Backend formats:
 * - { optionText } - from quiz creation API
 * - { option, optionNumber } - from attempt quiz responses
 * - { id, text } - from other endpoints
 */
function normalizeOptions(options: any[]): { id: string; text: string }[] {
    if (!Array.isArray(options)) return [];
    return options
        .filter((opt) => opt) // Filter out null/undefined
        .map((opt, idx) => ({
            // Use option number as id for attempt responses, fall back to id or index
            id: String(opt.optionNumber ?? opt.id ?? idx),
            // Handle all three field names: option, optionText, text
            text: opt.option || opt.optionText || opt.text || '',
        }))
        .filter((opt) => opt.text); // Only keep options with text
}

/**
 * Save student's progress on a quiz attempt
 * Called periodically (e.g., every 30 seconds) for auto-save functionality
 * @param attemptId - The ID of the attempt
 * @param payload - Object containing array of answered questions
 * @returns Promise with success confirmation
 */
export const saveAttemptProgress = async (
    attemptId: string,
    payload: SaveAttemptPayload
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.post<ApiResponse<{ success: boolean; message: string }>>(
            ENDPOINTS.ATTEMPTS.SAVE(attemptId),
            payload
        );
        console.log('✓ Attempt progress saved:', payload.answers.length, 'answers');
        return response.data.data ?? { success: true, message: 'Progress saved' };
    } catch (error) {
        console.error('✗ Failed to save attempt progress:', error);
        throw error;
    }
};

/**
 * Submit a completed quiz attempt
 * @param attemptId - The ID of the attempt to submit
 * @param payload - Final answers before submission
 * @returns Promise with submission confirmation
 */
export const submitQuizAttempt = async (
    attemptId: string,
    payload: SaveAttemptPayload
): Promise<{ success: boolean; message: string; attemptId: string }> => {
    try {
        const response = await api.put<
            ApiResponse<{ success: boolean; message: string; attemptId: string }>
        >(ENDPOINTS.ATTEMPTS.SUBMIT(attemptId), payload);
        console.log('✓ Quiz attempt submitted');
        return response.data.data ?? {
            success: true,
            message: 'Attempt submitted successfully',
            attemptId,
        };
    } catch (error) {
        console.error('✗ Failed to submit quiz attempt:', error);
        throw error;
    }
};

/**
 * Get the result/grade of a submitted quiz attempt
 * @param attemptId - The ID of the attempt
 * @returns Promise with attempt result including score
 */
export const getAttemptResult = async (attemptId: string): Promise<AttemptResult> => {
    try {
        const response = await api.get<ApiResponse<any>>(
            ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId)
        );

        const data = response.data.data;
        console.log('✓ Attempt result fetched - Score:', data?.achievedScore);

        // Calculate percentage
        const achieved = data?.achievedScore || 0;
        const total = data?.totalScore || 1; // 1 to avoid division by zero
        const percentage = Math.round((achieved / total) * 100);

        return {
            quizId: data?.quizId,
            score: achieved,
            totalScore: data?.totalScore || 0,
            percentage: percentage,
            status: data?.status || 'Submitted',
            studentId: data?.studentId,
            quizName: data?.quizName,
            submittedAt: data?.submittedAt,
            attemptNumber: data?.attemptNumber,
        };
    } catch (error) {
        console.error('✗ Failed to fetch attempt result:', error);
        throw error;
    }
};

/**
 * Get detailed student answers for review
 * Reads answers from attemptResult array in the result response
 * @param attemptId - The ID of the attempt
 * @returns Promise with array of student's answers with feedback
 */
export const getStudentAnswers = async (attemptId: string): Promise<StudentAnswer[]> => {
    try {
        // Use GET_RESULT endpoint since backend combines result with answer details
        const response = await api.get<ApiResponse<any>>(
            ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId)
        );

        const resultsArray = response.data.data?.attemptResult || [];
        console.log('✓ Student answers fetched:', resultsArray.length, 'answers');

        return resultsArray.map((item: any) => {
            // Find the correct option from options array
            const correctOption = item.options?.find((opt: any) => opt.isCorrect);

            return {
                questionId: item.questionId,
                questionText: item.questionText,
                studentAnswer: item.studentAnswer,
                correctAnswer: correctOption ? correctOption.optionText : undefined,
                isCorrect: item.score > 0, // If score > 0, it's correct
                points: item.score,
                possiblePoints: item.maxScore
            };
        });
    } catch (error) {
        console.error('✗ Failed to fetch student answers:', error);
        return [];
    }
};

/**
 * Grade a quiz attempt (instructor only)
 * Used for manual grading of essay/written questions
 * @param attemptId - The ID of the attempt to grade
 * @param payload - Grading data including scores for essay questions
 * @returns Promise with grading confirmation
 */
export const gradeAttempt = async (
    attemptId: string,
    payload: {
        essayGrades?: { questionId: string; score: number }[];
        totalScore?: number;
        feedback?: string;
    }
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.put<ApiResponse<{ success: boolean; message: string }>>(
            ENDPOINTS.ATTEMPTS.GRADE(attemptId),
            payload
        );
        console.log('✓ Attempt graded successfully');
        return response.data.data ?? { success: true, message: 'Grading saved' };
    } catch (error) {
        console.error('✗ Failed to grade attempt:', error);
        throw error;
    }
};

/**
 * Get all attempts for a specific quiz (all statuses: InProgress, Submitted, Graded)
 * @param quizId - The ID of the quiz
 * @returns Promise with array of all attempts for the quiz
 */
export const getQuizAttempts = async (quizId: string): Promise<StartAttemptResponse[]> => {
    try {
        const response = await api.get<any>(
            ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId)
        );

        const attemptsArray = response.data.data?.attempts ?? [];

        console.log('✓ Quiz attempts fetched:', attemptsArray.length, 'total attempts');
        return attemptsArray;
    } catch (error) {
        console.error('✗ Failed to fetch quiz attempts:', error);
        return [];
    }
}

