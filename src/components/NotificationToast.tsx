import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BookOpen, Award, ClipboardList, HelpCircle, Clock, Sparkles, Trash2, X } from 'lucide-react';
import type { ToastData } from '@/hooks/useRealtimeNotifications';

interface NotificationToastProps {
    toast: ToastData;
    onClose: () => void;
    isDropdownOpen: boolean;
}

const getToastIconConfig = (type: string | number) => {
    const t = String(type).toLowerCase();

    if (t === '0' || t.includes('assignment')) {
        return { icon: ClipboardList, bg: 'bg-[#21A9FF]/10 dark:bg-[#21A9FF]/20', color: 'text-[#21A9FF]' };
    }
    if (t === '1' || t.includes('material') || t.includes('update')) {
        return { icon: BookOpen, bg: 'bg-[#21A9FF]/10 dark:bg-[#21A9FF]/20', color: 'text-[#21A9FF]' };
    }
    if (t === '2' || t.includes('quiz')) {
        return { icon: HelpCircle, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' };
    }
    if (t === '3' || t.includes('attempt') || t.includes('review')) {
        return { icon: Award, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (t === '4' || t.includes('deadline')) {
        return { icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' };
    }
    if (t === '5' || t.includes('generation') || t.includes('finished')) {
        return { icon: Sparkles, bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400' };
    }
    if (t === '6' || t.includes('remove') || t.includes('admin')) {
        return { icon: Trash2, bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' };
    }

    return { icon: Bell, bg: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-600 dark:text-gray-400' };
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onClose, isDropdownOpen }) => {
    const iconConfig = getToastIconConfig(toast.type);
    const IconComponent = iconConfig.icon;

    // Position: if dropdown is open, render to the left of the dropdown on desktop.
    // Otherwise, render directly below the bell icon.
    const positionClasses = isDropdownOpen
        ? 'absolute right-0 top-[calc(100%+8px)] lg:right-[390px] lg:top-0 w-[320px] md:w-[340px]'
        : 'absolute right-0 top-[calc(100%+8px)] w-[320px] md:w-[340px]';

    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`${positionClasses} z-[70] bg-white/95 dark:bg-slate-900/95 border border-gray-200/80 dark:border-slate-700/80 shadow-2xl rounded-2xl p-4 flex items-start gap-3 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(33,169,255,0.25)] transition-shadow duration-300 ring-2 ring-[#21A9FF]/10 dark:ring-[#21A9FF]/20`}
        >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconConfig.bg} relative`}>
                {/* Subtle pulsing background glow on the icon */}
                <span className="absolute inset-0 rounded-full bg-[#21A9FF]/20 animate-ping opacity-75" />
                <IconComponent className={`w-5 h-5 ${iconConfig.color} relative z-10`} />
            </div>

            <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {toast.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {toast.message}
                </p>
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
export default NotificationToast;
