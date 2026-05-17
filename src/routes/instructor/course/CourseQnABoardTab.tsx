/**
 * Q&A Board — Instructor Route Page
 * Wraps QnATab inside the instructor course manage layout.
 */
import { useOutletContext } from 'react-router-dom';
import { QnATab } from '@/features/qna/components/QnATab';

interface CourseManageContext {
    courseId: string;
    numericCourseId: number | null;
}

export function CourseQnABoardTab() {
    const { numericCourseId } = useOutletContext<CourseManageContext>();

    if (!numericCourseId) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
                Invalid course.
            </div>
        );
    }

    return <QnATab courseId={numericCourseId} />;
}
