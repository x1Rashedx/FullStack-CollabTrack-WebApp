
import React, { useState, useRef } from 'react';
import { 
    Layout, 
    MessageSquare, 
    PieChart, 
    Users, 
    ArrowRight, 
    Zap,
    Columns,
    Menu,
    X,
    Sun,
    Moon,
    Monitor,
    Smartphone,
    Globe,
    Mail,
    MapPin,
    Send,
    CheckCircle2,
    Download
} from 'lucide-react';

interface LandingPageProps {
    onNavigate: (mode: 'signin' | 'signup') => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onDemoLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isDarkMode, onToggleTheme, onDemoLogin }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!heroRef.current) return;
        
        const rect = heroRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5; // Max rotation 5deg
        const rotateY = ((x - centerX) / centerX) * 5;
        
        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-primary-200 dark:selection:bg-primary-900 overflow-hidden">
            {/* Animated Background Blob */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                 <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary-200/30 dark:bg-primary-900/10 blur-[100px] animate-float"></div>
                 <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-secondary-accent-200/30 dark:bg-secondary-accent-900/10 blur-[100px] animate-float-delayed"></div>
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-40 w-full glass border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                                <Layout size={20} />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-accent-500">
                                CollabTrack
                            </span>
                        </div>
                        
                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('home')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Home</button>
                            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About Us</button>
                            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</button>
                            <button onClick={() => scrollToSection('downloads')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Downloads</button>
                            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact Us</button>
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
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => onNavigate('signup')}
                                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-md hover:shadow-lg hover:shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
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
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 hover:text-primary-600">
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 animate-slide-up">
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            <button onClick={() => scrollToSection('home')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Home</button>
                            <button onClick={() => scrollToSection('about')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">About Us</button>
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Features</button>
                            <button onClick={() => scrollToSection('downloads')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Downloads</button>
                            <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Contact Us</button>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                                <button 
                                    onClick={() => onNavigate('signin')}
                                    className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Sign In
                                </button>
                                <button 
                                    onClick={() => onNavigate('signup')}
                                    className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Home (Hero) Section */}
            <section id="home" className="relative pt-20 pb-32 overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100/50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wide mb-6 backdrop-blur-sm shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
                            v1.0 is now live
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
                            Manage Projects with <br/>
                            <span className="text-primary-600 dark:text-primary-500">Unmatched Clarity</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Stop juggling multiple tools. CollabTrack brings your tasks, team, and conversations together in one intuitive platform.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => onNavigate('signup')}
                                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg hover:shadow-primary-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Start for Free <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* App Mockup with 3D Tilt */}
                    <div 
                        ref={heroRef}
                        className="relative mx-auto max-w-5xl perspective-1000 animate-slide-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div 
                            className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden transition-transform duration-100 ease-out preserve-3d"
                            style={{
                                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                            }}
                        >
                            {/* Mockup Header */}
                            <div className="h-12 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 space-x-2 backdrop-blur-md">
                                <div className="w-3 h-3 rounded-full bg-error-status-400"></div>
                                <div className="w-3 h-3 rounded-full bg-warning-status-400"></div>
                                <div className="w-3 h-3 rounded-full bg-success-status-400"></div>
                            </div>
                            {/* Mockup Body */}
                            <div className="p-6 grid grid-cols-3 gap-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-500 rounded"></div>
                                        <div className="flex justify-between mt-4">
                                            <div className="h-6 w-6 rounded-full bg-primary-400"></div>
                                            <div className="h-4 w-12 bg-success-status-100 dark:bg-success-status-900 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 opacity-70">
                                        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="flex justify-between mt-4">
                                            <div className="h-6 w-6 rounded-full bg-secondary-accent-400"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="h-20 w-full bg-gray-100 dark:bg-gray-600 rounded mb-2"></div>
                                        <div className="flex -space-x-2 mt-2">
                                            <div className="h-6 w-6 rounded-full bg-error-status-400 border-2 border-white dark:border-gray-700"></div>
                                            <div className="h-6 w-6 rounded-full bg-warning-status-400 border-2 border-white dark:border-gray-700"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Column 3 */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 border-l-4 border-l-success-status-500">
                                        <div className="flex justify-between items-start">
                                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                            <div className="h-4 w-4 bg-success-status-500 rounded-full"></div>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-500 rounded mt-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-24 bg-white dark:bg-gray-800/50 relative z-10 scroll-mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block px-3 py-1 rounded-full bg-secondary-accent-100 dark:bg-secondary-accent-900/30 text-secondary-accent-600 dark:text-secondary-accent-400 text-xs font-semibold uppercase tracking-wider">
                                Our Mission
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                                Empowering teams to achieve more, together.
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                At CollabTrack, we believe that project management shouldn't be a chore. It should be the engine that drives your team's creativity and productivity.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Founded in 2025, our goal was to bridge the gap between simple to-do lists and complex enterprise software. We built a tool that grows with you, focusing on clarity, speed, and meaningful collaboration.
                            </p>
                            <div className="pt-4 grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-500">NaN</p>
                                    <p className="text-sm text-gray-500">Active Teams</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-500">NaN</p>
                                    <p className="text-sm text-gray-500">Tasks Completed</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-500">99.9%</p>
                                    <p className="text-sm text-gray-500">Uptime</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary-200 dark:bg-primary-800 rounded-full blur-2xl opacity-50"></div>
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary-accent-200 dark:bg-secondary-accent-800 rounded-full blur-2xl opacity-50"></div>
                            <div className="glass p-8 rounded-2xl border border-gray-200 dark:border-gray-700 relative z-10 shadow-xl">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Built for Speed</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Zero lag, instant updates. Your flow stays uninterrupted.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Global Collaboration</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time sync across all time zones and devices.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Community First</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We build what you need based on direct feedback.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50 relative z-10 scroll-mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to ship faster</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Powerful features integrated into a simple, intuitive interface designed for modern teams.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard 
                            icon={<Columns className="text-primary-500" size={32} />}
                            title="Kanban Boards"
                            description="Visualize your workflow with flexible boards. Drag, drop, and customize columns to fit your process."
                            delay={0.1}
                        />
                        <FeatureCard 
                            icon={<Users className="text-secondary-accent-500" size={32} />}
                            title="Team Collaboration"
                            description="Assign tasks, mention teammates, and work together in real-time without stepping on toes."
                            delay={0.2}
                        />
                        <FeatureCard 
                            icon={<MessageSquare className="text-success-status-500" size={32} />}
                            title="Real-time Chat"
                            description="Discuss projects directly in the context of your work. Direct messages and group channels included."
                            delay={0.3}
                        />
                        <FeatureCard 
                            icon={<PieChart className="text-warning-status-500" size={32} />}
                            title="Analytics"
                            description="Track progress with beautiful charts. Measure velocity, completion rates, and individual contributions."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* Downloads Section */}
            <section id="downloads" className="py-24 bg-white dark:bg-gray-800 relative z-10 scroll-mt-16 border-y border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Available on all your devices</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Keep your projects moving forward whether you're at your desk or on the go.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Desktop */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-8 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700 group">
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-primary-600 dark:text-primary-400">
                                <Monitor size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Desktop</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For macOS and Windows</p>
                            <button className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 font-medium">
                                <Download size={16} /> Download
                            </button>
                        </div>

                        {/* Web */}
                        <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-8 hover:bg-primary-100/50 dark:hover:bg-primary-900/20 transition-colors border border-primary-100 dark:border-primary-900/30 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-primary-600 text-white text-[10px] font-bold uppercase rounded-bl-xl">Popular</div>
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-primary-600 dark:text-primary-400">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Web App</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Access from any browser</p>
                            <button 
                                onClick={() => onNavigate('signup')}
                                className="w-full py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-md transition-all flex items-center justify-center gap-2 font-bold"
                            >
                                <Zap size={16} /> Launch Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-900 relative z-10 scroll-mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                        {/* Contact Info */}
                        <div className="bg-primary-600 p-10 md:w-2/5 text-white flex flex-col justify-between">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Get in touch</h2>
                                <p className="text-primary-100 mb-8 leading-relaxed">
                                    Have a question or feedback? We'd love to hear from you. Fill out the form or reach us via email.
                                </p>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-lg">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary-200 uppercase tracking-wider font-semibold">Email</p>
                                            <p className="font-medium">support@collabtrack.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-lg">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary-200 uppercase tracking-wider font-semibold">Office</p>
                                            <p className="font-medium">IAU, Dammam, Saudi Arabia</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12">
                                <p className="text-sm text-primary-200">
                                    Support available Mon-Fri, 9am-6pm PST.
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-10 md:w-3/5 bg-white dark:bg-gray-800">
                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                        <input type="text" id="name" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                        <input type="email" id="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                    <input type="text" id="subject" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="How can we help?" />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                    <textarea id="message" rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Tell us more about your inquiry..."></textarea>
                                </div>
                                <button className="w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg">
                                    <Send size={18} /> Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 relative z-10">
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
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                            <li><button onClick={() => scrollToSection('downloads')} className="hover:text-white">Downloads</button></li>
                            <li><a href="#" className="hover:text-white">Integrations</a></li>
                            <li><a href="#" className="hover:text-white">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><button onClick={() => scrollToSection('about')} className="hover:text-white">About Us</button></li>
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                            <li><button onClick={() => scrollToSection('contact')} className="hover:text-white">Contact</button></li>
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

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <div 
        className="glass-panel p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100/50 dark:border-gray-700/50 group hover:-translate-y-2"
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg inline-block group-hover:scale-110 transition-transform shadow-sm">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;
