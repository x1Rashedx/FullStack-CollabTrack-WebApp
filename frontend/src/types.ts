export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'prefer-not-to-say';
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
}

export interface Folder {
  id: string;
  name: string;
  projectIds: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignees: User[];
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  weight: number;
  completed: boolean;

  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string; // New: Added updatedAt field
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface ChatMessage {
  id: string;
  projectId: string;
  author: {id: string, name: string, avatarUrl: string};
  content: string;
  timestamp: string;

  attachments?: Attachment[];
  parentId?: string;
}

export interface TeamMember {
    user: User;
    role: 'admin' | 'member';
}

export interface Team {
    id:string;
    name: string;
    description: string;
    icon: string;
    members: TeamMember[];
    projectIds: string[];
    joinRequests: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  chatMessages: ChatMessage[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;

  attachments?: Attachment[];
  parentId?: string;
}