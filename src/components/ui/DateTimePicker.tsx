import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock, ChevronDown } from 'lucide-react';

interface DateTimePickerProps {
    id?: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date | null;
    hasError?: boolean;
    disabled?: boolean;
    placeholder?: string;
    iconColor?: string;
}

const CustomInput = forwardRef<
    HTMLButtonElement,
    {
        value?: string;
        onClick?: () => void;
        placeholder?: string;
        hasError?: boolean;
        disabled?: boolean;
        iconColor?: string;
        id?: string;
    }
>(({ value, onClick, placeholder, hasError, disabled, iconColor = 'text-blue-500', id }, ref) => (
    <button
        id={id}
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={placeholder || 'Select date and time'}
        className={`
            relative w-full flex items-center gap-3.5 px-5 py-4
            bg-slate-50/50 dark:bg-slate-900/60
            border rounded-[1.25rem]
            focus:outline-none focus:ring-4
            transition-all text-sm font-bold text-left
            ${hasError
                ? 'border-red-400 focus:ring-red-500/10'
                : 'border-slate-100 dark:border-slate-800 focus:ring-indigo-500/10 focus:border-indigo-400 dark:focus:border-indigo-500/50 hover:border-indigo-200 dark:hover:border-slate-700 shadow-sm hover:shadow-indigo-500/5'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        <div className={`p-2 rounded-xl ${iconColor.replace('text-', 'bg-').replace('-500', '-500/10')} ${iconColor} shrink-0`}>
            <Calendar className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
            {value ? (
                <span className="text-slate-900 dark:text-white truncate leading-tight">{value}</span>
            ) : (
                <span className="text-slate-400 dark:text-slate-500 truncate leading-tight font-semibold">{placeholder || 'Select date & time'}</span>
            )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        </div>
    </button>
));

CustomInput.displayName = 'DateTimePickerInput';

export function DateTimePicker({
    id,
    value,
    onChange,
    minDate,
    hasError = false,
    disabled = false,
    placeholder,
    iconColor,
}: DateTimePickerProps) {
    return (
        <DatePicker
            selected={value}
            onChange={onChange}
            showTimeInput
            showTimeSelect={false}
            timeInputLabel="Time"
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={minDate ?? undefined}
            disabled={disabled}
            placeholderText={placeholder}
            popperPlacement="bottom-start"
            showPopperArrow={false}
            shouldCloseOnSelect={false}
            popperClassName="ailern-datepicker-popper"
            customInput={
                <CustomInput
                    id={id}
                    hasError={hasError}
                    disabled={disabled}
                    iconColor={iconColor}
                />
            }
            calendarClassName="ailern-datepicker"
            wrapperClassName="w-full"
        />
    );
}
