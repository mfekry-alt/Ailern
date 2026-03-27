/**
 * Quiz Attempts Service - Handles all quiz attempt-related API calls
 * Manages the complete quiz attempt workflow: start, fetch questions, save progress, submit
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

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
    attemptId: string;
    quizId: string;
    score: number;
    totalScore: number;
    percentage: number;
    status: 'Submitted' | 'Graded' | 'InProgress';
    submittedAt: string;
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
 */
export interface StartAttemptResponse {
    id: string;
    attemptId: string;
    quizId: string;
    startedAt: string;
    submittedAt?: string;
    status: 'InProgress' | 'Submitted' | 'Graded' | 'In-Progress';
    timeLimit?: number;
    score?: number;
    totalMarks?: number;
    duration?: number;
    attemptNumber?: number;
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
 * @param quizId - The ID of the quiz
 * @returns Promise with array of open attempts (usually 0-1)
 */
export const getStudentOpenAttempts = async (quizId: string): Promise<StartAttemptResponse[]> => {
    try {
        const response = await api.get<any>(
            ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId)
        );

        // Get all attempts from the response
        const allAttempts = response.data.data?.attempts ?? [];

        // Filter to get only InProgress attempts (check both variations)
        const openAttempts = allAttempts.filter(
            (attempt: StartAttemptResponse) =>
                attempt.status === 'InProgress' || attempt.status === 'In-Progress'
        );

        console.log('✓ Open attempts fetched:', openAttempts.length, 'from', allAttempts.length, 'total');
        return openAttempts;
    } catch (error) {
        console.warn('✗ Failed to fetch open attempts:', error);
        // Return empty array instead of throwing - not all backends support this endpoint
        return [];
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
        return response.data.data ?? [];
    } catch (error) {
        console.error('✗ Failed to fetch attempt questions:', error);
        throw error;
    }
};

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
        const response = await api.get<ApiResponse<AttemptResult>>(
            ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId)
        );
        console.log('✓ Attempt result fetched - Score:', response.data.data?.score);
        return response.data.data!;
    } catch (error) {
        console.error('✗ Failed to fetch attempt result:', error);
        throw error;
    }
};

/**
 * Get detailed student answers for review
 * Includes both student answers and correct answers for learning purposes
 * @param attemptId - The ID of the attempt
 * @returns Promise with array of student's answers with feedback
 */
export const getStudentAnswers = async (attemptId: string): Promise<StudentAnswer[]> => {
    try {
        const response = await api.get<ApiResponse<StudentAnswer[]>>(
            ENDPOINTS.ATTEMPTS.GET_STUDENT_ANSWERS(attemptId)
        );
        console.log('✓ Student answers fetched:', response.data.data?.length, 'answers');
        return response.data.data ?? [];
    } catch (error) {
        console.error('✗ Failed to fetch student answers:', error);
        throw error;
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

