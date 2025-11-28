import React, { useState } from 'react';
import type { Task } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = startDate;

    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const tasksByDate: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
        if (task.dueDate) {
            // Adjust for timezone offset before creating date string key
            const taskDueDate = new Date(task.dueDate);
            const utcDate = new Date(taskDueDate.getUTCFullYear(), taskDueDate.getUTCMonth(), taskDueDate.getUTCDate());
            const dateKey = utcDate.toDateString();

            if (!tasksByDate[dateKey]) {
                tasksByDate[dateKey] = [];
            }
            tasksByDate[dateKey].push(task);
        }
    });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const today = new Date();

    return (
        <div className="flex-1 flex flex-col p-4 bg-gray-100 dark:bg-gray-800 overflow-auto">
            <header className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>
            <div className="grid grid-cols-7 flex-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                    <div key={dayName} className="text-center py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        {dayName}
                    </div>
                ))}
                {days.map((d) => {
                    const dateKey = d.toDateString();
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    const isToday = d.toDateString() === today.toDateString();

                    return (
                        <div key={dateKey} className={`relative p-2 border-r border-b border-gray-200 dark:border-gray-700 ${!isCurrentMonth ? 'bg-gray-100/50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700/50'}`}>
                            <div className={`text-sm mb-2 text-right ${isToday ? 'bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : `text-gray-600 dark:text-gray-300 ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : ''}`}`}>
                                {d.getDate()}
                            </div>
                            <div className="space-y-1 h-24 overflow-y-auto">
                                {tasksByDate[dateKey]?.map(task => (
                                    <div 
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className="p-1.5 rounded-md bg-brand-100 dark:bg-brand-900/50 cursor-pointer hover:bg-brand-200 dark:hover:bg-brand-900"
                                    >
                                        <p className="text-xs font-medium text-brand-800 dark:text-brand-200 truncate">{task.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;