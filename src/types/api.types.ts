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

export interface SendPasswordResetEmailCommand {
    email: string;
}

export interface UserPasswordResetCommand {
    email: string;
    token: string;
    newPassword: string;
}

// ============================================================================
// User Registration Types
// ============================================================================

export interface CreateAdminCommand {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface CreateInstructorCommand {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface CreateStudentCommand {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    studentId: number;
}

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

// Response DTOs for Assignments (not in swagger but returned by API)
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

/**
 * Standard API response wrapper used by all endpoints
 * The actual data is in the 'data' field
 */
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
// Course Status Constants
// ============================================================================

export const CourseStatus = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
} as const;

export type CourseStatus = typeof CourseStatus[keyof typeof CourseStatus];

// ============================================================================
// User Roles Constants
// ============================================================================

export const UserRole = {
    ADMIN: 'Admin',
    INSTRUCTOR: 'Instructor',
    STUDENT: 'Student',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// Quiz Types
// ============================================================================

export type QuizStatus = 'Draft' | 'Published' | 'Scheduled';
export type QuestionType = 'MCQ' | 'TrueFalse' | 'Written';

// Request types (for creating/updating)
export interface OptionRequest {
    optionText: string;
    isCorrect: boolean;
}

export interface QuestionRequest {
    id?: string;           // uuid – omit for new questions, include for updates
    questionText: string;
    questionType: QuestionType;
    mark: number;
    instructions?: string;
    explanation?: string;
    options: OptionRequest[];
}

// Response types (DTOs returned from API)
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

export interface CreateQuizCommand {
    title: string;
    description?: string;
    courseId: string;
    maximumAttempts: number;
    status: QuizStatus;
    availableFrom: string;
    availableUntil: string;
    publishedDate?: string;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    questions: QuestionRequest[];
}

export interface GetQuizDto {
    id: string;
    title: string;
    description?: string;
    courseId: string | number;
    maximumAttempts: number;
    status: QuizStatus;
    availableFrom: string;
    availableUntil: string;
    publishedDate?: string;
    publishedAt?: string | null;
    submissionsCount?: number;
    questionsCount?: number;
    createdAt: string;
    showResultOnClose?: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    questions?: QuestionDto[];  // Optional: included when fetching single quiz
}
