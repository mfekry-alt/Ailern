import axios from 'axios';
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

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

export const aiResourcesService = {
    /**
     * Get all AI resources for a course
     */
    getAiResources: async (courseId: number | string) => {
        const response = await api.get<ApiResponse<any[]>>(
            ENDPOINTS.COURSES.AI_RESOURCES.BASE(courseId)
        );
        return response.data;
    },

    /**
     * Generate presigned URLs for uploading files
     */
    generateUploadUrls: async (courseId: number | string, data: AIResourceGenerateUrlsRequest) => {
        const response = await api.post<ApiResponse<AIResourcePresignedUrlResponse[]>>(
            ENDPOINTS.COURSES.AI_RESOURCES.BASE(courseId),
            data
        );
        return response.data;
    },

    /**
     * Upload a single file to S3/Wasabi using a presigned URL
     */
    uploadToS3: async (
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
    },

    /**
     * Confirm that files have been successfully uploaded
     */
    confirmUploads: async (courseId: number | string, fileIds: string[]) => {
        const response = await api.put<ApiResponse>(
            ENDPOINTS.COURSES.AI_RESOURCES.CONFIRM(courseId),
            { AiResourceIds: fileIds }
        );
        return response.data;
    },

    /**
     * Delete a single AI resource
     */
    deleteResource: async (courseId: number | string, resourceId: string) => {
        const response = await api.delete<ApiResponse>(
            ENDPOINTS.COURSES.AI_RESOURCES.DELETE(courseId, resourceId)
        );
        return response.data;
    },
};
