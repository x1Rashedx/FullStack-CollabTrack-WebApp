import React, { useState } from 'react';
import Spinner from '../components/Spinner';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (name: string, email: string, password: string) => Promise<void>
    onNavigateURL: (url: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateURL, onRegister}) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            // In a real app, you would have a separate register function
            if (isLoginView) {
                await onLogin(email, password);
            } else {
                await onRegister(fullName, email, password);
            }
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                     <svg className="w-10 h-10 text-brand-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white ml-3">CollabTrack</h1>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                            {isLoginView ? 'Welcome Back!' : 'Create Your Account'}
                        </h2>
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {isLoginView ? 'Sign in to continue to your dashboard.' : 'Get started with the best project tool.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                             {!isLoginView && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                                </div>
                             )}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                        </div>

                        {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}

                        <div className="mt-6">
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 flex justify-center items-center disabled:bg-brand-400">
                                {isLoading ? <Spinner /> : (isLoginView ? 'Sign In' : 'Sign Up')}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(null); !isLoginView ? onNavigateURL("/login") : onNavigateURL("/signup");}} className="font-medium text-brand-600 hover:text-brand-500 ml-1">
                            {isLoginView ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
