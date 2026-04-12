/**
 * Quiz & Attempt Validators
 * Client-side validation helpers matching backend constraints from API spec
 * 
 * =====================================================================
 * USAGE IN COMPONENTS
 * =====================================================================
 * 
 * For True/False questions, use the helper to avoid manual typing errors:
 * 
 *   import { createTrueFalseOptions, validateQuestionsArray } from '@/lib/validators';
 *   
 *   // Create options
 *   const options = createTrueFalseOptions(true); // true = "True" is correct
 *   
 *   // Use in question
 *   const question = {
 *     questionText: "Is 2+2=4?",
 *     questionType: "TrueFalse",
 *     mark: 5,
 *     options: options
 *   };
 *   
 *   // Validate
 *   const result = validateQuestionsArray([question]);
 *   if (!result.isValid) { handleErrors(result.errors); }
 * 
 * =====================================================================
 */

import type { QuestionRequest, QuizOptionRequest } from '@/types/api.types';

// ============================================================================
// Validation Result Type
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// ============================================================================
// Constants
// ============================================================================

const MAX_QUESTION_TEXT = 2000;
const MAX_INSTRUCTION_TEXT = 1000;
const MAX_EXPLANATION_TEXT = 1000;
const MAX_OPTION_TEXT = 300;
const MIN_MARK = 0.01;
const MAX_MARK = 100;

/**
 * Fixed True/False options - Use these directly in components to prevent user errors
 * These ensure consistent capitalization and avoid manual typing mistakes
 */
export const TRUE_FALSE_OPTIONS = [
    { optionText: 'True', isCorrect: false },  // Will be toggled by user
    { optionText: 'False', isCorrect: false }, // Will be toggled by user
] as const;

/**
 * Helper to create True/False options with one marked as correct
 * @param correctAnswer - boolean: true for "True" option, false for "False" option
 * @returns Array of QuizOptionRequest with one option marked correct
 */
export const createTrueFalseOptions = (correctAnswer: boolean): Array<{ optionText: string; isCorrect: boolean }> => [
    { optionText: 'True', isCorrect: correctAnswer === true },
    { optionText: 'False', isCorrect: correctAnswer === false },
];

/**
 * Validates if options match the True/False pattern
 * Used internally by validator
 */
const isTrueFalsePattern = (options: Array<{ optionText: string; isCorrect: boolean }>): boolean => {
    if (!options || options.length !== 2) return false;

    const texts = options.map(o => o.optionText.trim().toLowerCase());
    const hasTrue = texts.includes('true');
    const hasFalse = texts.includes('false');

    return hasTrue && hasFalse;
};

// ============================================================================
// Question & Option Validation
// ============================================================================

export const validateQuestionOption = (option: QuizOptionRequest, questionType: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!option.optionText?.trim()) {
        errors.push({ field: 'optionText', message: 'Option text is required' });
    } else if (option.optionText.length > MAX_OPTION_TEXT) {
        errors.push({ field: 'optionText', message: `Option text cannot exceed ${MAX_OPTION_TEXT} characters` });
    }

    // TrueFalse specific validation - must be exactly "True" or "False"
    if (questionType === 'TrueFalse') {
        const text = option.optionText?.trim().toLowerCase();
        if (text !== 'true' && text !== 'false') {
            errors.push({
                field: 'optionText',
                message: 'TrueFalse options must be "True" or "False" (recommended: use createTrueFalseOptions helper)'
            });
        }
    }

    return errors;
};

export const validateQuestionRequest = (question: QuestionRequest): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Question text validation
    if (!question.questionText?.trim()) {
        errors.push({ field: 'questionText', message: 'Question text is required' });
    } else if (question.questionText.length > MAX_QUESTION_TEXT) {
        errors.push({ field: 'questionText', message: `Question text cannot exceed ${MAX_QUESTION_TEXT} characters` });
    }

    // Mark validation
    if (typeof question.mark !== 'number' || question.mark <= 0) {
        errors.push({ field: 'mark', message: 'Mark must be greater than 0' });
    } else if (question.mark > MAX_MARK) {
        errors.push({ field: 'mark', message: `Mark cannot exceed ${MAX_MARK}` });
    }

    // Question type validation
    if (!['MCQ', 'TrueFalse', 'Written'].includes(question.questionType)) {
        errors.push({ field: 'questionType', message: 'Invalid question type' });
    }

    // Instructions validation
    if (question.instructions && question.instructions.length > MAX_INSTRUCTION_TEXT) {
        errors.push({ field: 'instructions', message: `Instructions cannot exceed ${MAX_INSTRUCTION_TEXT} characters` });
    }

    // Explanation validation
    if (question.explanation && question.explanation.length > MAX_EXPLANATION_TEXT) {
        errors.push({ field: 'explanation', message: `Explanation cannot exceed ${MAX_EXPLANATION_TEXT} characters` });
    }

    // Options validation (for MCQ and TrueFalse)
    if (question.questionType === 'MCQ' || question.questionType === 'TrueFalse') {
        const options = question.options || [];

        if (!options || options.length === 0) {
            errors.push({ field: 'options', message: 'At least one option is required' });
        } else {
            // Validate each option
            options.forEach((opt, index) => {
                const optErrors = validateQuestionOption(opt, question.questionType);
                errors.push(...optErrors.map(e => ({ ...e, field: `options[${index}].${e.field}` })));
            });

            // Check for exactly one correct answer
            const correctCount = options.filter(o => o.isCorrect).length;
            if (correctCount !== 1) {
                errors.push({ field: 'options', message: 'Exactly one option must be marked as correct' });
            }

            // MCQ specific: 3-5 options
            if (question.questionType === 'MCQ') {
                if (options.length < 3 || options.length > 5) {
                    errors.push({ field: 'options', message: 'MCQ must have between 3 and 5 options' });
                }
            }

            // TrueFalse specific: exactly 2 options with True and False labels
            if (question.questionType === 'TrueFalse') {
                if (options.length !== 2) {
                    errors.push({ field: 'options', message: 'TrueFalse must have exactly 2 options (True and False)' });
                } else if (!isTrueFalsePattern(options)) {
                    errors.push({
                        field: 'options',
                        message: 'TrueFalse options must contain exactly one "True" and one "False" option. Use createTrueFalseOptions() helper for correct format.'
                    });
                }
            }
        }
    }

    return errors;
};

export const validateQuestionsArray = (questions: QuestionRequest[]): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!questions || questions.length === 0) {
        return { isValid: false, errors: [{ field: 'questions', message: 'At least one question is required' }] };
    }

    questions.forEach((q, index) => {
        const questionErrors = validateQuestionRequest(q);
        errors.push(...questionErrors.map(e => ({ ...e, field: `questions[${index}].${e.field}` })));
    });

    return { isValid: errors.length === 0, errors };
};

// ============================================================================
// Grading Validation
// ============================================================================

export interface GradeEntry {
    questionId: string;
    score: number;
    feedback?: string;
}

export const validateGradeEntry = (grade: GradeEntry): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!grade.questionId?.trim()) {
        errors.push({ field: 'questionId', message: 'Question ID is required' });
    }

    if (typeof grade.score !== 'number' || grade.score < 0) {
        errors.push({ field: 'score', message: 'Score must be a non-negative number' });
    }

    if (grade.score > MAX_MARK) {
        errors.push({ field: 'score', message: `Score cannot exceed ${MAX_MARK}` });
    }

    return errors;
};

export const validateGradesArray = (grades: GradeEntry[]): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!grades || grades.length === 0) {
        return { isValid: false, errors: [{ field: 'grades', message: 'At least one grade entry is required' }] };
    }

    grades.forEach((g, index) => {
        const gradeErrors = validateGradeEntry(g);
        errors.push(...gradeErrors.map(e => ({ ...e, field: `grades[${index}].${e.field}` })));
    });

    return { isValid: errors.length === 0, errors };
};

export const validateGradeSubmissionStatus = (status: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!['Submitted', 'Reviewed'].includes(status)) {
        errors.push({ field: 'status', message: 'Status must be either "Submitted" or "Reviewed"' });
    }

    return errors;
};

// ============================================================================
// Submission Query Validation
// ============================================================================

export interface SubmissionQueryParams {
    status: 'InProgress' | 'Submitted' | 'Reviewed';
    pageNo?: number;
    pageSize?: number;
}

export const validateSubmissionQuery = (params: SubmissionQueryParams): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!['InProgress', 'Submitted', 'Reviewed'].includes(params.status)) {
        errors.push({ field: 'status', message: 'Status must be "InProgress", "Submitted", or "Reviewed"' });
    }

    if (params.pageNo && params.pageNo < 1) {
        errors.push({ field: 'pageNo', message: 'Page number must be at least 1' });
    }

    if (params.pageSize && (params.pageSize < 1 || params.pageSize > 100)) {
        errors.push({ field: 'pageSize', message: 'Page size must be between 1 and 100' });
    }

    return { isValid: errors.length === 0, errors };
};
