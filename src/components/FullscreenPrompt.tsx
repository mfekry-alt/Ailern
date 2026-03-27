import { Maximize2, Shield, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface FullscreenPromptProps {
    onFullscreenEntered: () => void;
    onCancel: () => void;
}

/**
 * FullscreenPrompt Component
 * 
 * Gate component that appears before quiz starts.
 * Explains why fullscreen is required and enforces it.
 * 
 * User must:
 * 1. Check "I understand the exam rules" checkbox
 * 2. Click "Enter Fullscreen Mode" button
 * Cannot proceed without completing both steps
 */
export const FullscreenPrompt = ({ onFullscreenEntered, onCancel }: FullscreenPromptProps) => {
    const [rulesChecked, setRulesChecked] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    const handleEnterFullscreen = async () => {
        if (!rulesChecked) {
            alert('Please check the rules confirmation before proceeding.');
            return;
        }

        setIsRequesting(true);
        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }

            console.log('[Exam] Fullscreen enabled, starting exam security');
            onFullscreenEntered();
        } catch (error) {
            console.error('[Exam] Fullscreen request failed:', error);
            setIsRequesting(false);
            alert('Failed to enter fullscreen mode. Please check browser permissions.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            {/* Modal */}
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/10 rounded-full p-4 backdrop-blur">
                            <Shield className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Exam Mode Activated</h1>
                    <p className="text-indigo-100 text-lg">Secure Quiz Taking Environment</p>
                </div>

                {/* Content */}
                <div className="px-8 py-12">
                    {/* What is Fullscreen */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Maximize2 className="w-6 h-6 text-indigo-400" />
                            Why Fullscreen Mode?
                        </h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            Fullscreen mode is required to maintain exam integrity. It ensures:
                        </p>
                        <ul className="space-y-3">
                            {[
                                'You cannot switch to other windows or tabs',
                                'External resources and distractions are blocked',
                                'Your screen is dedicated entirely to the exam',
                                'Security monitoring can properly function',
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-slate-200">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Security Policy */}
                    <div className="bg-slate-800/70 rounded-xl p-6 mb-8 border border-slate-700">
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-3">
                            ⚠️ Security & Integrity Policy
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li>• <span className="font-semibold">Violations Tracked:</span> Switching tabs, minimizing window, or exiting fullscreen are violations.</li>
                            <li>• <span className="font-semibold">3-Strike Rule:</span> 3 violations will automatically submit your exam.</li>
                            <li>• <span className="font-semibold">No Cheating:</span> Right-click, copy-paste, and text selection are disabled.</li>
                            <li>• <span className="font-semibold">Immersive Mode:</span> Once started, remain in fullscreen until submission.</li>
                        </ul>
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-start gap-3 mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <input
                            type="checkbox"
                            id="rules-check"
                            checked={rulesChecked}
                            onChange={(e) => setRulesChecked(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded accent-indigo-500 cursor-pointer"
                        />
                        <label
                            htmlFor="rules-check"
                            className="flex-1 cursor-pointer text-slate-200"
                        >
                            <span className="font-semibold">I understand and accept the exam rules.</span>
                            <p className="text-xs text-slate-400 mt-1">
                                I understand that I may not switch tabs, minimize the window, or exit fullscreen during the exam. I agree to follow all security protocols.
                            </p>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-6 border border-slate-600 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEnterFullscreen}
                            disabled={!rulesChecked || isRequesting}
                            className={`flex-1 py-3 px-6 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${rulesChecked && !isRequesting
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 active:scale-95'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Maximize2 className="w-5 h-5" />
                            {isRequesting ? 'Activating...' : 'Enter Fullscreen Mode'}
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-slate-500 text-center mt-6">
                        Press Esc anytime to exit fullscreen (but this will be recorded as a violation)
                    </p>
                </div>
            </div>
        </div>
    );
};
