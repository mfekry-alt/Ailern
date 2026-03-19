import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Trash2, CheckCircle2, Loader2, GripVertical } from 'lucide-react';
import { useQuiz, useUpdateQuiz } from '@/features/quizzes/api';
import type { QuestionType, QuizStatus } from '@/types/api.types';
import { ROUTES } from '@/lib/constants';
import {
    convertQuestionRequestToUI,
    buildPayloadOptions,
} from './quizQuestion.utils';

// ─── Local UI types ────────────────────────────────────────────────────────

interface UIOption { text: string; isCorrect: boolean; }
interface UIQuestion {
    uid: number;
    id?: string;
    type: QuestionType;
    text: string;
    instructions: string;
    mark: number;
    explanation: string;
    options: UIOption[];
}

interface QuizSettings {
    title: string;
    courseId: string;
    status: QuizStatus;
}

// ─── Helpers Outside Component (To Solve S3358, S2004) ──────────────────

const getQuestionName = (q: UIQuestion, idx: number): string => {
    const text = q.text.trim();
    if (!text) return `Question ${idx + 1}`;
    return text.length > 40 ? `${text.slice(0, 40)}...` : text;
};

const mutateUpdateQ = (qs: UIQuestion[], uid: number, patch: Partial<UIQuestion>) =>
    qs.map(q => (q.uid === uid ? { ...q, ...patch } : q));

const mutateUpdateOpt = (qs: UIQuestion[], uid: number, idx: number, patch: Partial<UIOption>) =>
    qs.map(q => {
        if (q.uid !== uid) return q;
        return {
            ...q,
            options: q.options.map((o, i) => (i === idx ? { ...o, ...patch } : o))
        };
    });

// ─── Main Component ─────────────────────────────────────────────────────

export const InstructorQuizQuestionsEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    const currentId = id || '';
    const settings = location.state?.settings as QuizSettings | undefined;

    const { data: quiz, isLoading: quizLoading } = useQuiz(currentId);
    const updateQuizMutation = useUpdateQuiz(quiz?.courseId || '');

    const [questions, setQuestions] = useState<UIQuestion[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (quiz?.questions && !hydrated) {
            const uiQs = quiz.questions.map((q, idx) => convertQuestionRequestToUI(q, idx + 1));
            setQuestions(uiQs);
            setHydrated(true);
        }
    }, [quiz, hydrated]);

    const updateQ = useCallback((uid: number, patch: Partial<UIQuestion>) => setQuestions(qs => mutateUpdateQ(qs, uid, patch)), []);

    const handleSubmit = async () => {
        try {
            const payload = {
                ...settings,
                questions: questions.map(q => ({
                    id: q.id,
                    questionType: q.type,
                    questionText: q.text,
                    mark: q.mark,
                    options: buildPayloadOptions(q),
                }))
            };
            await updateQuizMutation.mutateAsync({ id: currentId, cmd: payload as any });
            setSuccess(true);
            setTimeout(() => navigate(ROUTES.INSTRUCTOR_QUIZ_EDIT.replace(':id', currentId)), 1500);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Update failed');
        }
    };

    if (quizLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Quiz Questions</h1>
                <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border rounded-lg cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </header>

            {error && <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">{error}</div>}
            {success && <div className="p-4 mb-4 bg-green-50 text-green-800 rounded-lg text-sm border border-green-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Updated!</div>}

            <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
                <aside className="space-y-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.uid}
                            type="button"
                            onClick={() => document.getElementById(`q-${q.uid}`)?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full text-left p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center gap-3 cursor-pointer shadow-sm"
                        >
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <span className="truncate text-sm font-medium">{getQuestionName(q, idx)}</span>
                        </button>
                    ))}
                </aside>

                <main className="space-y-6">
                    {questions.map((q, idx) => (
                        <Card key={q.uid} id={`q-${q.uid}`} variant="elevated">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg">Question {idx + 1}</h3>
                                    <button type="button" onClick={() => setQuestions(qs => qs.filter(item => item.uid !== q.uid))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor={`text-${q.uid}`} className="block text-sm font-medium mb-1">Question Text</label>
                                        <textarea
                                            id={`text-${q.uid}`}
                                            value={q.text}
                                            onChange={e => updateQ(q.uid, { text: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-zinc-800 text-sm"
                                            rows={3}
                                        />
                                    </div>
                                    
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <div className="flex justify-end pt-6 border-t dark:border-zinc-800">
                        <button type="button" onClick={handleSubmit} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 cursor-pointer shadow-lg transition-all">
                            Save Changes
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};