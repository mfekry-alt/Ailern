// Base types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar?: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    instructorId: string;
    instructor?: User;
    category?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    price: number;
    duration?: number; // in minutes
    status: 'Draft' | 'Published' | 'Archived';
    enrollmentCount: number;
    rating?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Module {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    lessons?: Lesson[];
    createdAt: string;
    updatedAt: string;
}

export interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: number; // in minutes
    order: number;
    type: 'Video' | 'Text' | 'Quiz' | 'Assignment';
    isPreview: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    course?: Course;
    status: 'Active' | 'Completed' | 'Dropped';
    progress: number; // 0-100
    enrolledAt: string;
    completedAt?: string;
}

export interface Quiz {
    id: string;
    courseId: string;
    lessonId?: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number; // in minutes
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

export interface Question {
    id: string;
    quizId: string;
    question: string;
    type: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer';
    options?: string[];
    correctAnswer: string;
    points: number;
    order: number;
}

export interface Submission {
    id: string;
    userId: string;
    quizId: string;
    answers: Record<string, string>;
    score?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
}

export interface LessonProgress {
    id: string;
    userId: string;
    lessonId: string;
    completed: boolean;
    progress: number; // 0-100
    lastAccessedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    code?: string;
    status: number;
    fieldErrors?: Record<string, string[]>;
}

// Form types
export interface LoginForm {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterForm {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}

export interface CourseForm {
    title: string;
    description: string;
    thumbnail?: string;
    category?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    price: number;
    status: 'Draft' | 'Published';
}

export interface LessonForm {
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    type: 'Video' | 'Text' | 'Quiz' | 'Assignment';
    isPreview: boolean;
}

// Filter types
export interface CourseFilter {
    search?: string;
    category?: string;
    level?: string;
    status?: string;
    instructorId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UserFilter {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
}

