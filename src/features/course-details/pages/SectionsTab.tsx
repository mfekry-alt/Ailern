import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCourseSections } from '../api';
import { SectionCard } from '../components/SectionCard';
import { EmptyState } from '../components/EmptyState';
import { TabLoadingState } from '../components/TabLoadingState';
import { Layers, AlertCircle, RefreshCw, Search, Sparkles } from 'lucide-react';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export const SectionsTab = () => {
    const { courseId, numericCourseId } = useOutletContext<CourseContext>();
    const { data: sections, isLoading, error, refetch } = useCourseSections(numericCourseId ?? 0);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = useMemo(() => {
        if (!sections) return [];
        if (!searchQuery.trim()) return sections;
        const term = searchQuery.toLowerCase();
        return sections.filter(s => 
            s.title.toLowerCase().startsWith(term) || 
            s.sectionNumber.toString().startsWith(term)
        );
    }, [sections, searchQuery]);

    if (isLoading) return <TabLoadingState />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-500/20 shadow-sm shadow-red-500/5">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    Failed to load sections
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 max-w-sm mx-auto font-medium">
                    Could not fetch course sections. Please check your connection and try again.
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry Loading
                </button>
            </div>
        );
    }

    if (!sections || sections.length === 0) {
        return (
            <EmptyState
                icon={Layers}
                title="No sections yet"
                description="This course doesn't have any sections or materials yet. Check back later."
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Simple Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <Layers className="w-6 h-6 text-[#21A9FF]" />
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Sections
                    </h2>
                </div>

                {/* Search Bar UI */}
                <div className="relative group w-full md:w-80">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#21A9FF] transition-colors">
                        <Search className="w-4.5 h-4.5" />
                    </div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search materials..."
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#21A9FF]/10 focus:border-[#21A9FF]/50 transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-600"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredSections.length > 0 ? (
                    filteredSections.map((section) => (
                        <SectionCard key={section.id} section={section} courseId={courseId} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-700/50">
                         <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">No sections found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};
