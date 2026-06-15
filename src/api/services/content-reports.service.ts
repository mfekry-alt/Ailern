/**
 * Content Reports Service
 * Handles API calls related to content moderation reports
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

export interface GetContentReportsParams {
  pageNo: number;
  pageSize: number;
  type?: string | null;
}

export interface ApiContentReportItem {
  reportId: string;
  material: string;
  reason: string;
  reporter: string;
  comment: string;
  date: string;
  status: string;
}

export interface GetContentReportsResponse {
  totalResults: number;
  pagesCount: number;
  start: number;
  end: number;
  items: ApiContentReportItem[];
}

/**
 * Get all content reports with pagination and filtering
 * @param params - Pagination and filter parameters
 * @returns Paginated list of content reports
 */
export const getContentReports = async (
  params: GetContentReportsParams
): Promise<GetContentReportsResponse> => {
  const response = await api.get<ApiResponse<GetContentReportsResponse>>(
    ENDPOINTS.USERS.ADMIN_REPORTS,
    { params }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch content reports');
  }

  const data = response.data.data;

  if (!data) {
    throw new Error('No data received from server');
  }

  return data;
};

export interface ApiContentReportDetail {
  reportId: string;
  reportType: string;
  submittedAt: string;
  reportComment: string;
  reportStatus: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  materialId: string;
  materialName: string;
  materialType: string;
  courseId: number;
  courseName: string;
  instructorId: number;
  instructorName: string;
  instructorEmail: string;
  previewMaterialUrl: string;
}

/**
 * Get detailed report by ID
 * @param id - Report ID
 * @returns Report details
 */
export const getContentReportDetails = async (id: string): Promise<ApiContentReportDetail> => {
  const response = await api.get<ApiResponse<ApiContentReportDetail>>(
    ENDPOINTS.USERS.ADMIN_REPORT_DETAILS(id)
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch report details');
  }

  const data = response.data.data;

  if (!data) {
    throw new Error('No data received from server');
  }

  return data;
};

/**
 * Reject content report (keep content)
 * @param id - Report ID
 */
export const rejectContentReport = async (id: string): Promise<void> => {
  const response = await api.put<ApiResponse<void>>(ENDPOINTS.USERS.ADMIN_REPORT_REJECT(id));

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to reject report');
  }
};
