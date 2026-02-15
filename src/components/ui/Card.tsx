import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// --- Types ---
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

// --- Main Card Component ---
export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {

        // We removed the local isDark state and the toggle button.
        // The card now relies purely on Tailwind's dark: modifiers.
        const variants = {
            default: 'bg-white border-transparent text-gray-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100',
            bordered: 'bg-white border-gray-200 text-gray-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100',
            elevated: 'bg-white shadow-md border-transparent text-gray-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl transition-all duration-300',
                    variants[variant],
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = 'Card';

// --- Sub-Components ---

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col space-y-1.5 mb-4 dark:text-zinc-100', className)} {...props} />
    )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight dark:text-zinc-50', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-gray-500 dark:text-zinc-400', className)} {...props} />
    )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('dark:text-zinc-200', className)} {...props} />
    )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex items-center pt-4 dark:text-zinc-200', className)} {...props} />
    )
);
CardFooter.displayName = 'CardFooter';