
import type { Project, Task, Column, ChatMessage, Attachment, Comment, Team, DirectMessage, Folder, Subtask } from '../types'; // FIX: Add Subtask to import
import type { User } from '@/types';

export const USERS: { [key: string]: User } = {
    'user-1': { id: 'user-1', name: 'Alex Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=user-1', email: 'alex.j@example.com' },
    'user-2': { id: 'user-2', name: 'Maria Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=user-2', email: 'maria.g@example.com' },
    'user-3': { id: 'user-3', name: 'James Smith', avatarUrl: 'https://i.pravatar.cc/150?u=user-3', email: 'james.s@example.com' },
    'user-4': { id: 'user-4', name: 'Priya Patel', avatarUrl: 'https://i.pravatar.cc/150?u=user-4', email: 'priya.p@example.com' },
    'user-5': { id: 'user-5', name: 'Kenji Tanaka', avatarUrl: 'https://i.pravatar.cc/150?u=user-5', email: 'kenji.t@example.com' },
    'user-6': { id: 'user-6', name: '', avatarUrl: '', email: 'new.user@example.com' },
};

const attachments: { [key: string]: Attachment } = {
    'att-1': { id: 'att-1', name: 'Initial Mockup.fig', url: '#', createdAt: new Date().toISOString()},
    'att-2': { id: 'att-2', name: 'Project Brief.pdf', url: '#', createdAt: new Date().toISOString()},
    'att-3': { id: 'att-3', name: 'Meeting Notes.docx', url: '#', createdAt: new Date().toISOString()},
    'att-4': { id: 'att-4', name: 'Design Concepts.png', url: '#', createdAt: new Date().toISOString()},
};

const comments: { [key: string]: Comment } = {
    'comment-1': { id: 'comment-1', author: USERS['user-2'], content: 'Can you double-check the brand colors? Something feels off.', timestamp: '2024-08-10T14:00:00.000Z'},
    'comment-2': { id: 'comment-2', author: USERS['user-1'], content: 'Good catch. I\'ve uploaded the latest style guide as an attachment.', timestamp: '2024-08-10T14:05:00.000Z'},
};

const tasks: { [key: string]: Task } = {
    'task-1': { id: 'task-1', projectId: "proj-1", title: 'Design the new logo', description: 'Create a modern and fresh logo for the CollabTrack brand.', assignees: [USERS['user-1'], USERS['user-2']], dueDate: '2024-08-15T23:59:59.999Z', priority: 'high', tags: ['design', 'branding'], attachments: [attachments['att-1']], comments: [comments['comment-1'], comments['comment-2']], weight: 5, completed: false, subtasks: [{ id: 'st-1', title: 'Draft sketches', completed: true }, { id: 'st-2', title: 'Vectorize', completed: false }], createdAt: '2024-08-01T09:00:00.000Z', updatedAt: '2024-08-10T14:05:00.000Z' },
    'task-2': { id: 'task-2', projectId: "proj-1", title: 'Develop the landing page', description: 'Code the main landing page using React and Tailwind CSS.', assignees: [USERS['user-3']], dueDate: '2024-08-20T23:59:59.999Z', priority: 'high', tags: ['development', 'frontend'], attachments: [], comments: [], weight: 8, completed: false, subtasks: [], createdAt: '2024-08-02T10:30:00.000Z', updatedAt: '2024-08-02T10:30:00.000Z' },
    'task-3': { id: 'task-3', projectId: "proj-1", title: 'Set up the database', description: 'Initialize the PostgreSQL database and create the necessary tables.', assignees: [USERS['user-4']], dueDate: '2024-08-18T23:59:59.999Z', priority: 'medium', tags: ['backend', 'database'], attachments: [], comments: [], weight: 5, completed: false, subtasks: [], createdAt: '2024-08-03T11:15:00.000Z', updatedAt: '2024-08-03T11:15:00.000Z' },
    'task-4': { id: 'task-4', projectId: "proj-1", title: 'Write API documentation', description: 'Document all the endpoints for the project API.', assignees: [USERS['user-3'], USERS['user-4']], dueDate: '2024-08-25T23:59:59.999Z', priority: 'low', tags: ['documentation'], attachments: [], comments: [], weight: 3, completed: true, subtasks: [{ id: 'st-3', title: 'Auth endpoints', completed: true }, { id: 'st-4', title: 'User endpoints', completed: true }], createdAt: '2024-08-04T14:00:00.000Z', updatedAt: '2024-08-24T16:00:00.000Z' },
    'task-5': { id: 'task-5', projectId: "proj-1", title: 'User authentication flow', description: 'Implement login, logout, and registration.', assignees: [USERS['user-3']], dueDate: null, priority: 'high', tags: ['development', 'auth'], attachments: [], comments: [], weight: 5, completed: false, subtasks: [], createdAt: '2024-08-05T09:45:00.000Z', updatedAt: '2024-08-05T09:45:00.000Z' },
    'task-6': { id: 'task-6', projectId: "proj-1", title: 'Create marketing materials', description: 'Design brochures and social media posts.', assignees: [USERS['user-2']], dueDate: '2024-08-30T23:59:59.999Z', priority: 'medium', tags: ['marketing'], attachments: [], comments: [], weight: 2, completed: false, subtasks: [], createdAt: '2024-08-06T13:20:00.000Z', updatedAt: '2024-08-06T13:20:00.000Z' },
};

const columns: { [key: string]: Column } = {
    'col-1': { id: 'col-1', title: 'To Do', taskIds: ['task-1', 'task-5', 'task-6'] },
    'col-2': { id: 'col-2', title: 'In Progress', taskIds: ['task-2', 'task-3'] },
    'col-3': { id: 'col-3', title: 'Done', taskIds: ['task-4'] },
};

const columnOrder: string[] = ['col-1', 'col-2', 'col-3'];

const chatMessages: ChatMessage[] = [
    { id: 'msg-1', projectId: "proj-1", author: USERS['user-2'], content: "Hey team, how's the progress on the landing page?", timestamp: '2024-08-15T10:30:00.000Z' },
    { id: 'msg-2', projectId: "proj-1", author: USERS['user-3'], content: "Going well! Should have a draft ready by EOD tomorrow.", timestamp: '2024-08-15T10:32:00.000Z' },
    { id: 'msg-3', projectId: "proj-1", author: USERS['user-1'], content: "Great! I've finished the initial logo concepts. I'll share them in the design channel.", timestamp: '2024-08-15T11:15:00.000Z', attachments: [attachments['att-1']] },
    { id: 'msg-4', projectId: "proj-1", author: USERS['user-3'], content: "Sounds good Alex! I'm struggling a bit with the new auth module, any chance you can take a look?", timestamp: '2024-08-15T11:20:00.000Z', parentId: 'msg-2' }, // Reply
    { id: 'msg-5', projectId: "proj-1", author: USERS['user-1'], content: "Sure James, I can take a look after lunch. Send me the branch name.", timestamp: '2024-08-15T11:25:00.000Z', parentId: 'msg-4' }, // Reply
    { id: 'msg-6', projectId: "proj-1", author: USERS['user-2'], content: "I've uploaded the new design concepts for review.", timestamp: '2024-08-16T09:00:00.000Z', attachments: [attachments['att-4']] },
    { id: 'msg-7', projectId: "proj-1", author: USERS['user-1'], content: "Looks good Maria, I'll provide feedback this afternoon.", timestamp: '2024-08-16T09:10:00.000Z', parentId: 'msg-6' },
];

const teams: { [key: string]: Team } = {
    'team-1': {
        id: 'team-1',
        name: 'General Workspace',
        description: 'The default team for all initial projects and members.',
        icon: 'bg-gradient-to-tr from-cyan-400 to-blue-600',
        members: [
            { user: USERS['user-1'], role: 'admin' },
            { user: USERS['user-2'], role: 'member' },
            { user: USERS['user-3'], role: 'member' },
            { user: USERS['user-4'], role: 'member' },
        ],
        projectIds: ['proj-1', 'proj-2'],
        joinRequests: ['user-5'],
    },
    'team-2': {
        id: 'team-2',
        name: 'Design Guild',
        description: 'A place for all designers to collaborate on new ideas.',
        icon: 'bg-gradient-to-tr from-purple-400 to-pink-600',
        members: [
            { user: USERS['user-2'], role: 'admin' },
            { user: USERS['user-4'], role: 'member' },
        ],
        projectIds: [],
        joinRequests: [],
    }
};

const directMessages: { [key: string]: DirectMessage } = {
    'dm-1': { id: 'dm-1', senderId: 'user-2', receiverId: 'user-1', content: 'Hey, I had a question about the logo design.', timestamp: '2024-08-11T10:00:00.000Z' },
    'dm-2': { id: 'dm-2', senderId: 'user-1', receiverId: 'user-2', content: 'Sure, what\'s up?', timestamp: '2024-08-11T10:01:00.000Z' },
    'dm-3': { id: 'dm-3', senderId: 'user-1', receiverId: 'user-2', content: 'Can you review my PR for the landing page?', timestamp: '2024-08-12T15:30:00.000Z', attachments: [attachments['att-2']] },
    'dm-4': { id: 'dm-4', senderId: 'user-2', receiverId: 'user-1', content: 'I need your input on the Q4 marketing budget. Can you prepare the numbers?', timestamp: '2024-08-12T15:35:00.000Z' },
    'dm-5': { id: 'dm-5', senderId: 'user-1', receiverId: 'user-2', content: 'Got it. I\'ll have those to you by end of day.', timestamp: '2024-08-12T15:36:00.000Z', parentId: 'dm-4' }, // Reply
    'dm-6': { id: 'dm-6', senderId: 'user-3', receiverId: 'user-1', content: 'Did you get a chance to look at the auth module?', timestamp: '2024-08-16T10:00:00.000Z', },
    'dm-7': { id: 'dm-7', senderId: 'user-1', receiverId: 'user-3', content: 'Not yet, super swamped. Will get to it this afternoon.', timestamp: '2024-08-16T10:05:00.000Z', parentId: 'dm-6' },
};

const folders: { [key: string]: Folder } = {
    'folder-1': { id: 'folder-1', name: 'In Progress', projectIds: ['proj-1'] },
    'folder-2': { id: 'folder-2', name: 'Upcoming', projectIds: ['proj-2'] },
    'folder-3': { id: 'folder-3', name: 'Finished', projectIds: [] },
};


export const initialData: { 
    projects: { [key: string]: Project },
    teams: { [key: string]: Team },
    directMessages: { [key: string]: DirectMessage },
    folders: { [key: string]: Folder }
} = {
    projects: {
        'proj-1': {
            id: 'proj-1',
            name: 'Website Redesign',
            description: 'A complete overhaul of the company website to improve user experience and modernize the design.',
            teamId: 'team-1',
            tasks: tasks,
            columns: columns,
            columnOrder: columnOrder,
            chatMessages: chatMessages,
        },
        'proj-2': {
            id: 'proj-2',
            name: 'Q3 Marketing Campaign',
            description: 'Launch a new marketing campaign for the upcoming product release.',
            teamId: 'team-1',
            tasks: {
                'task-7': { projectId: 'proj-2', id: 'task-7', title: 'Plan social media strategy', description: '', assignees: [USERS['user-2']], dueDate: null, priority: 'high', tags: [], attachments: [], comments: [], weight: 3, completed: false, subtasks: [], createdAt: '2024-08-07T09:00:00.000Z', updatedAt: '2024-08-07T09:00:00.000Z' },
                'task-8': { projectId: 'proj-2', id: 'task-8', title: 'Write blog post announcement', description: '', assignees: [USERS['user-1']], dueDate: null, priority: 'medium', tags: [], attachments: [], comments: [], weight: 2, completed: false, subtasks: [], createdAt: '2024-08-08T10:00:00.000Z', updatedAt: '2024-08-08T10:00:00.000Z' },
            },
            columns: {
                'col-1': { id: 'col-1', title: 'To Do', taskIds: ['task-7', 'task-8'] },
                'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
                'col-3': { id: 'col-3', title: 'Done', taskIds: [] },
            },
            columnOrder: ['col-1', 'col-2', 'col-3'],
            chatMessages: [],
        }
    },
    teams: teams,
    directMessages: directMessages,
    folders: folders,
};