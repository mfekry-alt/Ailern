import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

/**
 * Maps server-side validation errors to React Hook Form fields.
 * 
 * @param serverErrors - The errors object from the backend (e.g. { "Name": ["Error 1"], "Code": ["Error 2"] })
 * @param setError - The setError function from useForm
 * @param fieldMapping - Optional mapping from backend names to frontend field names
 */
export const mapServerErrors = <T extends FieldValues>(
    serverErrors: Record<string, string[]>,
    setError: UseFormSetError<T>,
    fieldMapping: Record<string, Path<T>> = {}
) => {
    Object.entries(serverErrors).forEach(([key, messages]) => {
        const fieldName = fieldMapping[key] || (key.charAt(0).toLowerCase() + key.slice(1) as Path<T>);
        
        setError(fieldName, {
            type: 'server',
            message: messages[0] // Take the first error message
        });
    });
};
