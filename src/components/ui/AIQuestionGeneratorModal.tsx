import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, FolderOpen, Sparkles, FileText, X, ChevronDown, ChevronRight, AlertTriangle, BrainCircuit, Settings, SlidersHorizontal, BookOpen, Loader2 } from 'lucide-react';
import { quizService, sectionService } from '@/api/services';
import type { QuestionUpsertRequest } from '@/types/api.types';
import type { GenerateQuizByAIPayload, QuizGenerationFile } from '@/api/services/quiz.service';
import type { SectionDto } from '@/api/services/section.service';

interface SectionFileGroup {
    id: string;
    label: string;
    files: QuizGenerationFile[];
}

interface DifficultyState {
    hard: number;
    medium: number;
    easy: number;
}

interface AIQuestionGeneratorModalProps {
    isOpen: boolean;
    quizId?: string;
    onClose: () => void;
    onGenerate: (questions: QuestionUpsertRequest[]) => void;
}

export function AIQuestionGeneratorModal({ isOpen, quizId, onClose, onGenerate }: AIQuestionGeneratorModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    const lastJobUpdateRef = useRef(0);

    const [useUploadSource, setUseUploadSource] = useState(true);
    const [useCourseSource, setUseCourseSource] = useState(true);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [totalQuestions, setTotalQuestions] = useState(34);
    const [mcqCount, setMcqCount] = useState(22);
    const [trueFalseCount, setTrueFalseCount] = useState(6);
    const [writtenCount, setWrittenCount] = useState(12);
    const [difficulty, setDifficulty] = useState<DifficultyState>({ hard: 100, medium: 0, easy: 0 });
    const [anchorDifficultyKey, setAnchorDifficultyKey] = useState<keyof DifficultyState | null>(null);
    const [instructions, setInstructions] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    const maxPollAttempts = 12;
    const pollIntervalMs = 5000;
    const generationTotalMs = pollIntervalMs * maxPollAttempts;

    if (!isOpen) return null;

    const difficultySum = difficulty.hard + difficulty.medium + difficulty.easy;
    const difficultyError = difficultySum !== 100;
    const sourceError = selectedMaterials.length === 0 && uploadedFiles.length === 0;
    const hasError = sourceError || difficultyError;

    const showToast = (message: string) => {
        setToastMessage(message);
        if (toastTimerRef.current !== null) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 4000);
    };

    const normalizeFileList = (input: any): QuizGenerationFile[] => {
        const rawList = Array.isArray(input) ? input : Array.isArray(input?.files) ? input.files : Array.isArray(input?.items) ? input.items : [];
        return rawList.map((item: any) => {
            const id = item?.id ?? item?.fileId ?? item?.fileID ?? item?.fileGuid ?? item?.fileGuidId ?? item?.fileUuid ?? item?.fileUUID;
            const fileName = item?.fileName ?? item?.name ?? item?.originalFileName ?? 'File';
            if (!id) return null;
            return { id: String(id), fileName: String(fileName), fileSize: item?.fileSize ?? item?.size, contentType: item?.contentType ?? item?.mimeType } as QuizGenerationFile;
        }).filter(Boolean) as QuizGenerationFile[];
    };

    const coerceQuestions = (input: any): QuestionUpsertRequest[] => {
        const candidate = input?.questions ?? input?.result?.questions ?? input?.data?.questions ?? input?.data ?? input;
        const rawQuestions = Array.isArray(candidate) ? candidate : [];
        return rawQuestions.map((q: any) => {
            const questionText = String(q?.questionText ?? q?.text ?? q?.prompt ?? '').trim();
            const questionType = String(q?.questionType ?? q?.type ?? q?.questionTypeName ?? 'MCQ');
            if (!questionText) return null;
            const options = Array.isArray(q?.options)
                ? q.options.map((o: any) => ({
                    optionText: String(o?.optionText ?? o?.text ?? o?.answer ?? '').trim(),
                    isCorrect: Boolean(o?.isCorrect ?? o?.correct),
                })).filter((o: any) => o.optionText)
                : [];
            return { questionText, questionType: questionType as QuestionUpsertRequest['questionType'], mark: Number(q?.mark ?? q?.points ?? 5), instructions: q?.instructions ?? q?.instruction ?? undefined, explanation: q?.explanation ?? undefined, options } as QuestionUpsertRequest;
        }).filter(Boolean) as QuestionUpsertRequest[];
    };

    const extractJobId = (input: any): string | null => {
        if (!input) return null;
        if (typeof input === 'string') return input;
        if (input?.jobId) return String(input.jobId);
        if (input?.id) return String(input.id);
        if (input?.job?.id) return String(input.job.id);
        return null;
    };

    const getJobStatus = (input: any) => {
        const raw = String(input?.status ?? input?.jobStatus ?? input?.state ?? input?.jobState ?? input?.resultStatus ?? '').trim();
        if (raw === 'Completed') return 'completed';
        if (raw === 'InProgress') return 'processing';
        if (raw === 'Pending') return 'pending';
        if (raw === 'Failed' || raw === 'Canceled') return 'failed';
        const lowerRaw = raw.toLowerCase();
        if (lowerRaw.includes('complete') || lowerRaw.includes('done') || lowerRaw.includes('success')) return 'completed';
        if (lowerRaw.includes('fail') || lowerRaw.includes('error') || lowerRaw.includes('cancel')) return 'failed';
        if (lowerRaw.includes('progress') || lowerRaw.includes('process') || lowerRaw.includes('running')) return 'processing';
        if (lowerRaw.includes('pending') || lowerRaw.includes('queued') || lowerRaw.includes('created')) return 'pending';
        return 'unknown';
    };

    const quizQuery = useQuery({ queryKey: ['quiz', quizId], queryFn: () => quizService.getQuiz(quizId as string), enabled: Boolean(quizId) });
    const courseId = quizQuery.data?.courseId ? Number(quizQuery.data.courseId) : undefined;
    const sectionsQuery = useQuery({ queryKey: ['sections', courseId], queryFn: () => sectionService.getSectionsByCourse(courseId as number), enabled: Boolean(courseId) && isOpen && useCourseSource });
    const generationFilesQuery = useQuery({ queryKey: ['quiz-generation-files', quizId], queryFn: () => quizService.getQuizGenerationFiles(quizId as string), enabled: Boolean(quizId) && isOpen && useCourseSource });

    const fileBelongsToSection = (fileName: string, section: SectionDto) => {
        const lowerName = fileName.toLowerCase();
        return lowerName.includes(section.title.toLowerCase()) || lowerName.includes(`section ${section.sectionNumber}`);
    };

    const sectionFileGroups = useMemo<SectionFileGroup[]>(() => {
        const files = normalizeFileList(generationFilesQuery.data);
        const sections = sectionsQuery.data ?? [];
        if (files.length === 0) return [];
        if (sections.length === 0) return [{ id: 'ungrouped', label: 'All Materials', files }];
        const candidateSections = selectedSections.length > 0 ? sections.filter((section) => selectedSections.includes(section.id)) : sections;
        const groupsMap = new Map<string, SectionFileGroup>();
        for (const section of candidateSections) groupsMap.set(section.id, { id: section.id, label: `Section ${section.sectionNumber}: ${section.title}`, files: [] });
        const ungrouped: QuizGenerationFile[] = [];
        for (const file of files) {
            const matchedSection = candidateSections.find((section) => fileBelongsToSection(file.fileName, section));
            if (matchedSection) groupsMap.get(matchedSection.id)?.files.push(file);
            else ungrouped.push(file);
        }
        const groups = Array.from(groupsMap.values()).filter((group) => group.files.length > 0);
        if (ungrouped.length > 0) groups.push({ id: 'ungrouped', label: 'Other Materials', files: ungrouped });
        return groups;
    }, [generationFilesQuery.data, selectedSections, sectionsQuery.data]);

    const visibleFileIds = useMemo(() => {
        const ids = new Set<string>();
        for (const group of sectionFileGroups) for (const file of group.files) ids.add(file.id);
        return Array.from(ids);
    }, [sectionFileGroups]);

    useEffect(() => {
        setExpandedGroups(sectionFileGroups.map((group) => group.id));
    }, [sectionFileGroups]);

    const generateMutation = useMutation({
        mutationFn: (payload: GenerateQuizByAIPayload) => quizService.generateQuizQuestionsByAI(quizId as string, payload),
        onSuccess: (data) => {
            const nextJobId = extractJobId(data);
            if (nextJobId) {
                setJobId(nextJobId);
                setPollCount(0);
                return;
            }
            const questions = coerceQuestions(data);
            if (questions.length > 0) {
                onGenerate(questions);
                setIsGenerating(false);
                onClose();
                return;
            }
            setIsGenerating(false);
            showToast('No questions were returned. Please try again.');
        },
        onError: () => {
            setIsGenerating(false);
            showToast('The AI server is currently offline. Please try again later.');
        },
    });

    const jobQuery = useQuery({
        queryKey: ['quiz-generation-job', jobId],
        queryFn: () => quizService.getQuizGenerationJob(jobId as string),
        enabled: Boolean(jobId),
        refetchInterval: (query) => {
            const status = getJobStatus(query.state.data);
            if ((status === 'pending' || status === 'processing' || status === 'unknown') && pollCount < maxPollAttempts) return pollIntervalMs;
            return false;
        },
    });

    const setTotal = (nextTotal: number) => {
        const safe = Math.max(1, Math.min(100, nextTotal));
        const prevTotal = totalQuestions;
        const mcqRatio = prevTotal > 0 ? mcqCount / prevTotal : 0.55;
        const tfRatio = prevTotal > 0 ? trueFalseCount / prevTotal : 0.15;
        let nextMcq = Math.round(safe * mcqRatio);
        let nextTrueFalse = Math.round(safe * tfRatio);
        if (nextMcq + nextTrueFalse > safe) nextTrueFalse = Math.max(0, safe - nextMcq);
        const nextWritten = Math.max(0, safe - nextMcq - nextTrueFalse);
        setTotalQuestions(safe);
        setMcqCount(Math.max(0, Math.min(safe, nextMcq)));
        setTrueFalseCount(Math.max(0, Math.min(safe, nextTrueFalse)));
        setWrittenCount(Math.max(0, Math.min(safe, nextWritten)));
    };

    const setMcq = (next: number) => {
        const safeMcq = Math.max(0, Math.min(totalQuestions, next));
        const safeTrueFalse = Math.max(0, Math.min(totalQuestions - safeMcq, trueFalseCount));
        setMcqCount(safeMcq);
        setTrueFalseCount(safeTrueFalse);
        setWrittenCount(Math.max(0, totalQuestions - safeMcq - safeTrueFalse));
    };

    const setTrueFalse = (next: number) => {
        const safeTrueFalse = Math.max(0, Math.min(totalQuestions, next));
        const safeMcq = Math.max(0, Math.min(totalQuestions - safeTrueFalse, mcqCount));
        setTrueFalseCount(safeTrueFalse);
        setMcqCount(safeMcq);
        setWrittenCount(Math.max(0, totalQuestions - safeMcq - safeTrueFalse));
    };

    const setWritten = (next: number) => {
        const safeWritten = Math.max(0, Math.min(totalQuestions, next));
        const maxTrueFalse = Math.max(0, totalQuestions - safeWritten - mcqCount);
        const safeTrueFalse = Math.min(trueFalseCount, maxTrueFalse);
        setWrittenCount(safeWritten);
        setTrueFalseCount(safeTrueFalse);
        setMcqCount(Math.max(0, totalQuestions - safeWritten - safeTrueFalse));
    };

    const handleDifficultyChange = (key: keyof DifficultyState, value: number) => {
        const allKeys: Array<keyof DifficultyState> = ['hard', 'medium', 'easy'];
        const anchor = anchorDifficultyKey ?? key;
        if (!anchorDifficultyKey) setAnchorDifficultyKey(key);

        const nextDifficulty: DifficultyState = { hard: difficulty.hard, medium: difficulty.medium, easy: difficulty.easy };

        if (key === anchor) {
            const [staticOtherKey, dynamicOtherKey] = allKeys.filter(k => k !== anchor);
            const staticOtherValue = difficulty[staticOtherKey];
            const capped = Math.max(0, Math.min(100 - staticOtherValue, value));
            nextDifficulty[anchor] = capped;
            nextDifficulty[staticOtherKey] = staticOtherValue;
            nextDifficulty[dynamicOtherKey] = Math.max(0, 100 - staticOtherValue - capped);
        } else {
            const dynamicKey = allKeys.find(k => k !== anchor && k !== key) ?? key;
            const anchorValue = difficulty[anchor];
            const capped = Math.max(0, Math.min(100 - anchorValue, value));
            nextDifficulty[anchor] = anchorValue;
            nextDifficulty[key] = capped;
            nextDifficulty[dynamicKey] = Math.max(0, 100 - anchorValue - capped);
        }
        setDifficulty(nextDifficulty);
    };

    const jobStatus = jobId ? getJobStatus(jobQuery.data) : null;
    const generationStatus = jobStatus === 'pending' ? 'Queued for generation...' : jobStatus === 'processing' ? 'Composing question set...' : jobStatus === 'completed' ? 'Done.' : jobStatus === 'failed' ? 'Generation failed.' : generationProgress < 25 ? 'Analyzing selected materials...' : generationProgress < 50 ? 'Extracting key concepts...' : generationProgress < 75 ? 'Composing question set...' : generationProgress < 100 ? 'Finalizing and validating output...' : 'Done.';
    const estimatedSeconds = Math.max(0, Math.ceil(((100 - generationProgress) / 100) * (generationTotalMs / 1000)));

    useEffect(() => {
        if (!jobId) return;
        if (jobQuery.dataUpdatedAt === lastJobUpdateRef.current) return;
        lastJobUpdateRef.current = jobQuery.dataUpdatedAt;
        const status = getJobStatus(jobQuery.data);

        if (status === 'completed') {
            const questions = coerceQuestions(jobQuery.data);
            if (questions.length > 0) {
                onGenerate(questions);
                setIsGenerating(false);
                setJobId(null);
                setPollCount(0);
                onClose();
                return;
            }
            showToast('No questions were returned. Please try again.');
            setIsGenerating(false);
            setJobId(null);
            setPollCount(0);
            return;
        }

        if (status === 'failed') {
            showToast('The AI server is currently offline. Please try again later.');
            setIsGenerating(false);
            setJobId(null);
            setPollCount(0);
            return;
        }
        setPollCount(prev => prev + 1);
    }, [jobId, jobQuery.data, jobQuery.dataUpdatedAt, onClose, onGenerate]);

    useEffect(() => {
        if (!jobId) return;
        if (pollCount >= maxPollAttempts) {
            showToast('AI generation is taking too long. Please try again later.');
            setIsGenerating(false);
            setJobId(null);
            setPollCount(0);
            return;
        }
        const status = getJobStatus(jobQuery.data);
        if (status === 'completed') {
            setGenerationProgress(100);
            return;
        }
        const pct = Math.min(95, Math.round((pollCount / maxPollAttempts) * 100));
        setGenerationProgress(pct);
    }, [jobId, pollCount, jobQuery.data]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current !== null) {
                window.clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (generationFilesQuery.isError) {
            showToast('Failed to load quiz materials. Please try again later.');
        }
    }, [generationFilesQuery.isError]);

    const handleGenerate = () => {
        if (hasError) return;
        if (!quizId) {
            showToast('Please open an existing quiz before generating questions.');
            return;
        }
        if (selectedMaterials.length === 0 && uploadedFiles.length === 0) {
            showToast('Please choose or upload at least one course material file.');
            return;
        }

        const payload: GenerateQuizByAIPayload = {
            fileIds: useCourseSource ? selectedMaterials : [],
            newUploadedFiles: useUploadSource ? uploadedFiles : [],
            questionsCount: totalQuestions,
            questionTypeCounts: { MCQ: mcqCount, TrueFalse: trueFalseCount, Written: writtenCount },
            questionDifficultyPercents: { Easy: difficulty.easy, Medium: difficulty.medium, Hard: difficulty.hard },
            query: instructions.trim() || undefined,
        };

        setIsGenerating(true);
        setGenerationProgress(5);
        setJobId(null);
        setPollCount(0);
        generateMutation.mutate(payload);
    };

    const handleCancelGeneration = () => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setJobId(null);
        setPollCount(0);
    };

    const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        const list = Array.from(event.target.files ?? []);
        if (list.length === 0) return;
        setUploadedFiles(prev => [...prev, ...list]);
    };

    const removeUploadedFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
    };

    const toggleMaterial = (material: string) => {
        setSelectedMaterials(prev => prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]);
    };

    const selectAllVisibleMaterials = () => setSelectedMaterials(visibleFileIds);
    const clearSelectedMaterials = () => setSelectedMaterials([]);
    const toggleSection = (sectionId: string) => setSelectedSections((prev) => prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]);
    const selectAllSections = () => setSelectedSections((sectionsQuery.data ?? []).map((section) => section.id));
    const toggleGroupExpanded = (groupId: string) => setExpandedGroups((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]);
    const toggleGroupMaterials = (group: SectionFileGroup) => {
        const groupIds = group.files.map((file) => file.id);
        const allSelected = groupIds.every((id) => selectedMaterials.includes(id));
        if (allSelected) {
            setSelectedMaterials((prev) => prev.filter((id) => !groupIds.includes(id)));
            return;
        }
        setSelectedMaterials((prev) => Array.from(new Set([...prev, ...groupIds])));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isGenerating && onClose()} />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4">

                {/* Header */}
                <header className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-purple-500" />
                            Generate with AI
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">
                            Create custom assessments from your course materials instantly.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="mx-6 sm:mx-8 mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2 shrink-0">
                        <AlertTriangle className="w-4 h-4" /> {toastMessage}
                    </div>
                )}

                {/* Scrollable Body */}
                <div className={`p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 ${isGenerating ? 'pointer-events-none opacity-60' : ''}`}>

                    {/* Source Material Section */}
                    <section className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" /> Source Material
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Course Source */}
                            <button
                                type="button"
                                onClick={() => setUseCourseSource(prev => !prev)}
                                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${useCourseSource
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${useCourseSource ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <p className={`font-bold text-sm ${useCourseSource ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>Select Course Materials</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">From existing files in course sections.</p>
                            </button>

                            {/* Upload Source */}
                            <button
                                type="button"
                                onClick={() => {
                                    setUseUploadSource(prev => {
                                        if (!prev) fileInputRef.current?.click();
                                        return !prev;
                                    });
                                }}
                                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${useUploadSource
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-sm'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${useUploadSource ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className={`font-bold text-sm ${useUploadSource ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>Upload New Files</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">PDF, DOCX, TXT</p>
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadFiles} />

                        {/* File Selections (Conditional) */}
                        <div className="mt-4 space-y-4">
                            {useUploadSource && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Uploaded Files ({uploadedFiles.length})</p>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">Add more</button>
                                    </div>
                                    {uploadedFiles.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-slate-500 italic">No files selected yet.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                            {uploadedFiles.map((file, idx) => (
                                                <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2.5 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate">{file.name}</span>
                                                    </div>
                                                    <button onClick={() => removeUploadedFile(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {useCourseSource && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Course Materials</p>
                                        {visibleFileIds.length > 0 && (
                                            <div className="flex gap-3">
                                                <button type="button" onClick={selectAllVisibleMaterials} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Select All</button>
                                                <button type="button" onClick={clearSelectedMaterials} className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:underline">Clear</button>
                                            </div>
                                        )}
                                    </div>

                                    {!quizId ? (
                                        <p className="text-sm text-amber-600 dark:text-amber-500 italic">Open an existing quiz to load course materials.</p>
                                    ) : generationFilesQuery.isLoading ? (
                                        <p className="text-sm text-gray-500 dark:text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading materials...</p>
                                    ) : sectionFileGroups.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-slate-500 italic">No materials found in this course.</p>
                                    ) : (
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {sectionFileGroups.map((group) => {
                                                const groupIds = group.files.map((file) => file.id);
                                                const allGroupSelected = groupIds.length > 0 && groupIds.every((id) => selectedMaterials.includes(id));
                                                const isExpanded = expandedGroups.includes(group.id);

                                                return (
                                                    <div key={group.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-3">
                                                        <div className="flex items-center justify-between">
                                                            <button type="button" onClick={() => toggleGroupExpanded(group.id)} className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-200 hover:text-blue-600 transition-colors">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                {group.label}
                                                            </button>
                                                            <button type="button" onClick={() => toggleGroupMaterials(group)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                                                {allGroupSelected ? 'Deselect group' : 'Select group'}
                                                            </button>
                                                        </div>
                                                        {isExpanded && (
                                                            <div className="mt-3 space-y-2 pl-6">
                                                                {group.files.map((file) => (
                                                                    <label key={file.id} className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-slate-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedMaterials.includes(file.id)}
                                                                            onChange={() => toggleMaterial(file.id)}
                                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                        />
                                                                        <FileText className="w-4 h-4 text-gray-400" />
                                                                        <span className="truncate">{file.fileName}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {sourceError && (
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Please choose at least one material file to generate questions.</p>
                            )}
                        </div>
                    </section>

                    {/* Question Config Section */}
                    <section className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-500" /> Assessment Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Question Counts */}
                            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <div>
                                        <label className="text-sm font-bold text-gray-900 dark:text-white">Total Questions</label>
                                        <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Max 100</p>
                                    </div>
                                    <input
                                        type="number" min={1} max={100} value={totalQuestions} onChange={e => setTotal(Number(e.target.value))}
                                        className="w-20 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-center font-black text-lg text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none py-1.5"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Multiple Choice</span>
                                        <input type="number" min={0} value={mcqCount} onChange={e => setMcq(Number(e.target.value))} className="w-16 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-center font-bold text-gray-900 dark:text-white py-1 outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">True / False</span>
                                        <input type="number" min={0} value={trueFalseCount} onChange={e => setTrueFalse(Number(e.target.value))} className="w-16 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-center font-bold text-gray-900 dark:text-white py-1 outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Written Response</span>
                                        <input type="number" min={0} value={writtenCount} onChange={e => setWritten(Number(e.target.value))} className="w-16 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-center font-bold text-gray-900 dark:text-white py-1 outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Difficulty Sliders */}
                            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Difficulty Distribution</label>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Must total 100%</p>
                                </div>
                                <div className="space-y-4">
                                    {/* Visual Bar */}
                                    <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-slate-800 flex">
                                        <div className="bg-red-500" style={{ width: `${difficulty.hard}%` }} />
                                        <div className="bg-amber-500" style={{ width: `${difficulty.medium}%` }} />
                                        <div className="bg-emerald-500" style={{ width: `${difficulty.easy}%` }} />
                                    </div>

                                    {/* Sliders */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-14 text-xs font-bold text-red-600 dark:text-red-400 uppercase">Hard</span>
                                            <input type="range" min={0} max={100} value={difficulty.hard} onChange={e => handleDifficultyChange('hard', Number(e.target.value))} className="flex-1 h-1.5 cursor-pointer accent-red-500" />
                                            <span className="w-10 text-right text-xs font-bold text-red-600 dark:text-red-400">{difficulty.hard}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-14 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Med</span>
                                            <input type="range" min={0} max={100} value={difficulty.medium} onChange={e => handleDifficultyChange('medium', Number(e.target.value))} className="flex-1 h-1.5 cursor-pointer accent-amber-500" />
                                            <span className="w-10 text-right text-xs font-bold text-amber-600 dark:text-amber-400">{difficulty.medium}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-14 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Easy</span>
                                            <input type="range" min={0} max={100} value={difficulty.easy} onChange={e => handleDifficultyChange('easy', Number(e.target.value))} className="flex-1 h-1.5 cursor-pointer accent-emerald-500" />
                                            <span className="w-10 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">{difficulty.easy}%</span>
                                        </div>
                                    </div>
                                </div>
                                {difficultyError && (
                                    <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Total must be exactly 100%</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Additional Instructions */}
                    <section className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-purple-500" /> AI Prompt Instructions
                        </h3>
                        <textarea
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            rows={3}
                            placeholder="e.g. Focus on Bloom's Taxonomy, align with chapter 3 learning outcomes, avoid negative phrasing..."
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none resize-none transition-all"
                        />
                    </section>
                </div>

                {/* ── Footer ── */}
                <footer className="p-6 sm:p-8 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 rounded-b-[2rem] shrink-0">
                    {isGenerating && (
                        <div className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-5 shadow-sm">
                            <div className="flex items-center justify-between text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">
                                <span className="inline-flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
                                    Generating {totalQuestions} questions...
                                </span>
                                <span>{generationProgress}% • ~{estimatedSeconds}s left</span>
                            </div>
                            <div className="h-2.5 bg-blue-100 dark:bg-slate-800 rounded-full overflow-hidden border border-blue-200 dark:border-slate-700">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-300 ease-out relative"
                                    style={{ width: `${generationProgress}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-[2px]"></div>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3 text-center uppercase tracking-widest">{generationStatus}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                            Powered by Ailern AI Engine
                        </p>
                        <button
                            type="button"
                            onClick={isGenerating ? handleCancelGeneration : handleGenerate}
                            disabled={!isGenerating && hasError}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm ${isGenerating
                                    ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-purple-500/25 hover:-translate-y-0.5'
                                }`}
                        >
                            {isGenerating ? (
                                <><X className="w-4 h-4" /> Cancel</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Generate Questions</>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}