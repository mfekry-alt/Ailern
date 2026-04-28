import { isAxiosError } from 'axios';
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, SectionCreateCommand, SectionUpdateCommand, MaterialFilesReorderCommand, RequestMaterialPresignedUrlCommand } from '@/types/api.types';

export interface SectionDto {
    id: string;
    title: string;
    sectionNumber: number;
    courseId: number;
    sectionFiles?: SectionFileDto[];
}

export interface SectionFileDto {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    uploadDate: string;
    orderIndex: number;
}

export type PresignedUrlResponse = string[];

export const getSectionsByCourse = async (courseId: number): Promise<SectionDto[]> => {
    try {
        const response = await api.get<ApiResponse<SectionDto[]> | SectionDto[]>(
            ENDPOINTS.SECTIONS.BY_COURSE(courseId)
        );
        const payload = response.data as ApiResponse<SectionDto[]> | SectionDto[];
        if (Array.isArray(payload)) return payload;
        if (payload && typeof payload === 'object' && 'data' in payload) {
            return (payload as { data?: SectionDto[] }).data ?? [];
        }
        return [];
    } catch (e) {
        if (isAxiosError(e) && e.response?.status === 403) {
            throw e;
        }
        return [];
    }
};

export const createSection = async (cmd: SectionCreateCommand): Promise<SectionDto> => {
    const response = await api.post(ENDPOINTS.SECTIONS.CREATE, cmd);
    const payload = response.data;
    return payload?.data ?? payload;
};

export const updateSection = async (sectionId: string, cmd: SectionUpdateCommand): Promise<void> => {
    await api.put(ENDPOINTS.SECTIONS.UPDATE(sectionId), cmd);
};

export const deleteSection = async (sectionId: string): Promise<void> => {
    await api.delete(ENDPOINTS.SECTIONS.DELETE(sectionId));
};

export const requestPresignedUrls = async (sectionId: string, cmd: RequestMaterialPresignedUrlCommand): Promise<string[]> => {
    const response = await api.post(`/Sections/${sectionId}/presigned-url`, cmd);
    const payload = response.data;
    const urls = payload?.data ?? payload ?? [];
    return Array.isArray(urls) ? urls : [];
};

export const uploadFileToPresignedUrl = async (url: string, file: File): Promise<void> => {
    await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
};

export const deleteMaterialFile = async (sectionId: string, fileId: string): Promise<void> => {
    await api.delete(`/Sections/${sectionId}/files/${fileId}`);
};

export const reorderMaterialFiles = async (sectionId: string, cmd: MaterialFilesReorderCommand): Promise<void> => {
    await api.put(`/Sections/${sectionId}/files/reorder`, cmd);
};
