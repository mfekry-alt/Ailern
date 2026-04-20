import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { courseService } from '@/api/services';

export const useCourseOverview = (courseId: number) =>
    useQuery({
        queryKey: QUERY_KEYS.COURSE(courseId.toString()),
        queryFn: () => courseService.getCourseById(courseId),
        enabled: courseId > 0,
    });
