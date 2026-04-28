import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { getSectionsByCourse } from '@/api/services/section.service';

type UseCourseSectionsOptions = {
    /** When false, the sections list is not requested (e.g. blocked while a quiz attempt is in progress). */
    enabled?: boolean;
};

export const useCourseSections = (courseId: number, options?: UseCourseSectionsOptions) =>
    useQuery({
        queryKey: QUERY_KEYS.COURSE_SECTIONS(courseId.toString()),
        queryFn: async () => {
            const sections = await getSectionsByCourse(courseId);
            return sections
                .sort((a, b) => a.sectionNumber - b.sectionNumber)
                .map((s) => ({
                    ...s,
                    sectionFiles: (s.sectionFiles ?? []).sort(
                        (a, b) => a.orderIndex - b.orderIndex
                    ),
                }));
        },
        enabled: (options?.enabled !== false) && courseId > 0,
    });
