/**
 * Q&A Board — Student Route Page
 * Wraps QnATab inside the student course details layout.
 */
import { useOutletContext } from 'react-router-dom';
import { QnATab } from '@/features/qna/components/QnATab';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export function QnABoardTab() {
    const { numericCourseId } = useOutletContext<CourseContext>();

    if (!numericCourseId) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
                Invalid course.
            </div>
        );
    }

    return <QnATab courseId={numericCourseId} />;
}
