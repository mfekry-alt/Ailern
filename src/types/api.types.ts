/**
 * API Types - Auto-generated from Swagger/OpenAPI specification
 * Base URL: https://ailern.runasp.net
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface UserLoginByEmailAndPasswordCommand {
    email: string;
    password: string;
}

export interface GetTokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresOn: string;
    userName: string;
    email: string;
    role: string;
    instructorId?: number; // Numeric instructor ID (present for instructor logins)
    studentId?: number; // Numeric student ID (present for student logins)
    id?: number; // Generic user ID (if present)
    imageUrl: string | null;
}

export interface GetRefreshTokenCommand {
    refreshToken: string;
}

export interface RevokeRefreshTokenCommand {
    refresToken: string; // Note: API has typo "refresToken"
}

export interface ResendEmailConfirmationCommand {
    email: string;
}

export interface ForgetPasswordCommand {
    email: string;
}

export interface UserPasswordResetCommand {
    email: string;
    token: string;
    newPassword: string;
}

/** Logged-in change password — POST /api/auth/change-password (API uses these property names) */
export interface ChangePasswordCommand {
    currentPassword: string;
    newPassword: string;
}

export interface ChangeEmailCommand {
    newEmail: string;
    currentPassword: string;
}

export interface ConfirmChangeUserEmailCommand {
    token: string;
    userId: string;
    newEmail: string;
}

export interface ChangeUserPhotoCommand {
    Image: FileMetaData;
}

export interface DeleteUserPhotoCommand {
    // Usually empty if authenticated, but matches command pattern
}

// ============================================================================
// User Registration Types
// ============================================================================

export type InstructorJobTitle = 'Professor' | 'Teacher' | 'TeachingAssistant' | 'Lecturer' | 'Other';

export type Roles = 'Admin' | 'Student' | 'Instructor';

export interface CreateAdminCommand {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface RegisterUserCommand {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    role: Roles;
    jobTitle?: InstructorJobTitle;
}

/** @deprecated Use RegisterUserCommand instead */
export type RegisterCommand = RegisterUserCommand;

// ============================================================================
// User Management Types
// ============================================================================

export interface GetUserByIdDto {
    userName: string;
    email: string;
    fullName: string;
    role: string;
    createdBy: string;
}

export interface GetUsersByRoleDto {
    id: number;
    fullName: string;
    userName: string;
    email: string;
    phoneNumber: string;
    createdBy: string;
    role: string;
    imageUrl?: string | null;
}

export interface GetUsersByRoleDtoPaginationResult {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: GetUsersByRoleDto[];
}

export interface AddUserToRoleCommand {
    role: string;
}

export interface DeleteUserRoleCommand {
    role: string;
}

export interface GetUserCountsDto {
    totalUsers: number;
    totalStudent: number;
    totalInstructors: number;
    totalAdmins: number;
}

// ============================================================================
// Course Types
// ============================================================================

export interface CreateCourseCommand {
    code: string;
    name: string;
    description?: string;
    Image?: FileMetaData;
}

export interface UpdateCourseDetailsCommand {
    code: string;
    name: string;
    description?: string;
    Image?: FileMetaData;
}

export interface GetCourseDto {
    id: number;
    code: string;
    name: string;
    description: string;
    courseStatus: string;
    createdAt: string;
    instructorId: number;
    instructorName: string;
    imageUrl?: string | null;
}

export interface GetAllCoursesDto {
    id: number;
    code: string;
    name: string;
    createdAt: string;
    instructorId: number;
    instructorName: string;
    enrolledStudents: number;
    totalStudents: number;
    totalSections: number;
    description: string | null;
    imageUrl?: string | null;
    courseProgress?: number;
}

export interface GetAllCoursesDtoPaginationResult {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: GetAllCoursesDto[];
}

export interface GetCourseDetailsDto {
    id: number;
    imagePath: string | null;
    courseName: string;
    courseCode: string;
    courseDescription: string;
    instructorId: number;
    instructorName: string;
    instructorEmail: string;
    instructorImage: string | null;
    totalEnrollments: number;
    totalMaterialNumber: number;
    totalMaterialSize: number;
    totalAiResourcesNumber: number;
    totalAiResourcesSize: number;
}

export interface GetAvailableCoursesDto {
    id: number;
    code: string;
    name: string;
    instructorId: number;
    instructorName: string;
}

export interface GetAvailableCoursesDtoPaginationResult {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: GetAvailableCoursesDto[];
}

export interface RejectCourseCommand {
    reason: string;
}

// ============================================================================
// Enrollment Types
// ============================================================================

export interface GetEnrollmentRequestsDto {
    id: number;
    email: string;
    name: string;
    studentId: number;
    requestAt: string;
}

export interface RejectEnrollmentCommand {
    reason: string;
}

export interface GetStudentsByCourseIdDto {
    studentId: number;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    enrolledAt: string;
}

export interface GetStudentCoursesDto {
    id: number;
    code: string;
    name: string;
    description: string;
    instructorId: number;
    instructorName: string;
    /** Overall completion 0–100 from section completions; omitted on older payloads */
    progress?: number;
    imageUrl?: string | null;
}

/** Learning resume row — GET /Courses/my-learning (numeric codes from API) */
export const LearningType = {
    None: 0,
    File: 1,
    Video: 2,
} as const;

export type LearningType = (typeof LearningType)[keyof typeof LearningType];

export interface GetMyLearningDto {
    courseId: number;
    name: string;
    lastLearningItemId?: string | null;
    lastPageNumber?: number | null;
    lastWatchedTime?: number | null;
    type: LearningType;
}

/** Body — PUT /Courses/{courseId}/progress */
export interface UpdateStudentCourseProgressCommand {
    lastWatchedTime?: number;
    lastPageNumber?: number;
    lastOpenedFileId?: string | null;
}

// ============================================================================
// Pagination Query Parameters
// ============================================================================

export interface PaginationParams {
    SearchString?: string;
    SortBy?: string;
    Order?: 'asc' | 'desc';
    PageNumber?: number;
    PageSize?: number;
}

export interface CourseStatusParams extends PaginationParams {
    Status?: string;
}

export interface EmailConfirmationParams {
    Token: string;
    Email: string;
}

// ============================================================================
// Assignment Types
// ============================================================================

export interface AssignmentMutationResponse {
    id: number;
    presingedFileUrls?: string[];
}

export interface AssignmentCreateCommand {
    title: string;
    instructions: string;
    dueDate: string; // ISO 8601 date-time format
    allowLateSubmission: boolean;
    isPublished: boolean;
    uploadedFileMetaData?: FileMetaData[];
}

export interface AssignmentUpdateCommand {
    title: string;
    instructions: string;
    dueDate: string; // ISO 8601 date-time format
    allowLateSubmission: boolean;
    isPublished: boolean;
    uploadedFileMetaData?: FileMetaData[];
}

export interface AssignmentSubmissionCreateCommand {
    assignmentId: number;
    fileMetaData?: FileMetaData[];
}

export interface ConfirmAssignmentUploadCommand {
    assignmentId: number;
}

export interface FileMetaData {
    id?: string;
    fileId?: string;
    fileName?: string;
    FileName?: string;
    fileSize?: number;
    FileSize?: number;
    contentType?: string;
    ContentType?: string;
    fileUrl?: string;
}

// Response DTOs for Assignments
export interface GetAssignmentDto {
    id: number;
    title: string;
    instructions: string;
    dueDate: string;
    courseId: number;
    courseName?: string;
    instructorId: number;
    instructorName?: string;
    allowLateSubmission: boolean;
    isPublished: boolean;
    createdAt: string;
    files?: FileMetaData[];
    submissionFiles?: FileMetaData[];
    isSubmitted?: boolean;
    hasFeedback?: boolean;
}

export interface GetAssignmentSubmissionDto {
    id: number;
    assignmentId?: number;
    studentId: number;
    name: string;
    email?: string;
    submissionDate: string;
    isLate?: boolean;
    files?: FileMetaData[];
    grade?: number;
    feedback?: string;
}

export interface GetMySubmissionDto {
    submissionId: number;
    submissionDate: string;
    studentId: number;
    assignmentId: number;
    feedback: string | null;
    /** Set when instructor has graded */
    grade?: number | null;
    isLate: boolean;
    filesUrls: {
        id: string;
        fileName: string;
        fileType: string;
        fileUrl: string;
    }[];
}

// ============================================================================
// Generic API Response Types (global envelope)
// ============================================================================

/** Success envelope — `data` holds the endpoint payload (may be null for void ops). */
export interface ApiSuccess<T> {
    success: true;
    message: string | null;
    data: T;
    statusCode: 200;
}

export type ApiFailure =
    | { success: false; message: string | null; errors: Record<string, string[]>; statusCode: 400 }
    | { success: false; message: string | null; statusCode: 400 }
    | { success: false; message: string | null; statusCode: 404 | 401 | 403 | 409 | 500 };

/** Axios `response.data` shape — narrow with `if (data.success)` before using `data.data`. */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

/** Loose envelope for legacy callers / interceptors (optional fields). */
export interface ApiEnvelope<T = unknown> {
    success?: boolean;
    statusCode?: number;
    message?: string | null;
    errors?: Record<string, string[]> | null;
    data?: T;
}

export interface PaginationResult<T> {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: T[];
}

export interface ApiError {
    message: string;
    code?: string;
    status: number;
    fieldErrors?: Record<string, string[]>;
}

// ============================================================================
// Constants
// ============================================================================

export const CourseStatus = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
} as const;

export type CourseStatus = typeof CourseStatus[keyof typeof CourseStatus];

export const UserRole = {
    ADMIN: 'Admin',
    INSTRUCTOR: 'Instructor',
    STUDENT: 'Student',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// Quiz Types (API contract)
// ============================================================================

/** Server JSON enums */
export type QuizStatus = 'Draft' | 'Published';
/** UI-only scheduling mode (not sent as API enum) */
export type QuizFormStatus = QuizStatus | 'Scheduled';
export type QuestionType = 'MCQ' | 'TrueFalse' | 'Written';

// --- Request bodies (route supplies courseId / quizId where applicable) ---

export interface CreateQuizBody {
    title: string;
    description?: string | null;
    availableFrom: string;
    availableUntil: string;
    attemptTimeLimit: number;
    maximumAttempts: number;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableAIGrading?: boolean;
    globalAIInstructions?: string;
}

export interface UpdateQuizBody {
    title: string;
    description?: string | null;
    availableFrom: string;
    availableUntil: string;
    attemptTimeLimit: number;
    maximumAttempts: number;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableAIGrading?: boolean;
    globalAIInstructions?: string;
}

// --- Request DTOs (questions upsert) ---
export interface OptionRequest {
    optionId?: string | null;
    optionText: string;
    isCorrect: boolean;
}

/** @deprecated Use OptionRequest instead */
export type QuizOptionRequest = OptionRequest;

export type ExpectedAnswerImportance = "must-have" | "nice-to-have";

export interface ExpectedAnswerPoint {
    id: string;
    text: string;
    importance: ExpectedAnswerImportance;
}

export interface QuestionAIRubric {
    name: string;
    weight: number;
}

export interface EssayQuestionAIConfig {
    modelAnswer?: string | null;
    expectedPoints?: ExpectedAnswerPoint[] | null;
    rubric?: QuestionAIRubric[] | null;
    aiInstructions?: string | null;
}

export interface QuestionUpsertRequest {
    id?: string | null;
    questionText: string;
    questionType: QuestionType;
    mark: number;
    instructions?: string | null;
    explanation?: string | null;
    aiConfig?: EssayQuestionAIConfig | null;
    options: OptionRequest[];
}

/** @deprecated Use QuestionUpsertRequest instead */
export type QuestionRequest = QuestionUpsertRequest;

/**
 * Legacy combined shape (course + status) used by some forms.
 * Prefer `CreateQuizBody` + `POST /Courses/{courseId}/quizzes` or `UpdateQuizBody` for updates.
 */
export interface QuizRequest extends CreateQuizBody {
    courseId: number;
    /** UI may use Draft | Published | Scheduled; API list/detail use Draft | Published only */
    status: QuizFormStatus;
    publishedDate?: string | null;
}

/** @deprecated Use CreateQuizBody / UpdateQuizBody */
export type CreateQuizCommand = QuizRequest;

// --- List row (course quizzes pagination) ---
export interface GetAllQuizDto {
    id: string;
    title: string;
    description?: string | null;
    availableFrom: string;
    availableUntil: string;
    status: QuizStatus;
    maximumAttempts: number;
    showResultOnClose: boolean;
    attemptTimeLimit: number;
    createdAt: string;
    publishedAt?: string | null;
    questionsCount: number;
    studentAttemptCount?: number | null;
    hasActiveAttempt: boolean;
}

// --- Response DTOs (single quiz) ---
export interface OptionDto {
    optionNumber: number;
    optionText: string;
    isCorrect: boolean;
    /** Present on some mappings; prefer optionNumber when ordering */
    id?: string;
}

export interface QuestionDto {
    id?: string | null;
    questionText: string;
    questionType: QuestionType;
    mark: number;
    instructions?: string | null;
    explanation?: string | null;
    order: number;
    options?: OptionDto[] | null;
    aiConfig?: EssayQuestionAIConfig | null;
}

export interface GetQuizDto {
    id: string;
    courseId: number;
    title: string;
    description: string;
    availableFrom: string;
    availableUntil: string;
    maximumAttempts: number;
    totalPoints: number;
    publishedAt?: string | null;
    status?: QuizStatus | null;
    showResultOnClose?: boolean | null;
    shuffleQuestions?: boolean | null;
    shuffleOptions?: boolean | null;
    attemptTimeLimit?: number;
    enableAIGrading?: boolean;
    globalAIInstructions?: string;
    createdAt?: string | null;
    questions?: QuestionDto[] | null;
    /** Client / older payloads */
    courseName?: string;
    publishedDate?: string;
    questionsCount?: number;
    studentAttemptCount?: number;
    hasActiveAttempt?: boolean;
}

// ============================================================================
// Quiz Submission & Grading Types
// ============================================================================

export type AttemptStatus = 'InProgress' | 'Submitted' | 'Reviewed';

export interface GetSubmissionsByQuizIdDto {
    id: string;
    studentId: number;
    studentName: string;
    email: string;
    timeSpent?: number | null;
    startAt: string;
    submittedAt?: string | null;
    score?: number | null;
    attemptNumber: number;
    status: AttemptStatus;
}

/** @deprecated Prefer GetSubmissionsByQuizIdDto */
export interface QuizSubmission extends GetSubmissionsByQuizIdDto {
    attemptId?: string;
    studentEmail?: string;
    quizId?: string;
    quizTitle?: string;
    totalScore?: number;
    percentage?: number;
}

export type QuizSubmissionsResult = PaginationResult<GetSubmissionsByQuizIdDto>;

export interface GradeSubmissionDto {
    questionId: string;
    score?: number | null;
    feedback?: string | null;
}

/** @deprecated Use GradeSubmissionDto instead */
export type GradeQuestionEntry = GradeSubmissionDto;

export interface GradeSubmissionBody {
    grades: GradeSubmissionDto[];
    status: AttemptStatus;
}

/** @deprecated Use GradeSubmissionBody */
export type GradeSubmissionCommand = GradeSubmissionBody;

export interface GradeSubmissionResult {
    attemptId: string;
    quizId: string;
    score: number;
    totalScore: number;
    percentage: number;
    status: AttemptStatus;
    gradesApplied: number;
}

// ============================================================================
// Quiz Attempt Types (student + result)
// ============================================================================

export interface AttemptDto {
    attemptId: string;
    attemptEndDate: string;
}

export interface AttemptOptionDto {
    option: string;
    optionId: string;
    order: number;
}

export interface AttemptQuestionDto {
    id: string;
    question: string;
    type: QuestionType;
    mark: number;
    instructions?: string | null;
    options?: AttemptOptionDto[] | null;
    order: number;
    writtenAnswer?: string | null;
    selectedOptionId?: string | null;
    shuffledOptionIds: string[];
}

export interface SaveAttemptAnswerRequest {
    questionId: string;
    writtenAnswer?: string | null;
    optionId?: string | null;
}

export interface AttemptMetaData {
    id: string;
    timeSpent?: number | null;
    startAt: string;
    submittedAt?: string | null;
    score?: number | null;
    attemptNumber: number;
    status: AttemptStatus;
    attemptEndTime: string;
}

export interface GetAttemptsByQuizIdDto {
    quizId: string;
    quizTitle: string;
    totalPoints: number;
    availableFrom: string;
    availableUntil: string;
    showResultOnClose: boolean;
    attempts: AttemptMetaData[];
}

export interface OptionAnswerDto {
    order: number;
    optionText: string;
    isCorrect: boolean;
    isSelected: boolean;
}

export interface AnswerDto {
    questionId?: string;
    questionText: string;
    type: QuestionType;
    answer?: string | null;
    order: number;
    score: number;
    maxScore: number;
    feedback: string;
    instructions?: string | null;
    explanation?: string | null;
    options?: OptionAnswerDto[] | null;
}

export interface AttemptResultDto {
    attemptId: string;
    status: AttemptStatus;
    quizTitle: string;
    quizId: string;
    answers: AnswerDto[];
    timeSpent: number;
    totalScore: number;
    score: number;
}

// ============================================================================
// Section Types
// ============================================================================

export interface SectionCreateCommand {
    title: string;
    sectionNumber: number; // int32
    courseId: number;       // int32
}

export interface SectionUpdateCommand {
    id: string; // uuid
    title: string;
    sectionNumber: number; // int32
}

// ============================================================================
// Material Types
// ============================================================================

export interface MaterialFilesReorderCommand {
    orderedFilesIds: string[]; // uuid[]
}

export interface RequestMaterialPresignedUrlCommand {
    files: FileMetaData[];
}

// ============================================================================
// Instructor Dashboard Types
// ============================================================================

export interface InstructorStatsDto {
    totalCourses: number;
    totalStudents: number;
    totalQuizzes: number;
    totalAssignments: number;
}

export interface InstructorCourseProgressDto {
    courseId: number;
    courseName: string;
    studentsCount: number;
    quizzesCount: number;
    progressPercentage: number;
}

export interface UpcomingEventDto {
    title: string;
    eventType: 'Assignment' | 'Quiz';
    courseName: string;
    availableUntil: string; // ISO 8601 date-time e.g. "2027-04-10T00:00:00"
}
// Admin Dashboard Types
// ============================================================================
export interface TopCourseDto {
    courseName: string;
    instructorName: string;
    totalStudents: number;
}

export interface UserGrowthMonthDto {
    month: string;
    studentsCount: number;
    instructorsCount: number;
}

export interface AdminDashboardData {
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    totalCourses: number;
    totalEnrollments: number;
    topCourses: TopCourseDto[];
    userGrowthPerMonths: UserGrowthMonthDto[];
}

// ============================================================================
// Student Profile Types
// ============================================================================

export interface StudentProfileAssignmentDto {
    assignmentName: string;
    assignmentId: number;
    submissionId: number;
    submissionFiles: FileMetaData[];
    submissionFeedback: string | null;
}

export interface QuizAttemptDto {
    attemptId: string;
    attemptNumber: number;
    score: number;
    submittedAt: string;
}

export interface StudentProfileQuizDto {
    quizName: string;
    quizId: string;
    attempts: QuizAttemptDto[];
}

export interface GetStudentProfileDto {
    assignments: StudentProfileAssignmentDto[];
    quizzes: StudentProfileQuizDto[];
    averageQuizzesScore: number;
    progress: number;
}