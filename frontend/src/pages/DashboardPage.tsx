
import React, { useState, useMemo } from 'react';
import type { Project, Team, User, Task } from '@/types';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { Plus, Users, CheckSquare, Briefcase, ListTodo, PlayCircle, CheckCircle, AlertCircle, Clock, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import Avatar from '@/components/common/Avatar';

interface DashboardPageProps {
    projects: Project[];
    teams: Team[];
    currentUser: User;
    onSelectProject: (projectId: string) => void;
    onCreateProject: (name: string, description: string, teamId: string) => void;
    onNavigateToTeam: (teamId: string) => void;
    onSelectTask: (projectId: string, taskId: string) => void;
}

const StatCard = ({ icon, label, value, colorClass, trend }: { icon: React.ReactNode, label: string, value: number, colorClass: string, trend?: string }) => (
    <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-white/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 group">
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
            {trend && <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={10}/> {trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20 dark:bg-opacity-20 shadow-sm group-hover:rotate-6 transition-transform`}>
            {icon}
        </div>
    </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ projects, teams, currentUser, onSelectProject, onCreateProject, onNavigateToTeam, onSelectTask }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const getTeamForProject = (project: Project): Team | undefined => {
        return teams.find(team => team.id === project.teamId);
    };

    // Calculate Stats
    const stats = useMemo(() => {
        const allTasks = projects.flatMap(p => 
            Object.values(p.tasks).map((t: Task) => ({ ...t, projectId: p.id, projectName: p.name }))
        );
        
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.completed).length;
        const overdueTasks = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        const inProgressTasks = allTasks.filter(t => !t.completed).length; // Active tasks
        const projectCount = projects.length;

        // Upcoming deadlines: Not completed, has due date, sorted by date (nearest first)
        const upcomingDeadlines = allTasks
            .filter(t => !t.completed && t.dueDate)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 5);

        return {
            totalTasks,
            completedTasks,
            overdueTasks,
            inProgressTasks,
            projectCount,
            upcomingDeadlines
        };
    }, [projects]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 opacity-0 animate-fade-in pb-24 overflow-y-auto h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Overview of your workspace.</p>
                </div>
                 <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-900 w-full sm:w-auto justify-center transition-transform transform hover:-translate-y-0.5">
                    <Plus size={20} className="mr-2" />
                    New Project
                </button>
            </div>

            {/* Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard 
                    icon={<ListTodo className="text-blue-600 dark:text-blue-400" size={24} />} 
                    label="Total Tasks" 
                    value={stats.totalTasks} 
                    colorClass="bg-blue-100 dark:bg-blue-900" 
                />
                <StatCard 
                    icon={<PlayCircle className="text-amber-600 dark:text-amber-400" size={24} />} 
                    label="In Progress" 
                    value={stats.inProgressTasks} 
                    colorClass="bg-amber-100 dark:bg-amber-900" 
                />
                <StatCard 
                    icon={<CheckCircle className="text-green-600 dark:text-green-400" size={24} />} 
                    label="Completed" 
                    value={stats.completedTasks} 
                    colorClass="bg-green-100 dark:bg-green-900" 
                />
                <StatCard 
                    icon={<AlertCircle className="text-red-600 dark:text-red-400" size={24} />} 
                    label="Overdue" 
                    value={stats.overdueTasks} 
                    colorClass="bg-red-100 dark:bg-red-900" 
                />
                <StatCard 
                    icon={<Briefcase className="text-purple-600 dark:text-purple-400" size={24} />} 
                    label="Projects" 
                    value={stats.projectCount} 
                    colorClass="bg-purple-100 dark:bg-purple-900" 
                />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Projects Section */}
                    <section className="opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-brand-600 dark:text-brand-400" /> Your Projects
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((project, index) => {
                                const team = getTeamForProject(project);
                                const taskCount = Object.keys(project.tasks).length;
                                const doneCount = Object.values(project.tasks).filter((t: Task) => t.completed).length;
                                const progress = taskCount > 0 ? (doneCount / taskCount) * 100 : 0;

                                return (
                                    <div 
                                        key={project.id} 
                                        onClick={() => onSelectProject(project.id)}
                                        className="glass-panel rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col border border-white/50 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transform hover:-translate-y-1 group"
                                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                {team && (
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className={`w-1.5 h-4 rounded-full ${team.icon}`}></div>
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{team.name}</p>
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{project.name}</h3>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors">
                                                <ArrowRight size={18} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 flex-grow line-clamp-2 leading-relaxed">
                                            {project.description || "No description provided."}
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                                <span>Progress</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`} 
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                                                        <CheckSquare size={12} />
                                                        <span>{taskCount} Tasks</span>
                                                    </div>
                                                </div>
                                                {team && (
                                                    <div className="flex -space-x-2">
                                                        {team.members.slice(0, 3).map(member => (
                                                            <div key={member.user.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                                <Avatar user={member.user} className="h-6 w-6" />
                                                            </div>
                                                        ))}
                                                        {team.members.length > 3 && (
                                                            <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                +{team.members.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div onClick={() => setIsCreateModalOpen(true)} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors min-h-[220px] group">
                                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-500 transition-colors">
                                    <Plus size={28} />
                                </div>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">Create New Project</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start tracking your work</p>
                            </div>
                        </div>
                    </section>

                    {/* Teams Section */}
                    <section className="opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-brand-600 dark:text-brand-400" /> Your Teams
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.length > 0 ? teams.map((team) => (
                                <div 
                                    key={team.id}
                                    onClick={() => onNavigateToTeam(team.id)}
                                    className="glass-panel rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    <div className={`w-12 h-12 rounded-lg ${team.icon} flex-shrink-0 shadow-sm flex items-center justify-center text-white font-bold text-lg`}>
                                        {team.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{team.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{team.members.length} members • {team.projectIds.length} projects</p>
                                    </div>
                                </div>
                            )) : (
                                 <div className="col-span-full text-center py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                    <Users size={24} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">You haven't joined any teams yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Sidebar: Deadlines */}
                <div className="xl:col-span-1 space-y-8">
                    <section className="opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-brand-600 dark:text-brand-400" /> Upcoming Deadlines
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {stats.upcomingDeadlines.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {stats.upcomingDeadlines.map((task) => {
                                        const dueDate = new Date(task.dueDate!);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isOverdue = dueDate < today;
                                        const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                        
                                        let dueLabel = '';
                                        let dueColor = '';
                                        
                                        if (isOverdue) {
                                            dueLabel = 'Overdue';
                                            dueColor = 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
                                        } else if (daysLeft === 0) {
                                            dueLabel = 'Today';
                                            dueColor = 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
                                        } else if (daysLeft === 1) {
                                            dueLabel = 'Tomorrow';
                                            dueColor = 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400';
                                        } else {
                                            dueLabel = `In ${daysLeft} days`;
                                            dueColor = 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
                                        }

                                        return (
                                            <div 
                                                key={task.id} 
                                                onClick={() => onSelectTask(task.projectId, task.id)}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group block"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${dueColor}`}>
                                                        {dueLabel}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">{task.title}</h4>
                                                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Briefcase size={10} />
                                                    <span className="truncate max-w-[150px]">{task.projectName}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">All caught up!</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No upcoming deadlines.</p>
                                </div>
                            )}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 text-center">
                                <button className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">View Calendar</button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateProjectModal 
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={onCreateProject}
                    teams={teams}
                />
            )}
        </div>
    );
};

export default DashboardPage;