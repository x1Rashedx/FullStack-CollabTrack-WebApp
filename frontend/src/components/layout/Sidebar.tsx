
import React, { useState, useRef, useEffect } from 'react';
import type { Project, Folder, Team } from '@/types';
import { LayoutDashboard, Columns, Users, Settings, MessageCircle, Folder as FolderIcon, ChevronDown, Plus, MoreHorizontal, Trash2, ChevronsLeft, ChevronsRight, GripVertical, Sparkles, Calendar } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent, DragEndEvent, useDndMonitor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import ConfirmationModal from '@/components/modals/ConfirmationModal';


interface SidebarProps {
    projects: Project[];
    teams: { [key: string]: Team };
    folders: Folder[];
    currentProjectId: string | null;
    onSelectProject: (projectId: string) => void;
    onNavigate: (page: 'dashboard' | 'teams' | 'settings' | 'messages' | 'calendar') => void;
    currentPage: string;
    onCreateFolder: (name: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveProject: (projectId: string, newFolderId: string | null, oldFolderId: string | null) => void;
    onReorderFolders: (folderIds: string[]) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    width: number;
    onResize: (width: number) => void;
}

const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

const Sidebar: React.FC<SidebarProps> = ({ projects, teams, folders, currentProjectId, onSelectProject, onNavigate, currentPage, onCreateFolder, onDeleteFolder, onMoveProject, onReorderFolders, isCollapsed, onToggleCollapse, width, onResize }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Custom collision detection for folder dragging
    const customCollisionDetection = (args: any) => {
        try {
            const { active, droppableContainers } = args;

            // Use default collision detection
            const collisions = closestCenter(args);

            if (!collisions || !Array.isArray(collisions)) {
                return [];
            }

            // If dragging a folder and colliding with a project, remap to the project's parent folder
            if (active?.data?.current?.type === 'folder' && collisions.length > 0) {
                const remappedCollisions = collisions.map((collision: any) => {
                    if (!collision || !collision.id) return collision;

                    // Find the container - droppableContainers is an array
                    let container = null;
                    for (const cont of droppableContainers) {
                        if (cont.id === collision.id) {
                            container = cont;
                            break;
                        }
                    }

                    if (container?.data?.current?.type === 'project') {
                        const projectFolderId = container.data.current?.folderId;
                        if (projectFolderId) {
                            // Return collision with parent folder ID
                            return { ...collision, id: projectFolderId };
                        }
                    }
                    return collision;
                }).filter(Boolean);

                // Remove duplicates (multiple projects in same folder)
                const seen = new Set();
                return remappedCollisions.filter((collision: any) => {
                    if (!collision || !collision.id) return false;
                    if (seen.has(collision.id)) return false;
                    seen.add(collision.id);
                    return true;
                });
            }

            return collisions;
        } catch (error) {
            console.error('Error in customCollisionDetection:', error);
            return [];
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const type = event.active.data.current?.type;
        if (type === 'project' || type === 'folder') {
            setActiveId(event.active.id as string);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Handle folder reordering
        if (active.data.current?.type === 'folder') {
            let targetFolderId = over.id as string;

            // If hovering over a project, get its parent folder for folder reordering
            if (over.data.current?.type === 'project') {
                const projectFolderId = over.data.current?.folderId;
                if (projectFolderId) {
                    targetFolderId = projectFolderId;
                } else {
                    // Project is uncategorized, don't reorder folders
                    return;
                }
            }

            // Only proceed if hovering over another folder
            if (over.data.current?.type === 'folder' || over.data.current?.folderId) {
                const oldIndex = folders.findIndex(f => f.id === active.id);
                const newIndex = folders.findIndex(f => f.id === targetFolderId);
                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const newOrder = [...folders];
                    const [moved] = newOrder.splice(oldIndex, 1);
                    newOrder.splice(newIndex, 0, moved);
                    onReorderFolders(newOrder.map(f => f.id));
                }
            }
            return;
        }

        // Handle project moving
        if (active.data.current?.type !== 'project') {
            return;
        }

        const projectId = active.id as string;
        const oldFolderId = active.data.current?.folderId || null;
        let newFolderId: string | null = null;

        if (over.data.current?.type === 'folder') {
            // Dropped on a folder or the uncategorized zone
            newFolderId = over.id === 'uncategorized-drop-zone' ? null : (over.id as string);
        } else if (over.data.current?.type === 'project') {
            // Dropped on another project, inherit its folder
            newFolderId = over.data.current?.folderId || null;
        } else {
            return; // Not a valid drop target for a project.
        }

        if (oldFolderId !== newFolderId) {
            onMoveProject(projectId, newFolderId, oldFolderId);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                onResize(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

    const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
        <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-brand-100/50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}>
            {icon}
            {!isCollapsed && <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
        </a>
    );

    const categorizedProjectIds = new Set(folders.flatMap(f => f.projectIds));
    const uncategorizedProjects = projects.filter(p => !categorizedProjectIds.has(p.id));

    return (
        <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
                className={`h-full flex flex-col bg-white dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0 z-40`}
                style={{ width: isCollapsed ? 80 : width }}
            >
                <button
                    onClick={onToggleCollapse}
                    className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 h-16 w-5 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                </button>
                <div className={`flex items-center h-16 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 px-4 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-brand-500 animate-float" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                        </svg>
                        {!isCollapsed && <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400">CollabTrack</h1>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col">
                    <nav className="space-y-1 mb-4">
                        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isActive={currentPage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
                        {currentProjectId && <NavItem icon={<Columns size={20} />} label="Board" isActive={currentPage === 'project'} onClick={() => onSelectProject(currentProjectId)} />}
                        <NavItem icon={<Users size={20} />} label="Teams" isActive={currentPage === 'teams'} onClick={() => onNavigate('teams')} />
                        <NavItem icon={<MessageCircle size={20} />} label="Messages" isActive={currentPage === 'messages'} onClick={() => onNavigate('messages')} />
                        <NavItem icon={<Calendar size={20} />} label="Calendar" isActive={currentPage === 'calendar'} onClick={() => onNavigate('calendar')} />
                        <NavItem icon={<Settings size={20} />} label="Settings" isActive={currentPage === 'settings'} onClick={() => onNavigate('settings')} />
                    </nav>

                    <div className="pt-4 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center px-3 mb-2">
                            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>}
                            {!isCollapsed && <AddFolderForm onCreate={onCreateFolder} />}
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                {folders.map(folder => (
                                    <FolderItem
                                        key={folder.id}
                                        folder={folder}
                                        projects={projects.filter(p => folder.projectIds.includes(p.id))}
                                        teams={teams}
                                        currentProjectId={currentProjectId}
                                        currentPage={currentPage}
                                        onSelectProject={onSelectProject}
                                        onDelete={() => onDeleteFolder(folder.id)}
                                        isCollapsed={isCollapsed}
                                    />
                                ))}
                            </SortableContext>
                            {!isCollapsed && (
                                <UncategorizedDropZone>
                                    {uncategorizedProjects.length > 0 && (
                                        <div className="pt-2 mt-2">
                                            <p className="px-3 mb-1 text-xs text-gray-400">Uncategorized</p>
                                            <SortableContext items={uncategorizedProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                                {uncategorizedProjects.map(project => (
                                                    <DraggableProjectLink
                                                        key={project.id}
                                                        project={project}
                                                        isActive={project.id === currentProjectId && currentPage === 'project'}
                                                        onClick={() => { onSelectProject(project.id) }}
                                                        isCollapsed={isCollapsed}
                                                        folderId={null}
                                                        teamIcon={teams[project.teamId]?.icon}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </div>
                                    )}
                                </UncategorizedDropZone>
                            )}
                        </div>
                    </div>
                </div>
                {!isCollapsed && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-20"
                    >
                        <div className="w-full h-full bg-transparent group-hover:bg-brand-500/50 transition-colors duration-200"></div>
                    </div>
                )}
                <DragOverlay dropAnimation={null}>
                    {activeProject ? <ProjectLink project={activeProject} isActive={false} onClick={() => { }} isCollapsed={isCollapsed} isOverlay teamIcon={teams[activeProject.teamId]?.icon} /> : null}
                </DragOverlay>
            </div>
        </DndContext >
    );
};

const DraggableProjectLink: React.FC<{ project: Project; isActive: boolean; onClick: () => void; isCollapsed: boolean; folderId: string | null; teamIcon?: string }> = ({ project, isActive, onClick, isCollapsed, folderId, teamIcon }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: project.id,
        data: { type: 'project', folderId: folderId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <ProjectLink project={project} isActive={isActive} onClick={onClick} isCollapsed={isCollapsed} dragHandleListeners={listeners} dragHandleAttributes={attributes} teamIcon={teamIcon} />
        </div>
    )
}

const ProjectLink: React.FC<{ project: Project; isActive: boolean; onClick: () => void; isCollapsed: boolean; isOverlay?: boolean; dragHandleListeners?: any; dragHandleAttributes?: any; teamIcon?: string }> = ({ project, isActive, onClick, isCollapsed, isOverlay = false, dragHandleListeners, dragHandleAttributes, teamIcon }) => (
    <div
        className={`flex items-center text-sm font-medium rounded-md group relative ${isOverlay ? 'bg-white dark:bg-gray-700 shadow-lg' : ''}`}
        {...dragHandleListeners}
        {...dragHandleAttributes}
    >
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex-grow flex items-center px-3 py-2 rounded-md min-w-0 transition-colors ${isActive ? 'bg-gray-200/60 dark:bg-gray-700/60 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
        >
            <span className={`w-2 h-3 rounded-full flex-shrink-0 ${teamIcon || 'bg-gray-300'}`}></span>
            {!isCollapsed && <span className="truncate ml-3">{project.name}</span>}
        </a>
    </div>
);

const FolderItem: React.FC<{ folder: Folder, projects: Project[], teams: { [key: string]: Team }, currentProjectId: string | null, currentPage: string, onSelectProject: (id: string) => void, onDelete: () => void, isCollapsed: boolean }> = ({ folder, projects, teams, currentProjectId, currentPage, onSelectProject, onDelete, isCollapsed }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: folder.id,
        data: { type: 'folder' },
    });

    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id: folder.id,
        data: { type: 'folder' },
    });

    const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
    const [isOverChild, setIsOverChild] = useState(false);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [activeDragType, setActiveDragType] = useState<string | null>(null);

    // Track when dragging over any project that belongs to this folder
    useDndMonitor({
        onDragStart: (event) => {
            setActiveDragType(event.active.data.current?.type || null);
        },
        onDragOver: (event) => {
            const overId = event.over?.id;
            const overFolderId = event.over?.data.current?.folderId;
            // Check if over a project that belongs to this folder
            if (overId && overFolderId === folder.id) {
                setIsOverChild(true);
            } else {
                setIsOverChild(false);
            }
        },
        onDragEnd: () => {
            setIsOverChild(false);
            setActiveDragType(null);
        },
        onDragCancel: () => {
            setIsOverChild(false);
            setActiveDragType(null);
        },
    });

    // Only highlight when dragging a project, not a folder
    const isHighlighted = activeDragType === 'project' && (isOver || isOverChild);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={setSortableRef}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
                opacity: isDragging ? 0.6 : undefined,
            }}
            className="mb-1 rounded-md transition-colors duration-100"
        >
            <div
                ref={setDroppableRef}
                className={`outline-2 outline-offset-[-1px] ${isHighlighted ? 'outline-dashed outline-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'outline-transparent'} rounded-md`}
            >
                {!isCollapsed &&
                    <div
                        className="flex items-center justify-between group px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                    >
                        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center flex-grow text-left min-w-0">
                            <ChevronDown size={16} className={`mr-2 transform transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            <FolderIcon size={16} className="mr-2" />
                            <span className="truncate">{folder.name}</span>
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen(p => !p)} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                <MoreHorizontal size={16} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 glass-panel">
                                    <div className="py-1">
                                        <button onClick={() => { setFolderToDelete(folder.id); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                }
                {(!isCollapsed && isOpen) && (
                    <div className="pl-4 space-y-1 py-1">
                        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {projects.map(project => (
                                <DraggableProjectLink
                                    key={project.id}
                                    project={project}
                                    isActive={project.id === currentProjectId && currentPage === 'project'}
                                    onClick={() => onSelectProject(project.id)}
                                    isCollapsed={isCollapsed}
                                    folderId={folder.id}
                                    teamIcon={teams[project.teamId]?.icon}
                                />
                            ))}
                        </SortableContext>
                        {projects.length === 0 && <p className="px-3 py-1 text-xs text-gray-400">Drop projects here</p>}
                    </div>
                )}

                <ConfirmationModal
                    isOpen={!!folderToDelete}
                    onClose={() => setFolderToDelete(null)}
                    onConfirm={onDelete}
                    title="Delete Folder"
                    message="Are you sure? Projects in this folder will not be deleted."
                    confirmText="Delete"
                />
            </div>
        </div>
    );
};

const UncategorizedDropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isOver, setNodeRef } = useDroppable({ id: 'uncategorized-drop-zone', data: { type: 'folder' } });
    const [isOverChild, setIsOverChild] = useState(false);
    const [activeDragType, setActiveDragType] = useState<string | null>(null);

    // Track when dragging over any uncategorized project (folderId === null)
    useDndMonitor({
        onDragStart: (event) => {
            setActiveDragType(event.active.data.current?.type || null);
        },
        onDragOver: (event) => {
            const overType = event.over?.data.current?.type;
            const overFolderId = event.over?.data.current?.folderId;
            // Check if over a project that has no folder (uncategorized)
            if (overType === 'project' && overFolderId === null) {
                setIsOverChild(true);
            } else {
                setIsOverChild(false);
            }
        },
        onDragEnd: () => {
            setIsOverChild(false);
            setActiveDragType(null);
        },
        onDragCancel: () => {
            setIsOverChild(false);
            setActiveDragType(null);
        },
    });

    // Only highlight when dragging a project, not a folder
    const isHighlighted = activeDragType === 'project' && (isOver || isOverChild);

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-h-[100px] outline-2 outline-offset-[-2px] ${isHighlighted ? 'outline-dashed outline-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'outline-transparent'} rounded-md transition-all duration-100 p-1 -m-1`}
        >
            {children}
        </div>
    );
};

const AddFolderForm: React.FC<{ onCreate: (name: string) => void }> = ({ onCreate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isAdding) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsAdding(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAdding]);

    const handleSubmit = () => {
        if (name.trim()) {
            onCreate(name.trim());
            setName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="relative">
            <button ref={buttonRef} onClick={() => setIsAdding(true)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400">
                <Plus size={16} />
            </button>
            {isAdding && (
                <div ref={containerRef} className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 p-2 space-y-2 glass-panel">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="New folder name..."
                        autoFocus
                        className="w-full text-sm px-2 py-1.5 rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 border focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-2 py-1 text-xs font-semibold rounded hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs font-semibold rounded bg-brand-600 text-white hover:bg-brand-700">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;