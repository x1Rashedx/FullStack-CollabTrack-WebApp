
import React from 'react';

interface SpinnerProps {
    className?: string; // Allow external className to be passed
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer Ring */}
            <div className="animate-spin-slow rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 border-opacity-75 absolute"></div>
            {/* Middle Ring */}
            <div className="animate-spin-medium rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary-accent-500 border-opacity-50 absolute" style={{animationDuration: '1.5s'}}></div>
            {/* Inner Ring (optional, smaller) */}
            <div className="animate-spin-fast rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-300 border-opacity-30 absolute" style={{animationDuration: '1s'}}></div>

            {/* FIX: Removed jsx prop */}
            <style>{`
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-medium {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); } /* Counter-rotate */
                }
                @keyframes spin-fast {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 2s linear infinite;
                }
                .animate-spin-medium {
                    animation: spin-medium 1.5s linear infinite;
                }
                .animate-spin-fast {
                    animation: spin-fast 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Spinner;
