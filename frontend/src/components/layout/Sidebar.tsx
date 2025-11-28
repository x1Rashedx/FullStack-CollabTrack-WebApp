import React, { useState, useRef, useEffect } from 'react';
import type { Project, Folder } from '@/types';
import { LayoutDashboard, Columns, Users, Settings, MessageCircle, Folder as FolderIcon, ChevronDown, Plus, MoreHorizontal, Trash2, ChevronsLeft, ChevronsRight, GripVertical } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import ConfirmationModal from '@components/modals/ConfirmationModal';


interface SidebarProps {
    projects: Project[];
    folders: Folder[];
    currentProjectId: string | null;
    onSelectProject: (projectId: string) => void;
    onNavigate: (page: 'dashboard' | 'teams' | 'settings' | 'messages') => void;
    currentPage: string;
    onCreateFolder: (name: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveProject: (projectId: string, newFolderId: string | null, oldFolderId: string | null) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    width: number;
    onResize: (width: number) => void;
}

const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

const Sidebar: React.FC<SidebarProps> = ({ projects, folders, currentProjectId, onSelectProject, onNavigate, currentPage, onCreateFolder, onDeleteFolder, onMoveProject, isCollapsed, onToggleCollapse, width, onResize }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'project') {
            setActiveId(event.active.id as string);
        }
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
    
        if (!over || active.id === over.id || active.data.current?.type !== 'project') {
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
    
    const NavItem: React.FC<{icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
         <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {icon}
            {!isCollapsed && <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
        </a>
    );

    const categorizedProjectIds = new Set(folders?.flatMap(f => f.projectIds));
    const uncategorizedProjects = projects.filter(p => !categorizedProjectIds.has(p.id));

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div 
                className={`bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0`}
                style={{ width: isCollapsed ? 80 : width }}
            >
                 <button 
                    onClick={onToggleCollapse} 
                    className={`absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 h-16 w-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md`}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                </button>
                <div className={`flex items-center h-16 border-b dark:border-gray-700 flex-shrink-0 px-4 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                        </svg>
                        {!isCollapsed && <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2">CollabTrack</h1>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                    <nav className="space-y-1">
                        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isActive={currentPage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
                        {currentProjectId && <NavItem icon={<Columns size={20} />} label="Board" isActive={currentPage === 'project'} onClick={() => onSelectProject(currentProjectId)} />}
                        <NavItem icon={<Users size={20} />} label="Teams" isActive={currentPage === 'teams'} onClick={() => onNavigate('teams')} />
                        <NavItem icon={<MessageCircle size={20} />} label="Messages" isActive={currentPage === 'messages'} onClick={() => onNavigate('messages')} />
                        <NavItem icon={<Settings size={20} />} label="Settings" isActive={currentPage === 'settings'} onClick={() => onNavigate('settings')} />
                    </nav>

                    <div className="pt-4">
                        <div className="flex justify-between items-center px-3 mb-2">
                            {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>}
                            {!isCollapsed && <AddFolderForm onCreate={onCreateFolder} />}
                        </div>
                        <div className="space-y-1">
                            {folders?.map(folder => (
                                <FolderItem 
                                    key={folder.id} 
                                    folder={folder}
                                    projects={projects.filter(p => folder.projectIds.includes(p.id))}
                                    currentProjectId={currentProjectId}
                                    currentPage={currentPage}
                                    onSelectProject={onSelectProject}
                                    onDelete={() => onDeleteFolder(folder.id)}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
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
                                                        onClick={() => onSelectProject(project.id)}
                                                        isCollapsed={isCollapsed}
                                                        folderId={null}
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
                <DragOverlay>
                    {activeProject ? <ProjectLink project={activeProject} isActive={false} onClick={() => {}} isCollapsed={isCollapsed} isOverlay /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

const DraggableProjectLink: React.FC<{project: Project; isActive: boolean; onClick: () => void; isCollapsed: boolean; folderId: string | null}> = ({ project, isActive, onClick, isCollapsed, folderId }) => {
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
            <ProjectLink project={project} isActive={isActive} onClick={onClick} isCollapsed={isCollapsed} dragHandleListeners={listeners} dragHandleAttributes={attributes} />
        </div>
    )
}

const ProjectLink: React.FC<{project: Project; isActive: boolean; onClick: () => void; isCollapsed: boolean; isOverlay?: boolean; dragHandleListeners?: any; dragHandleAttributes?: any}> = ({ project, isActive, onClick, isCollapsed, isOverlay = false, dragHandleListeners, dragHandleAttributes }) => (
    <div className={`flex items-center text-sm font-medium rounded-md group relative ${isOverlay ? 'bg-white dark:bg-gray-700 shadow-lg' : ''}`}>
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex-grow flex items-center pl-10 pr-3 py-2 rounded-md min-w-0 ${isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
            <span className={`w-2 h-2 rounded-full ${project.id === 'proj-1' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
            {!isCollapsed && <span className="truncate ml-3">{project.name}</span>}
        </a>
        <div 
             {...dragHandleListeners}
             {...dragHandleAttributes}
            className="absolute left-0 top-0 bottom-0 flex items-center px-3 text-gray-400 cursor-grab rounded-l-md"
        >
             <GripVertical size={14} />
        </div>
    </div>
);

const FolderItem: React.FC<{folder: Folder, projects: Project[], currentProjectId: string | null, currentPage: string, onSelectProject: (id: string) => void, onDelete: () => void, isCollapsed: boolean}> = ({ folder, projects, currentProjectId, currentPage, onSelectProject, onDelete, isCollapsed }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { isOver, setNodeRef } = useDroppable({ id: folder.id, data: { type: 'folder' } });
    const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
    
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
        <div ref={setNodeRef} className={`outline-2 outline-offset-[-1px] ${isOver ? 'outline-dashed outline-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'outline-transparent'} rounded-md transition-all duration-200`}>
            {!isCollapsed &&
                <div className="flex items-center justify-between group px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
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
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                    <button onClick={() => {setFolderToDelete(folder.id) ; setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
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
    );
};

const UncategorizedDropZone: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { isOver, setNodeRef } = useDroppable({ id: 'uncategorized-drop-zone', data: { type: 'folder' } });
    
    return (
        <div 
            ref={setNodeRef} 
            className={`min-h-[20px] outline-2 outline-offset-[-2px] ${isOver ? 'outline-dashed outline-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'outline-transparent'} rounded-md transition-all duration-200 p-1 -m-1`}
        >
            {children}
        </div>
    );
};

const AddFolderForm: React.FC<{onCreate: (name: string) => void}> = ({ onCreate }) => {
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
                 <div ref={containerRef} className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 p-2 space-y-2">
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
                        <button onClick={() => setIsAdding(false)} className="px-2 py-1 text-xs font-semibold rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-white ">Cancel</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs font-semibold rounded bg-brand-600 text-white hover:bg-brand-700">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;