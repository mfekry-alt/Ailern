/**
 * useQuizAttempt Hook - Complete lifecycle management for quiz attempt workflow
 * Handles: starting attempts, fetching questions, saving progress, submitting, and viewing results
 * Features: auto-save every 40 seconds (only when there is something to save), localStorage backup
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import * as attemptsService from '@/api/services/attempts.service';
import {
    buildSaveAnswerEntries,
    type AttemptResult,
    type StudentAnswer,
    type LocalAnswerLike,
} from '@/api/services/attempts.service';

/**
 * Question object returned from API
 */
interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    options?: { id: string; text: string }[];
    points?: number;
}

/**
 * Hook return type containing all state and action methods
 */
export interface UseQuizAttemptReturn {
    // State - Attempt Info
    attemptId: string | null;
    questions: Question[];
    answers: LocalAnswerLike[];
    result: AttemptResult | null;
    studentAnswers: StudentAnswer[];

    // State - Loading
    isLoadingStart: boolean;
    isLoadingQuestions: boolean;
    isLoadingSubmit: boolean;
    isLoadingResult: boolean;
    isAutoSaving: boolean;

    // State - Errors
    errorStart: string | null;
    errorQuestions: string | null;
    errorSubmit: string | null;
    errorResult: string | null;

    // Actions
    startAttempt: (quizId: string) => Promise<void>;
    updateAnswer: (questionId: string, answer: string | string[]) => void;
    submitAttempt: () => Promise<void>;
    fetchResult: () => Promise<void>;
    fetchStudentAnswers: () => Promise<void>;
    clearAnswers: () => void;
    loadAnswersFromStorage: () => void;
}

/**
 * Custom hook for managing quiz attempt lifecycle
 * @returns Object with state and methods for quiz attempt management
 */
export const useQuizAttempt = (): UseQuizAttemptReturn => {
    // Attempt Information
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<LocalAnswerLike[]>([]);
    const [result, setResult] = useState<AttemptResult | null>(null);
    const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);

    // Loading States
    const [isLoadingStart, setIsLoadingStart] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    // Error States
    const [errorStart, setErrorStart] = useState<string | null>(null);
    const [errorQuestions, setErrorQuestions] = useState<string | null>(null);
    const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
    const [errorResult, setErrorResult] = useState<string | null>(null);

    // Auto-save timer reference
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const answersRef = useRef(answers);
    const questionsRef = useRef(questions);
    const attemptIdRef = useRef(attemptId);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);
    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);
    useEffect(() => {
        attemptIdRef.current = attemptId;
    }, [attemptId]);

    /**
     * Generate localStorage key for this attempt
     */
    const getStorageKey = (id: string) => `quiz_attempt_${id}`;

    /**
     * Save answers to localStorage for backup
     */
    const saveToLocalStorage = useCallback((currentAnswers: LocalAnswerLike[], currentAttemptId: string) => {
        try {
            if (currentAttemptId) {
                localStorage.setItem(
                    getStorageKey(currentAttemptId),
                    JSON.stringify({
                        attemptId: currentAttemptId,
                        answers: currentAnswers,
                        timestamp: new Date().toISOString(),
                    })
                );
            }
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }, []);

    /**
     * Auto-save every 40s; POST only when at least one answer is saveable (non-empty).
     */
    const initiateAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setInterval(async () => {
            const id = attemptIdRef.current;
            if (!id) return;
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length === 0) return;
            try {
                setIsAutoSaving(true);
                await attemptsService.saveAttemptProgress(id, entries);
                saveToLocalStorage(answersRef.current, id);
            } catch (error) {
                console.warn('Auto-save failed, will retry:', error);
            } finally {
                setIsAutoSaving(false);
            }
        }, 40_000);
    }, [saveToLocalStorage]);

    /**
     * Start a new quiz attempt
     */
    const startAttempt = useCallback(async (quizId: string) => {
        setIsLoadingStart(true);
        setErrorStart(null);
        try {
            const response = await attemptsService.startOrResumeQuizAttempt(quizId);
            const resolvedAttemptId = response.id;  // Backend sends 'id', not 'attemptId'
            setAttemptId(resolvedAttemptId);

            // Fetch questions for this attempt
            setIsLoadingQuestions(true);
            const questionsData = await attemptsService.getAttemptQuestions(resolvedAttemptId);
            setQuestions(questionsData as Question[]);
            setIsLoadingQuestions(false);

            // Initialize answers array
            setAnswers([]);
            setErrorQuestions(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start quiz attempt';
            setErrorStart(message);
            console.error('Start attempt failed:', error);
        } finally {
            setIsLoadingStart(false);
        }
    }, []);

    /**
     * Update a single answer
     */
    const updateAnswer = useCallback((questionId: string, answer: string | string[]) => {
        setAnswers((prevAnswers) => {
            const existingIndex = prevAnswers.findIndex((a) => a.questionId === questionId);

            let updatedAnswers: LocalAnswerLike[];
            if (existingIndex > -1) {
                updatedAnswers = [...prevAnswers];
                updatedAnswers[existingIndex] = {
                    ...updatedAnswers[existingIndex],
                    ...(typeof answer === 'string'
                        ? { answer }
                        : { selectedOptions: answer }),
                };
            } else {
                updatedAnswers = [
                    ...prevAnswers,
                    {
                        questionId,
                        ...(typeof answer === 'string'
                            ? { answer }
                            : { selectedOptions: answer }),
                    },
                ];
            }

            // Save to localStorage whenever answer updates
            if (attemptId) {
                saveToLocalStorage(updatedAnswers, attemptId);
            }

            return updatedAnswers;
        });
    }, [attemptId, saveToLocalStorage]);

    /**
     * Submit the quiz attempt
     */
    const submitAttempt = useCallback(async () => {
        if (!attemptId) {
            console.error('No attempt ID available for submission');
            return;
        }

        setIsLoadingSubmit(true);
        setErrorSubmit(null);
        try {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length > 0) {
                await attemptsService.saveAttemptProgress(attemptId, entries);
            }
            await attemptsService.submitQuizAttempt(attemptId);

            // Clear auto-save timer on successful submission
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }

            // Clear localStorage on successful submission
            localStorage.removeItem(getStorageKey(attemptId));

            console.log('✓ Quiz submitted successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit quiz';
            setErrorSubmit(message);
            console.error('Submit attempt failed:', error);
            throw error;
        } finally {
            setIsLoadingSubmit(false);
        }
    }, [attemptId]);

    /**
     * Fetch the result/grade of the attempt
     */
    const fetchResult = useCallback(async () => {
        if (!attemptId) {
            console.error('No attempt ID available for fetching result');
            return;
        }

        setIsLoadingResult(true);
        setErrorResult(null);
        try {
            const resultData = await attemptsService.getAttemptResult(attemptId);
            setResult(resultData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch result';
            setErrorResult(message);
            console.error('Fetch result failed:', error);
        } finally {
            setIsLoadingResult(false);
        }
    }, [attemptId]);

    /**
     * Fetch detailed student answers for review
     */
    const fetchStudentAnswers = useCallback(async () => {
        if (!attemptId) {
            console.error('No attempt ID available for fetching student answers');
            return;
        }

        try {
            const answersData = await attemptsService.getStudentAnswers(attemptId);
            setStudentAnswers(answersData);
        } catch (error) {
            console.error('Fetch student answers failed:', error);
        }
    }, [attemptId]);

    /**
     * Clear all answers
     */
    const clearAnswers = useCallback(() => {
        setAnswers([]);
        if (attemptId) {
            localStorage.removeItem(getStorageKey(attemptId));
        }
    }, [attemptId]);

    /**
     * Load answers from localStorage (for recovery after page refresh)
     */
    const loadAnswersFromStorage = useCallback(() => {
        if (!attemptId) return;

        try {
            const stored = localStorage.getItem(getStorageKey(attemptId));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.answers && Array.isArray(parsed.answers)) {
                    setAnswers(parsed.answers);
                    console.log('✓ Answers recovered from localStorage');
                }
            }
        } catch (error) {
            console.warn('Failed to load answers from storage:', error);
        }
    }, [attemptId]);

    /**
     * Set up auto-save when answers change and attempt is active
     */
    useEffect(() => {
        if (attemptId && questions.length > 0) {
            initiateAutoSave();
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [attemptId, questions.length, initiateAutoSave]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, []);

    return {
        // State
        attemptId,
        questions,
        answers,
        result,
        studentAnswers,
        isLoadingStart,
        isLoadingQuestions,
        isLoadingSubmit,
        isLoadingResult,
        isAutoSaving,
        errorStart,
        errorQuestions,
        errorSubmit,
        errorResult,

        // Actions
        startAttempt,
        updateAnswer,
        submitAttempt,
        fetchResult,
        fetchStudentAnswers,
        clearAnswers,
        loadAnswersFromStorage,
    };
};
