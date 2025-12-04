
import React, { useState } from 'react';
import { Layout, MessageSquare, PieChart, Users, ArrowRight, Zap, Columns, Menu, X, Sun, Moon } from 'lucide-react';

interface LandingPageProps {
    onNavigate: (mode: 'signin' | 'signup') => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onDemoLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isDarkMode, onToggleTheme, onDemoLogin }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-200 dark:selection:bg-brand-900">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                                <Layout size={20} />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-500">
                                CollabTrack
                            </span>
                        </div>
                        
                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#home" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home</a>
                            <a href="#about" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About Us</a>
                            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
                            <a href="#downloads" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Downloads</a>
                            <a href="#contacts" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Us</a>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <button 
                                onClick={onToggleTheme} 
                                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button 
                                onClick={() => onNavigate('signin')}
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => onNavigate('signup')}
                                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            <button 
                                onClick={onToggleTheme} 
                                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 hover:text-brand-600">
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            <a href="#home" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Home</a>
                            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">About Us</a>
                            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Features</a>
                            <a href="#downloads" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Downloads</a>
                            <a href="#contacts" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Contacts</a>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                                <button 
                                    onClick={() => onNavigate('signin')}
                                    className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Sign In
                                </button>
                                <button 
                                    onClick={() => onNavigate('signup')}
                                    className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-brand-500 mr-2 animate-pulse"></span>
                            v1.0 is now live
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
                            Manage Projects with <br/>
                            <span className="text-brand-600 dark:text-brand-500">Unmatched Clarity</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                            Stop juggling multiple tools. CollabTrack brings your tasks, team, and conversations together in one intuitive platform.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => onNavigate('signup')}
                                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                Start for Free <ArrowRight size={20} />
                            </button>
                            <button 
                                onClick={onDemoLogin}
                                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap size={20} className="text-yellow-500" /> Live Demo
                            </button>
                        </div>
                    </div>

                    {/* App Mockup */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="absolute inset-0 bg-brand-500 blur-[100px] opacity-20 rounded-full"></div>
                        <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {/* Mockup Header */}
                            <div className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            {/* Mockup Body */}
                            <div className="p-6 grid grid-cols-3 gap-6 opacity-90">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-500 rounded"></div>
                                        <div className="flex justify-between mt-4">
                                            <div className="h-6 w-6 rounded-full bg-blue-400"></div>
                                            <div className="h-4 w-12 bg-green-100 dark:bg-green-900 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 opacity-70">
                                        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="flex justify-between mt-4">
                                            <div className="h-6 w-6 rounded-full bg-purple-400"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="h-20 w-full bg-gray-100 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="flex -space-x-2 mt-2">
                                            <div className="h-6 w-6 rounded-full bg-red-400 border-2 border-white dark:border-gray-700"></div>
                                            <div className="h-6 w-6 rounded-full bg-yellow-400 border-2 border-white dark:border-gray-700"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Column 3 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-500 rounded mt-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to ship faster</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Powerful features integrated into a simple, intuitive interface designed for modern teams.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard 
                            icon={<Columns className="text-brand-500" size={32} />}
                            title="Kanban Boards"
                            description="Visualize your workflow with flexible boards. Drag, drop, and customize columns to fit your process."
                        />
                        <FeatureCard 
                            icon={<Users className="text-purple-500" size={32} />}
                            title="Team Collaboration"
                            description="Assign tasks, mention teammates, and work together in real-time without stepping on toes."
                        />
                        <FeatureCard 
                            icon={<MessageSquare className="text-green-500" size={32} />}
                            title="Real-time Chat"
                            description="Discuss projects directly in the context of your work. Direct messages and group channels included."
                        />
                        <FeatureCard 
                            icon={<PieChart className="text-orange-500" size={32} />}
                            title="Analytics"
                            description="Track progress with beautiful charts. Measure velocity, completion rates, and individual contributions."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TestimonialCard 
                            quote="CollabTrack changed how we deliver software. It's cleaner than Jira and faster than Trello."
                            author="Sarah Jenkins"
                            role="Product Manager at TechFlow"
                            avatar="https://i.pravatar.cc/150?u=1"
                        />
                        <TestimonialCard 
                            quote="The real-time chat integration is a game changer. We stopped using Slack for project-specific comms."
                            author="David Chen"
                            role="Lead Developer at StartUp Inc"
                            avatar="https://i.pravatar.cc/150?u=2"
                        />
                        <TestimonialCard 
                            quote="Finally, a project tool that doesn't feel like a spreadsheet. My design team actually loves using it."
                            author="Emily Rodriguez"
                            role="Creative Director at Studio 54"
                            avatar="https://i.pravatar.cc/150?u=3"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-brand-600 dark:bg-brand-700">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to streamline your workflow?</h2>
                    <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto">
                        Join thousands of teams who rely on CollabTrack to deliver projects on time and under budget.
                    </p>
                    <button 
                        onClick={() => onNavigate('signup')}
                        className="px-10 py-4 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 text-lg"
                    >
                        Get Started for Free
                    </button>
                    <p className="mt-4 text-sm text-brand-200 opacity-80">No credit card required. Cancel anytime.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <Layout size={24} />
                            <span className="text-xl font-bold">CollabTrack</span>
                        </div>
                        <p className="text-sm">
                            Making project management effortless for modern teams.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">Features</a></li>
                            <li><a href="#" className="hover:text-white">Integrations</a></li>
                            <li><a href="#" className="hover:text-white">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-sm">
                    &copy; {new Date().getFullYear()} CollabTrack. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

// --- Sub Components ---

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 group">
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg inline-block group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const TestimonialCard = ({ quote, author, role, avatar }: { quote: string, author: string, role: string, avatar: string }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-yellow-400">★</span>)}
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{quote}"</p>
        <div className="flex items-center gap-4">
            <img src={avatar} alt={author} className="w-10 h-10 rounded-full" />
            <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{author}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
            </div>
        </div>
    </div>
);

export default LandingPage;