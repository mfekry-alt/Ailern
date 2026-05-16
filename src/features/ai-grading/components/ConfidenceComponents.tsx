import React from 'react';
import { clsx } from 'clsx';
import { Brain, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const getConfidenceColor = (confidence: number) => {
    if (confidence < 50) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (confidence < 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
};

export const getConfidenceIcon = (confidence: number) => {
    if (confidence < 50) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (confidence < 70) return <Info className="w-3.5 h-3.5" />;
    return <CheckCircle2 className="w-3.5 h-3.5" />;
};

interface ConfidenceBadgeProps {
    confidence: number;
    showIcon?: boolean;
    className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, showIcon = true, className }) => {
    return (
        <div className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
            getConfidenceColor(confidence),
            className
        )}>
            {showIcon && getConfidenceIcon(confidence)}
            <span>{confidence}% Confidence</span>
        </div>
    );
};

interface ConfidenceProgressBarProps {
    confidence: number;
    height?: string;
    showLabel?: boolean;
}

export const ConfidenceProgressBar: React.FC<ConfidenceProgressBarProps> = ({ confidence, height = "h-1.5", showLabel = false }) => {
    const color = confidence < 50 ? 'bg-rose-500' : confidence < 70 ? 'bg-amber-500' : 'bg-emerald-500';
    
    return (
        <div className="w-full space-y-1.5">
            {showLabel && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>AI Confidence</span>
                    <span className={clsx(
                        confidence < 50 ? 'text-rose-500' : confidence < 70 ? 'text-amber-500' : 'text-emerald-500'
                    )}>{confidence}%</span>
                </div>
            )}
            <div className={clsx("w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden", height)}>
                <div 
                    className={clsx("h-full transition-all duration-1000 ease-out", color)}
                    style={{ width: `${confidence}%` }}
                />
            </div>
        </div>
    );
};
