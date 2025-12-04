// This file contains the API service layer.
// These functions simulate a backend API for demonstration purposes,
// allowing the frontend to run standalone.

import { initialData, USERS } from './db';
import type { Project, Team, User, Column, DirectMessage, Folder, ChatMessage, Attachment } from '@/types';

// Create a mutable copy of the initial data to simulate a database
// FIX: Use structuredClone for deep copying for better performance and robustness
let db: {
    projects: { [key: string]: Project };
    teams: { [key: string]: Team };
    directMessages: { [key: string]: DirectMessage };
    folders: { [key: string]: Folder };
} = structuredClone(initialData);

let allUsers = structuredClone(USERS); // FIX: Use structuredClone


const FAKE_LATENCY = 300;

// --- Auth Simulation ---

export const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('authToken');
    } catch (e) {
        return null;
    }
};

export const setAuthToken = (token: string): void => {
    try {
        localStorage.setItem('authToken', token);
    } catch (e) {
        // ignore errors for environments where localStorage is unavailable
    }
};

export const clearAuthToken = (): void => {
    try {
        localStorage.removeItem('authToken');
    } catch (e) {
        // ignore
    }
};

export const login = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = Object.values(allUsers).find((u: User) => u.email === email);
            // In this simulation, any password is fine if the user exists.
            if (user) {
                setAuthToken((user as User).id);
                resolve();
            } else {
                reject(new Error('Invalid email or password.'));
            }
        }, FAKE_LATENCY);
    });
};

export const loginDemo = (): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // User-1 (Alex Johnson) is the default demo user
            const demoUserId = 'user-1';
            setAuthToken(demoUserId);
            resolve();
        }, FAKE_LATENCY);
    });
};

export const logout = () => {
    clearAuthToken();
};

export const fetchCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const userId = getAuthToken();
            if (userId && allUsers[userId]) {
                resolve(allUsers[userId]);
            } else {
                // If token is invalid/not found, clear it to be safe
                clearAuthToken();
                resolve(null);
            }
        }, FAKE_LATENCY / 2);
    });
};


// --- Data Fetching & Mutations ---

export const fetchAllData = (): Promise<{
    projects: { [key: string]: Project };
    teams: { [key: string]: Team };
    directMessages: { [key: string]: DirectMessage };
    folders: { [key: string]: Folder };
    users: { [key: string]: User };
}> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Ensure we return the current state of db and allUsers
            resolve({
                projects: structuredClone(db.projects),
                teams: structuredClone(db.teams),
                directMessages: structuredClone(db.directMessages),
                folders: structuredClone(db.folders),
                users: structuredClone(allUsers),
            });
        }, FAKE_LATENCY);
    });
};

export const updateProject = (updatedProject: Project): Promise<Project> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // FIX: Use structuredClone for deep copying to prevent direct mutation issues
            const clonedProject = structuredClone(updatedProject);
            db.projects[clonedProject.id] = clonedProject;
            resolve(structuredClone(clonedProject));
        }, FAKE_LATENCY);
    });
};

export const deleteProject = (projectId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            delete db.projects[projectId];
            // Also remove project from any folders and teams
            Object.values(db.folders).forEach(folder => {
                folder.projectIds = folder.projectIds.filter(id => id !== projectId);
            });
            Object.values(db.teams).forEach(team => {
                team.projectIds = team.projectIds.filter(id => id !== projectId);
            });
            resolve();
        }, FAKE_LATENCY);
    });
};

export const createProject = (name: string, description: string, teamId: string): Promise<{ newProject: Project; updatedTeam: Team }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const newProjectId = `proj-${Date.now()}`;
            const newProject: Project = {
                id: newProjectId,
                name,
                description,
                teamId,
                tasks: {},
                columns: {
                    'col-todo': { id: 'col-todo', title: 'To Do', taskIds: [] },
                    'col-in-progress': { id: 'col-in-progress', title: 'In Progress', taskIds: [] },
                    'col-done': { id: 'col-done', title: 'Done', taskIds: [] },
                },
                columnOrder: ['col-todo', 'col-in-progress', 'col-done'],
                chatMessages: [],
            };
            db.projects[newProjectId] = newProject;

            const team = db.teams[teamId];
            if (team) {
                team.projectIds.push(newProjectId);
                resolve({ newProject: structuredClone(newProject), updatedTeam: structuredClone(team) });
            } else {
                reject(new Error('Team not found'));
            }
        }, FAKE_LATENCY);
    });
};

export const createColumn = (projectId: string, title: string): Promise<Project> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const project = db.projects[projectId];
            if (project) {
                const newColumnId = `col-${Date.now()}`;
                const newColumn: Column = { id: newColumnId, title, taskIds: [] };
                project.columns[newColumnId] = newColumn;
                project.columnOrder.push(newColumnId);
                resolve(structuredClone(project));
            } else {
                reject(new Error('Project not found'));
            }
        }, FAKE_LATENCY);
    });
};


export const updateUser = (updatedUser: User): Promise<{ updatedUser: User, updatedProjects: { [key: string]: Project }, updatedTeams: { [key: string]: Team } }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            allUsers[updatedUser.id] = structuredClone(updatedUser);

            // Reflect user changes in projects (assignees)
            Object.values(db.projects).forEach(project => {
                Object.values(project.tasks).forEach(task => {
                    const assigneeIndex = task.assignees.findIndex(a => a.id === updatedUser.id);
                    if (assigneeIndex !== -1) {
                        task.assignees[assigneeIndex] = structuredClone(updatedUser);
                    }
                });
                project.chatMessages.forEach(msg => {
                    if (msg.author.id === updatedUser.id) {
                        msg.author = structuredClone(updatedUser);
                    }
                });
            });

            // Reflect user changes in teams (members)
            Object.values(db.teams).forEach(team => {
                const memberIndex = team.members.findIndex(m => m.user.id === updatedUser.id);
                if (memberIndex !== -1) {
                    team.members[memberIndex].user = structuredClone(updatedUser);
                }
            });

            // Reflect user changes in direct messages (sender/receiver display)
            Object.values(db.directMessages).forEach(dm => {
                // This doesn't actually update sender/receiver objects in DMs,
                // but the FE usually resolves these from the `allUsers` map.
                // Keeping this for consistency if DM objects were to embed full user objects.
            });


            resolve({
                updatedUser: structuredClone(updatedUser),
                updatedProjects: structuredClone(db.projects),
                updatedTeams: structuredClone(db.teams)
            });
        }, FAKE_LATENCY);
    });
};

// --- Teams ---

export const createTeam = (name: string, description: string): Promise<Team> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newTeamId = `team-${Date.now()}`;
            const currentUser = allUsers[getAuthToken()!]; // Assume authenticated
            const newTeam: Team = {
                id: newTeamId,
                name,
                description,
                icon: `bg-gradient-to-tr from-${Math.random() > 0.5 ? 'blue' : 'purple'}-400 to-${Math.random() > 0.5 ? 'teal' : 'pink'}-600`, // Random icon
                members: [{ user: structuredClone(currentUser), role: 'admin' }],
                projectIds: [],
                joinRequests: [],
            };
            db.teams[newTeamId] = newTeam;
            resolve(structuredClone(newTeam));
        }, FAKE_LATENCY);
    });
};

export const updateTeam = (updatedTeam: Team): Promise<Team> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            db.teams[updatedTeam.id] = structuredClone(updatedTeam);
            resolve(structuredClone(updatedTeam));
        }, FAKE_LATENCY);
    });
};

export const deleteTeam = (teamId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const teamProjects = db.teams[teamId]?.projectIds || [];
            delete db.teams[teamId];
            // Delete associated projects
            teamProjects.forEach(projectId => delete db.projects[projectId]);
            resolve();
        }, FAKE_LATENCY);
    });
};

export const inviteMember = (teamId: string, email: string): Promise<Team> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const team = db.teams[teamId];
            if (!team) {
                return reject(new Error('Team not found.'));
            }
            const userToInvite = Object.values(allUsers).find(u => u.email === email);
            if (!userToInvite) {
                // Create a mock user if not found
                const newUserId = `user-${Date.now()}`;
                const newUser: User = {
                    id: newUserId,
                    name: email.split('@')[0], // Basic name from email
                    email: email,
                    avatarUrl: `https://i.pravatar.cc/150?u=${newUserId}`
                };
                allUsers[newUserId] = newUser;
                team.members.push({ user: structuredClone(newUser), role: 'member' });
                return resolve(structuredClone(team));
            }

            if (team.members.some(m => m.user.id === userToInvite.id)) {
                return reject(new Error(`${userToInvite.name || userToInvite.email} is already a member.`));
            }
            // Remove from join requests if they had one
            team.joinRequests = team.joinRequests?.filter(id => id !== userToInvite.id);
            team.members.push({ user: structuredClone(userToInvite), role: 'member' });
            resolve(structuredClone(team));
        }, FAKE_LATENCY);
    });
};

export const requestToJoinTeam = (teamId: string): Promise<Team> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const team = db.teams[teamId];
            if (!team) {
                return reject(new Error('Team not found.'));
            }
            const currentUser = allUsers[getAuthToken()!];
            if (team.members.some(m => m.user.id === currentUser.id)) {
                return reject(new Error('You are already a member of this team.'));
            }
            if (team.joinRequests?.includes(currentUser.id)) {
                return reject(new Error('You have already sent a request to join this team.'));
            }

            team.joinRequests = [...(team.joinRequests || []), currentUser.id];
            resolve(structuredClone(team));
        }, FAKE_LATENCY);
    });
};

export const manageJoinRequest = (teamId: string, userId: string, action: 'approve' | 'deny'): Promise<{ updatedTeam: Team, message: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const team = db.teams[teamId];
            if (!team) {
                return reject(new Error('Team not found.'));
            }
            team.joinRequests = team.joinRequests?.filter(id => id !== userId);
            const user = allUsers[userId];
            if (action === 'approve') {
                if (!team.members.some(m => m.user.id === userId)) {
                    team.members.push({ user: structuredClone(user), role: 'member' });
                }
                resolve({ updatedTeam: structuredClone(team), message: `${user.name || user.email} approved to join ${team.name}.` });
            } else {
                resolve({ updatedTeam: structuredClone(team), message: `${user.name || user.email}'s request to join ${team.name} denied.` });
            }
        }, FAKE_LATENCY);
    });
};


// --- Messages ---

// New: Added attachments and parentId for message threading
export const sendProjectChatMessage = (projectId: string, content: string, attachments: Attachment[] = [], parentId?: string): Promise<ChatMessage> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const project = db.projects[projectId];
            if (!project) {
                return reject(new Error('Project not found.'));
            }

            const currentUser = allUsers[getAuthToken()!];
            const newMsgId = `msg-${Date.now()}`;
            const newMessage: ChatMessage = {
                id: newMsgId,
                projectId,
                author: structuredClone(currentUser),
                content,
                timestamp: new Date().toISOString(),
                attachments: structuredClone(attachments),
                parentId,
            };
        }, FAKE_LATENCY);
    });
};

// Modified: Added attachments and parentId for message threading
export const sendDirectMessage = (receiverId: string, content: string, attachments: Attachment[] = [], parentId?: string): Promise<DirectMessage> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const currentUser = allUsers[getAuthToken()!];
            const newDmId = `dm-${Date.now()}`;
            const newDirectMessage: DirectMessage = {
                id: newDmId,
                senderId: currentUser.id,
                receiverId,
                content,
                timestamp: new Date().toISOString(),
                attachments: structuredClone(attachments),
                parentId,
            };
        }, FAKE_LATENCY);
    });
};

// --- Folders ---

export const createFolder = (name: string): Promise<Folder> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newFolderId = `folder-${Date.now()}`;
            const newFolder: Folder = { id: newFolderId, name, projectIds: [] };
            db.folders[newFolderId] = newFolder;
            resolve(structuredClone(newFolder));
        }, FAKE_LATENCY);
    });
};

export const deleteFolder = (folderId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const folder = db.folders[folderId];
            if (!folder) {
                return reject(new Error('Folder not found.'));
            }
            if (folder.projectIds.length > 0) {
                // If there are projects, move them to uncategorized (null folder)
                folder.projectIds.forEach(projectId => {
                    const project = db.projects[projectId];
                    if (project) {
                        // Project itself doesn't have a folderId property in this mock,
                        // so removing from the folder is enough.
                    }
                });
            }
            delete db.folders[folderId];
            resolve();
        }, FAKE_LATENCY);
    });
};

export const updateFolders = (folders: Folder[]): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Update only the folders that are passed
            folders.forEach(updatedFolder => {
                db.folders[updatedFolder.id] = structuredClone(updatedFolder);
            });
            resolve();
        }, FAKE_LATENCY);
    });
};
