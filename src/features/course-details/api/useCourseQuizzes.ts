import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { getCourseQuizzes } from '@/api/services/quiz.service';

export const useCourseQuizzes = (courseId: number) =>
    useQuery({
        queryKey: QUERY_KEYS.COURSE_QUIZZES(courseId.toString()),
        queryFn: () => getCourseQuizzes(courseId.toString()),
        enabled: courseId > 0,
    });
