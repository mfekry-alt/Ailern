// ============================================================================
// Quiz Dashboard / Analytics Types
// GET /api/Dashboard/quiz/{quizId}
// ============================================================================

export type DashboardMode = 'Min' | 'Avg' | 'Max';

export interface PassFailStats {
    passes: number;
    fails: number;
}

export interface AverageScore {
    minAverage: number;
    avgAverage: number;
    maxAverage: number;
}

export interface PassesFails {
    Min: PassFailStats;
    Avg: PassFailStats;
    Max: PassFailStats;
}

export interface QuestionStatistic {
    questionId: string;
    questionText: string;
    correctAnswersCount: number;
}

export interface AttemptsDistribution {
    attemptNumber: number;
    studentsCount: number;
}

export interface SubmissionTimeDistribution {
    bucketIndex: number;
    label: string;
    submissionsCount: number;
}

export interface QuizDashboardData {
    studentsInCourse: number;
    numberOfStudents: number;
    averageScore: AverageScore;
    passesFalis: PassesFails;
    questionStatistics: QuestionStatistic[];
    attemptsDistributions: AttemptsDistribution[];
    submissionTimeDistribution: SubmissionTimeDistribution[];
}
