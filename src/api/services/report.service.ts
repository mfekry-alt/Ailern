/**
 * Content Reporting Service
 * Handles all report-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, SubmitReportCommand, ContentReportsDashboardData } from '@/types/api.types';

/**
 * Report a section material (Student)
 * POST /api/Sections/{sectionId}/material/{materialId}/reports
 */
export const reportMaterial = async (
    sectionId: string,
    materialId: string,
    data: SubmitReportCommand
): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>(
        ENDPOINTS.SECTIONS.REPORT_MATERIAL(sectionId, materialId),
        data
    );
    return response.data;
};

/**
 * Get Content Reports Dashboard (Admin)
 * GET /api/Users/admin/content-reports
 */
export const getReportsDashboard = async (): Promise<ContentReportsDashboardData> => {
    const response = await api.get<ApiResponse<ContentReportsDashboardData>>(
        ENDPOINTS.REPORTS.DASHBOARD
    );
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data;
    }
    return payload as unknown as ContentReportsDashboardData;
};

/**
 * Approve a Content Report (Admin)
 * PUT /api/Users/admin/content-reports?reportid={reportId}
 */
export const approveReport = async (reportId: string): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>(
        ENDPOINTS.REPORTS.APPROVE(reportId)
    );
    return response.data;
};
