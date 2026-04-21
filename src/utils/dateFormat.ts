/**
 * Date formatting utilities
 * Converts UTC dates from API to local timezone for display
 */

export interface DateFormatOptions {
    includeTime?: boolean;
    includeSeconds?: boolean;
    dateStyle?: 'short' | 'medium' | 'long' | 'full';
    timeStyle?: 'short' | 'medium' | 'long' | 'full';
}

const defaultOptions: DateFormatOptions = {
    includeTime: true,
    includeSeconds: false,
    dateStyle: 'medium',
    timeStyle: 'short',
};

/**
 * Parse a UTC date string from the API and convert to local Date object
 * Handles various ISO 8601 formats and ensures proper UTC parsing
 */
export function parseUtcDate(dateString: string | Date | undefined | null): Date | null {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateString);
            return null;
        }
        return date;
    } catch (error) {
        console.warn('Error parsing date:', dateString, error);
        return null;
    }
}

/**
 * Format a UTC date string for display in user's local timezone
 * Example output: "Apr 20, 2026, 9:47 AM"
 */
export function formatDateTime(
    dateString: string | Date | undefined | null,
    options: DateFormatOptions = {}
): string {
    const opts = { ...defaultOptions, ...options };
    const date = parseUtcDate(dateString);

    if (!date) return 'Invalid date';

    const formatterOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: opts.dateStyle === 'short' ? 'short' : 'long',
        day: 'numeric',
    };

    if (opts.includeTime) {
        formatterOptions.hour = 'numeric';
        formatterOptions.minute = '2-digit';
        if (opts.includeSeconds) {
            formatterOptions.second = '2-digit';
        }
        formatterOptions.hour12 = true;
    }

    return date.toLocaleString(undefined, formatterOptions);
}

/**
 * Format date only (no time)
 * Example output: "Apr 20, 2026"
 */
export function formatDate(
    dateString: string | Date | undefined | null,
    options: Omit<DateFormatOptions, 'includeTime'> = {}
): string {
    return formatDateTime(dateString, { ...options, includeTime: false });
}

/**
 * Format time only (no date)
 * Example output: "9:47 AM"
 */
export function formatTime(
    dateString: string | Date | undefined | null,
    options: Pick<DateFormatOptions, 'includeSeconds'> = {}
): string {
    const date = parseUtcDate(dateString);
    if (!date) return 'Invalid time';

    const formatterOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    if (options.includeSeconds) {
        formatterOptions.second = '2-digit';
    }

    return date.toLocaleString(undefined, formatterOptions);
}

/**
 * Format date with full time details
 * Example output: "Apr 20, 2026, 9:47:30 AM"
 */
export function formatDateTimeFull(dateString: string | Date | undefined | null): string {
    return formatDateTime(dateString, { includeSeconds: true });
}

/**
 * Check if a date is in the past (compared to now)
 */
export function isPast(dateString: string | Date | undefined | null): boolean {
    const date = parseUtcDate(dateString);
    if (!date) return false;
    return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future (compared to now)
 */
export function isFuture(dateString: string | Date | undefined | null): boolean {
    const date = parseUtcDate(dateString);
    if (!date) return false;
    return date.getTime() > Date.now();
}

/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(dateString: string | Date | undefined | null): string {
    const date = parseUtcDate(dateString);
    if (!date) return 'Invalid date';

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    if (Math.abs(diffSecs) < 60) {
        return rtf.format(diffSecs, 'second');
    } else if (Math.abs(diffMins) < 60) {
        return rtf.format(diffMins, 'minute');
    } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
    } else {
        return rtf.format(diffDays, 'day');
    }
}
