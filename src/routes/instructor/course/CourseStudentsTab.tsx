import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/api/services';
import { Users, Loader2 } from 'lucide-react';
import type { GetStudentsByCourseIdDto } from '@/types/api.types';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseStudentsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();

    const { data: students = [], isLoading } = useQuery<GetStudentsByCourseIdDto[]>({
        queryKey: ['course-students', numericCourseId],
        queryFn: () => courseService.getCourseStudents(numericCourseId!),
        enabled: !!numericCourseId,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" /> Enrolled Students
                </h2>
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                    {students.length} total
                </span>
            </div>

            {students.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No students enrolled</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Students will appear here once they join the course.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Student ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {students.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                                    {s.fullName?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{s.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{s.email}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-slate-400">{s.studentId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
