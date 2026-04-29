import { Link } from 'react-router-dom';
import { ROUTES, APP_NAME, ROLES } from '@/lib/constants';
import { normalizeRole } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import {
    Menu,
    X as XIcon,
    ArrowRight,
    Sparkles,
    FileCheck,
    BrainCircuit,
    Users,
    LinkIcon,
    Bot,
    BookOpen,
    Mail,
    Globe,
    Check,
    Crown,
    LayoutDashboard,
    Sun,
    Moon,
} from 'lucide-react';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import ParticleNetwork from '@/components/ParticleNetwork';

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(node);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

function RevealSection({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const { ref, isVisible } = useScrollReveal();
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const getDashboardRoute = () => {
        const role = normalizeRole(user?.roles?.[0]);
        if (role === ROLES.ADMIN) return ROUTES.ADMIN;
        if (role === ROLES.INSTRUCTOR) return ROUTES.INSTRUCTOR;
        return ROUTES.DASHBOARD;
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">

            {/* ── Navigation ── */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${scrolled
                        ? 'bg-white/80 dark:bg-zinc-950/90 backdrop-blur-lg shadow-soft'
                        : 'bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2">
                            <img
                                src="/logo-removebg.png"
                                alt={`${APP_NAME} logo`}
                                className="w-[120px] h-[120px] object-contain"
                            />
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            {['Features', 'How It Works', 'Pricing', 'About'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="text-base font-semibold text-slate-600 dark:text-zinc-400 hover:text-[#0F5A9C] dark:hover:text-blue-400 transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            {/* Theme Toggle */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F5A9C] dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {isAuthenticated ? (
                                <Link to={getDashboardRoute()}>
                                    <Button
                                        size="md"
                                        className="!bg-gradient-to-r !from-[#0F5A9C] !to-[#74388B] hover:!opacity-90 shadow-lg shadow-[#0F5A9C]/25 !rounded-xl cursor-pointer !text-base"
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-1.5" />
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to={ROUTES.LOGIN}>
                                        <button className="px-6 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                                            Sign In
                                        </button>
                                    </Link>
                                    <Link to={ROUTES.SIGNUP}>
                                        <Button
                                            size="md"
                                            className="!bg-gradient-to-r !from-[#0F5A9C] !to-[#74388B] hover:!opacity-90 shadow-lg shadow-[#0F5A9C]/25 !rounded-xl cursor-pointer !text-base"
                                        >
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-slate-600 dark:text-zinc-300 p-2 cursor-pointer"
                        >
                            {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 pt-2 pb-4 shadow-lg animate-dropdown">
                        <div className="flex flex-col gap-2">
                            {['Features', 'How It Works', 'Pricing', 'About'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="text-base font-medium text-slate-600 dark:text-zinc-300 hover:text-[#0F5A9C] py-2.5"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
                            {/* Mobile Theme Toggle */}
                            <button
                                type="button"
                                onClick={() => {
                                    toggleTheme();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-3 text-base font-medium text-slate-600 dark:text-zinc-300 hover:text-[#0F5A9C] py-2.5 cursor-pointer"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
                            {isAuthenticated ? (
                                <Link to={getDashboardRoute()} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button size="sm" className="w-full !bg-gradient-to-r !from-[#0F5A9C] !to-[#74388B]">
                                        <LayoutDashboard className="w-4 h-4 mr-1.5" />
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full text-center px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                                            Sign In
                                        </button>
                                    </Link>
                                    <Link to={ROUTES.SIGNUP} onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button size="sm" className="w-full !bg-gradient-to-r !from-[#0F5A9C] !to-[#74388B]">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative min-h-[92vh] flex items-center overflow-hidden">
                <ParticleNetwork />

                <div className="absolute inset-0 z-[1] pointer-events-none">
                    <div className="absolute top-20 -left-32 w-[500px] h-[500px] rounded-full bg-[#0F5A9C]/10 blur-[120px]" />
                    <div className="absolute bottom-10 -right-32 w-[400px] h-[400px] rounded-full bg-[#74388B]/10 blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-28 pb-16">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-[#0F5A9C]/10 dark:bg-[#0F5A9C]/20 text-[#0F5A9C] dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border border-[#0F5A9C]/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Powered by AI</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.15] mb-6">
                                <span className="text-slate-900 dark:text-white">AI-Powered Learning</span>
                                <br />
                                <span className="text-slate-900 dark:text-white">Management for </span>
                                <span className="bg-gradient-to-r from-[#0F5A9C] to-[#74388B] bg-clip-text text-transparent">
                                    Educators
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-slate-500 dark:text-zinc-400 mb-10 leading-relaxed max-w-lg">
                                Auto-grade assignments, generate quizzes instantly, and give personalized feedback to every student.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <Link to={ROUTES.SIGNUP}>
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto !bg-gradient-to-r !from-[#0F5A9C] !to-[#74388B] hover:!opacity-90 shadow-xl shadow-[#0F5A9C]/20 !rounded-xl !px-8 cursor-pointer"
                                    >
                                        Get Started
                                        <ArrowRight className="w-5 h-5 ml-1" />
                                    </Button>
                                </Link>
                                <Link to={ROUTES.LOGIN}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto !rounded-xl !px-8 !border-slate-200 dark:!border-zinc-700 !text-slate-700 dark:!text-zinc-200 hover:!bg-slate-50 dark:hover:!bg-zinc-800 cursor-pointer"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    <span>Free to use</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    <span>No credit card</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    <span>Setup in minutes</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative hidden lg:block">
                            <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#0F5A9C]/15 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#74388B]/15 rounded-full blur-3xl" />

                            <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl p-7 border border-slate-200/60 dark:border-zinc-700/60 shadow-[0_0_60px_-15px_rgba(15,90,156,0.2)]">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Grading Dashboard</h3>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Real-time insights</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F5A9C]/5 to-[#0F5A9C]/10 dark:from-[#0F5A9C]/10 dark:to-[#0F5A9C]/20 border border-[#0F5A9C]/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-[#0F5A9C]/10 rounded-lg">
                                                <FileCheck className="w-4 h-4 text-[#0F5A9C]" />
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-zinc-400">Graded</span>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">247</div>
                                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Automatically by AI</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#74388B]/5 to-[#74388B]/10 dark:from-[#74388B]/10 dark:to-[#74388B]/20 border border-[#74388B]/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-[#74388B]/10 rounded-lg">
                                                <BrainCircuit className="w-4 h-4 text-[#74388B]" />
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-zinc-400">Quizzes</span>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">38</div>
                                        <div className="text-xs text-[#74388B] dark:text-purple-400 mt-1 font-medium">AI-Generated</div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    {[
                                        { name: 'Sarah M.', subject: 'Essay Assignment', score: '92%', status: 'Graded', color: 'green' },
                                        { name: 'Ahmed K.', subject: 'Quiz #4 — Physics', score: '88%', status: 'Graded', color: 'green' },
                                        { name: 'Lisa T.', subject: 'Lab Report', score: '—', status: 'Grading...', color: 'amber' },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F5A9C] to-[#74388B] flex items-center justify-center text-[10px] font-bold text-white">
                                                    {item.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{item.name}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">{item.subject}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">{item.score}</div>
                                                <div className={`text-[10px] font-medium ${item.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute -right-5 bottom-16 bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-zinc-800 flex items-center gap-2.5 hero-float-badge">
                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                                        <Sparkles className="text-green-600 dark:text-green-400 w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-900 dark:text-white">AI Feedback Sent</div>
                                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">3 students notified</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section className="py-24 bg-slate-50/50 dark:bg-zinc-900/30" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <RevealSection>
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-block text-sm font-semibold text-[#0F5A9C] dark:text-blue-400 mb-3 tracking-wide uppercase">
                                Features
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                                Everything you need to teach{' '}
                                <span className="bg-gradient-to-r from-[#0F5A9C] to-[#74388B] bg-clip-text text-transparent">smarter</span>
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
                                Let AI handle the heavy lifting so you can focus on what matters most — your students.
                            </p>
                        </div>
                    </RevealSection>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <FileCheck className="w-7 h-7" />,
                                color: 'from-[#0F5A9C] to-[#2D5F8B]',
                                bgLight: 'bg-[#0F5A9C]/5',
                                bgDark: 'dark:bg-[#0F5A9C]/10',
                                iconColor: 'text-[#0F5A9C]',
                                title: 'AI Auto-Grading',
                                desc: 'Save hours with intelligent grading that understands context and provides personalized, constructive feedback to each student automatically.',
                            },
                            {
                                icon: <BrainCircuit className="w-7 h-7" />,
                                color: 'from-[#74388B] to-[#A135A2]',
                                bgLight: 'bg-[#74388B]/5',
                                bgDark: 'dark:bg-[#74388B]/10',
                                iconColor: 'text-[#74388B]',
                                title: 'Instant Quiz Generation',
                                desc: 'Create comprehensive assessments in seconds. Our AI generates relevant questions from your course materials with adjustable difficulty.',
                            },
                            {
                                icon: <Users className="w-7 h-7" />,
                                color: 'from-[#2D5F8B] to-[#0F5A9C]',
                                bgLight: 'bg-[#2D5F8B]/5',
                                bgDark: 'dark:bg-[#2D5F8B]/10',
                                iconColor: 'text-[#2D5F8B]',
                                title: 'Simple Course Management',
                                desc: 'Easy enrollment via link, code, or email. Track student progress, manage content, and keep everything organized in one clean dashboard.',
                            },
                        ].map((feature, i) => (
                            <RevealSection key={feature.title} delay={i * 120}>
                                <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-slate-100 dark:border-zinc-800 hover:border-[#0F5A9C]/30 dark:hover:border-[#0F5A9C]/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                                    <div className={`w-14 h-14 rounded-2xl ${feature.bgLight} ${feature.bgDark} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <div className={feature.iconColor}>{feature.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="py-24 bg-white dark:bg-zinc-950" id="how-it-works">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <RevealSection>
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-block text-sm font-semibold text-[#74388B] dark:text-purple-400 mb-3 tracking-wide uppercase">
                                How It Works
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                                Up and running in{' '}
                                <span className="bg-gradient-to-r from-[#74388B] to-[#0F5A9C] bg-clip-text text-transparent">three steps</span>
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
                                Get started in minutes — no technical skills required.
                            </p>
                        </div>
                    </RevealSection>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
                        <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-[#0F5A9C]/30 via-[#74388B]/30 to-[#0F5A9C]/30" />

                        {[
                            {
                                step: '1',
                                icon: <BookOpen className="w-6 h-6 text-white" />,
                                title: 'Create Your Course',
                                desc: 'Set up your course with content, materials, and structure. Our intuitive builder makes it effortless.',
                            },
                            {
                                step: '2',
                                icon: <LinkIcon className="w-6 h-6 text-white" />,
                                title: 'Invite Your Students',
                                desc: 'Share a link, enrollment code, or send email invitations. Students join with a single click.',
                            },
                            {
                                step: '3',
                                icon: <Bot className="w-6 h-6 text-white" />,
                                title: 'Let AI Handle the Rest',
                                desc: 'AI grades assignments, generates quizzes, and delivers personalized feedback — you stay in control.',
                            },
                        ].map((item, i) => (
                            <RevealSection key={item.step} delay={i * 150}>
                                <div className="text-center relative">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F5A9C] to-[#74388B] mb-6 shadow-lg shadow-[#0F5A9C]/20 relative z-10">
                                        {item.icon}
                                    </div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center text-xs font-bold text-[#0F5A9C] border-2 border-[#0F5A9C]/30 -mt-2 -ml-6 z-20">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">{item.desc}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing Section ── */}
            <section className="py-24 bg-slate-50/50 dark:bg-zinc-900/30" id="pricing">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <RevealSection>
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-block text-sm font-semibold text-[#0F5A9C] dark:text-blue-400 mb-3 tracking-wide uppercase">
                                Pricing
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                                Start free, upgrade when{' '}
                                <span className="bg-gradient-to-r from-[#0F5A9C] to-[#74388B] bg-clip-text text-transparent">you're ready</span>
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
                                No hidden fees. Pick the plan that fits your classroom.
                            </p>
                        </div>
                    </RevealSection>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <RevealSection delay={0}>
                            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-slate-200 dark:border-zinc-800 h-full flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Free</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400">Perfect for getting started</p>
                                </div>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                                    <span className="text-slate-500 dark:text-zinc-400 text-sm">/month</span>
                                </div>
                                <ul className="space-y-3.5 mb-8 flex-1">
                                    {[
                                        { text: '1 course, up to 10 students', included: true },
                                        { text: '4 AI-generated quizzes / month', included: true },
                                        { text: 'Student performance statistics', included: false },
                                        { text: 'Auto-grading + personalized feedback', included: false },
                                    ].map((item) => (
                                        <li key={item.text} className="flex items-start gap-3">
                                            {item.included ? (
                                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                    <XIcon className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                                                </div>
                                            )}
                                            <span className={`text-sm ${item.included ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to={ROUTES.SIGNUP}>
                                    <button className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:border-[#0F5A9C] hover:text-[#0F5A9C] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all duration-300 cursor-pointer">
                                        Get Started Free
                                    </button>
                                </Link>
                            </div>
                        </RevealSection>

                        {/* Premium Plan */}
                        <RevealSection delay={150}>
                            <div className="relative bg-gradient-to-br from-[#0F5A9C]/[0.03] to-[#74388B]/[0.03] dark:from-[#0F5A9C]/[0.08] dark:to-[#74388B]/[0.08] rounded-2xl p-8 border-2 border-[#0F5A9C]/30 dark:border-[#0F5A9C]/40 h-full flex flex-col">
                                <div className="absolute -top-3.5 left-6">
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0F5A9C] to-[#74388B] text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-lg shadow-[#0F5A9C]/25">
                                        <Crown className="w-3 h-3" />
                                        POPULAR
                                    </span>
                                </div>
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Premium</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400">For serious educators</p>
                                </div>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-extrabold bg-gradient-to-r from-[#0F5A9C] to-[#74388B] bg-clip-text text-transparent">$30</span>
                                    <span className="text-slate-500 dark:text-zinc-400 text-sm">/month</span>
                                </div>
                                <ul className="space-y-3.5 mb-8 flex-1">
                                    {[
                                        'Unlimited courses & students',
                                        'Unlimited AI quiz generations',
                                        'Full auto-grading + personalized feedback',
                                        'Student performance statistics',
                                        'Export grades (CSV, PDF)',
                                    ].map((text) => (
                                        <li key={text} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-[#0F5A9C]/10 dark:bg-[#0F5A9C]/20 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-[#0F5A9C] dark:text-blue-400" />
                                            </div>
                                            <span className="text-sm text-slate-700 dark:text-zinc-200">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to={ROUTES.SIGNUP}>
                                    <button className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F5A9C] to-[#74388B] hover:opacity-90 hover:shadow-lg hover:shadow-[#0F5A9C]/20 transition-all duration-300 cursor-pointer">
                                        Get Premium
                                    </button>
                                </Link>
                            </div>
                        </RevealSection>
                    </div>
                </div>
            </section>

            {/* ── About / CTA Section ── */}
            <section className="py-24 relative overflow-hidden" id="about">
                <ParticleNetwork />

                <div className="absolute inset-0 z-[1] pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#0F5A9C]/8 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#74388B]/8 rounded-full blur-[150px]" />
                </div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <RevealSection>
                        <span className="inline-block text-sm font-semibold text-blue-300 mb-3 tracking-wide uppercase">
                            About {APP_NAME}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white leading-tight">
                            Built for educators who care about{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                every student
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                            {APP_NAME} was built with one mission: give educators the AI tools they need to spend less time
                            on repetitive tasks and more time making a real difference. Whether you're a professor with 300
                            students or a tutor with 10, our platform scales to fit your needs.
                        </p>
                    </RevealSection>

                    <RevealSection delay={200}>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to={ROUTES.SIGNUP}>
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto !bg-white !text-[#0F5A9C] hover:!bg-slate-100 !rounded-xl !px-8 shadow-xl cursor-pointer font-semibold"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 ml-1" />
                                </Button>
                            </Link>
                            <Link to={ROUTES.LOGIN}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto !rounded-xl !px-8 !border-white/20 !text-white hover:!bg-white/10 cursor-pointer"
                                >
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </RevealSection>
                </div>
            </section>
            {/* ── Footer ── */}
            <footer className="bg-slate-900 dark:bg-zinc-950 text-slate-400 pt-16 pb-8 border-t border-slate-800 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <img src="/logo-removebg.png" alt={`${APP_NAME} logo`} className="w-20 h-20 object-contain" />
                                <span className="text-lg font-bold text-white">{APP_NAME}</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                                AI-powered learning management that helps educators teach smarter and students learn better.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0F5A9C]/20 flex items-center justify-center transition-colors">
                                    <Globe className="w-4 h-4 text-slate-400 hover:text-white" />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0F5A9C]/20 flex items-center justify-center transition-colors">
                                    <Mail className="w-4 h-4 text-slate-400 hover:text-white" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 dark:border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 gap-4">
                        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
                        <p>Made with <span className="text-red-400">&hearts;</span> for Education</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};