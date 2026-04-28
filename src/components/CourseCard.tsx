import { ArrowRight, BookOpen, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
    id: string | number;
    title: string;
    description: string;
    instructor: string;
    progress?: number;
    thumbnail?: string;
    imageUrl?: string;
    courseCode?: string;
}

const FALLBACK_IMAGE = "/course-default.png";

export const CourseCard = ({
    id,
    title,
    description,
    instructor,
    progress = 0,
    thumbnail,
    imageUrl,
    courseCode,
}: CourseCardProps) => {
    const navigate = useNavigate();

    const handleTitleClick = () => {
        navigate(`/courses/${id}`);
    };

    const handleContinueClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/courses/${id}/sections`);
    };

    // Generate a gradient based on course id for consistent colors
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-violet-500 to-purple-600',
        'from-orange-500 to-rose-500',
        'from-cyan-500 to-blue-600',
        'from-fuchsia-500 to-pink-600',
    ];
    const gradient = gradients[Number(id) % gradients.length] || gradients[0];

    return (
        <div className="group bg-white dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            {/* Thumbnail Section */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-slate-700">
                <img
                    src={imageUrl || thumbnail || FALLBACK_IMAGE}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />

                {/* Course Code Badge */}
                {courseCode && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
                        {courseCode}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                {/* Header */}
                <div className="mb-3">
                    <h3
                        onClick={handleTitleClick}
                        className="text-lg font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    >
                        {title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{instructor}</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
                    {description}
                </p>

                {/* Progress Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Progress</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleContinueClick}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 group/btn"
                >
                    Continue Learning
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
            </div>
        </div>
    );
};
