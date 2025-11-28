
import React from 'react';
import type { Project, User, Task } from '@/types';
import Avatar from '@components/common/Avatar';
import { CheckCircle, Circle, TrendingUp, Award, PieChart, BarChart2, List, Layers } from 'lucide-react';

interface ProjectStatsProps {
    project: Project;
    members: User[];
}

// --- Reusable Chart Components ---

const DonutChart = ({ data, size = 160, strokeWidth = 20 }: { data: { label: string; value: number; color: string }[]; size?: number; strokeWidth?: number }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    let cumulativeAngle = 0;

    if (total === 0) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                         <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} className="dark:stroke-gray-700" />
                    </svg>
                     <span className="absolute text-xs font-medium">No Data</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 transform">
                {data.map((item, index) => {
                    const radius = (size - strokeWidth) / 2;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativeAngle * circumference; // Note the negative sign for clockwise
                    
                    // Calculate angle for next segment (percentage of full circle)
                    const angle = item.value / total;
                    cumulativeAngle += angle;

                    return (
                        <circle
                            key={index}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500 ease-out hover:opacity-80"
                        >
                            <title>{item.label}: {item.value}</title>
                        </circle>
                    );
                })}
            </svg>
             <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-800 dark:text-white">{total}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks</span>
            </div>
        </div>
    );
};

const SimpleBarChart = ({ data, height = 180 }: { data: { label: string; value: number; color: string }[]; height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    
    // Determine nice tick interval
    let interval = 1;
    if (maxValue > 0) {
        const targetTicks = 5;
        // Rough interval
        interval = Math.ceil(maxValue / (targetTicks - 1));
        // Round interval to nice numbers if large (1, 2, 5, 10, etc)
        if (interval > 10) {
            const magnitude = Math.pow(10, Math.floor(Math.log10(interval)));
            interval = Math.ceil(interval / magnitude) * magnitude;
        }
    }
    
    // Calculate max based on interval
    const chartMax = interval * 4 >= maxValue ? interval * 4 : Math.ceil(maxValue / interval) * interval;
    // Ensure at least some height if all 0
    const finalMax = chartMax === 0 ? 5 : chartMax;
    
    // Generate exactly 5 ticks: 0, 25%, 50%, 75%, 100%
    const computedTicks = [0, finalMax * 0.25, finalMax * 0.5, finalMax * 0.75, finalMax];

    const xAxisHeight = 24; 
    const chartHeight = height - xAxisHeight;

    return (
        <div className="w-full relative" style={{ height }}>
            {/* Y-Axis Labels Area */}
            <div className="absolute left-0 top-0 w-8 flex flex-col justify-between text-xs text-gray-400" style={{ height: chartHeight }}>
                 {computedTicks.map((tick, i) => {
                     const percentage = (tick / finalMax) * 100;
                     return (
                        <div 
                            key={i} 
                            className="absolute right-0 flex items-center justify-end w-full"
                            style={{ 
                                bottom: `${percentage}%`, 
                                transform: 'translateY(50%)', // Center vertically on the tick
                                height: '12px', // Fixed small height for centering calculation to be predictable
                                lineHeight: '12px'
                            }}
                        >
                            {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                        </div>
                     );
                 })}
            </div>

            {/* Chart Plot Area */}
            <div className="absolute left-10 right-0 top-0 border-b border-gray-200 dark:border-gray-700" style={{ height: chartHeight }}>
                 {/* Grid Lines */}
                 {computedTicks.map((tick, i) => {
                    if (tick === 0) return null; // Handled by border-b
                    const percentage = (tick / finalMax) * 100;
                    return (
                        <div 
                            key={i} 
                            className="absolute w-full border-t border-dashed border-gray-200 dark:border-gray-700" 
                            style={{ bottom: `${percentage}%` }}
                        ></div>
                    );
                 })}

                 {/* Bars */}
                 <div className="absolute inset-0 flex items-end justify-around px-2 gap-2">
                     {data.map((item, index) => {
                         const heightPercentage = (item.value / finalMax) * 100;
                         return (
                             <div key={index} className="flex-1 h-full flex items-end justify-center group relative">
                                 <div 
                                     className="w-full max-w-[32px] rounded-t-sm transition-all duration-500 ease-out hover:opacity-80 relative"
                                     style={{ 
                                         height: `${heightPercentage}%`, 
                                         backgroundColor: item.color,
                                         minHeight: item.value > 0 ? '2px' : '0'
                                     }}
                                 >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow border border-gray-100 dark:border-gray-700 whitespace-nowrap z-20 pointer-events-none">
                                        {item.value}
                                    </div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute left-10 right-0 bottom-0 flex items-center justify-around px-2 gap-2" style={{ height: xAxisHeight }}>
                 {data.map((item, index) => (
                     <div key={index} className="flex-1 text-center flex justify-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block max-w-full" title={item.label}>
                            {item.label}
                        </span>
                     </div>
                ))}
            </div>
        </div>
    );
}


const ProjectStats: React.FC<ProjectStatsProps> = ({ project, members }) => {
    const tasks = Object.values(project.tasks);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalWeight = tasks.reduce((acc, t) => acc + (t.weight || 1), 0);
    const completedWeight = tasks.filter(t => t.completed).reduce((acc, t) => acc + (t.weight || 1), 0);
    const weightCompletionRate = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    const memberStats = members.map(member => {
        const memberTasks = tasks.filter(t => t.assignees.some(a => a.id === member.id));
        const mTotalTasks = memberTasks.length;
        const mCompletedTasks = memberTasks.filter(t => t.completed).length;
        const mTotalWeight = memberTasks.reduce((acc, t) => acc + (t.weight || 1), 0);
        const mCompletedWeight = memberTasks.filter(t => t.completed).reduce((acc, t) => acc + (t.weight || 1), 0);
        
        return {
            user: member,
            totalTasks: mTotalTasks,
            completedTasks: mCompletedTasks,
            totalWeight: mTotalWeight,
            completedWeight: mCompletedWeight,
            weightCompletionRate: mTotalWeight > 0 ? Math.round((mCompletedWeight / mTotalWeight) * 100) : 0
        };
    }).sort((a, b) => b.completedWeight - a.completedWeight); // Sort by completed weight (contribution)

    const maxWeight = memberStats.length > 0 ? memberStats[0].completedWeight : 0;
    const topContributors = maxWeight > 0 
        ? memberStats.filter(stat => stat.completedWeight === maxWeight)
        : [];

    // --- Data Preparation for Charts ---

    const statusData = [
        { label: 'Completed', value: completedTasks, color: '#22c55e' }, // green-500
        { label: 'In Progress', value: totalTasks - completedTasks, color: '#e5e7eb' }, // gray-200
    ];

    const priorityData = [
        { label: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#4ade80' }, // green-400
        { label: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#facc15' }, // yellow-400
        { label: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f87171' }, // red-400
    ];

    const memberContributionData = memberStats.map(stat => ({
        label: stat.user.name?.split(' ')[0] || 'User',
        value: stat.completedWeight,
        color: '#0ea5e9' // brand-500
    })).slice(0, 8); // Limit to top 8 to fit screen

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Project Analytics</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">Last updated: Just now</span>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Overall Completion Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700">
                        <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                    </div>
                    <div className="p-3 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 mb-3">
                        <CheckCircle size={28} />
                    </div>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Task Completion</span>
                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        {completedTasks} of {totalTasks} tasks done
                    </div>
                </div>

                {/* Weighted Progress Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gray-100 dark:border-gray-700">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700">
                        <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${weightCompletionRate}%` }}></div>
                    </div>
                    <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mb-3">
                        <TrendingUp size={28} />
                    </div>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{weightCompletionRate}%</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Weighted Score</span>
                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Based on task difficulty & importance
                    </div>
                </div>
                
                 {/* MVP Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center relative border border-gray-100 dark:border-gray-700">
                     {topContributors.length > 0 ? (
                         <>
                             <div className="absolute top-3 right-3 text-yellow-500 animate-pulse">
                                 <Award size={24} />
                             </div>
                            
                             {topContributors.length === 1 ? (
                                 <>
                                     <div className="relative mb-3">
                                         <Avatar user={topContributors[0].user} className="h-14 w-14 ring-4 ring-yellow-100 dark:ring-yellow-900/30" />
                                         <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800">#1</div>
                                     </div>
                                     <span className="text-lg font-bold text-gray-900 dark:text-white truncate w-full px-4">{topContributors[0].user.name}</span>
                                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Top Contributor</span>
                                     <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                         {topContributors[0].completedWeight} points earned
                                     </div>
                                 </>
                             ) : (
                                 <>
                                    <div className="flex -space-x-3 mb-3 justify-center pl-3">
                                        {topContributors.slice(0, 3).map((stat) => (
                                            <div key={stat.user.id} className="relative ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                <Avatar user={stat.user} className="h-12 w-12" />
                                            </div>
                                        ))}
                                        {topContributors.length > 3 && (
                                            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 relative z-10">
                                                +{topContributors.length - 3}
                                            </div>
                                        )}
                                    </div>
                                     <div className="text-lg font-bold text-gray-900 dark:text-white truncate w-full px-4">
                                        {topContributors.length} Top Contributors
                                     </div>
                                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Tied for 1st Place</span>
                                     <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                        {topContributors[0].completedWeight} points earned each
                                    </div>
                                 </>
                             )}
                         </>
                     ) : (
                         <div className="text-gray-400 flex flex-col items-center justify-center h-full opacity-50">
                             <Award size={32} className="mb-2" />
                             <p className="text-sm">No data yet</p>
                         </div>
                     )}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Status Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2 w-full">
                        <PieChart size={16} /> Status Distribution
                    </h3>
                    <DonutChart data={statusData} />
                    <div className="flex justify-center gap-4 mt-6 w-full">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Completed
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></span> In Progress
                        </div>
                    </div>
                </div>

                {/* Priority Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Layers size={16} /> Tasks by Priority
                    </h3>
                    <SimpleBarChart data={priorityData} height={180} />
                </div>

                {/* Contribution Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <BarChart2 size={16} /> Top Contributors (Points)
                    </h3>
                    {memberContributionData.length > 0 && memberContributionData.some(d => d.value > 0) ? (
                         <SimpleBarChart data={memberContributionData} height={180} />
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                            No contributions yet
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <List size={20} /> Detailed Breakdown
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-center">Tasks Assigned</th>
                                <th className="px-6 py-3 font-medium text-center">Tasks Completed</th>
                                <th className="px-6 py-3 font-medium text-center">Weight Completed</th>
                                <th className="px-6 py-3 font-medium text-center">Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {memberStats.map((stat) => (
                                <tr key={stat.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={stat.user} className="h-9 w-9" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{stat.user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">{stat.totalTasks}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            {stat.completedTasks}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{stat.completedWeight}</span>
                                            <span className="text-gray-400 text-xs">/ {stat.totalWeight}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 max-w-[140px] mx-auto">
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full transition-all duration-700 ${stat.weightCompletionRate === 100 ? 'bg-green-500' : 'bg-brand-500'}`} 
                                                    style={{ width: `${stat.weightCompletionRate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{stat.weightCompletionRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectStats;
