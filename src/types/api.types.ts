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

// ============================================================================
// Course Types
// ============================================================================

export interface CreateCourseCommand {
    code: string;
    name: string;
    description: string;
}

export interface UpdateCourseDetailsCommand {
    code: string;
    name: string;
    description: string;
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
}

export interface GetAllCoursesDto {
    id: number;
    code: string;
    name: string;
    courseStatus: string;
    createdAt: string;
    instructorId: number;
}

export interface GetAllCoursesDtoPaginationResult {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: GetAllCoursesDto[];
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
    id: number;
    studentId: number;
    email: string;
    fullName: string;
    phoneNumber: string;
}

export interface GetStudentCoursesDto {
    id: number;
    code: string;
    name: string;
    description: string;
    instructorId: number;
    instructorName: string;
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

export interface AssignmentCreateCommand {
    title: string;
    instructions: string;
    dueDate: string; // ISO 8601 date-time format
    courseId: number;
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
    fileName: string;
    fileSize: number; // int64
    contentType: string;
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
}

export interface GetAssignmentSubmissionDto {
    id: number;
    assignmentId: number;
    studentId: number;
    studentName: string;
    submittedAt: string;
    files: FileMetaData[];
    grade?: number;
    feedback?: string;
}

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    errors?: any;
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
// Quiz Types (Updated to support attemptTimeLimit & exact JSON payload)
// ============================================================================

export type QuizStatus = 'Draft' | 'Published' | 'Scheduled';
export type QuestionType = 'MCQ' | 'TrueFalse' | 'Written';

// --- Request DTOs (For Creation/Updating) ---
export interface OptionRequest {
    optionId?: string;     // uuid — omit for new, include for updates
    optionText: string;
    isCorrect: boolean;
}

/** @deprecated Use OptionRequest instead */
export type QuizOptionRequest = OptionRequest;

export interface QuestionUpsertRequest {
    id?: string;           // uuid — omit for new, include for updates
    questionText: string;
    questionType: QuestionType;
    mark: number;          // double
    instructions?: string;
    explanation?: string;
    options?: OptionRequest[];
}

/** @deprecated Use QuestionUpsertRequest instead */
export type QuestionRequest = QuestionUpsertRequest;

export interface QuizRequest {
    courseId: number;
    title: string;
    description?: string;
    availableFrom: string;
    availableUntil: string;
    maximumAttempts: number;
    attemptTimeLimit: number;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    status: QuizStatus;
    publishedDate?: string | null;
}

/** @deprecated Use QuizRequest instead */
export type CreateQuizCommand = QuizRequest;

// --- Response DTOs (For Fetching) ---
export interface OptionDto {
    id: string;
    optionText: string;
    isCorrect: boolean;
}

export interface QuestionDto {
    id: string;
    questionText: string;
    questionType: QuestionType;
    mark: number;
    instructions?: string;
    explanation?: string;
    options: OptionDto[];
}

export interface GetQuizDto {
    id: string;
    title: string;
    description?: string;
    courseId: string | number;
    courseName?: string;
    maximumAttempts: number;
    attemptTimeLimit: number;  // Added Duration Field
    status: QuizStatus;
    availableFrom: string;
    availableUntil: string;
    publishedDate?: string;
    publishedAt?: string | null;
    submissionsCount?: number;
    questionsCount?: number;
    studentAttemptCount?: number;
    hasActiveAttempt?: boolean;
    createdAt: string;
    showResultOnClose?: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    questions?: QuestionDto[]; // Optional: included when fetching a single quiz
}

// ============================================================================
// Quiz Submission & Grading Types
// ============================================================================

export type AttemptStatus = 'InProgress' | 'Submitted' | 'Reviewed';

export interface QuizSubmission {
    id: string;
    attemptId: string;
    studentId: string;
    studentName?: string;
    studentEmail?: string;
    quizId: string;
    quizTitle?: string;
    status: AttemptStatus;
    submittedAt?: string;
    score?: number;
    totalScore?: number;
    percentage?: number;
    timeSpent?: number;
    attemptNumber?: number;
}

export interface QuizSubmissionsResult extends PaginationResult<QuizSubmission> {
    totalResults: number;
    pagesCount: number;
    start: number;
    end: number;
    items: QuizSubmission[];
}

export interface GradeSubmissionDto {
    questionId: string;    // uuid
    score: number | null;  // double, nullable
    feedback?: string;
}

/** @deprecated Use GradeSubmissionDto instead */
export type GradeQuestionEntry = GradeSubmissionDto;

export interface GradeSubmissionCommand {
    grades: GradeSubmissionDto[];
    status: AttemptStatus;
}

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
// Quiz Attempt Types
// ============================================================================

export interface SaveAttemptAnswerRequest {
    questionId: string;    // uuid
    writtenAnswer?: string;
    optionId?: string;     // uuid
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