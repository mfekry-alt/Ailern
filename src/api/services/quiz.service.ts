/**
 * Quiz Service — aligned with `/api` quiz contract (course-scoped create/list, envelope responses).
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    ApiEnvelope,
    ApiResponse,
    CreateQuizBody,
    GetAllQuizDto,
    GetQuizDto,
    GetSubmissionsByQuizIdDto,
    OptionDto,
    PaginationResult,
    QuestionDto,
    QuestionType,
    QuestionUpsertRequest,
    UpdateQuizBody,
} from '@/types/api.types';

export interface QuizGenerationFile {
    id: string;
    fileName: string;
    fileSize?: number;
    contentType?: string;
}

export interface GenerateQuizByAIPayload {
    fileIds?: string[];
    topics?: string[];
    questionsCount: number;
    questionTypeCounts: {
        MCQ: number;
        TrueFalse: number;
        Written: number;
    };
    questionDifficultyPercents: {
        Easy: number;
        Medium: number;
        Hard: number;
    };
    query?: string;
    options?: {
        useSelectedOnly: boolean;
        style: 'conceptual' | 'practical' | 'mixed';
        bloomLevel?: string;
    };
}

const unwrapEnvelope = <T>(payload: ApiEnvelope<T> | T | undefined): T | undefined => {
    if (payload == null) return undefined;
    if (typeof payload === 'object' && payload !== null && 'data' in payload) {
        return (payload as ApiEnvelope<T>).data as T | undefined;
    }
    return payload as T;
};

const unwrapApiResponse = <T>(payload: ApiResponse<T> | ApiEnvelope<T> | T): T => {
    const inner = unwrapEnvelope<T>(payload as ApiEnvelope<T>);
    if (inner !== undefined) return inner as T;
    return payload as T;
};

// --- Quiz CRUD ---

/**
 * POST /api/Courses/{courseId}/quizzes — returns new quiz id (GUID string).
 */
export const createQuiz = async (
    courseId: string | number,
    body: CreateQuizBody
): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(ENDPOINTS.COURSES.QUIZZES(courseId), body);
    const id = unwrapEnvelope<string>(response.data as ApiEnvelope<string>);
    if (typeof id !== 'string' || !id) {
        throw new Error((response.data as ApiEnvelope)?.message ?? 'Failed to create quiz');
    }
    return id;
};

/**
 * PUT /api/Quizzes/{id}/update-status?status=Draft|Published
 */
export const updateQuizStatus = async (
    quizId: string,
    status: 'Draft' | 'Published'
): Promise<void> => {
    await api.put(ENDPOINTS.QUIZZES.UPDATE_STATUS(quizId), undefined, {
        params: { status },
    });
};

/**
 * GET /api/Courses/{courseId}/quizzes?pageNo=&pageSize=
 */
export const getCourseQuizzes = async (
    courseId: string | number,
    pageNo: number = 1,
    pageSize: number = 100
): Promise<GetAllQuizDto[]> => {
    try {
        const response = await api.get<ApiResponse<PaginationResult<GetAllQuizDto>>>(
            ENDPOINTS.COURSES.QUIZZES(courseId),
            { params: { pageNo, pageSize } }
        );
        const page = unwrapEnvelope<PaginationResult<GetAllQuizDto>>(response.data as ApiEnvelope<PaginationResult<GetAllQuizDto>>);
        if (page?.items) return page.items;
        return [];
    } catch (error) {
        console.error('Fetch course quizzes failed:', error);
        return [];
    }
};

export const getCourseQuizzesPage = async (
    courseId: string | number,
    pageNo: number = 1,
    pageSize: number = 10
): Promise<PaginationResult<GetAllQuizDto>> => {
    const response = await api.get<ApiResponse<PaginationResult<GetAllQuizDto>>>(
        ENDPOINTS.COURSES.QUIZZES(courseId),
        { params: { pageNo, pageSize } }
    );
    const page = unwrapEnvelope<PaginationResult<GetAllQuizDto>>(response.data as ApiEnvelope<PaginationResult<GetAllQuizDto>>);
    return (
        page ?? {
            totalResults: 0,
            pagesCount: 0,
            start: 0,
            end: -1,
            items: [],
        }
    );
};

let activeQuizPromises: Record<string, Promise<GetQuizDto> | undefined> = {};

export const getQuiz = async (id: string): Promise<GetQuizDto> => {
    if (activeQuizPromises[id]) {
        return activeQuizPromises[id];
    }

    activeQuizPromises[id] = (async () => {
        try {
            const response = await api.get<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.GET(id));
            const data = unwrapEnvelope<GetQuizDto>(response.data as ApiEnvelope<GetQuizDto>);
            if (!data) throw new Error('Quiz not found');
            return data;
        } finally {
            delete activeQuizPromises[id];
        }
    })();

    return activeQuizPromises[id];
};

/**
 * PUT /api/Quizzes/{id}
 */
export const updateQuiz = async (id: string, command: UpdateQuizBody): Promise<void> => {
    await api.put<ApiResponse<null>>(ENDPOINTS.QUIZZES.UPDATE(id), command);
};

export const deleteQuiz = async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.QUIZZES.DELETE(id));
};

// --- AI (optional / backend-specific) ---

export const generateQuizQuestionsByAI = async (quizId: string, payload: GenerateQuizByAIPayload): Promise<unknown> => {
    const response = await api.post<ApiResponse<unknown>>(
        ENDPOINTS.QUIZZES.GENERATE_BY_AI(quizId),
        payload
    );
    return unwrapApiResponse(response.data);
};

export const generateAIQuestions = async (params: {
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    count: number;
    context?: string;
}): Promise<QuestionUpsertRequest[]> => {
    const response = await api.post<ApiResponse<QuestionUpsertRequest[]>>('/Quizzes/quick-generate', params);
    const data = unwrapEnvelope(response.data as ApiEnvelope<QuestionUpsertRequest[]>);
    return data ?? [];
};

export const getQuizGenerationJob = async (jobId: string): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(ENDPOINTS.QUIZZES.JOB_STATUS(jobId));
    return unwrapApiResponse(response.data);
};

export const getQuizGenerationFiles = async (quizId: string): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(ENDPOINTS.QUIZZES.GENERATE_FILES(quizId));
    return unwrapApiResponse(response.data);
};

// --- AI Generated Questions ---

export interface AiGeneratedQuestionDto {
    id: string;
    questionText: string;
    questionType: QuestionType;
    mark: number;
    instructions?: string | null;
    explanation?: string | null;
    options?: OptionDto[] | null;
}

export const getAiGeneratedQuestions = async (quizId: string): Promise<AiGeneratedQuestionDto[]> => {
    const response = await api.get<ApiResponse<AiGeneratedQuestionDto[]>>(ENDPOINTS.QUIZZES.AI_GENERATED_QUESTIONS(quizId));
    const data = unwrapEnvelope<AiGeneratedQuestionDto[]>(response.data as ApiEnvelope<AiGeneratedQuestionDto[]>);
    return data ?? [];
};

export const acceptAiGeneratedQuestion = async (quizId: string, questionId: string): Promise<void> => {
    await api.put<ApiResponse<null>>(ENDPOINTS.QUIZZES.ACCEPT_AI_QUESTION(quizId, questionId));
};

export const rejectAiGeneratedQuestion = async (quizId: string, questionId: string): Promise<void> => {
    await api.delete(ENDPOINTS.QUIZZES.REJECT_AI_QUESTION(quizId, questionId));
};

export const acceptAllAiGeneratedQuestions = async (quizId: string): Promise<void> => {
    await api.put<ApiResponse<null>>(ENDPOINTS.QUIZZES.ACCEPT_ALL_AI_QUESTIONS(quizId));
};

// --- Questions ---

export const upsertQuizQuestions = async (
    quizId: string,
    questions: QuestionUpsertRequest[]
): Promise<void> => {
    await api.put<ApiResponse<null>>(ENDPOINTS.QUIZZES.UPSERT_QUESTIONS(quizId), questions);
};

// --- Submissions (instructor) ---

export const getQuizSubmissions = async (
    quizId: string,
    status?: 'InProgress' | 'Submitted' | 'Reviewed' | null,
    pageNo: number = 1,
    pageSize: number = 10
): Promise<PaginationResult<GetSubmissionsByQuizIdDto>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('pageNo', String(pageNo));
    params.append('pageSize', String(pageSize));

    const queryString = params.toString();
    const endpoint = ENDPOINTS.QUIZZES.GET_SUBMISSIONS(quizId);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await api.get<ApiResponse<PaginationResult<GetSubmissionsByQuizIdDto>>>(url);
    const page = unwrapEnvelope<PaginationResult<GetSubmissionsByQuizIdDto>>(
        response.data as ApiEnvelope<PaginationResult<GetSubmissionsByQuizIdDto>>
    );
    return (
        page ?? {
            totalResults: 0,
            pagesCount: 0,
            start: 0,
            end: -1,
            items: [],
        }
    );
};
