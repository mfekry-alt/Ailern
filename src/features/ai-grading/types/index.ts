export type AISubmissionStatus = 'Auto Approved' | 'Needs Manual Review' | 'Instructor Reviewed';

export type AIConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface AIWeakTopic {
    id: string;
    name: string;
    severity: 'high' | 'medium';
}

export interface AIStrengthTopic {
    id: string;
    name: string;
}

export interface AIRubricScore {
    criterionName: string;
    weight: number; // percentage or absolute points
    score: number;
    feedback?: string;
}

export interface AIQuestionEvaluation {
    questionNumber: number;
    questionId: string;
    questionType: 'MCQ' | 'TrueFalse' | 'Written';
    questionText: string;
    studentAnswer: string;
    modelAnswer: string;
    awardedScore: number;
    maxScore: number;
    confidence: number; // 0-100
    feedback: string;
    mistakes: string[];
    missingConcepts: string[];
    positiveObservations: string[];
    rubricScores?: AIRubricScore[];
}

export interface AIInstructorReview {
    status: AISubmissionStatus;
    instructorNote?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    scoreOverride?: number;
}

export interface AISubmissionResult {
    id: string;
    quizId: string;
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    submissionDate: string;
    timeTakenMinutes: number;
    finalScore: number;
    maxScore: number;
    overallConfidence: number; // 0-100
    status: AISubmissionStatus;
    overallFeedback: string;
    recommendation: string;
    weakTopics: AIWeakTopic[];
    strengths: AIStrengthTopic[];
    questionEvaluations: AIQuestionEvaluation[];
    instructorReview?: AIInstructorReview;
}

export interface AIQuizGradingStats {
    totalSubmissions: number;
    averageScore: number;
    averageConfidence: number;
    lowConfidenceCount: number;
    needsReviewCount: number;
    completionPercentage: number;
}
