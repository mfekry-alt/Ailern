/**
 * SubmissionSuccessMessage
 * A minimal, formal success message for assignment submissions.
 * No animations - static, clean UI.
 */

import { CheckCircle } from 'lucide-react';

interface SubmissionSuccessMessageProps {
    onClose?: () => void;
    message?: string;
}

export const SubmissionSuccessMessage = ({
    onClose,
    message = 'Your submission has been uploaded successfully',
}: SubmissionSuccessMessageProps) => {
    return (
        <div className="text-center py-10">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Submission Successful
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-300 max-w-sm mx-auto">
                {message}
            </p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="mt-6 px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
                >
                    Close Now
                </button>
            )}
        </div>
    );
};
