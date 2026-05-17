/**
 * Q&A Board — Empty State
 * Premium illustration with helpful CTA.
 */
import { motion } from 'framer-motion';
import { MessageSquarePlus, Sparkles } from 'lucide-react';

interface QnAEmptyStateProps {
    onAskQuestion: () => void;
    isFiltered?: boolean;
}

export function QnAEmptyState({ onAskQuestion, isFiltered }: QnAEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            {/* Floating icon illustration */}
            <div className="relative mb-8">
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#21A9FF]/10 to-[#0094F2]/5 dark:from-[#21A9FF]/15 dark:to-[#0094F2]/10 flex items-center justify-center shadow-lg shadow-[#21A9FF]/5"
                >
                    <MessageSquarePlus className="w-10 h-10 text-[#21A9FF]" />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
            </div>

            {isFiltered ? (
                <>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                        No matching questions
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                        Try adjusting your search or filter to find what you're looking for.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                        No questions yet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                        Be the first to start a discussion! Ask about course concepts, assignments, or anything you'd like clarified.
                    </p>
                </>
            )}

            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAskQuestion}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#21A9FF] to-[#0094F2] text-white text-sm font-bold shadow-lg shadow-[#21A9FF]/25 hover:shadow-[#21A9FF]/40 transition-shadow"
            >
                <MessageSquarePlus className="w-4 h-4" />
                Ask the First Question
            </motion.button>
        </motion.div>
    );
}
