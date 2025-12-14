import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Columns, Calendar as CalendarIcon, PieChart, List, Info, Filter, ChevronDown, LayoutGrid, Plus } from 'lucide-react';

import type { Project, User, Task, Team, Attachment, Comment, Subtask } from '@/types';
import { KanbanBoard, KanbanColumn, KanbanTask, TaskModal, TasksListView } from '@/components/features/tasks';
import { ConfirmationModal, CreateTaskModal } from '@components/modals';
import { ProjectStats, ProjectInfo, ProjectFilters } from '@/components/features/projects';
import { TaskWithStatus } from '@/components/features/tasks/TasksListView';

import CalendarView from '@/components/features/calendar/CalendarView';
import Chat from '@/components/features/chat/Chat';
import { Avatar } from '@/components/common';

interface ProjectPageProps {
    project: Project;
    team: Team;
    currentUser: User;
    taskToOpen: string | null;
    onUpdateProject: (updatedProject: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onClearTaskToOpen: () => void;

    onCreateColumn: (projectId: string, title: string) => void;
    onUpdateColumn: (projectId: string, columnId: string, newTitle: string) => void;
    onMoveColumn: (projectId: string, newOrder: string[]) => void;
    onDeleteColumn: (columnId: string) => void;

    onSendMessage: (projectId: string, content: string) => void;

    onCreateTask: (projectId: string, newTaskData: Omit<Task, 'id' | 'projectId'>, columnId: string) => Promise<Task>;
    onUpdateTask: (projectId: string, taskId: string, updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onMoveTask: (projectId: string, taskId: string, toColumnId: string, position?: number) => void;
    onCreateComment: (projectId: string, taskId: string, content: string) => void;
    onUploadTaskAttachment: (projectId: string, taskId: string, file: File) => Promise<Attachment>;
    onDeleteTaskAttachment: (projectId: string, taskId: string, attachmentId: string) => Promise<void>;
    onCreateSubtask: (projectId: string, taskId: string, title: string) => Promise<void>;
    onUpdateSubtask: (projectId: string, taskId: string, subtaskId: string, data: Partial<Subtask>) => Promise<void>;
    onDeleteSubtask: (projectId: string, taskId: string, subtaskId: string) => Promise<void>;

    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ProjectPage: React.FC<ProjectPageProps> = ({ project, team, currentUser, onUpdateProject, onDeleteProject, onCreateColumn, taskToOpen, onClearTaskToOpen, onUpdateColumn, onMoveColumn, onDeleteColumn, onSendMessage, onCreateTask, onUpdateTask, onDeleteTask, onMoveTask, onCreateComment, onUploadTaskAttachment, onDeleteTaskAttachment, onCreateSubtask, onUpdateSubtask, onDeleteSubtask, addToast }) => {
    const [tasks, setTasks] = useState(project.tasks);
    const [columns, setColumns] = useState(project.columns);
    const [columnOrder, setColumnOrder] = useState(project.columnOrder);
    const [view, setView] = useState<'board' | 'stats' | 'list' | 'calendar' | 'info'>('board');
    const [isChatCollapsed, setChatCollapsed] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [columnForNewTask, setColumnForNewTask] = useState<string | null>(null);

    const [chatWidth, setChatWidth] = useState(() => {
        const saved = localStorage.getItem("chatSidebarWidth");
        return saved ? parseInt(saved, 10) : 320;
    });

    useEffect(() => {
        localStorage.setItem("chatSidebarWidth", chatWidth.toString());
    }, [chatWidth]);

    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

    // --- Computed Stats ---
    const projectStats = useMemo(() => {
        const allTasks = Object.values(tasks) as Task[];
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.completed).length;
        const overdue = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, overdue, progress };
    }, [tasks]);

    // Filter & Sort States
    const [filters, setFilters] = useState({
        assignee: 'all',
        priority: 'all',
        search: '',
        showCompleted: true,
    });
    const [sortBy, setSortBy] = useState<string>('manual');

    useEffect(() => {
        setTasks(project.tasks);
        setColumns(project.columns);
        setColumnOrder(project.columnOrder);
    }, [project]);

    useEffect(() => {
        if (taskToOpen && tasks[taskToOpen]) {
            setSelectedTask(tasks[taskToOpen]);
            onClearTaskToOpen();
        }
    }, [taskToOpen, onClearTaskToOpen]);

    useEffect(() => {
        if (selectedTask && !tasks[selectedTask.id]) {
            setSelectedTask(null);
        }
        if (selectedTask && tasks[selectedTask.id]) {
            setSelectedTask(tasks[selectedTask.id]);
        }
    }, [tasks]);

    const [activeDragItem, setActiveDragItem] = useState<{ type: 'task' | 'column', id: string } | null>(null);
    const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);
    const activeTask = activeDragItem && activeDragItem.type === 'task' ? tasks[activeDragItem.id] : null;
    const activeColumn = activeDragItem && activeDragItem.type === 'column' ? columns[activeDragItem.id] : null;
    const activeDragType = activeDragItem ? (activeDragItem.type === 'task' ? 'task' : 'column') : null;

    const [overColumnId, setOverColumnId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
        })
    );

    // --- Filter and Sort Logic ---
    const processedTasksMap = useMemo(() => {
        const map: { [key: string]: Task[] } = {};
        
        columnOrder.forEach(colId => {
            const col = columns[colId];
            if (!col) return;

        let colTasks = col.taskIds.map(id => tasks[id]).filter(Boolean);
            // 1. Filter
            colTasks = colTasks.filter(task => {
                // Search
                if (filters.search) {
                    const q = filters.search.toLowerCase();
                    if (!task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) return false;
                }
                // Assignee
                if (filters.assignee !== 'all') {
                    if (filters.assignee === 'unassigned') {
                        if (task.assignees.length > 0) return false;
                    } else {
                        if (!task.assignees.some(u => u.id === filters.assignee)) return false;
                    }
                }
                // Priority
                if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
                // Completed
                if (!filters.showCompleted && task.completed) return false;
                return true;
            });
            // 2. Sort
            if (sortBy !== 'manual') {
                colTasks.sort((a, b) => {
                    switch (sortBy) {
                        case 'priority':
                            const pMap = { high: 3, medium: 2, low: 1 };
                            return pMap[b.priority] - pMap[a.priority];
                        case 'weight':
                            return (b.weight || 0) - (a.weight || 0);
                        case 'dueDate':
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        case 'newest':
                            // Assuming ID has timestamp or using creation date if available, here using ID as proxy for newest
                            return b.id.localeCompare(a.id);
                        default:
                            return 0;
                    }
                });
            }
            
            map[colId] = colTasks;
        });
        
        return map;
    }, [tasks, columns, columnOrder, filters, sortBy]);

    const allFilteredTasks = useMemo(() => {
        return Object.values(processedTasksMap).flat();
    }, [processedTasksMap]);

    // Prepare flat list with status for the List View
    const tasksWithStatus: TaskWithStatus[] = useMemo(() => {
        const result: TaskWithStatus[] = [];
        columnOrder.forEach(colId => {
            const col = columns[colId];
            if (processedTasksMap[colId]) {
                processedTasksMap[colId].forEach(task => {
                    result.push({ task, status: col.title });
                });
            }
        });
        return result;
    }, [processedTasksMap, columns, columnOrder]);

    const statusOrder = useMemo(() => {
        return columnOrder.map(id => columns[id]?.title).filter(Boolean);
    }, [columnOrder, columns]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ assignee: 'all', priority: 'all', search: '', showCompleted: true });
        setSortBy('manual');
    };

    const hasActiveFilters = filters.assignee !== 'all' || filters.priority !== 'all' || filters.search !== '' || !filters.showCompleted || sortBy !== 'manual';

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        const type = event.active.data.current?.type;
        if (!type) return;

        setActiveDragItem({ id, type });
        if (event.active.data.current?.type === 'task') {
            // FIX: Replaced deprecated `event.active.node` with `event.active.rect` to get element width.
            setActiveTaskWidth(event.active.rect.current.initial?.width ?? null);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (activeDragType === 'task' && over) {
        const overId = over.id as string;
        const overIsColumn = over.data.current?.type === 'column';
        const overColumn = overIsColumn ? overId : Object.values(columns).find(col => col.taskIds.includes(overId))?.id;
        
        if (overColumn) {
            setOverColumnId(overColumn);
        } else {
            setOverColumnId(null);
        }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        setOverColumnId(null);
        setActiveTaskWidth(null);

        // Disable drag and drop reordering if sorting is active or filters hide items (to prevent confusion)
        // We still allow moving BETWEEN columns, just not reordering within if sorted
        const isSorted = sortBy !== 'manual';

        const { active, over } = event;

        if (!active || !over) return;

        const activeId = String(active.id);
        const overId = String(over.id);


        // Handle Column Dragging
        if (active.data.current?.type === 'column' && over.data.current?.type === 'column' && activeId !== overId) {
            const oldIndex = columnOrder.indexOf(activeId);
            const newIndex = columnOrder.indexOf(overId);
            const newOrder = arrayMove(columnOrder, oldIndex, newIndex);

            // Side effect outside of state update
            onMoveColumn(project.id, newOrder);

            setColumnOrder(newOrder);  // Pure state update
        }

        // Handle Task Dragging
        if (active.data.current?.type === 'task') {
        const startColumnId = Object.keys(columns).find(id => columns[id].taskIds.includes(activeId));
                
        let endColumnId = over.data.current?.type === 'column' ? overId : null;
        if (!endColumnId) {
            endColumnId = Object.keys(columns).find(id => columns[id].taskIds.includes(overId));
        }

        if (!startColumnId || !endColumnId) {
            return; // Abort if columns aren't found
        }

        // Create new state immutably
        const newColumns = JSON.parse(JSON.stringify(columns));
        const startCol = newColumns[startColumnId];
        const endCol = newColumns[endColumnId];

        const oldIndex = startCol.taskIds.indexOf(activeId);
        const newIndex = endCol.taskIds.indexOf(overId);

        if (startColumnId === endColumnId) {
            // Reordering within the same column

            if (isSorted) return; // Prevent reordering when sorted
            
            // Only move if dropping on a different task
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                startCol.taskIds = arrayMove(startCol.taskIds, oldIndex, newIndex);
            } else {
                return; // No change needed
            }
        } else {
                // Moving to a different column
                // Remove from start column
                const taskIndex = startCol.taskIds.indexOf(activeId);
                startCol.taskIds.splice(taskIndex, 1);

            // If sorted, just append to end (or beginning), visually it will sort itself
                if (isSorted) {
                        endCol.taskIds.push(activeId);
                } else {
                    // Add to end column
                    const newIndex = over.data.current?.type === 'task' 
                        ? endCol.taskIds.indexOf(overId) 
                        : endCol.taskIds.length; // Drop at the end if dropping on column
                    endCol.taskIds.splice(newIndex, 0, activeId);
                }
        }


        onMoveTask(project.id, activeId, endColumnId, newIndex)
        setColumns(newColumns)
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };
    
    const handleCloseTaskModal = () => {
        setSelectedTask(null);
    };

    const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'projectId'>, columnId: string) => {
        const p = onCreateTask(project.id, newTaskData, columnId);
        setCreateTaskModalOpen(false)
        return p;
    };
    
    const handleUpdateTask = (updatedTask: Task) => {
        setTasks(prev => ({ ...prev, [updatedTask.id]: updatedTask }));
        onUpdateTask(project.id, updatedTask.id, updatedTask)
    };
    
    const handleDeleteTask = (taskId: string) => {
        const newTasks = { ...tasks };
        delete newTasks[taskId];

        const newColumns = JSON.parse(JSON.stringify(columns));
        Object.keys(newColumns).forEach(colId => {
            newColumns[colId].taskIds = newColumns[colId].taskIds.filter((id: string) => id !== taskId);
        });

        setTasks(newTasks);
        setColumns(newColumns);
        onDeleteTask(taskId)
        setSelectedTask(null);
    };

    const handleCreateComment = (taskId: string, content: string) => {
        onCreateComment(project.id, taskId, content);
    };

    const handleUploadAttachment = (taskId: string, file: File) => {
        return onUploadTaskAttachment(project.id, taskId, file);
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        return onDeleteTaskAttachment(project.id, selectedTask.id, attachmentId);
    };

    const handleCreateSubtask = (taskId: string, title: string) => {
        return onCreateSubtask(project.id, taskId, title);
    };

    const handleUpdateSubtask = (taskId: string, subtaskId: string, data: Partial<Subtask>) => {
        return onUpdateSubtask(project.id, taskId, subtaskId, data);
    };

    const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
        return onDeleteSubtask(project.id, taskId, subtaskId);
    };

    const handleAddTask = (columnId: string) => {
        setColumnForNewTask(columnId);
        setCreateTaskModalOpen(true);
    };
    
    const handleSendMessage = (content: string) => {
        onSendMessage(project.id, content);
    };
    
    const handleCreateColumn = (title: string) => {
        onCreateColumn(project.id, title);
    }

    const handleUpdateColumn = (columnId: string, newTitle: string) => {
            const newColumns = {
                ...columns,
                [columnId]: { ...columns[columnId], title: newTitle },
            };
            setColumns(newColumns);
            onUpdateColumn(project.id, columnId, newTitle);
        };

    const requestDeleteColumn = (columnId: string) => {
        if (columnOrder.length <= 1) {
            addToast("Cannot delete the last column.", "error");
            return;
        }
        setColumnToDelete(columnId);
    };

    const confirmDeleteColumn = () => {
        if (!columnToDelete) return;
        const newColumns = { ...columns };
        const tasksToMove = newColumns[columnToDelete].taskIds;
        delete newColumns[columnToDelete];
        const newColumnOrder = columnOrder.filter(id => id !== columnToDelete);
        
        const targetColumnId = newColumnOrder[0];
        newColumns[targetColumnId].taskIds = [...newColumns[targetColumnId].taskIds, ...tasksToMove];
        
        setColumns(newColumns);
        setColumnOrder(newColumnOrder);
        onDeleteColumn(columnToDelete);
        setColumnToDelete(null);
    };

    const projectMembers = team.members.map(m => m.user);
    const isTeamAdmin = team.members.find(m => m.user.id === currentUser.id)?.role === 'admin';

    const showFilterBar = showFilters && (view === 'board' || view === 'calendar' || view === 'list');

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-brand-100/25 dark:bg-gray-900"> {/* Added background & blur here */}

            {/* --- 1. Project Hero Header --- */}
            <div className="glass bg-white dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 z-20 shadow-sm relative overflow-hidden">

                <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${team.icon} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                            {project.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{project.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-md">{project.description || 'No description provided.'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="hidden lg:flex items-center gap-4 border-r border-gray-200 dark:border-gray-700 pr-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{projectStats.progress}%</p>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Progress</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{projectStats.total}</p>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tasks</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${projectStats.overdue > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{projectStats.overdue}</p>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overdue</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex -space-x-2">
                            {projectMembers.slice(0, 5).map(m => (
                                <div key={m.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full cursor-pointer hover:scale-110 transition-transform relative group">
                                    <Avatar user={m} className="h-8 w-8" />
                                    <div className="absolute mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs mt-1 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {m.name}
                                    </div>
                                </div>
                            ))}
                            {projectMembers.length > 5 && (
                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                    +{projectMembers.length - 5}
                                </div>
                            )}
                        </div>
                        {isTeamAdmin && (
                            <button className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium hover:underline">
                                Manage Members
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. Unified Control Bar --- */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 z-10 sticky top-0">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    {[
                        { id: 'board', icon: Columns, label: 'Board' },
                        { id: 'list', icon: List, label: 'List' },
                        { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
                        { id: 'stats', icon: PieChart, label: 'Stats' },
                        { id: 'info', icon: Info, label: 'Info' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id as any)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                view === tab.id
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            <tab.icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {(view === 'board' || view === 'calendar' || view === 'list') && (
                        <>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                                    hasActiveFilters 
                                        ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-200' 
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="relative">
                                    <Filter size={16} />
                                    {hasActiveFilters && !showFilters && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                                    )}
                                </div>
                                <span className="hidden sm:inline">Filter & Sort</span>
                                <ChevronDown size={14} className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                        </>
                    )}
                    
                    <button 
                        onClick={() => {setColumnForNewTask(columnOrder[0]); setCreateTaskModalOpen(true)} }
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Task</span>
                    </button>
                </div>
            </div>
            
            {/* Filter Drawer */}
            <div 
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 z-10 backdrop-blur-sm ${
                    showFilters ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] border-none'
                }`}
            >
                <div className="overflow-hidden">
                    <ProjectFilters 
                        members={projectMembers}
                        filters={filters}
                        sortBy={sortBy}
                        onFilterChange={handleFilterChange}
                        onSortChange={setSortBy}
                        onClearFilters={handleClearFilters}
                        hideSort={view === 'list'}
                    />
                </div>
            </div>

            {/* --- 3. Main Content Area --- */}
            <div className="flex-1 flex min-h-0 relative z-0"> {/* Adjusted z-index */}
                {view === 'board' ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={rectIntersection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                <KanbanBoard
                                    columns={columns}
                                    columnOrder={columnOrder}
                                    tasks={tasks}
                                    processedTasksMap={processedTasksMap}
                                    onTaskClick={handleTaskClick}
                                    onAddTask={handleAddTask}
                                    onCreateColumn={handleCreateColumn}
                                    activeDragType={activeDragType}
                                    overColumnId={overColumnId}
                                    onUpdateColumn={handleUpdateColumn}
                                    onDeleteColumn={requestDeleteColumn}
                                />
                            </SortableContext>
                            <DragOverlay>
                                {activeDragType === 'task' && activeTask && (
                                    <div style={{
                                        transform: 'rotate(4deg) scale(1.05)',
                                        width: activeTaskWidth ? `${activeTaskWidth}px` : 'auto',
                                    }}>
                                    <KanbanTask task={activeTask} onClick={() => {}} />
                                    </div>
                                )}
                                {activeDragType === 'column' && activeColumn && (
                                    <div style={{
                                        transform: 'rotate(3deg)',
                                        height: '100%',
                                    }}>
                                        <KanbanColumn
                                            column={activeColumn}
                                            tasks={processedTasksMap[activeColumn.id]}
                                            onTaskClick={() => {}}
                                            onAddTask={() => {}}
                                            activeDragType={null}
                                            overColumnId={null}
                                            onUpdateTitle={() => {}}
                                            onDelete={() => {}}
                                        />
                                    </div>
                                )}
                            </DragOverlay>
                    </DndContext>
                ) : view === 'list' ? (
                    <TasksListView 
                        tasks={tasksWithStatus} 
                        onTaskClick={handleTaskClick}
                        onToggleComplete={(task) => handleUpdateTask({ ...task, completed: !task.completed })}
                        statusOrder={statusOrder}
                    />
                ) : view === 'calendar' ? (
                    <CalendarView 
                        tasks={allFilteredTasks} 
                        onTaskClick={handleTaskClick} 
                    />
                ) : view === 'stats' ? (
                    <ProjectStats project={project} members={projectMembers} />
                ) : (
                    <ProjectInfo 
                        project={project} 
                        team={team} 
                        isTeamAdmin={isTeamAdmin}
                        onUpdateProject={onUpdateProject}
                        onDeleteProject={() => onDeleteProject(project.id)}
                    />
                )}
                
                <Chat 
                    messages={project.chatMessages} 
                    currentUser={currentUser} 
                    onSendMessage={handleSendMessage}
                    isCollapsed={isChatCollapsed}
                    onToggleCollapse={() => setChatCollapsed(p => !p)}
                    width={chatWidth}
                    onResize={setChatWidth}
                />
            </div>
            
            {/* Modals */}
            {selectedTask && (
                <TaskModal 
                    task={selectedTask} 
                    onClose={handleCloseTaskModal}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    projectMembers={projectMembers}
                    currentUser={currentUser}
                    isTeamAdmin={isTeamAdmin}
                    onCreateComment={handleCreateComment}
                    onUploadAttachment={handleUploadAttachment}
                    onDeleteAttachment={handleDeleteAttachment}
                    onCreateSubtask={handleCreateSubtask}
                    onUpdateSubtask={handleUpdateSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                />
            )}
            
            {isCreateTaskModalOpen && columnForNewTask && (
                <CreateTaskModal
                    onClose={() => setCreateTaskModalOpen(false)}
                    onCreateTask={handleCreateTask}
                    columnId={columnForNewTask}
                    projectMembers={projectMembers}
                    onUploadAttachment={handleUploadAttachment}
                    allTags={Array.from(new Set(Object.values(tasks).flatMap((task: Task) => task.tags)))}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!columnToDelete}
                onClose={() => setColumnToDelete(null)}
                onConfirm={confirmDeleteColumn}
                title="Delete Column"
                message="Are you sure? All tasks within this column will be moved to the first column."
                confirmText="Delete"
            />
        </div>
    );
};

export default ProjectPage;
