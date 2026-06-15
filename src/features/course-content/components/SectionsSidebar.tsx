/**
 * Sections Sidebar - Shows scrollable list of sections and files
 * Right side panel for the course content viewer
 */
import { useState, useMemo } from 'react';
import { 
    ChevronDown, ChevronUp, Film, FileText, File, 
    Clock, CheckCircle, Check, Lock, Download, ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionDto, SectionFileDto } from '@/api/services/section.service';

interface SectionsSidebarProps {
    sections: SectionDto[];
    activeFileId?: string;
    onFileSelect: (file: SectionFileDto, sectionId: string) => void;
    completedSections?: string[];
    onToggleSectionComplete?: (sectionId: string, completed: boolean) => void;
    isStudent?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (contentType: string) => {
    if (contentType.includes('video')) return Film;
    if (contentType.includes('pdf')) return FileText;
    return File;
};

const getFileTypeLabel = (contentType: string): string => {
    if (contentType.includes('video')) return 'Video';
    if (contentType.includes('pdf')) return 'PDF';
    if (contentType.includes('word') || contentType.includes('document')) return 'Document';
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return 'Presentation';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'Spreadsheet';
    return 'File';
};

interface FileItemProps {
    file: SectionFileDto;
    isActive: boolean;
    onClick: () => void;
    orderIndex: number;
}

const SidebarFileItem = ({ file, isActive, onClick, orderIndex }: FileItemProps) => {
    const Icon = getFileIcon(file.contentType);
    const isVideo = file.contentType.includes('video');

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 group
                ${isActive 
                    ? 'bg-[#21A9FF]/10 border border-[#21A9FF]/30 shadow-sm' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
        >
            {/* File Number/Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                ${isActive 
                    ? 'bg-[#21A9FF] text-white' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700'
                } transition-colors`}
            >
                <Icon className="w-4 h-4" />
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate
                    ${isActive ? 'text-[#21A9FF]' : 'text-gray-900 dark:text-gray-100'}`}
                >
                    {file.fileName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        {getFileTypeLabel(file.contentType)}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        {formatFileSize(file.fileSize)}
                    </span>
                </div>
            </div>

            {/* Active Indicator */}
            {isActive && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#21A9FF] mt-2" />
            )}
        </button>
    );
};

interface SectionItemProps {
    section: SectionDto;
    sectionOrder: number;
    isExpanded: boolean;
    onToggle: () => void;
    activeFileId?: string;
    onFileSelect: (file: SectionFileDto, sectionId: string) => void;
    isCompleted?: boolean;
    onToggleComplete?: (completed: boolean) => void;
    isStudent?: boolean;
}

const SidebarSectionItem = ({ 
    section, 
    sectionOrder, 
    isExpanded, 
    onToggle, 
    activeFileId, 
    onFileSelect,
    isCompleted,
    onToggleComplete,
    isStudent
}: SectionItemProps) => {
    const files = section.sectionFiles || [];
    const sortedFiles = useMemo(() => 
        [...files].sort((a, b) => a.orderIndex - b.orderIndex),
        [files]
    );

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300
            ${isExpanded 
                ? 'border-[#21A9FF]/30 bg-white dark:bg-slate-900 shadow-sm' 
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
            }`}
        >
            {/* Section Header */}
            <div className="flex items-stretch">
                <button
                    onClick={onToggle}
                    className="flex-1 flex items-center justify-between p-4 text-left min-w-0"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Section Number */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                            text-sm font-bold flex-shrink-0 transition-colors
                            ${isExpanded 
                                ? 'bg-[#21A9FF] text-white' 
                                : isCompleted
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : sectionOrder}
                        </div>

                        {/* Section Info */}
                        <div className="min-w-0">
                            <h4 className={`font-semibold truncate
                                ${isExpanded ? 'text-[#21A9FF]' : 'text-gray-900 dark:text-white'}`}
                            >
                                {section.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                {files.length} {files.length === 1 ? 'file' : 'files'}
                            </p>
                        </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isExpanded 
                            ? 'bg-[#21A9FF]/10 text-[#21A9FF]' 
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </button>

                {/* Complete Toggle (Student Only) */}
                {isStudent && onToggleComplete && (
                    <div className="flex items-center pr-4 pl-2">
                        <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mr-3" />
                        <label className="progress-checkbox-container" title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}>
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => onToggleComplete(!isCompleted)}
                            />
                            <div className="progress-checkmark" />
                        </label>
                    </div>
                )}
            </div>

            {/* Files List */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-1">
                    {sortedFiles.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500 dark:text-slate-400">
                            No files in this section
                        </div>
                    ) : (
                        sortedFiles.map((file) => (
                            <SidebarFileItem
                                key={file.id}
                                file={file}
                                isActive={activeFileId === file.id}
                                onClick={() => onFileSelect(file, section.id)}
                                orderIndex={file.orderIndex}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export const SectionsSidebar = ({ 
    sections, 
    activeFileId, 
    onFileSelect,
    completedSections = [],
    onToggleSectionComplete,
    isStudent = false
}: SectionsSidebarProps) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        // Expand first section by default
        return sections.length > 0 ? new Set([sections[0].id]) : new Set();
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    // Auto-expand section containing active file
    const activeSectionId = useMemo(() => {
        for (const section of sections) {
            if (section.sectionFiles?.some(f => f.id === activeFileId)) {
                return section.id;
            }
        }
        return null;
    }, [sections, activeFileId]);

    // Auto-expand when active file changes
    useMemo(() => {
        if (activeSectionId && !expandedSections.has(activeSectionId)) {
            setExpandedSections(prev => new Set([...prev, activeSectionId]));
        }
    }, [activeSectionId]);

    return (
        <div className="h-full flex flex-col bg-gray-50/50 dark:bg-slate-950/30">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Course Content
                </h3>
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {sections.length} sections
                </span>
            </div>

            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {sections.map((section, index) => (
                    <SidebarSectionItem
                        key={section.id}
                        section={section}
                        sectionOrder={index + 1}
                        isExpanded={expandedSections.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                        activeFileId={activeFileId}
                        onFileSelect={onFileSelect}
                        isCompleted={completedSections.includes(section.id)}
                        onToggleComplete={onToggleSectionComplete ? 
                            (completed) => onToggleSectionComplete(section.id, completed) : undefined
                        }
                        isStudent={isStudent}
                    />
                ))}
            </div>

            {/* Progress Footer */}
            {isStudent && (
                <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
                        <span className="text-sm font-bold text-[#21A9FF]">
                            {completedSections.length} / {sections.length}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#21A9FF] to-[#5ec5ff] rounded-full transition-all duration-500"
                            style={{ 
                                width: `${sections.length > 0 ? (completedSections.length / sections.length) * 100 : 0}%` 
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionsSidebar;
