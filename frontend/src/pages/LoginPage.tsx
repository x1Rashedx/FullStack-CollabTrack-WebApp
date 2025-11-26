
import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Layout, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import Spinner from '../components/Spinner';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (fullName: string, email: string, password: string) => Promise<void>;
    initialMode: 'signin' | 'signup';
    onBack: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onNavigateURL: (url: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, initialMode, onBack, isDarkMode, onToggleTheme, onNavigateURL }) => {
    const [isLoginView, setIsLoginView] = useState(initialMode === 'signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoginView(initialMode === 'signin');
        setError(null);
    }, [initialMode]);

    useEffect(() => {
        onNavigateURL(isLoginView ? '/login' : '/register');
    }, [isLoginView]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isLoginView) {
                await onLogin(email, password);
            } else {
                await onRegister(fullName, email, password);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <button 
                    onClick={onToggleTheme} 
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            <div className="w-full max-w-md mx-auto z-10 flex flex-col justify-center p-4">
                <button 
                    onClick={onBack}
                    className="self-start mb-8 flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back to Home
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="p-8 sm:p-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 mb-4">
                                <Layout size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoginView ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                {isLoginView ? 'Enter your credentials to access your workspace.' : 'Get started with your free account today.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLoginView && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            required 
                                            value={fullName} 
                                            onChange={e => setFullName(e.target.value)} 
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white sm:text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white sm:text-sm"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="password" 
                                        required 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center border border-red-100 dark:border-red-900/30">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? <Spinner /> : (isLoginView ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isLoginView ? "Don't have an account?" : "Already have an account?"}
                                <button 
                                    onClick={() => { setIsLoginView(!isLoginView); setError(null); }} 
                                    className="ml-1 font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                                >
                                    {isLoginView ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
                
                <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} CollabTrack. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
