import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
    value: string | null;
    onChange: (date: string | null) => void;
}

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    // Use UTC methods to avoid timezone issues where the date might shift by a day.
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // The value prop is a UTC ISO string. new Date() parses this correctly.
    const selectedDate = value ? new Date(value) : null;
    
    const [inputValue, setInputValue] = useState(formatDateForInput(selectedDate));
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Sync input value if prop changes from outside
    useEffect(() => {
        setInputValue(formatDateForInput(value ? new Date(value) : null));
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node) && popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOpen = () => {
        if (!isOpen && containerRef.current) {
            setViewDate(selectedDate || new Date());
            const rect = containerRef.current.getBoundingClientRect();
            const popupHeight = 320;
            const spaceBelow = window.innerHeight - rect.bottom;
            let top = spaceBelow < popupHeight && rect.top > popupHeight ? rect.top - popupHeight - 4 : rect.bottom + 4;
            setPopupStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${rect.left}px`,
                width: `${rect.width < 288 ? 288 : rect.width}px`,
                zIndex: 50,
            });
            setIsOpen(true);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove all non-digit characters to get a clean string of numbers
        const digits = e.target.value.replace(/\D/g, '');

        // Limit to a total of 8 digits (YYYYMMDD)
        const limitedDigits = digits.slice(0, 8);

        let formatted = '';
        // Apply formatting as the user types
        if (limitedDigits.length > 0) {
            // Add the year part (up to 4 digits)
            formatted += limitedDigits.slice(0, 4);
        }
        if (limitedDigits.length >= 5) {
            // Add the month part (up to 2 digits) after a dash
            formatted += '-' + limitedDigits.slice(4, 6);
        }
        if (limitedDigits.length >= 7) {
            // Add the day part (up to 2 digits) after a second dash
            formatted += '-' + limitedDigits.slice(6, 8);
        }

        setInputValue(formatted);
    };
    
    const handleInputBlur = () => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue === '') {
            if (value !== null) onChange(null);
            return;
        }

        // Validate the YYYY-MM-DD format and check if it's a real date
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
            const [year, month, day] = trimmedValue.split('-').map(Number);
            
            // A simple way to check for valid dates (e.g., handles 2023-02-30)
            const dateAsLocal = new Date(year, month - 1, day);
            if (dateAsLocal.getFullYear() === year && dateAsLocal.getMonth() === month - 1 && dateAsLocal.getDate() === day) {
                // If valid, create a UTC date and propagate
                const utcDate = new Date(Date.UTC(year, month - 1, day));
                onChange(utcDate.toISOString());
                return; // Date is valid, exit
            }
        }
        
        // If format is invalid or date is not real, revert to last good value
        setInputValue(formatDateForInput(selectedDate));
    };
    
    const handleDateSelect = (day: Date) => {
        // Create a new Date object at UTC midnight for the selected day to avoid timezone issues.
        const utcDate = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
        
        // Immediately update the input for instant feedback, preventing a visual flash.
        setInputValue(formatDateForInput(utcDate));

        // Propagate the change up as a full ISO string.
        onChange(utcDate.toISOString());
        setIsOpen(false);
    };

    const handleClearDate = () => {
        onChange(null);
        setIsOpen(false);
    };

    // FIX: Add missing month navigation handlers.
    const handlePrevMonth = () => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    const generateCalendarGrid = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const grid = [];
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
        for (let i = 0; i < 42; i++) {
            grid.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        return grid;
    };

    const calendarGrid = generateCalendarGrid();
    const today = new Date();

    return (
        <div className="w-full relative" ref={containerRef}>
             <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleOpen}
                onBlur={handleInputBlur}
                placeholder="YYYY-MM-DD"
                className="w-full mt-1 pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-sm text-gray-800 dark:text-gray-200"
            />
            <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
            
            {isOpen && (
                <div ref={popupRef} style={popupStyle} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-2">
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><ChevronLeft size={18} /></button>
                        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><ChevronRight size={18} /></button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {calendarGrid.map((day, index) => {
                            const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                            const isToday = day.toDateString() === today.toDateString();
                            
                            let buttonClass = 'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ';
                            if (!isCurrentMonth) {
                                buttonClass += 'text-gray-400 dark:text-gray-500';
                            } else if (isSelected) {
                                buttonClass += 'bg-brand-600 text-white hover:bg-brand-700';
                            } else if (isToday) {
                                buttonClass += 'ring-2 ring-brand-500 text-brand-600 dark:text-brand-300';
                            } else {
                                buttonClass += 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200';
                            }

                            return (
                                <div key={index} className="flex justify-center items-center py-0.5">
                                    <button
                                        type="button"
                                        onClick={() => handleDateSelect(day)}
                                        className={buttonClass}
                                    >
                                        {day.getDate()}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                     {value && (
                         <button
                            type="button"
                            onClick={handleClearDate}
                            className="w-full mt-2 text-center text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md py-1"
                         >
                            Clear Date
                         </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;