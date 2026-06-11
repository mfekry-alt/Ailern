/**
 * Course Content Viewer Page
 * 
 * Professional content viewer with:
 * - Left side (70%): File viewer (Video/PDF/Office)
 * - Right side (30%): Sections & files list
 * 
 * Similar to Udemy's course player interface
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle, RefreshCw, Loader2, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { ReportContentModal } from '@/components/ReportContentModal';

import { useCourseSections } from '@/features/course-details/api';
import { useCourseQuizzes } from '@/features/course-details/api';
import type { SectionFileDto, SectionDto } from '@/api/services/section.service';
import { updateStudentSectionProgress } from '@/api/services/section.service';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';

import FileViewerSwitch from '../components/FileViewerSwitch';
import SectionsSidebar from '../components/SectionsSidebar';
import { useCourseProgress, type FileType } from '@/hooks/useCourseProgress';

interface RouteParams extends Record<string, string> {
    courseId: string;
}

export const CourseContentViewerPage = () => {
    const { courseId } = useParams<RouteParams>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasRole, user } = useAuth();
    const queryClient = useQueryClient();
    const headerRef = useRef<HTMLElement>(null);

    const isStudent = hasRole('Student');
    const numericCourseId = courseId ? parseInt(courseId, 10) : 0;

    // Get file ID from URL if present
    const initialFileId = searchParams.get('file');

    // Get resume data from navigation state (from dashboard "Resume Course")
    const resumeState = location.state as {
        itemId?: string;
        type?: string;
        lastWatchedTime?: number;
        lastPageNumber?: number;
    } | null;

    // Resume state refs
    const resumeItemId = resumeState?.itemId;
    const resumeVideoTime = resumeState?.type === 'Video' ? resumeState.lastWatchedTime : undefined;
    const resumePageNumber = resumeState?.type === 'File' ? resumeState.lastPageNumber : undefined;

    // State
    const [activeFile, setActiveFile] = useState<SectionFileDto | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [navbarHeight, setNavbarHeight] = useState(56);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Resume position state (passed to viewers)
    const [initialVideoTime, setInitialVideoTime] = useState<number | undefined>(resumeVideoTime);
    const [initialDocumentPage, setInitialDocumentPage] = useState<number | undefined>(resumePageNumber);

    // Progress tracking
    const progressTracker = useCourseProgress({
        courseId: numericCourseId,
        enabled: isStudent && numericCourseId > 0,
    });

    // Determine file type from content type
    const getFileType = useCallback((contentType: string, fileName: string): FileType => {
        const type = contentType.toLowerCase();
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        if (type.includes('video') || ext.match(/mp4|webm|ogg|mov/)) {
            return 'video';
        }
        if (type.includes('pdf') || ext === 'pdf' ||
            type.includes('word') || ext.match(/doc|docx/)) {
            return 'document';
        }
        return 'unknown';
    }, []);

    // Calculate navbar height dynamically
    useEffect(() => {
        const updateHeight = () => {
            if (headerRef.current) {
                setNavbarHeight(headerRef.current.offsetHeight);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [activeFile]); // Recalculate when activeFile changes (mobile filename section appears/disappears)

    // Fetch sections
    const { 
        data: sections = [], 
        isLoading: sectionsLoading, 
        error: sectionsError,
        refetch: refetchSections 
    } = useCourseSections(numericCourseId, {
        enabled: numericCourseId > 0,
    });

    // Fetch quizzes (needed for access validation)
    const { data: quizzes, isLoading: quizzesLoading } = useCourseQuizzes(numericCourseId);

    // Section completion mutation
    const completionMutation = useMutation({
        mutationFn: ({ sectionId, completed }: { sectionId: string; completed: boolean }) =>
            updateStudentSectionProgress(sectionId, completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.COURSE_SECTIONS(numericCourseId.toString()) 
            });
        },
    });

    // Initialize completed sections from data
    useEffect(() => {
        if (sections) {
            const completed = new Set<string>();
            sections.forEach(section => {
                if (section.isCompleted) {
                    completed.add(section.id);
                }
            });
            setCompletedSections(completed);
        }
    }, [sections]);

    // Flatten all files for navigation
    const allFiles = useMemo(() => {
        const files: Array<{ file: SectionFileDto; sectionId: string; sectionIndex: number; fileIndex: number }> = [];
        sections.forEach((section, sIndex) => {
            const sortedFiles = [...(section.sectionFiles || [])].sort((a, b) => a.orderIndex - b.orderIndex);
            sortedFiles.forEach((file, fIndex) => {
                files.push({ file, sectionId: section.id, sectionIndex: sIndex, fileIndex: fIndex });
            });
        });
        return files;
    }, [sections]);

    // Find current file index
    const currentFileIndex = useMemo(() => {
        if (!activeFile) return -1;
        return allFiles.findIndex(f => f.file.id === activeFile.id);
    }, [activeFile, allFiles]);

    // Set initial active file from resume state, URL, or first file
    useEffect(() => {
        if (allFiles.length > 0 && !activeFile) {
            // Priority 1: Resume from dashboard (itemId from state)
            if (resumeItemId) {
                const fileFromResume = allFiles.find(f => f.file.id === resumeItemId);
                if (fileFromResume) {
                    setActiveFile(fileFromResume.file);
                    setActiveSectionId(fileFromResume.sectionId);
                    // Set initial position for video or document
                    if (resumeVideoTime !== undefined) {
                        setInitialVideoTime(resumeVideoTime);
                    }
                    if (resumePageNumber !== undefined) {
                        setInitialDocumentPage(resumePageNumber);
                    }
                    return;
                }
            }
            // Priority 2: File from URL query param
            if (initialFileId) {
                const fileFromUrl = allFiles.find(f => f.file.id === initialFileId);
                if (fileFromUrl) {
                    setActiveFile(fileFromUrl.file);
                    setActiveSectionId(fileFromUrl.sectionId);
                    return;
                }
            }
            // Priority 3: Default to first file
            setActiveFile(allFiles[0].file);
            setActiveSectionId(allFiles[0].sectionId);
        }
    }, [allFiles, initialFileId, activeFile, resumeItemId, resumeVideoTime, resumePageNumber]);

    // Handle file selection with progress tracking
    const handleFileSelect = useCallback((file: SectionFileDto, sectionId: string) => {
        const fileType = getFileType(file.contentType, file.fileName);

        // Save progress of current file before switching
        progressTracker.setActiveFileId(file.id, fileType);

        setActiveFile(file);
        setActiveSectionId(sectionId);

        // Clear resume positions when manually selecting a file
        setInitialVideoTime(undefined);
        setInitialDocumentPage(undefined);

        // Update URL without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('file', file.id);
        window.history.replaceState({}, '', url.toString());
    }, [progressTracker, getFileType]);

    // Navigate to previous file
    const handlePrevFile = useCallback(() => {
        if (currentFileIndex > 0) {
            const prev = allFiles[currentFileIndex - 1];
            handleFileSelect(prev.file, prev.sectionId);
        }
    }, [currentFileIndex, allFiles, handleFileSelect]);

    // Navigate to next file
    const handleNextFile = useCallback(() => {
        if (currentFileIndex < allFiles.length - 1) {
            const next = allFiles[currentFileIndex + 1];
            handleFileSelect(next.file, next.sectionId);
        }
    }, [currentFileIndex, allFiles, handleFileSelect]);

    // Handle section completion toggle
    const handleToggleSectionComplete = useCallback((sectionId: string, completed: boolean) => {
        if (!isStudent) return;
        
        setCompletedSections(prev => {
            const next = new Set(prev);
            if (completed) {
                next.add(sectionId);
            } else {
                next.delete(sectionId);
            }
            return next;
        });

        completionMutation.mutate({ sectionId, completed });
        
        if (completed) {
            toast.success('Section marked as complete! 🎉');
        }
    }, [isStudent, completionMutation]);

    // Handle file download
    const handleDownload = useCallback(() => {
        if (!activeFile) return;

        const link = document.createElement('a');
        link.href = activeFile.fileUrl;
        link.download = activeFile.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloading ${activeFile.fileName}...`);
    }, [activeFile]);

    // Handle video progress updates (throttled during playback, immediate on pause/end)
    const handleVideoProgress = useCallback((currentTime: number, immediate = false) => {
        if (!activeFile || !isStudent) return;

        progressTracker.updateProgress(
            {
                lastWatchedTime: currentTime,
                lastOpenedFileId: activeFile.id,
            },
            'video',
            immediate
        );
    }, [activeFile, isStudent, progressTracker]);

    // Handle document page changes (batched every 3-5 pages or idle)
    const handleDocumentPageChange = useCallback((currentPage: number) => {
        if (!activeFile || !isStudent) return;

        progressTracker.markActive(); // Reset inactivity timer on page change
        progressTracker.updateProgress(
            {
                lastPageNumber: currentPage,
                lastOpenedFileId: activeFile.id,
            },
            'document'
        );
    }, [activeFile, isStudent, progressTracker]);

    // Loading state
    if (sectionsLoading || quizzesLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#21A9FF] animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading course content...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (sectionsError) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Failed to load course content
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">
                        Could not fetch course sections. Please try again.
                    </p>
                    <button
                        onClick={() => refetchSections()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#21A9FF] hover:bg-[#1a8fd4] 
                                 text-white rounded-xl font-semibold transition-colors mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (sections.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No Content Available
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400">
                        This course doesn't have any sections or files yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-72px)] flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
            {/* Top Navigation Bar */}
            <header ref={headerRef} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shrink-0">
                <div className="flex items-center justify-between px-4 lg:px-6 h-14">
                    {/* Left: Back Button & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-2 py-2 text-gray-600 dark:text-gray-300 
                                     hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium hidden sm:inline whitespace-nowrap">Back to Course</span>
                        </button>
                        
                        {activeFile && (
                            <div className="hidden lg:block min-w-0 flex-1 max-w-xs xl:max-w-md">
                                <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {activeFile.fileName}
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Right: Navigation Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Report Content Button */}
                        {isStudent && activeFile && (
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                         border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400
                                         hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-400 dark:hover:border-red-500/50
                                         active:scale-95 shrink-0"
                                title="Report this content"
                            >
                                <Flag className="w-4 h-4" />
                                <span className="hidden sm:inline">Report</span>
                            </button>
                        )}

                        {/* Separator */}
                        {isStudent && activeFile && (
                            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 hidden sm:block" />
                        )}

                        {/* Previous Button */}
                        <button
                            onClick={handlePrevFile}
                            disabled={currentFileIndex <= 0}
                            className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                     disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shrink-0"
                            style={{
                                background: currentFileIndex > 0 ? '#21A9FF' : 'rgba(107, 114, 128, 0.2)',
                                color: currentFileIndex > 0 ? 'white' : 'rgba(156, 163, 175, 0.8)',
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* File Counter */}
                        <div className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg shrink-0">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {currentFileIndex + 1}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {allFiles.length}
                            </span>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNextFile}
                            disabled={currentFileIndex >= allFiles.length - 1}
                            className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                     disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shrink-0"
                            style={{
                                background: currentFileIndex < allFiles.length - 1 ? '#21A9FF' : 'rgba(107, 114, 128, 0.2)',
                                color: currentFileIndex < allFiles.length - 1 ? 'white' : 'rgba(156, 163, 175, 0.8)',
                            }}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Mobile File Name */}
                {activeFile && (
                    <div className="md:hidden px-4 py-2 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {activeFile.fileName}
                        </p>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                {/* Left Side - File Viewer (70%) */}
                <div className="flex-1 lg:w-[70%] bg-black flex flex-col min-h-0 relative">
                    {activeFile ? (
                        <div className="flex-1 p-2 lg:p-4 min-h-0">
                            <div className="h-full rounded-2xl overflow-hidden shadow-2xl relative">
                                <FileViewerSwitch
                                    key={activeFile.id} // Force remount when file changes to reset resume state
                                    fileUrl={activeFile.fileUrl}
                                    fileName={activeFile.fileName}
                                    contentType={activeFile.contentType}
                                    onDownload={handleDownload}
                                    onVideoProgress={isStudent ? handleVideoProgress : undefined}
                                    onDocumentPageChange={isStudent ? handleDocumentPageChange : undefined}
                                    initialVideoTime={initialVideoTime}
                                    initialDocumentPage={initialDocumentPage}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-white/60">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Select a file to view</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Sections Sidebar (30%) */}
                <div className="lg:w-[30%] lg:max-w-md border-l dark:border-slate-800 bg-white dark:bg-slate-900
                              h-[40vh] lg:h-full flex flex-col min-h-0 overflow-hidden">
                    <SectionsSidebar
                        sections={sections}
                        activeFileId={activeFile?.id}
                        onFileSelect={handleFileSelect}
                        completedSections={Array.from(completedSections)}
                        onToggleSectionComplete={handleToggleSectionComplete}
                        isStudent={isStudent}
                    />
                </div>
            </main>

            {/* Report Content Modal */}
            <ReportContentModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                materialName={activeFile?.fileName}
                sectionId={activeSectionId || ''}
                materialId={activeFile?.id || ''}
            />
        </div>
    );
};

export default CourseContentViewerPage;
