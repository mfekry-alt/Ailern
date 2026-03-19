/**
 * Section Service - Handles all section-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

export interface SectionDto {
    id: string;
    title: string;
    sectionNumber: number;
    courseId: number;
}

const unwrapApiResponse = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as ApiResponse<T>).data as T;
    }
    return payload as T;
};

/**
 * Get all sections for a course
 */
export const getSectionsByCourse = async (courseId: number): Promise<SectionDto[]> => {
    try {
        const response = await api.get<ApiResponse<SectionDto[]> | SectionDto[]>(
            ENDPOINTS.SECTIONS.BY_COURSE(courseId)
        );
        const payload = response.data as ApiResponse<SectionDto[]> | SectionDto[];
        return Array.isArray(payload) ? payload : (payload.data ?? []);
    } catch {
        return [];
    }
};

/**
 * Get a single section by ID
 */
export const getSection = async (sectionId: string): Promise<SectionDto | null> => {
    try {
        const response = await api.get<ApiResponse<SectionDto> | SectionDto>(
            ENDPOINTS.SECTIONS.GET(sectionId)
        );
        const payload = response.data as ApiResponse<SectionDto> | SectionDto;
        if (Array.isArray(payload)) {
            return null;
        }
        return ('data' in payload) ? (payload.data ?? null) : payload as SectionDto;
    } catch {
        return null;
    }
};
