import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function getInitials(name: string) {
    if (!name) return 'C';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function getGradientFromName(name: string) {
    const colors = [
        'from-indigo-500 to-blue-500',
        'from-purple-500 to-indigo-500',
        'from-violet-500 to-fuchsia-500',
        'from-emerald-500 to-teal-500',
        'from-rose-500 to-pink-500',
        'from-cyan-500 to-blue-500',
        'from-amber-500 to-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

interface CourseSidebarHeaderProps {
    courseName: string;
    courseCode: string;
    imageUrl?: string;
    isLoading?: boolean;
    collapsed: boolean;
    onToggle: () => void;
    onMobileClose?: () => void;
}

export function CourseSidebarHeader({
    courseName,
    courseCode,
    imageUrl,
    isLoading,
    collapsed,
    onToggle,
    onMobileClose
}: CourseSidebarHeaderProps) {
    const [imgFailed, setImgFailed] = useState(false);

    useEffect(() => {
        setImgFailed(false);
    }, [imageUrl]);

    const title = isLoading ? 'Loading...' : (courseName || 'Course');
    const code = courseCode || '';
    
    const initials = getInitials(title);
    const gradient = getGradientFromName(title);

    const hasImage = Boolean(imageUrl?.trim()) && !imgFailed;

    return (
        <div className={`p-3 border-b border-slate-100 dark:border-slate-800/50 transition-all ${collapsed ? 'flex justify-center' : ''} relative`}>
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border border-transparent outline-none transition-all duration-150 ease-in-out cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-[#21A9FF]/50 group ${collapsed ? 'justify-center' : 'justify-between'}`}
            >
                <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : 'flex-1 pr-8 sm:pr-0'}`}>
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-[12px] overflow-hidden shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800">
                        {hasImage ? (
                            <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={() => setImgFailed(true)}
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-tr ${gradient} text-white font-bold text-[13px] tracking-wider`}>
                                {initials}
                            </div>
                        )}
                        {collapsed && (
                            <div className="absolute inset-0 hidden lg:flex items-center justify-center bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-all duration-150 backdrop-blur-[2px]">
                                <ChevronRight className="w-5 h-5 ml-0.5" />
                            </div>
                        )}
                    </div>
                    
                    {!collapsed && (
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                            <h2 
                                className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight"
                                title={title}
                            >
                                {title}
                            </h2>
                            {code && (
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate tracking-wide mt-1">
                                    {code}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <div className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                )}
            </button>
            
            {!collapsed && onMobileClose && (
                <button 
                    onClick={onMobileClose} 
                    className="lg:hidden absolute right-3 top-3.5 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
