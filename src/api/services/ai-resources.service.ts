import axios from 'axios';
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

/** Mirrors backend `UploadStatus` enum (serialized as string names by default). */
export type AiResourceUploadStatus = 'Completed' | 'Pending' | 'Failed';

/**
 * Parses API upload status from JSON (string names or numeric enum values).
 * Backend order: Completed = 0, Pending = 1, Failed = 2.
 */
export function parseAiResourceUploadStatus(raw: unknown): AiResourceUploadStatus | undefined {
    if (raw == null) return undefined;
    if (typeof raw === 'number') {
        if (raw === 0) return 'Completed';
        if (raw === 1) return 'Pending';
        if (raw === 2) return 'Failed';
        return undefined;
    }
    const s = String(raw).trim();
    if (['Completed', 'Pending', 'Failed'].includes(s)) return s as AiResourceUploadStatus;
    const lower = s.toLowerCase();
    if (lower === 'completed') return 'Completed';
    if (lower === 'pending') return 'Pending';
    if (lower === 'failed') return 'Failed';
    return undefined;
}

export interface AIResourceGenerateUrlsRequest {
    Files: {
        FileName: string;
        FileSize: number;
        ContentType: string;
    }[];
}

export interface AIResourcePresignedUrlResponse {
    fileId: string;
    presignedUrl: string;
}

export interface AIResourceConfirmRequest {
    AiResourceIds: string[];
}

/**
 * Get all AI resources for a course
 */
export const getAiResources = async (courseId: number | string) => {
    const response = await api.get<ApiResponse<any[]>>(
        ENDPOINTS.COURSES.AI_RESOURCES.BASE(courseId)
    );
    return response.data;
};

/**
 * Generate presigned URLs for uploading files
 */
export const generateUploadUrls = async (courseId: number | string, data: AIResourceGenerateUrlsRequest) => {
    const response = await api.post<ApiResponse<AIResourcePresignedUrlResponse[]>>(
        ENDPOINTS.COURSES.AI_RESOURCES.BASE(courseId),
        data
    );
    return response.data;
};

/**
 * Upload a single file to S3/Wasabi using a presigned URL
 */
export const uploadToS3 = async (
    presignedUrl: string,
    file: File,
    contentType: string,
    onProgress?: (progress: number) => void
) => {
    // Use a clean axios instance to avoid sending our API headers to S3
    await axios.put(presignedUrl, file, {
        headers: {
            'Content-Type': contentType,
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
            }
        },
    });
};

/**
 * Confirm that files have been successfully uploaded
 */
export const confirmUploads = async (courseId: number | string, fileIds: string[]) => {
    const response = await api.put<ApiResponse>(
        ENDPOINTS.COURSES.AI_RESOURCES.CONFIRM(courseId),
        { AiResourceIds: fileIds }
    );
    return response.data;
};

/**
 * Delete a single AI resource
 */
export const deleteResource = async (courseId: number | string, resourceId: string) => {
    const response = await api.delete<ApiResponse>(
        ENDPOINTS.COURSES.AI_RESOURCES.DELETE(courseId, resourceId)
    );
    return response.data;
};

// Maintain the object export for backward compatibility with direct imports
export const aiResourcesService = {
    getAiResources,
    generateUploadUrls,
    uploadToS3,
    confirmUploads,
    deleteResource
};
