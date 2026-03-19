import type { OptionRequest, QuestionRequest, QuestionType } from '@/types/api.types';

export interface UIOptionBase {
    text: string;
    isCorrect: boolean;
}

export interface UIQuestionBase {
    uid: number;
    type: QuestionType;
    text: string;
    instructions: string;
    mark: number;
    explanation: string;
    options: UIOptionBase[];
}

export const makeMCQOptions = (): UIOptionBase[] => [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

export const makeTFOptions = (): UIOptionBase[] => [
    { text: 'True', isCorrect: true },
    { text: 'False', isCorrect: false },
];

export const defaultQuestion = (uid: number): UIQuestionBase => ({
    uid,
    type: 'MCQ',
    text: '',
    instructions: '',
    mark: 5,
    explanation: '',
    options: makeMCQOptions(),
});

export const convertQuestionRequestToUI = (q: QuestionRequest, uid: number): UIQuestionBase => {
    const options = q.options?.length
        ? q.options.map((o) => ({ text: o.optionText, isCorrect: o.isCorrect }))
        : q.questionType === 'TrueFalse'
            ? makeTFOptions()
            : q.questionType === 'MCQ'
                ? makeMCQOptions()
                : [];

    return {
        uid,
        type: q.questionType,
        text: q.questionText,
        instructions: q.instructions ?? '',
        mark: q.mark ?? 5,
        explanation: q.explanation ?? '',
        options,
    };
};

export const buildPayloadOptions = (q: { options: UIOptionBase[] }): OptionRequest[] =>
    q.options.map((o) => ({ optionText: o.text, isCorrect: o.isCorrect }));
