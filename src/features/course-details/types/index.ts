export type CourseDetailsTab = 'overview' | 'sections' | 'assignments' | 'quizzes';

export type { SectionDto, SectionFileDto } from '@/api/services/section.service';
export type {
    GetAssignmentDto,
    GetAssignmentSubmissionDto,
    GetMySubmissionDto,
    GetQuizDto,
    GetCourseDto,
    FileMetaData,
    AssignmentSubmissionCreateCommand,
} from '@/types/api.types';

export interface SubmitPayload {
    assignmentId: number;
    files: File[];
}

export interface SubmissionCreateResponse {
    id: number;
    uploadUrls: string[];
}
