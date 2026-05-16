import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    X, BookOpen, Users, FileText, Bot, 
    Mail, User, Database, AlertCircle, Loader2
} from 'lucide-react';
import { getCourseDetails } from '@/api/services/course.service';
import { handleApiError } from '@/api/client';
import type { GetCourseDetailsDto } from '@/types/api.types';

interface CourseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number | null;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const CourseDetailsModal = ({ isOpen, onClose, courseId }: CourseDetailsModalProps) => {
    const [course, setCourse] = useState<GetCourseDetailsDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instructorImageError, setInstructorImageError] = useState(false);

    useEffect(() => {
        if (isOpen && courseId) {
            fetchDetails(courseId);
            setInstructorImageError(false);
        } else if (!isOpen) {
            // Reset state when closing
            setTimeout(() => {
                setCourse(null);
                setError(null);
            }, 300);
        }
    }, [isOpen, courseId]);

    const fetchDetails = async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCourseDetails(id);
            setCourse(data);
        } catch (err) {
            const apiError = handleApiError(err);
            setError(apiError.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl border border-gray-200 dark:border-slate-800">
                                {/* Header / Close Button */}
                                <div className="absolute right-6 top-6 z-20">
                                    <button
                                        onClick={onClose}
                                        className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600 rounded-2xl transition-all duration-200 group"
                                    >
                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="p-8 space-y-8 animate-pulse">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
                                            <div className="flex-1 space-y-4">
                                                <div className="h-4 w-1/4 bg-gray-200 dark:bg-slate-800 rounded" />
                                                <div className="h-8 w-3/4 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                                                <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="h-24 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
                                            <div className="h-24 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
                                            ))}
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="p-12 text-center">
                                        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                            <AlertCircle className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
                                        <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">{error}</p>
                                        <button
                                            onClick={() => courseId && fetchDetails(courseId)}
                                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : course ? (
                                    <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                                        {/* Course Hero Header */}
                                        <div className="relative p-8 pb-4">
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                <div className="w-full md:w-48 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shrink-0 group">
                                                    {course.imagePath ? (
                                                        <img 
                                                            src={course.imagePath} 
                                                            alt={course.courseName} 
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/course-default.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <img 
                                                            src="/course-default.png" 
                                                            alt="Default Course" 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black tracking-widest uppercase">
                                                        {course.courseCode}
                                                    </span>
                                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                                        {course.courseName}
                                                    </h2>
                                                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium line-clamp-3">
                                                        {course.courseDescription || "No description provided for this course."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 pt-4 space-y-8">
                                            {/* Instructor Card */}
                                            <section className="space-y-4">
                                                <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Instructor Details</h3>
                                                <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-5 rounded-[2rem] flex items-center gap-4 group">
                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform border border-gray-100 dark:border-slate-800 overflow-hidden shrink-0">
                                                        {course.instructorImage && !instructorImageError ? (
                                                            <img 
                                                                src={course.instructorImage} 
                                                                alt={course.instructorName} 
                                                                className="w-full h-full object-cover"
                                                                onError={() => setInstructorImageError(true)}
                                                            />
                                                        ) : (
                                                            <User className="w-7 h-7" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                                                            {course.instructorName}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 text-sm font-bold mt-1 truncate">
                                                            <Mail className="w-4 h-4 text-blue-500" />
                                                            {course.instructorEmail}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Statistics Groups */}
                                            <section className="space-y-6 pb-4">
                                                <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Metrics</h3>
                                                
                                                <div className="space-y-4">
                                                    {/* Total Enrollments - Independent Card */}
                                                    <div className="bg-blue-600 dark:bg-blue-600 p-6 rounded-[2.5rem] shadow-lg shadow-blue-500/20 flex items-center justify-between group overflow-hidden relative">
                                                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                                                        <div className="flex items-center gap-5 relative z-10">
                                                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                                                                <Users className="w-7 h-7" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Total Enrollments</p>
                                                                <p className="text-3xl font-black text-white leading-none">
                                                                    {course.totalEnrollments.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Course Materials Group */}
                                                        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-[2.5rem] shadow-sm space-y-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Course Materials</h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                <StatItem 
                                                                    icon={BookOpen} 
                                                                    label="Count" 
                                                                    value={course.totalMaterialNumber.toLocaleString()} 
                                                                    color="emerald" 
                                                                />
                                                                <StatItem 
                                                                    icon={Database} 
                                                                    label="Total Size" 
                                                                    value={formatBytes(course.totalMaterialSize)} 
                                                                    color="emerald" 
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* AI Resources Group */}
                                                        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-6 rounded-[2.5rem] shadow-sm space-y-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600">
                                                                    <Bot className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">AI Resources</h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                <StatItem 
                                                                    icon={Bot} 
                                                                    label="Count" 
                                                                    value={course.totalAiResourcesNumber.toLocaleString()} 
                                                                    color="purple" 
                                                                />
                                                                <StatItem 
                                                                    icon={Database} 
                                                                    label="Total Size" 
                                                                    value={formatBytes(course.totalAiResourcesSize)} 
                                                                    color="purple" 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                ) : null}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Helper component for small metric items
const StatItem = ({ 
    icon: Icon, 
    label, 
    value, 
    color 
}: { 
    icon: any, 
    label: string, 
    value: string, 
    color: string 
}) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-800 transition-all hover:border-blue-500/30 group/item">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover/item:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{label}</span>
        </div>
        <span className="text-sm font-black text-gray-900 dark:text-white">{value}</span>
    </div>
);
