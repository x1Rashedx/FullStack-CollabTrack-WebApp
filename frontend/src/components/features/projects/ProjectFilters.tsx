
import React from 'react';
import { Filter, ArrowUpDown, Search, X, User as UserIcon, CheckCircle } from 'lucide-react';
import type { User } from '@/types';

interface ProjectFiltersProps {
    members: User[];
    filters: {
        assignee: string;
        priority: string;
        search: string;
        showCompleted: boolean;
    };
    sortBy: string;
    onFilterChange: (key: string, value: any) => void;
    onSortChange: (value: string) => void;
    onClearFilters: () => void;
    hideSort?: boolean;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
    members,
    filters,
    sortBy,
    onFilterChange,
    onSortChange,
    onClearFilters,
    hideSort = false,
}) => {
    const hasActiveFilters = filters.assignee !== 'all' || filters.priority !== 'all' || filters.search !== '' || !filters.showCompleted;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {/* Search */}
            <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filter tasks..."
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Assignee Filter */}
                <div className="relative">
                    <select
                        value={filters.assignee}
                        onChange={(e) => onFilterChange('assignee', e.target.value)}
                        className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                    >
                        <option value="all">All Members</option>
                        <option value="unassigned">Unassigned</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <UserIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Priority Filter */}
                <div className="relative">
                    <select
                        value={filters.priority}
                        onChange={(e) => onFilterChange('priority', e.target.value)}
                        className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                    >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                    <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                
                 {/* Sort By - Conditionally Rendered */}
                 {!hideSort && (
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                        >
                            <option value="manual">Manual Order</option>
                            <option value="dueDate">Due Date</option>
                            <option value="priority">Priority</option>
                            <option value="weight">Weight</option>
                            <option value="newest">Newest</option>
                        </select>
                        <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                 )}

                {/* Show Completed Toggle */}
                 <button
                    onClick={() => onFilterChange('showCompleted', !filters.showCompleted)}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md border transition-colors ${filters.showCompleted ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}
                >
                    <CheckCircle size={14} className={`mr-2 ${filters.showCompleted ? 'text-gray-400' : 'fill-current'}`} />
                    Completed
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                    >
                        <X size={14} className="mr-1" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProjectFilters;
