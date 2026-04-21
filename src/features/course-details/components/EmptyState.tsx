import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-gray-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm">{description}</p>
    </div>
);
