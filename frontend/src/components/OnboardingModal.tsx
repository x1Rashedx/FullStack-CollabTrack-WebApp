
import React from 'react';
import { X, Move, Edit, Users, Moon } from 'lucide-react';

interface OnboardingModalProps {
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const features = [
        {
            icon: <Move className="h-6 w-6 text-brand-600" />,
            title: "Drag & Drop Boards",
            description: "Easily move tasks between columns to track your progress visually."
        },
        {
            icon: <Edit className="h-6 w-6 text-brand-600" />,
            title: "Detailed Task Management",
            description: "Click any task to add descriptions, assignees, due dates, and more."
        },
        {
            icon: <Users className="h-6 w-6 text-brand-600" />,
            title: "Collaborate with Your Team",
            description: "Assign tasks and see who's working on what at a glance."
        },
        {
            icon: <Moon className="h-6 w-6 text-brand-600" />,
            title: "Light & Dark Modes",
            description: "Switch themes for your comfort using the toggle in the header."
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700 relative">
                    <svg className="w-12 h-12 text-brand-500 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to CollabTrack!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Your new hub for project management.</p>
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Key Features:</h3>
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                             <div key={index} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 bg-brand-100 dark:bg-brand-900/50 p-2 rounded-full">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{feature.title}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-center">
                     <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-brand-600 rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-500 transition-transform transform hover:scale-105"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
