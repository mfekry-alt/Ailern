import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, FolderOpen, Sparkles, FileText, X, ChevronDown, ChevronRight } from 'lucide-react';
import { quizService, sectionService } from '@/api/services';
import type { QuestionRequest } from '@/types/api.types';
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
    onGenerate: (questions: QuestionRequest[]) => void;
}

export function AIQuestionGeneratorModal({ isOpen, quizId, onClose, onGenerate }: AIQuestionGeneratorModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    const lastJobUpdateRef = useRef(0);
    const [useUploadSource, setUseUploadSource] = useState(true);
    const [useCourseSource, setUseCourseSource] = useState(true);
    const [selectedSections, setSelectedSections] = useState<string[]>([]); // Empty = all sections
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
    const sourceError = selectedMaterials.length === 0;
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
        const rawList = Array.isArray(input)
            ? input
            : Array.isArray(input?.files)
                ? input.files
                : Array.isArray(input?.items)
                    ? input.items
                    : [];

        return rawList
            .map((item: any) => {
                const id =
                    item?.id ??
                    item?.fileId ??
                    item?.fileID ??
                    item?.fileGuid ??
                    item?.fileGuidId ??
                    item?.fileUuid ??
                    item?.fileUUID;
                const fileName = item?.fileName ?? item?.name ?? item?.originalFileName ?? 'File';
                if (!id) return null;
                return {
                    id: String(id),
                    fileName: String(fileName),
                    fileSize: item?.fileSize ?? item?.size,
                    contentType: item?.contentType ?? item?.mimeType,
                } as QuizGenerationFile;
            })
            .filter(Boolean) as QuizGenerationFile[];
    };

    const coerceQuestions = (input: any): QuestionRequest[] => {
        const candidate =
            input?.questions ??
            input?.result?.questions ??
            input?.data?.questions ??
            input?.data ??
            input;

        const rawQuestions = Array.isArray(candidate) ? candidate : [];
        return rawQuestions
            .map((q: any) => {
                const questionText = String(q?.questionText ?? q?.text ?? q?.prompt ?? '').trim();
                const questionType = String(q?.questionType ?? q?.type ?? q?.questionTypeName ?? 'MCQ');
                if (!questionText) return null;
                const options = Array.isArray(q?.options)
                    ? q.options.map((o: any) => ({
                        optionText: String(o?.optionText ?? o?.text ?? o?.answer ?? '').trim(),
                        isCorrect: Boolean(o?.isCorrect ?? o?.correct),
                    })).filter((o: any) => o.optionText)
                    : [];

                return {
                    questionText,
                    questionType: questionType as QuestionRequest['questionType'],
                    mark: Number(q?.mark ?? q?.points ?? 5),
                    instructions: q?.instructions ?? q?.instruction ?? undefined,
                    explanation: q?.explanation ?? undefined,
                    options,
                } as QuestionRequest;
            })
            .filter(Boolean) as QuestionRequest[];
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
        const raw = String(
            input?.status ??
            input?.jobStatus ??
            input?.state ??
            input?.jobState ??
            input?.resultStatus ??
            ''
        ).trim();

        // Handle exact enum values from API
        if (raw === 'Completed') return 'completed';
        if (raw === 'InProgress') return 'processing';
        if (raw === 'Pending') return 'pending';
        if (raw === 'Failed' || raw === 'Canceled') return 'failed';

        // Fallback to substring matching (case-insensitive)
        const lowerRaw = raw.toLowerCase();
        if (lowerRaw.includes('complete') || lowerRaw.includes('done') || lowerRaw.includes('success')) return 'completed';
        if (lowerRaw.includes('fail') || lowerRaw.includes('error') || lowerRaw.includes('cancel')) return 'failed';
        if (lowerRaw.includes('progress') || lowerRaw.includes('process') || lowerRaw.includes('running')) return 'processing';
        if (lowerRaw.includes('pending') || lowerRaw.includes('queued') || lowerRaw.includes('created')) return 'pending';
        return 'unknown';
    };

    // Fetch quiz details to get courseId
    const quizQuery = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizService.getQuiz(quizId as string),
        enabled: Boolean(quizId),
    });

    const courseId = quizQuery.data?.courseId ? Number(quizQuery.data.courseId) : undefined;

    // Fetch sections for the course
    const sectionsQuery = useQuery({
        queryKey: ['sections', courseId],
        queryFn: () => sectionService.getSectionsByCourse(courseId as number),
        enabled: Boolean(courseId) && isOpen && useCourseSource,
    });

    const generationFilesQuery = useQuery({
        queryKey: ['quiz-generation-files', quizId],
        queryFn: () => quizService.getQuizGenerationFiles(quizId as string),
        enabled: Boolean(quizId) && isOpen && useCourseSource,
    });

    const fileBelongsToSection = (fileName: string, section: SectionDto) => {
        const lowerName = fileName.toLowerCase();
        return (
            lowerName.includes(section.title.toLowerCase()) ||
            lowerName.includes(`section ${section.sectionNumber}`)
        );
    };

    const sectionFileGroups = useMemo<SectionFileGroup[]>(() => {
        const files = normalizeFileList(generationFilesQuery.data);
        const sections = sectionsQuery.data ?? [];

        if (files.length === 0) {
            return [];
        }

        if (sections.length === 0) {
            return [{
                id: 'ungrouped',
                label: 'All Materials',
                files,
            }];
        }

        const candidateSections = selectedSections.length > 0
            ? sections.filter((section) => selectedSections.includes(section.id))
            : sections;

        const groupsMap = new Map<string, SectionFileGroup>();
        for (const section of candidateSections) {
            groupsMap.set(section.id, {
                id: section.id,
                label: `Section ${section.sectionNumber}: ${section.title}`,
                files: [],
            });
        }

        const ungrouped: QuizGenerationFile[] = [];
        for (const file of files) {
            const matchedSection = candidateSections.find((section) => fileBelongsToSection(file.fileName, section));
            if (matchedSection) {
                groupsMap.get(matchedSection.id)?.files.push(file);
            } else {
                ungrouped.push(file);
            }
        }

        const groups = Array.from(groupsMap.values()).filter((group) => group.files.length > 0);
        if (ungrouped.length > 0) {
            groups.push({
                id: 'ungrouped',
                label: 'Other Materials',
                files: ungrouped,
            });
        }

        return groups;
    }, [generationFilesQuery.data, selectedSections, sectionsQuery.data]);

    const visibleFileIds = useMemo(() => {
        const ids = new Set<string>();
        for (const group of sectionFileGroups) {
            for (const file of group.files) {
                ids.add(file.id);
            }
        }
        return Array.from(ids);
    }, [sectionFileGroups]);

    useEffect(() => {
        setExpandedGroups(sectionFileGroups.map((group) => group.id));
    }, [sectionFileGroups]);

    const generateMutation = useMutation({
        mutationFn: (payload: GenerateQuizByAIPayload) =>
            quizService.generateQuizQuestionsByAI(quizId as string, payload),
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
            if ((status === 'pending' || status === 'processing' || status === 'unknown') && pollCount < maxPollAttempts) {
                return pollIntervalMs;
            }
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

        if (nextMcq + nextTrueFalse > safe) {
            nextTrueFalse = Math.max(0, safe - nextMcq);
        }

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
        if (!anchorDifficultyKey) {
            setAnchorDifficultyKey(key);
        }

        const nextDifficulty: DifficultyState = {
            hard: difficulty.hard,
            medium: difficulty.medium,
            easy: difficulty.easy,
        };

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
    const generationStatus =
        jobStatus === 'pending'
            ? 'Queued for generation...'
            : jobStatus === 'processing'
                ? 'Composing question set...'
                : jobStatus === 'completed'
                    ? 'Done.'
                    : jobStatus === 'failed'
                        ? 'Generation failed.'
                        : generationProgress < 25
                            ? 'Analyzing selected materials...'
                            : generationProgress < 50
                                ? 'Extracting key concepts...'
                                : generationProgress < 75
                                    ? 'Composing question set...'
                                    : generationProgress < 100
                                        ? 'Finalizing and validating output...'
                                        : 'Done.';
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

        if (selectedMaterials.length === 0) {
            showToast('Please choose at least one course material file.');
            return;
        }

        const payload: GenerateQuizByAIPayload = {
            fileIds: useCourseSource ? selectedMaterials : [],
            newUploadedFiles: useUploadSource ? uploadedFiles : [],
            questionsCount: totalQuestions,
            questionTypeCounts: {
                MCQ: mcqCount,
                TrueFalse: trueFalseCount,
                Written: writtenCount,
            },
            questionDifficultyPercents: {
                Easy: difficulty.easy,
                Medium: difficulty.medium,
                Hard: difficulty.hard,
            },
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
        setSelectedMaterials(prev =>
            prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
        );
    };

    const selectAllVisibleMaterials = () => {
        setSelectedMaterials(visibleFileIds);
    };

    const clearSelectedMaterials = () => {
        setSelectedMaterials([]);
    };

    const toggleSection = (sectionId: string) => {
        setSelectedSections((prev) =>
            prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
        );
    };

    const selectAllSections = () => {
        const allSectionIds = (sectionsQuery.data ?? []).map((section) => section.id);
        setSelectedSections(allSectionIds);
    };

    const toggleGroupExpanded = (groupId: string) => {
        setExpandedGroups((prev) =>
            prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
        );
    };

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
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="w-full bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-800">

                {/* ── Header ── */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent font-extrabold flex items-center gap-1.5">
                                <Sparkles className="w-5 h-5 text-blue-400" />
                                Generate with AI
                            </span>
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Create custom assessments using advanced models</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm">Back</span>
                    </button>
                </header>

                {toastMessage && (
                    <div className="mx-6 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        {toastMessage}
                    </div>
                )}

                {/* ── Scrollable body ── */}
                <div className={`p-6 space-y-8 max-h-[72vh] overflow-y-auto ${isGenerating ? 'pointer-events-none opacity-70' : ''}`}>

                    {/* Source Material */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                            Source Material
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setUseUploadSource(prev => {
                                        const next = !prev;
                                        if (next) {
                                            fileInputRef.current?.click();
                                        }
                                        return next;
                                    });
                                }}
                                className={`group p-4 rounded-xl border transition-all duration-300 text-left ${useUploadSource
                                    ? 'border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-blue-500/10 hover:border-blue-500/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${useUploadSource
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400'
                                    }`}>
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="font-medium text-sm text-white">Upload Files <span className="text-zinc-500">(Optional)</span></p>
                                <p className="text-xs text-zinc-500 mt-0.5">PDF, DOCX, TXT</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setUseCourseSource(true)}
                                className={`group p-4 rounded-xl border transition-all duration-300 text-left ${useCourseSource
                                    ? 'border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500'
                                    : 'border-zinc-800 bg-zinc-900/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${useCourseSource
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <p className="font-medium text-sm text-white">Select Course Materials <span className="text-rose-300">(Required)</span></p>
                                <p className="text-xs text-zinc-500 mt-0.5">Choose at least one file</p>
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleUploadFiles}
                        />

                        {useUploadSource && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-zinc-400">Uploaded files ({uploadedFiles.length})</p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        Add more
                                    </button>
                                </div>
                                {uploadedFiles.length === 0 ? (
                                    <p className="text-xs text-zinc-500">No files selected yet.</p>
                                ) : (
                                    <div className="space-y-1 max-h-28 overflow-y-auto">
                                        {uploadedFiles.map((file, idx) => (
                                            <div key={`${file.name}-${idx}`} className="text-xs text-zinc-300 flex items-center justify-between gap-2 pr-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="truncate">{file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeUploadedFile(idx)}
                                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                                    aria-label={`Remove ${file.name}`}
                                                    title="Remove file"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {useCourseSource && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-3">
                                <p className="text-xs text-zinc-400">Select course materials <span className="text-rose-300">(required)</span></p>

                                {/* Section Selector */}
                                {sectionsQuery.data && sectionsQuery.data.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="block text-xs text-zinc-500">Filter by Section</p>
                                            <button
                                                type="button"
                                                onClick={selectAllSections}
                                                className="text-xs text-zinc-400 hover:text-zinc-200"
                                            >
                                                Select all
                                            </button>
                                        </div>
                                        <div className="space-y-1.5 max-h-28 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                                            {sectionsQuery.data.map((section) => (
                                                <label key={section.id} className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSections.includes(section.id)}
                                                        onChange={() => toggleSection(section.id)}
                                                        className="w-3.5 h-3.5 text-blue-500"
                                                    />
                                                    <span>Section {section.sectionNumber}: {section.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!quizId && (
                                    <p className="text-xs text-amber-300">
                                        Open an existing quiz to load uploaded materials.
                                    </p>
                                )}
                                {quizId && generationFilesQuery.isLoading && (
                                    <p className="text-xs text-zinc-500">Loading materials...</p>
                                )}
                                {visibleFileIds.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-zinc-400">Selected {selectedMaterials.filter((id) => visibleFileIds.includes(id)).length} of {visibleFileIds.length}</p>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={selectAllVisibleMaterials}
                                                    className="text-xs text-blue-400 hover:text-blue-300"
                                                >
                                                    Select all
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={clearSelectedMaterials}
                                                    className="text-xs text-zinc-400 hover:text-zinc-200"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                            {sectionFileGroups.map((group) => {
                                                const groupIds = group.files.map((file) => file.id);
                                                const allGroupSelected = groupIds.length > 0 && groupIds.every((id) => selectedMaterials.includes(id));
                                                const isExpanded = expandedGroups.includes(group.id);

                                                return (
                                                    <div key={group.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleGroupExpanded(group.id)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white"
                                                            >
                                                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                                {group.label}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleGroupMaterials(group)}
                                                                className="text-[11px] text-blue-400 hover:text-blue-300"
                                                            >
                                                                {allGroupSelected ? 'Clear group' : 'Select group'}
                                                            </button>
                                                        </div>

                                                        {isExpanded && group.files.map((file) => (
                                                            <label key={file.id} className="flex items-center gap-3 text-sm text-zinc-200 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedMaterials.includes(file.id)}
                                                                    onChange={() => toggleMaterial(file.id)}
                                                                    className="w-4 h-4 text-blue-500"
                                                                />
                                                                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                                <span className="truncate">{file.fileName}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {visibleFileIds.length > 0 && selectedMaterials.length === 0 && (
                                    <p className="text-xs text-rose-300">Choose at least one material file to continue.</p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Total Questions */}
                    <section className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-white">Total Number of Questions</label>
                            <p className="text-xs text-zinc-500 mt-0.5">Maximum limit of 100 per generation</p>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={totalQuestions}
                            onChange={e => setTotal(Number(e.target.value))}
                            className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg text-center font-bold text-blue-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none py-2"
                        />
                    </section>

                    {/* Question Types + Difficulty */}
                    <section className="grid grid-cols-2 gap-8">
                        {/* Question Types */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                                Question Types
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">Multiple Choice</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={mcqCount}
                                        onChange={e => setMcq(Number(e.target.value))}
                                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-center text-white py-1.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">Written Response</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={writtenCount}
                                        onChange={e => setWritten(Number(e.target.value))}
                                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-center text-white py-1.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">True / False</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={trueFalseCount}
                                        onChange={e => setTrueFalse(Number(e.target.value))}
                                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-center text-white py-1.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">MCQ, True/False, and Written auto-balance to the total count.</p>
                            </div>
                        </div>

                        {/* Difficulty Levels */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                                Difficulty Priority (%)
                            </h3>
                            <div className="space-y-4">
                                <div className="h-2 w-full rounded-full overflow-hidden bg-zinc-800 flex">
                                    <div className="bg-gradient-to-r from-rose-700 to-rose-400" style={{ width: `${difficulty.hard}%` }} />
                                    <div className="bg-gradient-to-r from-amber-700 to-amber-400" style={{ width: `${difficulty.medium}%` }} />
                                    <div className="bg-gradient-to-r from-emerald-700 to-emerald-400" style={{ width: `${difficulty.easy}%` }} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="w-14 text-xs text-rose-400">Hard</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={difficulty.hard}
                                            onChange={e => handleDifficultyChange('hard', Number(e.target.value))}
                                            className="flex-1 h-1.5 cursor-pointer accent-rose-500"
                                        />
                                        <span className="w-10 text-right text-xs text-rose-400">{difficulty.hard}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="w-14 text-xs text-amber-400">Medium</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={difficulty.medium}
                                            onChange={e => handleDifficultyChange('medium', Number(e.target.value))}
                                            className="flex-1 h-1.5 cursor-pointer accent-amber-500"
                                        />
                                        <span className="w-10 text-right text-xs text-amber-400">{difficulty.medium}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="w-14 text-xs text-emerald-400">Easy</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={difficulty.easy}
                                            onChange={e => handleDifficultyChange('easy', Number(e.target.value))}
                                            className="flex-1 h-1.5 cursor-pointer accent-emerald-500"
                                        />
                                        <span className="w-10 text-right text-xs text-emerald-400">{difficulty.easy}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-rose-400">Hard {difficulty.hard}%</span>
                                    <span className="text-amber-400">Medium {difficulty.medium}%</span>
                                    <span className="text-emerald-400">Easy {difficulty.easy}%</span>
                                </div>
                                {difficultyError && (
                                    <p className="text-xs text-red-400">
                                        Difficulty must total 100% (currently {difficultySum}%)
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Additional Instructions */}
                    <section className="space-y-3">
                        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-500">
                            Additional Instructions{' '}
                            <span className="normal-case font-normal text-zinc-600">(Optional)</span>
                        </label>
                        <textarea
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            rows={4}
                            placeholder="Add additional instructions to guide the AI (e.g., focus on Bloom's Taxonomy, align with specific learning outcomes, avoid certain topics, etc.)"
                            className="w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </section>
                </div>

                {/* ── Footer ── */}
                <footer className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                    {hasError && (
                        <p className="text-xs text-red-400 text-center mb-3">
                            Course materials are required. Choose at least one file to generate questions.
                        </p>
                    )}

                    {isGenerating && (
                        <div className="mb-4 rounded-xl border border-blue-900/40 bg-blue-950/30 p-3">
                            <div className="flex items-center justify-between text-xs text-blue-300 mb-2">
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    Generating {totalQuestions} questions...
                                </span>
                                <span>{generationProgress}% • ~{estimatedSeconds}s left</span>
                            </div>
                            <p className="text-xs text-blue-200/90 mb-2">Status: {generationStatus}</p>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-100"
                                    style={{ width: `${generationProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={isGenerating ? handleCancelGeneration : handleGenerate}
                        disabled={!isGenerating && hasError}
                        className="w-full bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-500 hover:via-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        {isGenerating ? 'Cancel' : 'Generate Questions'}
                    </button>
                    <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-[0.2em]">
                        Powered by Ailern Engine v2.4
                    </p>
                </footer>
            </div>
        </div>
    );
}
