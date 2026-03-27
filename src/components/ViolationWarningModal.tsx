import { AlertTriangle, Lock } from 'lucide-react';

interface ViolationWarningModalProps {
    isOpen: boolean;
    violationNumber: 1 | 2 | 3;
    reason: string;
    onAcknowledge: () => void;
}

/**
 * ViolationWarningModal Component
 * 
 * Displays violation warnings during exam.
 * - 1st and 2nd violations: Show warning with reason
 * - 3rd violation: Show final warning (though auto-submit usually happens)
 * 
 * Modal is unblockable:
 * - Dark overlay prevents clicking outside
 * - "I Understand" button is required to dismiss
 * - Cannot proceed with exam until acknowledged
 */
export const ViolationWarningModal = ({
    isOpen,
    violationNumber,
    reason,
    onAcknowledge,
}: ViolationWarningModalProps) => {
    if (!isOpen) return null;

    const isCritical = violationNumber === 3;
    const messages = {
        1: {
            title: 'First Violation ⚠️',
            desc: 'Please keep the quiz window in focus and avoid switching tabs.',
            bg: 'from-yellow-600 to-yellow-700',
            icon: 'text-yellow-400',
        },
        2: {
            title: 'Second Violation ⚠️⚠️',
            desc: 'WARNING: One more violation will automatically submit your exam. Stay focused!',
            bg: 'from-orange-600 to-orange-700',
            icon: 'text-orange-400',
        },
        3: {
            title: 'Critical: Exam Auto-Submitting 🔒',
            desc: 'Your exam has been submitted due to multiple security violations.',
            bg: 'from-red-600 to-red-700',
            icon: 'text-red-400',
        },
    };

    const config = messages[violationNumber];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* Dark overlay - unblockable */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

            {/* Modal */}
            <div className="relative z-[1000] w-full max-w-md mx-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header gradient */}
                <div className={`bg-gradient-to-r ${config.bg} px-6 py-8 text-center`}>
                    <div className="flex justify-center mb-4">
                        {isCritical ? (
                            <Lock className={`w-12 h-12 ${config.icon}`} />
                        ) : (
                            <AlertTriangle className={`w-12 h-12 ${config.icon}`} />
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">{config.title}</h2>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <p className="text-slate-300 text-center mb-4 leading-relaxed">{config.desc}</p>

                    {/* Reason display */}
                    <div className="bg-slate-800/70 rounded-xl p-4 mb-6 border border-slate-700">
                        <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-2">
                            Reason:
                        </p>
                        <p className="text-slate-200 text-sm">{reason}</p>
                    </div>

                    {/* Violation count indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3].map((num) => (
                            <div
                                key={num}
                                className={`w-3 h-3 rounded-full transition-all ${num <= violationNumber
                                        ? 'bg-red-500'
                                        : 'bg-slate-600'
                                    }`}
                            ></div>
                        ))}
                    </div>

                    {/* Security note */}
                    <div className="bg-slate-800/50 rounded-lg p-3 mb-6 border-l-4 border-amber-500">
                        <p className="text-xs text-slate-300">
                            <span className="font-bold text-amber-400">Security Notice:</span> This exam is protected by strict security monitoring. Multiple violations will result in automatic submission.
                        </p>
                    </div>
                </div>

                {/* Footer - Action button */}
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700">
                    <button
                        onClick={onAcknowledge}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        {isCritical ? 'Exam Submitted' : 'I Understand'}
                    </button>
                    {isCritical && (
                        <p className="text-xs text-slate-400 text-center mt-3">
                            Your responses have been saved. Redirecting...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
