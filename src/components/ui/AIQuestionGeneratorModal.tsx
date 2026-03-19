import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
// 💡 الحل النهائي لمشكلة الـ Export والمسار
import * as quizService from '@/api/services/quiz.service';
import { Card, CardContent } from '@/components/ui/Card';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { QuestionRequest } from '@/types/api.types';

interface AIQuestionGeneratorModalProps {
    isOpen: boolean;
    quizId?: string;
    onClose: () => void;
    onGenerate: (questions: QuestionRequest[]) => void;
}

export const AIQuestionGeneratorModal = ({
    isOpen,
    quizId,
    onClose,
    onGenerate
}: AIQuestionGeneratorModalProps) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [count, setCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 💡 إصلاح نوع الـ Timeout ليعمل في المتصفح وNodejs
    const toastTimerRef = useRef<any>(null);

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 4000);
    }, []);

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    const quizQuery = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizService.getQuiz(quizId as string),
        enabled: Boolean(quizId),
    });

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showToast('Please enter a topic');
            return;
        }
        setIsGenerating(true);
        try {
            const results =  quizService.generateAIQuestions({
                topic,
                difficulty,
                count,
                context: quizQuery.data?.title
            });
            onGenerate(await results);
            onClose();
        } catch (error: any) {
            showToast(error?.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold">AI Question Generator</h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 cursor-pointer"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 💡 FIX S6853: Associated Label */}
                        <div className="space-y-2">
                            <label htmlFor="ai-topic" className="block text-sm font-medium">Topic Context</label>
                            <textarea
                                id="ai-topic"
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border rounded-xl text-sm"
                                placeholder="What is the quiz about?"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="ai-diff" className="block text-sm font-medium">Difficulty</label>
                                <select
                                    id="ai-diff"
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border rounded-xl text-sm"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="ai-count" className="block text-sm font-medium">Count</label>
                                <input
                                    id="ai-count"
                                    type="number"
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border rounded-xl text-sm"
                                    value={count}
                                    onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex justify-end gap-3 border-t dark:border-zinc-800">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm cursor-pointer">Cancel</button>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Generate
                        </button>
                    </div>
                </CardContent>
            </Card>

            {toastMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}
        </div>
    );
};
