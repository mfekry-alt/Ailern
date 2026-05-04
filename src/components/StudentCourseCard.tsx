import { useNavigate } from 'react-router-dom';
import { User, Sparkles, LayoutGrid, ArrowRight } from 'lucide-react';
import { ParallaxTiltCard } from '@/components/ui';

const THUMBNAILS = [
    '/course-default.png'
];

interface StudentCourseCardProps {
    course: any;
    resumeData?: {
        lastLearningItemId?: string | null;
        type?: number | string;
        lastWatchedTime?: number | null;
        lastPageNumber?: number | null;
    };
}

export const StudentCourseCard = ({ course, resumeData }: StudentCourseCardProps) => {
    const navigate = useNavigate();
    const thumbIndex = typeof course.id === 'string' 
        ? course.id.length % THUMBNAILS.length 
        : (course.id || 0) % THUMBNAILS.length;
    
    // Allow overriding the thumbnail via course.image for dashboard
    const FALLBACK_IMAGE = "/course-default.png";
    const imageSrc = course.imageUrl || course.image || course.thumbnail || FALLBACK_IMAGE;

    // Handle resume course navigation with state
    const handleResumeCourse = () => {
        // If no resume data, go to course sections page
        if (!resumeData?.lastLearningItemId) {
            navigate(`/courses/${course.id}/sections`);
            return;
        }

        // Build navigation state with resume data
        // LearningType: 0=None, 1=File, 2=Video
        // Handle both number (2) and string ('2' or 'Video') type formats from API
        const rawType = resumeData.type;
        const isVideo = rawType === 2 || rawType === '2' || rawType === 'Video';
        const navigationState: Record<string, any> = {
            itemId: resumeData.lastLearningItemId,
            type: isVideo ? 'Video' : 'File',
        };

        // Add video time or page number based on type
        if (isVideo && resumeData.lastWatchedTime != null) {
            navigationState.lastWatchedTime = resumeData.lastWatchedTime;
        } else if (!isVideo && resumeData.lastPageNumber != null) {
            navigationState.lastPageNumber = resumeData.lastPageNumber;
        }

        // Navigate to content viewer with file ID in URL and resume data in state
        navigate(`/courses/${course.id}/content?file=${resumeData.lastLearningItemId}`, {
            state: navigationState,
        });
    };

    return (
        <ParallaxTiltCard
            className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden h-full"
            intensity={6}
            scale={1.02}
        >
            {/* Image Section */}
            <div className="relative aspect-[16/8] overflow-hidden">
                <img 
                    src={imageSrc} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                
                {/* Course Code Badge or Dashboard Progress Tag */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700 shadow-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        {course.courseCode || 'In Progress'}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="h-10 mb-2">
                    <button onClick={() => navigate(`/courses/${course.id}`)} className="group/title text-left w-full">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover/title:text-indigo-500 transition-colors duration-300">
                            {course.title}
                        </h3>
                    </button>
                </div>

                <div className="h-12 mb-2">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 opacity-80 italic">
                        {course.description || 'Continue learning and progressing through the modules.'}
                    </p>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                            {course.instructor}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <span>Progress</span>
                        <span className="text-indigo-500">{course.progress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-200/50 dark:border-slate-700/30">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${course.progress}%` }}
                        >
                            {/* Animated Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine shadow-[0_0_12px_rgba(99,102,241,0.4)]" />
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 group/info"
                        title="Course Info"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>

                    {resumeData?.lastLearningItemId ? (
                        <button 
                            onClick={handleResumeCourse}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group/btn"
                        >
                            Resume Course
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => navigate(`/courses/${course.id}/sections`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 group/btn"
                        >
                            Start Course
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </ParallaxTiltCard>
    );
};
