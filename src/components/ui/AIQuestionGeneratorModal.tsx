import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Upload, FolderOpen, Sparkles, FileText, CheckCircle2, X } from 'lucide-react';

interface DifficultyState {
    hard: number;
    medium: number;
    easy: number;
}

export interface GeneratePayload {
    sourceMaterial: 'upload' | 'course' | 'both';
    totalQuestions: number;
    mcqCount: number;
    writtenCount: number;
    difficulty: DifficultyState;
    instructions: string;
}

interface AIQuestionGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: GeneratePayload) => void;
}

export function AIQuestionGeneratorModal({ isOpen, onClose, onGenerate }: AIQuestionGeneratorModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const generationTimerRef = useRef<number | null>(null);
    const [useUploadSource, setUseUploadSource] = useState(true);
    const [useCourseSource, setUseCourseSource] = useState(false);
    const [totalQuestions, setTotalQuestions] = useState(34);
    const [mcqCount, setMcqCount] = useState(22);
    const [writtenCount, setWrittenCount] = useState(12);
    const [difficulty, setDifficulty] = useState<DifficultyState>({ hard: 100, medium: 0, easy: 0 });
    const [anchorDifficultyKey, setAnchorDifficultyKey] = useState<keyof DifficultyState | null>(null);
    const [instructions, setInstructions] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    const courseMaterialSections = useMemo(
        () => [
            {
                section: 'Modules',
                files: ['Module 1 - Introduction to LMS.pdf', 'Module 2 - Assessment Strategies.pdf'],
            },
            {
                section: 'Lecture Notes',
                files: ['Bloom Taxonomy Notes.docx', 'Instructional Design Summary.docx'],
            },
            {
                section: 'Slides & Rubrics',
                files: ['Week 4 Slides.pptx', 'Assignment Rubric v2.pdf'],
            },
        ],
        []
    );

    const generationTotalMs = 5000;

    if (!isOpen) return null;

    const difficultySum = difficulty.hard + difficulty.medium + difficulty.easy;
    const difficultyError = difficultySum !== 100;
    const sourceError =
        (!useUploadSource && !useCourseSource) ||
        (useCourseSource && selectedMaterials.length === 0);
    const hasError = sourceError || difficultyError;

    const sourceMaterial: GeneratePayload['sourceMaterial'] =
        useUploadSource && useCourseSource ? 'both' : useUploadSource ? 'upload' : 'course';

    const setTotal = (nextTotal: number) => {
        const safe = Math.max(1, Math.min(100, nextTotal));

        const prevTotal = totalQuestions;
        const mcqRatio = prevTotal > 0 ? mcqCount / prevTotal : 0.65;
        let nextMcq = Math.round(safe * mcqRatio);
        let nextWritten = safe - nextMcq;

        setTotalQuestions(safe);
        setMcqCount(Math.max(0, Math.min(safe, nextMcq)));
        setWrittenCount(Math.max(0, Math.min(safe, nextWritten)));
    };

    const setMcq = (next: number) => {
        const safeMcq = Math.max(0, Math.min(totalQuestions, next));
        setMcqCount(safeMcq);
        setWrittenCount(totalQuestions - safeMcq);
    };

    const setWritten = (next: number) => {
        const safeWritten = Math.max(0, Math.min(totalQuestions, next));
        setWrittenCount(safeWritten);
        setMcqCount(totalQuestions - safeWritten);
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

    const generationStatus =
        generationProgress < 25
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
        return () => {
            if (generationTimerRef.current !== null) {
                window.clearInterval(generationTimerRef.current);
                generationTimerRef.current = null;
            }
        };
    }, []);

    const handleGenerate = () => {
        if (hasError) return;

        setIsGenerating(true);
        setGenerationProgress(0);

        const stepMs = 100;
        const totalMs = generationTotalMs;
        const steps = totalMs / stepMs;
        let currentStep = 0;

        generationTimerRef.current = window.setInterval(() => {
            currentStep += 1;
            const nextProgress = Math.min(100, Math.round((currentStep / steps) * 100));
            setGenerationProgress(nextProgress);

            if (currentStep >= steps) {
                if (generationTimerRef.current !== null) {
                    window.clearInterval(generationTimerRef.current);
                    generationTimerRef.current = null;
                }
                setIsGenerating(false);
                onGenerate({ sourceMaterial, totalQuestions, mcqCount, writtenCount, difficulty, instructions });
            }
        }, stepMs);
    };

    const handleCancelGeneration = () => {
        if (generationTimerRef.current !== null) {
            window.clearInterval(generationTimerRef.current);
            generationTimerRef.current = null;
        }
        setIsGenerating(false);
        setGenerationProgress(0);
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
                                onClick={() => setUseCourseSource(prev => !prev)}
                                className={`group p-4 rounded-xl border transition-all duration-300 text-left ${useCourseSource
                                    ? 'border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-blue-500/10 hover:border-blue-500/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${useCourseSource
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400'
                                    }`}>
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <p className="font-medium text-sm text-white">Select Course Materials</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Choose by section and file</p>
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
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                                <p className="text-xs text-zinc-400">Select course materials by section</p>
                                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                                    {courseMaterialSections.map(({ section, files }) => (
                                        <div key={section} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                                            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{section}</p>
                                            <div className="space-y-1.5">
                                                {files.map(file => (
                                                    <label key={file} className="flex items-center gap-3 text-sm text-zinc-200 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMaterials.includes(file)}
                                                            onChange={() => toggleMaterial(file)}
                                                            className="w-4 h-4 text-blue-500"
                                                        />
                                                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span className="truncate">{file}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                <p className="text-xs text-zinc-500">Multiple Choice and Written auto-balance to total and either can be higher.</p>
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
                            Select at least one source option. If course materials are enabled, choose at least one file.
                        </p>
                    )}

                    {isGenerating && (
                        <div className="mb-4 rounded-xl border border-blue-900/40 bg-blue-950/30 p-3">
                            <div className="flex items-center justify-between text-xs text-blue-300 mb-2">
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    Generating 3 random questions...
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

                    <div className="mt-4 text-xs text-zinc-500 text-center inline-flex items-center justify-center w-full gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Generation adds 3 random questions after 5 seconds
                    </div>
                </footer>
            </div>
        </div>
    );
}
