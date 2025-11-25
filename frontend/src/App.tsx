import React, { useState, useEffect } from 'react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import TeamsPage from './pages/TeamsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingModal from './components/OnboardingModal';
import MessagesPage from './pages/MessagesPage';
import SearchPage from './pages/SearchPage';
import Toast from './components/Toast';
import UserProfileModal from './components/UserProfileModal';
import Spinner from './components/Spinner';
import * as api from './api';
import type { Project, Task, User, Team, DirectMessage, Folder } from './types';
import strict from 'assert/strict';


function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    const [projects, setProjects] = useState<{ [key: string]: Project }>({});
    const [teams, setTeams] = useState<{ [key: string]: Team }>({});
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [folders, setFolders] = useState<{ [key: string]: Folder }>({});
    const [directMessages, setDirectMessages] = useState<{ [key: string]: DirectMessage }>({});
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<'dashboard' | 'project' | 'teams' | 'settings' | 'messages' | 'search'>('dashboard');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [taskToOpen, setTaskToOpen] = useState<string | null>(null);
    const [currentConversationPartnerId, setCurrentConversationPartnerId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [teamToSelect, setTeamToSelect] = useState<string | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem("sidebarWidth");
        return saved ? parseInt(saved, 10) : 256;
    });

    useEffect(() => {
        localStorage.setItem("sidebarWidth", sidebarWidth.toString());
    }, [sidebarWidth]);
    
    const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'error' | 'info'}[]>([]);
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const navigateURL = (url: string) => {
        window.history.pushState({}, "", url);
    };


    useEffect(() => {
        console.log("Current user:", currentUser);
    }, [currentUser]);

    useEffect(() => {
        console.log("Projects updated:", projects);
    }, [projects]);

    useEffect(() => {
        console.log("Teams updated:", teams);
    }, [teams]);

    useEffect(() => {
        console.log("Direct messages updated:", directMessages);
    }, [directMessages]);

    useEffect(() => {
        console.log("users updated:", users);
    }, [users]);


    useEffect(() => {
        if (!currentUser) return; // Only fetch if user is logged in
        const fetchData = async () => {
            try {
                const v = api.fetchVersion;
                const data = await api.fetchAllData();
                if (v !== api.fetchVersion - 1) {console.log("abort"); return;};
                setProjects(data.projects);
                setTeams(data.teams);
                setDirectMessages(data.directMessages);
                setUsers(data.users);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };

        // Fetch immediately
        fetchData();

        // Then fetch every 4.5 seconds
        const intervalId = setInterval(fetchData, 4500);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, [currentUser]);

    
    
    // Auth check on initial load
    useEffect(() => {
        const authenticateAndLoadData = async () => {
            const token = api.getAuthToken();
            if (token) {
                try {
                    const user = await api.fetchCurrentUser();
                    setCurrentUser(user);
                    const data = await api.fetchAllData();
                    setProjects(data.projects);
                    setTeams(data.teams);
                    setDirectMessages(data.directMessages);
                    setUsers(data.users);
                } catch (err) {
                    // Token is invalid or expired
                    api.clearAuthToken();
                    setCurrentUser(null);
                }
            }
            setIsLoading(false);
        };
        authenticateAndLoadData();
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    const handleLogin = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.login(email, password);
            const user = await api.fetchCurrentUser();
            setCurrentUser(user);
            const data = await api.fetchAllData();
            setProjects(data.projects);
            setTeams(data.teams);
            setDirectMessages(data.directMessages);
            setUsers(data.users);

            // Check if it's the first login to show onboarding
            if (!localStorage.getItem('hasOnboarded')) {
                setShowOnboarding(true);
                localStorage.setItem('hasOnboarded', 'true');
            }

            navigateURL("/dashboard")
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.');
            throw err; // Re-throw to be caught by LoginPage
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Call your API to create a new user
            await api.registerUser({ name, email, password });

            // Optionally, log the user in immediately
            await api.login(email, password);

            // Fetch the current user (which should now be the new user)
            const user = await api.fetchCurrentUser();
            setCurrentUser(user);

            // Fetch all relevant data for the app
            const data = await api.fetchAllData();
            setProjects(data.projects);
            setTeams(data.teams);
            setDirectMessages(data.directMessages);
            setUsers(data.users);

            // Navigate to dashboard after registration
            navigateURL("/dashboard");

            addToast('Account created successfully!', 'success');

            // Show onboarding if this is the first time
            if (!localStorage.getItem('hasOnboarded')) {
                setShowOnboarding(true);
                localStorage.setItem('hasOnboarded', 'true');
            }

        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
            addToast(err.message || 'Registration failed.', 'error');
            throw err; // Let the register page handle it too
        } finally {
            setIsLoading(false);
        }
    };

    
    const handleLogout = () => {
        api.logout();
        setCurrentUser(null);
        setProjects({});
        setTeams({});
        setDirectMessages({});
        setCurrentPage('dashboard');
        setCurrentProjectId(null);
        navigateURL("/");
    };
    
    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
    };

    const handleSelectProject = (projectId: string) => {
        setCurrentProjectId(projectId);
        setCurrentPage('project');
        navigateURL(`/project/${projectId}`);
    };
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    const handleUpdateProject = async (updatedProject: Project) => {
        api.updateProject(updatedProject)
            .then(p => setProjects(prev => ({ ...prev, [p.id]: p })))
            .catch(() => addToast('Failed to update project.', 'error'));
    };
    
    const handleCreateProject = async (name: string, description: string, teamId: string) => {
        api.createProject(name, description, teamId)
            .then(({ newProject, updatedTeam }) => {
                setProjects(prev => ({...prev, [newProject.id]: newProject }));
                setTeams(prev => ({ ...prev, [updatedTeam.id]: updatedTeam }));
                handleSelectProject(newProject.id);
                addToast('Project created successfully!', 'success');
            })
            .catch(() => addToast('Failed to create project.', 'error'));
    };

    const handleNavigate = (page: 'dashboard' | 'teams' | 'settings' | 'messages' | 'search') => {
        setCurrentPage(page);
        if (page === 'dashboard') {
            //setCurrentProjectId(null);
            navigateURL("/dashboard");
        } else {
            navigateURL(`/${page}`);
        }
    };
    
    const handleCreateColumn = async (projectId: string, title: string) => {
        api.createColumn(projectId, title)
            .then(({columns, columnOrder}) => {
                setProjects(prev => ({
                ...prev,
                [projectId]: {
                    ...prev[projectId],
                    columns,
                    columnOrder          
                }
                }));
                addToast('Column added!', 'success');
            })
            .catch(() => addToast('Failed to create column.', 'error'));
    };

    const handleMoveColumn = async (projectId: string, newOrder: string[]) => {
        api.moveColumn(projectId, newOrder)
            .then(columnOrder => {
                setProjects(prev => ({
                ...prev,
                [projectId]: {
                    ...prev[projectId],   // keep existing project data
                    columnOrder,          // update only the column order
                }
                }));
                addToast('Column moved successfully!', 'success');
            })
            .catch(() => addToast('Failed to move column.', 'error'));
    };

    const handleUpdateColumn = async (projectId: string, columnId: string, title: string) => {
        api.updateColumn(columnId, title)
            .then(newColumn => {
                setProjects(prev => ({
                    ...prev,
                    [projectId]: {
                        ...prev[projectId],
                        columns: {
                            ...prev[projectId].columns,
                            [columnId]: newColumn
                        }
                    }
                }))
                addToast('Column title changed successfully!', 'success')
            })
            .catch(() => addToast('Failed to change column title.', 'error'));
    };

    const handleDeleteColumn = async (columnId: string) => {
        api.deleteColumn(columnId)
            .then(() => {
                addToast("Column deleted.", "info");;
            })
            .catch(() => addToast('Failed to delete column.', 'error'));
    }

    const handleCreateTask = async (projectId: string, newTaskData: Task, columnId: string) => {
        api.createTask(projectId, columnId, newTaskData)
            .then(newTask => {
                setProjects(prev => ({
                    ...prev,
                    [projectId]: {
                        ...prev[projectId],
                        tasks: {
                            ...prev[projectId].tasks,
                            [newTask.id]: newTask 
                        },
                        columns: {
                            ...prev[projectId].columns,
                            [columnId]: {
                                ...prev[projectId].columns[columnId],
                                taskIds: [...prev[projectId].columns[columnId].taskIds, newTask.id]
                            }
                        }
                    }
                }))
                addToast('task created successfully!', 'success');
            })
            .catch(() => addToast('Failed to create task.', 'error'));
    };

    const handleUpdateTask = async (projectId: string, taskId: string, updatedTask: Task) => {
        api.updateTask(projectId, taskId, updatedTask)
            .then(newTask => {
                setProjects(prev => ({
                    ...prev,
                    [projectId]: {
                        ...prev[projectId],
                        tasks: {
                            ...prev[projectId].tasks,
                            [newTask.id]: newTask 
                        }
                    }
                }))

                addToast('task updated successfully!', 'success');
            })
            .catch(() => {
                addToast('Failed to update task.', 'error');
            })
        
    }

    const handleDeleteTask = async (taskId: string) => {
        api.deleteTask(taskId)
            .then(() => {
                addToast("Task deleted.", "info");;
            })
            .catch(() => addToast('Failed to delete task.', 'error'));
    }

    const handleMoveTask = async (projectId: string, taskId: string, toColumnId: string, position: number) => {
        api.moveTask(taskId, toColumnId, position)
            .then(({columns}) => {
                setProjects(prev => ({
                ...prev,
                [projectId]: {
                    ...prev[projectId],     // keep existing project data
                    columns,                // update only the columns
                }
                }));
                    addToast('task moved successfully!', 'success');
                })
                .catch(() => addToast('Failed to move task.', 'error'));
    }

    const handleSendMessage = async (projectId: string, content: string) => {
        try {
            // Call backend API to save message
            const savedMessage = await api.sendChatMessage(projectId, content);
            const updatedMessages = [...projects[projectId].chatMessages, savedMessage];

            setProjects(prev => ({
                ...prev,
                [projectId]: {
                    ...prev[projectId],
                    chatMessages: updatedMessages,
                }
            }))

            addToast('Message sent!', 'success');
        } catch (err) {
            addToast('Failed to send message.', 'error');
        }
    };

    const handleSelectTaskFromSearch = (projectId: string, taskId: string) => {
        setCurrentProjectId(projectId);
        setCurrentPage('project');
        setTaskToOpen(taskId);
    };
    
    const clearTaskToOpen = () => setTaskToOpen(null);

    const handleUpdateUser = (updateUser: User, avatarFile?: File) => {
        api.updateUser(updateUser, avatarFile)
            .then((updatedUser) => {
                setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
                if (currentUser && currentUser.id === updatedUser.id) {
                    setCurrentUser(updatedUser);
                }
                addToast('Profile updated!', 'success');
            })
            .catch(() => addToast('Failed to update profile.', 'error'));
    };
    
    const handleCreateTeam = (name: string, description: string, icon: string) => {
        api.createTeam(name, description, icon)
            .then(newTeam => {
                setTeams(prev => ({...prev, [newTeam.id]: newTeam}));
                addToast('Team created!', 'success');
            })
            .catch(() => addToast('Failed to create team.', 'error'));
    };

    const handleUpdateTeam = (updatedTeam: Team) => {
        api.updateTeam(updatedTeam)
            .then(team => {
                 setTeams(prev => ({ ...prev, [team.id]: team }));
            })
            .catch(() => addToast('Failed to update team.', 'error'));
    };

    const handleStartConversation = (partnerId: string) => {
        setCurrentConversationPartnerId(partnerId);
        handleNavigate('messages');
    };

    const handleSendDirectMessage = (receiverId: string, content: string) => {
        api.sendDirectMessage(receiverId, content)
            .then(newDm => {
                 setDirectMessages(prev => ({ ...prev, [newDm.id]: newDm }));
            })
            .catch(() => addToast('Failed to send message.', 'error'));
    };

    const handleInviteMember = (teamId: string, email: string) => {
        api.inviteMember(teamId, email)
            .then(updatedTeam => {
                setTeams(prev => ({...prev, [teamId]: updatedTeam }));
                const invitedUser = Object.values(users).find(u => u.email === email);
                addToast(`Successfully added ${invitedUser?.name} to ${updatedTeam.name}.`, 'success');
            })
            .catch(err => addToast(err.message, 'error'));
    };
    
    const handleRequestToJoinTeam = (teamId: string) => {
        api.requestToJoinTeam(teamId)
            .then((data) => {
                addToast(`Your request to join ${data.name} has been sent.`, 'success');
            })
            .catch(err => addToast(err.message, 'error'));
    };
    
    const handleManageJoinRequest = (teamId: string, userId: string, action: 'approve' | 'deny') => {
        api.manageJoinRequest(teamId, userId, action)
            .then(({ message, team }) => {
                console.log(team)
                 setTeams(prev => ({...prev, [teamId]: team }));
                 addToast(message, 'info');
            })
            .catch(err => addToast(err.message, 'error'));
    };
    
    const handleSearchSubmit = (query: string) => {
        setSearchQuery(query);
        handleNavigate('search');
    };
    
    const handleNavigateToTeam = (teamId: string) => {
        setTeamToSelect(teamId);
        handleNavigate('teams');
    };
    
    const clearTeamToSelect = () => setTeamToSelect(null);

    const handleViewUser = (user: User) => {
        setViewingUser(user);
    };

    const handleCreateFolder = (name: string) => {
        // api.createFolder(name)
        //     .then(newFolder => {
        //         setFolders(prev => ({...prev, [newFolder.id]: newFolder}));
        //         addToast('Folder created!', 'success');
        //     })
        //     .catch(() => addToast('Failed to create folder.', 'error'));
    };
    const handleDeleteFolder = (folderIdToDelete: string) => {
        // const originalFolders = folders;
        // // Optimistic UI update for responsiveness
        // const updatedFolders = { ...originalFolders };
        // delete updatedFolders[folderIdToDelete];
        // setFolders(updatedFolders);
        // addToast('Folder deleted.', 'info');
        // // API call to persist the change
        // api.deleteFolder(folderIdToDelete)
        //     .catch(() => {
        //         // Revert state on failure
        //         setFolders(originalFolders);
        //         addToast('Failed to delete folder.', 'error');
        //     });
    };
    const handleMoveProject = (projectId: string, newFolderId: string | null, oldFolderId: string | null) => {
        // if (newFolderId === oldFolderId) return;
        // const originalFolders = folders;
        
        // // Create a deep copy to modify safely
        // const updatedFolders = JSON.parse(JSON.stringify(originalFolders));
        // let foldersForApi: Folder[] = [];
        // // 1. Remove project from its old folder
        // if (oldFolderId && updatedFolders[oldFolderId]) {
        //     updatedFolders[oldFolderId].projectIds = updatedFolders[oldFolderId].projectIds.filter(id => id !== projectId);
        //     foldersForApi.push(updatedFolders[oldFolderId]);
        // }
        // // 2. Add project to its new folder
        // if (newFolderId && updatedFolders[newFolderId]) {
        //     if (!updatedFolders[newFolderId].projectIds.includes(projectId)) {
        //         updatedFolders[newFolderId].projectIds.push(projectId);
        //         if (!foldersForApi.some(f => f.id === newFolderId)) {
        //              foldersForApi.push(updatedFolders[newFolderId]);
        //         }
        //     }
        // }
        // // Optimistically update the UI
        // setFolders(updatedFolders);
        // // 3. Call the API to persist changes
        // if (foldersForApi.length > 0) {
        //     api.updateFolders(foldersForApi)
        //         .catch(() => {
        //             setFolders(originalFolders);
        //             addToast('Failed to move project.', 'error');
        //         });
        // }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner />
            </div>
        );
    }
    
    if (!currentUser) {
        navigateURL("/login");
        return <LoginPage onLogin={handleLogin} onRegister={handleRegister} onNavigateURL={navigateURL} />;
    }
    
    if (error) {
         return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    const userTeams = Object.values(teams).filter(team => team.members.some(m => m.user.id === currentUser.id));
    const userTeamIds = userTeams.map(t => t.id);
    const userProjects = Object.values(projects).filter(p => userTeamIds.includes(p.teamId));

    const currentProject = currentProjectId ? projects[currentProjectId] : null;
    const currentTeamForProject = currentProject ? teams[currentProject.teamId] : null;

    return (
        <div className="h-screen w-screen flex bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
            {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
            {viewingUser && (
                <UserProfileModal
                    userToView={viewingUser}
                    currentUser={currentUser}
                    allTeams={Object.values(teams)}
                    onInviteMember={handleInviteMember}
                    onClose={() => setViewingUser(null)}
                />
            )}
            <div className="absolute top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
            <Sidebar 
                projects={userProjects}
                folders={Object.values(folders)}
                currentProjectId={currentProjectId}
                onSelectProject={handleSelectProject}
                onNavigate={handleNavigate}
                currentPage={currentPage}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveProject={handleMoveProject}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
                width={sidebarWidth}
                onResize={setSidebarWidth}
            />
            <div className="flex-1 flex flex-col min-w-0">
                 <Header 
                    currentProject={currentProject}
                    currentTeam={currentTeamForProject}
                    currentUser={currentUser}
                    isDarkMode={isDarkMode}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                    projects={Object.values(projects)}
                    allUsers={Object.values(users)}
                    allTeams={Object.values(teams)}
                    onSelectTask={handleSelectTaskFromSearch}
                    onSearchSubmit={handleSearchSubmit}
                    currentPage={currentPage}
                 />
                 <main className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {currentPage === 'dashboard' && <div className="overflow-auto"><DashboardPage projects={userProjects} teams={userTeams} currentUser={currentUser} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} onNavigateToTeam={handleNavigateToTeam} onCreateTeam={handleCreateTeam}/></div>}
                    {currentPage === 'project' && currentProject && currentTeamForProject && <ProjectPage project={currentProject} team={currentTeamForProject} currentUser={currentUser} onUpdateProject={handleUpdateProject} onCreateColumn={handleCreateColumn} taskToOpen={taskToOpen} onClearTaskToOpen={clearTaskToOpen} onMoveColumn={handleMoveColumn} onSendMessage={handleSendMessage} onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onMoveTask={handleMoveTask} onUpdateColumn={handleUpdateColumn} onDeleteColumn={handleDeleteColumn} addToast={addToast}/>}
                    {currentPage === 'teams' && <div className="flex-1 min-h-0"><TeamsPage currentUser={currentUser} allUsers={users} allTeams={Object.values(teams)} allProjects={projects} onSelectProject={handleSelectProject} onCreateTeam={handleCreateTeam} onUpdateTeam={handleUpdateTeam} onCreateProject={handleCreateProject} onStartConversation={handleStartConversation} onInviteMember={handleInviteMember} onRequestToJoin={handleRequestToJoinTeam} onManageJoinRequest={handleManageJoinRequest} teamToSelect={teamToSelect} onClearTeamToSelect={clearTeamToSelect} /></div>}
                    {currentPage === 'settings' && <ProfilePage currentUser={currentUser} projects={userProjects} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} onUpdateUser={handleUpdateUser} />}
                    {currentPage === 'messages' && <MessagesPage currentUser={currentUser} users={users} directMessages={Object.values(directMessages)} onSendMessage={handleSendDirectMessage} initialPartnerId={currentConversationPartnerId} onNavigateToUser={handleStartConversation} onViewUser={handleViewUser} />}
                    {currentPage === 'search' && <SearchPage query={searchQuery} allProjects={Object.values(projects)} allTeams={Object.values(teams)} allUsers={Object.values(users)} onSelectProject={handleSelectProject} onNavigateToTeam={handleNavigateToTeam} onStartConversation={handleStartConversation} onViewUser={handleViewUser} />}
                </main>
            </div>
        </div>
    );
}

export default App;
