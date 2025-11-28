import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TEAM_ICONS } from '@/utils/constants'

interface CreateTeamModalProps {
    onClose: () => void;
    onCreate: (name: string, description: string, icon: string) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(TEAM_ICONS[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, description, selectedIcon);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create New Team</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                            <input
                                type="text"
                                id="teamName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="e.g., Marketing Crew"
                            />
                        </div>
                        <div>
                            <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                            <textarea
                                id="teamDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="What is this team's purpose?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Icon</label>
                            <div className="mt-2 grid grid-cols-6 gap-2">
                                {TEAM_ICONS.map(iconClass => (
                                    <button
                                        type="button"
                                        key={iconClass}
                                        onClick={() => setSelectedIcon(iconClass)}
                                        className={`w-10 h-10 rounded-lg ${iconClass} flex items-center justify-center ring-2 transition-all ${selectedIcon === iconClass ? 'ring-brand-500 ring-offset-2 dark:ring-offset-gray-800' : 'ring-transparent'}`}
                                    >
                                        {selectedIcon === iconClass && <Check className="w-5 h-5 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2 rounded-b-lg">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800">
                            Create Team
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;