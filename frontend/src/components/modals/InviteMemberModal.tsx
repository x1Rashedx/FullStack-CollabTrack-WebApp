
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface InviteMemberModalProps {
    onClose: () => void;
    onInvite: (email: string) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onInvite }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            onInvite(email);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Invite New Member</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                             <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="you@example.com"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">They will receive an email to join your workspace.</p>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2 rounded-b-lg">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800">
                            <Send size={16} className="mr-2" />
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberModal;