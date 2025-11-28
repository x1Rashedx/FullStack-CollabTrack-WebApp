# Frontend Structure Documentation

## 📁 Project Organization

This frontend follows a feature-based modular architecture for scalability and maintainability.

```
src/
├── assets/                 # Static files (icons, images, fonts)
├── components/             # Reusable UI components
│   ├── common/             # Basic reusable components (Avatar, Button, Toast, etc.)
│   ├── layout/             # Layout components (Header, Sidebar)
│   ├── features/           # Feature-specific components
│   │   ├── projects/       # Project management components
│   │   ├── tasks/          # Task/Kanban components
│   │   ├── calendar/       # Calendar components
│   │   └── chat/           # Chat components
│   └── modals/             # All modal components
├── pages/                  # Page/route components
├── hooks/                  # Custom React hooks
├── context/                # React Context providers
├── services/               # API service layer
├── utils/                  # Utility functions and constants
├── styles/                 # Global styles
├── types.ts                # TypeScript type definitions
└── App.tsx                 # Root component

```

## 🚀 Quick Import Examples

### Before (Old Structure)
```typescript
import { Avatar } from '../../../components/Avatar';
import * as api from '../../../api';
```

### After (New Structure)
```typescript
import { Avatar } from '@components/common';
import { projectService, taskService } from '@services';
import { TOAST_DURATION, API_URL } from '@utils/constants';
```

## 📦 Services Layer

Services are organized by feature domain:

- **`auth.service.ts`** - Authentication (login, register, logout)
- **`user.service.ts`** - User management
- **`project.service.ts`** - Project CRUD operations
- **`task.service.ts`** - Task management
- **`column.service.ts`** - Kanban column operations
- **`team.service.ts`** - Team management
- **`message.service.ts`** - Direct messages and chat

### Usage Example
```typescript
import { projectService, taskService } from '@services';

// Create project
const newProject = await projectService.create(name, description, teamId);

// Create task
const newTask = await taskService.create(projectId, columnId, taskData);
```

## 🎨 Component Organization

### Common Components (`components/common/`)
Reusable UI components used across the app:
- Avatar
- Spinner
- Toast
- Button (add this later)
- Input (add this later)
- Modal (add this later)

### Layout Components (`components/layout/`)
Application shell components:
- Header
- Sidebar

### Feature Components (`components/features/`)
Feature-specific components grouped by feature:

**Projects** - Project card, info, stats, filters
**Tasks** - Kanban board, columns, task cards, list view
**Calendar** - Calendar view, date picker
**Chat** - Chat messaging interface

### Modal Components (`components/modals/`)
Centralized modal dialogs:
- CreateProjectModal
- CreateTaskModal
- CreateTeamModal
- InviteMemberModal
- UserProfileModal
- ImageCropperModal
- OnboardingModal
- ConfirmationModal

## 🔗 Path Aliases

Configured in `tsconfig.json`:

| Alias | Maps To |
|-------|---------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@pages/*` | `src/pages/*` |
| `@hooks/*` | `src/hooks/*` |
| `@services/*` | `src/services/*` |
| `@utils/*` | `src/utils/*` |
| `@context/*` | `src/context/*` |
| `@types/*` | `src/types.ts` |
| `@assets/*` | `src/assets/*` |

## 🔧 Next Steps

1. **Move component files** to their respective folders
2. **Create custom hooks** (useAsync, useFetch, useDebounce)
3. **Create Context providers** (AuthContext, ProjectContext, TaskContext)
4. **Extract App.tsx state** into context and hooks
5. **Update all imports** throughout the application

## 📝 Best Practices

### Imports
✅ Use path aliases for cleaner imports
✅ Import from index files when available
❌ Avoid relative imports like `../../../`

### Component Structure
✅ Keep components focused and small
✅ Use feature folders for related components
✅ Export from index.ts files for easier imports
❌ Don't mix feature and common components

### Services
✅ Keep API calls in service layer
✅ Use TypeScript types from `@types`
✅ Handle errors consistently
❌ Never make API calls directly in components

## 🎯 Migration Checklist

- [ ] Move component files to new structure
- [ ] Update component imports in App.tsx
- [ ] Create custom hooks for repeated logic
- [ ] Create Context providers for global state
- [ ] Update all relative imports to use aliases
- [ ] Test all functionality
- [ ] Remove old api.ts file
