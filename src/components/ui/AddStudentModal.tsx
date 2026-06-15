import React, { useState } from 'react';
import { Mail, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (email: string) => Promise<void>;
    isPending: boolean;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isPending,
}) => {
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
            toast.error('Please enter an email address.');
            return;
        }
        await onConfirm(trimmed);
        setEmail('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 animate-in zoom-in-95 fade-in duration-300">
                <div className="p-6 sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="w-14 h-14 bg-[#21A9FF]/10 rounded-2xl flex items-center justify-center mb-6">
                        <Mail className="w-7 h-7 text-[#21A9FF]" />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        Add Student
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                        Invite a student to this course directly using their email address.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                                Student Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. student@example.com"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] transition-all placeholder:text-slate-400"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isPending}
                                className="px-5 py-3 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || !email.trim()}
                                className="px-6 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-[#21A9FF]/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {isPending ? 'Adding...' : 'Add Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
