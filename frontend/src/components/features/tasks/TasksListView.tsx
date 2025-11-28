
import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle, Circle, BarChart2, AlignLeft, ArrowUp, ArrowDown, ArrowUpDown, Layers, Users, Layout } from 'lucide-react';
import type { Task } from '@/types';
import Avatar from '@/components/common/Avatar';

export interface TaskWithStatus {
    task: Task;
    status: string;
}

interface TasksListViewProps {
    tasks: TaskWithStatus[];
    onTaskClick: (task: Task) => void;
    onToggleComplete?: (task: Task) => void;
    statusOrder?: string[];
}

const priorityConfig: Record<string, { color: string; label: string; value: number }> = {
    low: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Low', value: 1 },
    medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Medium', value: 2 },
    high: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'High', value: 3 },
};

type SortKey = 'title' | 'status' | 'priority' | 'dueDate' | 'weight' | 'assignee';
type GroupByKey = 'none' | 'status' | 'priority' | 'assignee';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

const TasksListView: React.FC<TasksListViewProps> = ({ tasks, onTaskClick, onToggleComplete, statusOrder }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [groupBy, setGroupBy] = useState<GroupByKey>('none');

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTasks = useMemo(() => {
        if (!tasks) return [];
        const sorted = [...tasks];
        
        if (!sortConfig) return sorted;

        sorted.sort((a, b) => {
            const { key, direction } = sortConfig;
            let comparison = 0;

            switch (key) {
                case 'title':
                    comparison = (a.task.title || '').localeCompare(b.task.title || '');
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                case 'priority':
                    const valA = priorityConfig[a.task.priority]?.value ?? 2;
                    const valB = priorityConfig[b.task.priority]?.value ?? 2;
                    comparison = valA - valB;
                    break;
                case 'weight':
                    comparison = (a.task.weight || 0) - (b.task.weight || 0);
                    break;
                case 'dueDate':
                    const dateA = a.task.dueDate ? new Date(a.task.dueDate).getTime() : 0;
                    const dateB = b.task.dueDate ? new Date(b.task.dueDate).getTime() : 0;
                    if (!a.task.dueDate && !b.task.dueDate) comparison = 0;
                    else if (!a.task.dueDate) comparison = direction === 'asc' ? 1 : -1;
                    else if (!b.task.dueDate) comparison = direction === 'asc' ? -1 : 1;
                    else comparison = dateA - dateB;
                    break;
                case 'assignee':
                     const nameA = a.task.assignees?.[0]?.name || 'zzz';
                     const nameB = b.task.assignees?.[0]?.name || 'zzz';
                     comparison = nameA.localeCompare(nameB);
                     break;
                default:
                    comparison = 0;
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }, [tasks, sortConfig]);

    const groupedTasks = useMemo(() => {
        if (groupBy === 'none') {
            return [{ id: 'all', title: 'All Tasks', tasks: sortedTasks }];
        }

        const groups: Record<string, TaskWithStatus[]> = {};
        
        sortedTasks.forEach(item => {
            if (groupBy === 'assignee') {
                 const assignees = item.task.assignees;
                 if (assignees && assignees.length > 0) {
                     assignees.forEach(assignee => {
                         const key = assignee.name || 'Unknown';
                         if (!groups[key]) groups[key] = [];
                         groups[key].push(item);
                     });
                 } else {
                     const key = 'Unassigned';
                     if (!groups[key]) groups[key] = [];
                     groups[key].push(item);
                 }
                 return;
            }

            let key = 'Uncategorized';
            
            if (groupBy === 'status') {
                key = item.status || 'Unknown';
            } else if (groupBy === 'priority') {
                key = item.task.priority || 'medium'; // Default to medium if missing
            }
            
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        let groupArray = Object.entries(groups).map(([title, groupTasks]) => ({
            id: title,
            title: groupBy === 'priority' ? title.charAt(0).toUpperCase() + title.slice(1) : title,
            tasks: groupTasks
        }));

        if (groupBy === 'priority') {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            groupArray.sort((a, b) => {
                const keyA = a.id.toLowerCase();
                const keyB = b.id.toLowerCase();
                return (order[keyA] ?? 3) - (order[keyB] ?? 3);
            });
        } else if (groupBy === 'status' && statusOrder) {
            groupArray.sort((a, b) => {
                const indexA = statusOrder.indexOf(a.id);
                const indexB = statusOrder.indexOf(b.id);
                // Put unknown statuses at the end
                const safeIndexA = indexA === -1 ? 999 : indexA;
                const safeIndexB = indexB === -1 ? 999 : indexB;
                return safeIndexA - safeIndexB;
            });
        } else {
            groupArray.sort((a, b) => a.title.localeCompare(b.title));
        }

        return groupArray;
    }, [sortedTasks, groupBy, statusOrder]);

    const handleCompleteClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        if (onToggleComplete) onToggleComplete(task);
    };
    
    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={14} className="ml-1 text-brand-600 dark:text-brand-400" /> 
            : <ArrowDown size={14} className="ml-1 text-brand-600 dark:text-brand-400" />;
    };

    // Helper to safely get priority config
    const getPriorityStyles = (priority: string) => {
        return priorityConfig[priority] || priorityConfig.medium;
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Group By Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-4 flex-shrink-0">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Layers size={16} /> Group by:
                </span>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {(['none', 'status', 'priority', 'assignee'] as GroupByKey[]).map((option) => (
                        <button
                            key={option}
                            onClick={() => setGroupBy(option)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                                groupBy === option
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center">Task <SortIcon columnKey="title" /></div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('assignee')}
                                >
                                    <div className="flex items-center">Assignees <SortIcon columnKey="assignee" /></div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('priority')}
                                >
                                    <div className="flex items-center">Priority <SortIcon columnKey="priority" /></div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('dueDate')}
                                >
                                    <div className="flex items-center">Due Date <SortIcon columnKey="dueDate" /></div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                    onClick={() => handleSort('weight')}
                                >
                                    <div className="flex items-center">Weight <SortIcon columnKey="weight" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                            {groupedTasks.length > 0 ? groupedTasks.map((group) => (
                                <React.Fragment key={group.id}>
                                    {groupBy !== 'none' && (
                                        <tr className="bg-gray-100 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700 sticky top-2 z-0">
                                            <td colSpan={7} className="px-6 py-2 bg-gray-100 dark:bg-gray-700/50">
                                                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                                    {groupBy === 'status' && <Layout size={14} />}
                                                    {groupBy === 'priority' && <AlignLeft size={14} />}
                                                    {groupBy === 'assignee' && <Users size={14} />}
                                                    {group.title} <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-[10px]">{group.tasks.length}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {group.tasks.map(({ task, status }) => {
                                        const pStyle = getPriorityStyles(task.priority);
                                        return (
                                        <tr 
                                            key={`${task.id}-${group.id}`} 
                                            onClick={() => onTaskClick(task)}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap w-10" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={(e) => handleCompleteClick(e, task)}
                                                    className={`text-gray-400 hover:text-green-500 transition-colors ${task.completed ? 'text-green-500' : ''}`}
                                                >
                                                    {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.description && (
                                                        <span className="text-xs text-gray-500 truncate max-w-xs">{task.description}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {task.assignees && task.assignees.length > 0 ? (
                                                        task.assignees.map(u => (
                                                            <div key={u.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800">
                                                                <Avatar user={u} className="h-full w-full" />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${pStyle.color}`}>
                                                    {pStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {task.dueDate ? (
                                                    <div className={`flex items-center gap-1.5 ${!task.completed && new Date(task.dueDate) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                                                        <Calendar size={14} />
                                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <BarChart2 size={14} className="text-gray-400" />
                                                    {task.weight || 1}
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                                        No tasks found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TasksListView;
