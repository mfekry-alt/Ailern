import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/api/services';
import { QUERY_KEYS } from '@/lib/constants';
import type { SubmitReportCommand } from '@/types/api.types';

/**
 * Hook to submit a report for a course material (Student)
 */
export const useReportMaterial = () => {
    return useMutation({
        mutationFn: ({
            sectionId,
            materialId,
            data,
        }: {
            sectionId: string;
            materialId: string;
            data: SubmitReportCommand;
        }) => reportService.reportMaterial(sectionId, materialId, data),
    });
};

/**
 * Hook to fetch content reports dashboard statistics (Admin)
 */
export const useReportsDashboard = () => {
    return useQuery({
        queryKey: QUERY_KEYS.REPORTS_DASHBOARD,
        queryFn: () => reportService.getReportsDashboard(),
    });
};

/**
 * Hook to approve a content report (Admin)
 */
export const useApproveReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reportId: string) => reportService.approveReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS_DASHBOARD });
        },
    });
};
