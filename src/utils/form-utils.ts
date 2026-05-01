/**
 * Smoothly scrolls to and focuses the first element with a validation error.
 * Handles React Hook Form field names.
 */
export const scrollToFirstError = (errorObj: Record<string, any>) => {
    const firstErrorKey = Object.keys(errorObj)[0];
    if (firstErrorKey) {
        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                           document.querySelector(`input[name="${firstErrorKey}"]`) ||
                           document.getElementById(firstErrorKey);
        if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (errorElement as HTMLElement).focus();
        }
    }
};
