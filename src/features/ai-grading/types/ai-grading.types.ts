/**
 * AI Auto Grading Engine — TypeScript Types
 * Matches the system prompt input/output contract.
 */

// ─── Grading Modes ─────────────────────────────────────────────────────────
export type GradingMode = 'STRICT' | 'BALANCED' | 'FLEXIBLE';

// ─── Input Types (sent to the AI engine) ───────────────────────────────────

export interface AIGradingRubricCriteria {
    [key: string]: number; // e.g. { understanding: 70, examples: 30 }
}

export interface AIGradingRubric {
    criteria: AIGradingRubricCriteria;
}

export interface AIGradingQuestionInput {
    text: string;
    type: 'essay' | 'mcq' | 'true_false' | 'written';
    total_marks: number;
    rubric: AIGradingRubric;
    instructions: string[];
}

export interface AIGradingRequest {
    question: AIGradingQuestionInput;
    student_answer: string;
    global_instructions: string[];
    grading_mode: GradingMode;
}

// ─── Output Types (returned from the AI engine) ───────────────────────────

export interface AIGradingBreakdown {
    [criterion: string]: number; // e.g. { understanding: 6.5, examples: 2.0 }
}

export interface AIGradingResult {
    score: number;
    max_score: number;
    breakdown: AIGradingBreakdown;
    feedback: string[];
    final_comment: string;
}

// ─── Per-Question Grading Result (for the UI) ─────────────────────────────

export interface AIGradedQuestion {
    id: string;
    order: number;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    questionText: string;
    studentAnswer: string;
    correctAnswer?: string;
    options?: {
        optionText: string;
        isSelected: boolean;
        isCorrect: boolean;
        order: number;
    }[];
    aiResult: AIGradingResult;
}

// ─── Full Attempt Grading Response ────────────────────────────────────────

export interface AIGradingAttemptResult {
    attemptId: string;
    quizId: string;
    quizTitle: string;
    studentName: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    gradingMode: GradingMode;
    overallFeedback: string;
    questions: AIGradedQuestion[];
    gradedAt: string;
}

// ─── AI Grading Configuration (for Instructors) ─────────────────────────

export interface AIGradingCriterion {
    id: string | null;
    criterion: string;
    mark: number;
}

export interface AIGradingConfigUpdateRequest {
    modelAnswer: string;
    criteria: AIGradingCriterion[];
}

export interface AIGradingCriteriaResponseItem {
    questionId: string;
    questionText: string;
    mark: number;
    modelAnswer: string;
    criteriaList: AIGradingCriterion[];
}

export type AIGradingCriteriaResponse = AIGradingCriteriaResponseItem[];
