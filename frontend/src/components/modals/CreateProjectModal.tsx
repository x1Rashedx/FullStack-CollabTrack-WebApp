import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Team } from '@/types';

interface CreateProjectModalProps {
    onClose: () => void;
    onCreate: (name: string, description: string, teamId: string) => void;
    teams: Team[];
    defaultTeamId?: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate, teams, defaultTeamId }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId || teams[0]?.id || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Project name is required.');
            return;
        }
        if (!selectedTeamId) {
            setError('Please select a team.');
            return;
        }
        onCreate(name, description, selectedTeamId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create New Project</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</label>
                            <select
                                id="team"
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                disabled={!!defaultTeamId}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-200 dark:disabled:bg-gray-600 text-gray-900 dark:text-gray-100"
                            >
                                {teams.length > 0 ? (
                                     teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)
                                ) : (
                                    <option disabled>Create a team first</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                            <input
                                type="text"
                                id="projectName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="e.g., Q1 Marketing Campaign"
                            />
                        </div>
                        <div>
                            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                            <textarea
                                id="projectDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="A brief summary of what this project is about."
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2 rounded-b-lg">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800" disabled={teams.length === 0}>
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;