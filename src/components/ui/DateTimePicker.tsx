import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';

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
        className={`
            w-full flex items-center gap-3 px-4 py-3.5
            bg-gray-50 dark:bg-slate-900/50
            border rounded-xl
            focus:outline-none focus:ring-2
            transition-all text-sm font-semibold text-left
            ${hasError
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/50 hover:border-blue-300 dark:hover:border-slate-500'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        <Calendar className={`w-[18px] h-[18px] ${iconColor} shrink-0`} />
        {value ? (
            <span className="text-gray-900 dark:text-white flex-1 truncate">{value}</span>
        ) : (
            <span className="text-gray-400 dark:text-slate-500 flex-1">{placeholder || 'Select date & time'}</span>
        )}
        <Clock className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
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
            showTimeSelect
            timeFormat="hh:mm aa"
            timeIntervals={15}
            dateFormat="MMM d, yyyy  h:mm aa"
            minDate={minDate ?? undefined}
            disabled={disabled}
            placeholderText={placeholder}
            popperPlacement="bottom-start"
            showPopperArrow={false}
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
