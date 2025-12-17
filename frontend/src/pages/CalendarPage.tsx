import React, { useState, useMemo } from 'react';
import type { Project, Task, Team } from '@/types';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    Briefcase,
    Users
} from 'lucide-react';
import Avatar from '@/components/common/Avatar';

interface CalendarPageProps {
    projects: Project[];
    teams: Team[];
    onSelectTask: (projectId: string, taskId: string) => void;
    onSelectProject: (projectId: string) => void;
}

interface CalendarTask extends Task {
    projectId: string;
    projectName: string;
    teamName?: string;
    teamIcon?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarPage: React.FC<CalendarPageProps> = ({ projects, teams, onSelectTask, onSelectProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [view, setView] = useState<'month' | 'week'>('month');

    // Get all tasks with due dates from all projects
    const allTasks = useMemo((): CalendarTask[] => {
        return projects.flatMap(project => {
            const team = teams.find(t => t.id === project.teamId);
            return Object.values(project.tasks)
                .filter((task: Task) => task.dueDate)
                .map((task: Task) => ({
                    ...task,
                    projectId: project.id,
                    projectName: project.name,
                    teamName: team?.name,
                    teamIcon: team?.icon
                }));
        });
    }, [projects, teams]);

    // Get tasks for a specific date
    const getTasksForDate = (date: Date): CalendarTask[] => {
        return allTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            );
        });
    };

    // Calendar grid generation
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: (Date | null)[] = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentDate]);

    // Week view generation
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Start from Sunday

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentDate]);

    // Navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Check if a date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // Check if a date is selected
    const isSelected = (date: Date): boolean => {
        if (!selectedDate) return false;
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
    };

    // Get selected date tasks
    const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

    // Get upcoming tasks (next 7 days)
    const upcomingTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return allTasks
            .filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate <= nextWeek && !task.completed;
            })
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }, [allTasks]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate.getMonth() === currentDate.getMonth() &&
                dueDate.getFullYear() === currentDate.getFullYear();
        });

        const overdue = allTasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            return new Date(task.dueDate) < today;
        });

        const todayTasks = getTasksForDate(today);

        return {
            thisMonth: thisMonth.length,
            overdue: overdue.length,
            today: todayTasks.length,
            upcoming: upcomingTasks.length
        };
    }, [allTasks, currentDate, upcomingTasks]);

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-amber-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const formatDueDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 opacity-0 animate-fade-in pb-24 overflow-y-auto h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <CalendarIcon className="text-brand-600 dark:text-brand-400" size={28} />
                        Calendar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Track your tasks and deadlines</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button
                            onClick={() => setView('month')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'month'
                                ? 'bg-brand-600 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'week'
                                ? 'bg-brand-600 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            Week
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-panel p-4 rounded-xl border border-white/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <CalendarIcon size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">This Month</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.thisMonth}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Today</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.today}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Upcoming</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.upcoming}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Overdue</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overdue}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="xl:col-span-2 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="glass-panel rounded-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={goToNextMonth}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                            {view === 'week' ? (
                                weekDays.map((date, index) => (
                                    <div key={index} className="p-3 text-center">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {DAYS[date.getDay()]}
                                        </div>
                                        <div className={`text-lg font-bold mt-1 ${isToday(date) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                DAYS.map(day => (
                                    <div key={day} className="p-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7">
                            {(view === 'week' ? weekDays : calendarDays).map((date, index) => {
                                const tasksForDay = date ? getTasksForDate(date) : [];
                                const hasOverdue = tasksForDay.some(t => !t.completed && new Date(t.dueDate!) < new Date());

                                return (
                                    <div
                                        key={index}
                                        onClick={() => date && setSelectedDate(date)}
                                        className={`
                                            ${view === 'week' ? 'min-h-[300px]' : 'min-h-[100px]'} p-2 border-b border-r border-gray-100 dark:border-gray-700/50 
                                            cursor-pointer transition-colors relative
                                            ${date ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'bg-gray-50/50 dark:bg-gray-800/20'}
                                            ${date && isSelected(date) ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-inset ring-brand-500' : ''}
                                        `}
                                    >
                                        {date && (
                                            <>
                                                {view === 'month' && (
                                                    <div className={`
                                                        text-sm font-medium mb-1
                                                        ${isToday(date)
                                                            ? 'w-7 h-7 flex items-center justify-center bg-brand-600 text-white rounded-full'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                        }
                                                    `}>
                                                        {date.getDate()}
                                                    </div>
                                                )}

                                                {/* Task indicators */}
                                                <div className="space-y-1">
                                                    {tasksForDay.slice(0, view === 'week' ? 10 : 3).map(task => (
                                                        <div
                                                            key={task.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectTask(task.projectId, task.id);
                                                            }}
                                                            className={`
                                                                text-xs px-1.5 py-0.5 rounded truncate
                                                                ${task.completed
                                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 line-through'
                                                                    : `${getPriorityColor(task.priority)} bg-opacity-20 dark:bg-opacity-30`
                                                                }
                                                                hover:opacity-80 cursor-pointer transition-opacity
                                                            `}
                                                            title={task.title}
                                                        >
                                                            {task.title}
                                                        </div>
                                                    ))}
                                                    {tasksForDay.length > (view === 'week' ? 10 : 3) && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                                                            +{tasksForDay.length - (view === 'week' ? 10 : 3)} more
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Overdue indicator */}
                                                {hasOverdue && !isToday(date) && new Date() > date && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    {/* Selected Date Tasks */}
                    {selectedDate && (
                        <div className="glass-panel rounded-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white">
                                    {selectedDate.toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                                </p>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {selectedDateTasks.length > 0 ? (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selectedDateTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => onSelectTask(task.projectId, task.id)}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(task.priority)}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                                            {task.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <Briefcase size={12} />
                                                            <span className="truncate">{task.projectName}</span>
                                                        </div>
                                                        {task.assignees.length > 0 && (
                                                            <div className="flex -space-x-1 mt-2">
                                                                {task.assignees.slice(0, 3).map(assignee => (
                                                                    <Avatar key={assignee.id} user={assignee} className="h-5 w-5 ring-2 ring-white dark:ring-gray-800" />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {task.completed && (
                                                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <CalendarIcon size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks scheduled</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Tasks */}
                    <div className="glass-panel rounded-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Clock size={18} className="text-brand-600 dark:text-brand-400" />
                                Upcoming (7 days)
                            </h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {upcomingTasks.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {upcomingTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => onSelectTask(task.projectId, task.id)}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${task.priority === 'high'
                                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                            : task.priority === 'medium'
                                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                            }`}>
                                                            {formatDueDate(task.dueDate!)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-medium text-sm text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className={`w-1.5 h-3 rounded-full ${task.teamIcon || 'bg-gray-300'}`} />
                                                        <span className="truncate">{task.projectName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-green-400 mb-3" />
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">All caught up!</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No upcoming deadlines</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
