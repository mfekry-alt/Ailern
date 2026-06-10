import { useLayoutEffect } from 'react';

/**
 * Locks the body scroll when a component is mounted.
 * Useful for modals to prevent background scrolling.
 */
export function useLockBodyScroll(active: boolean = true) {
    useLayoutEffect(() => {
        if (!active) return;

        // Get original body overflow
        const originalStyle = window.getComputedStyle(document.body).overflow;
        
        // Prevent scrolling on mount
        document.body.style.overflow = 'hidden';
        
        // Re-enable scrolling on unmount
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [active]);
}
