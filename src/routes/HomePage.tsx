import { Link } from 'react-router-dom';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui';
import {
    Menu,
    X,
    Users,
    BookOpen,
    Clock,
    TrendingUp,
    CheckCircle2,
    MessageSquare,
    BarChart3,
    ChevronDown,
    ArrowRight,
    Check,
    Mail,
    Globe,
    School,
    Bookmark,
    Moon,
    Sun,
} from 'lucide-react';
import { useState } from 'react';
import { useDarkMode } from '@/contexts/DarkModeContext';

export const HomePage = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.svg" alt={`${APP_NAME} logo`} className="w-[150px]" />
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer" href="#features">
                                Features
                            </a>
                            <a className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer" href="#about">
                                About
                            </a>
                            <a className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer" href="#faq">
                                FAQ
                            </a>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to={ROUTES.LOGIN}>
                                <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-zinc-100 hover:bg-green-700 hover:text-white transition-all bg-slate-100 dark:bg-zinc-800 cursor-pointer">
                                    Login
                                </button>
                            </Link>
                            <Link to={ROUTES.LOGIN}>
                                <Button size="sm" className="bg-blue-700 shadow-lg shadow-blue-500/30 cursor-pointer">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-slate-600 hover:text-primary p-2 cursor-pointer"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 pt-2 pb-4 shadow-lg">
                        <div className="flex flex-col space-y-3">
                            {['Features', 'About', 'FAQ'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-base font-medium text-slate-600 dark:text-zinc-300 hover:text-blue-700 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="h-px bg-slate-100 dark:bg-zinc-800 my-2"></div>
                            <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
                                <button className="text-center w-full px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                                    Login
                                </button>
                            </Link>
                            <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
                                <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-500 shadow-md">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center space-x-2 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-blue-100">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-green-700 font-bold">v1.0 System Update Live</span>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                                Manage Education <br />
                                <span className="text-blue-700 dark:text-blue-500">Intelligently.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                {APP_NAME} provides a comprehensive admin dashboard to oversee students, instructors, and course content with real-time analytics and seamless management tools.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex -space-x-2">
                                    <img
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJqMIa5Flh8bxVEaVBiRtzgxfcLDWxYK-Z4OxXY3VRBl4il4F-V2fmaq9uvyNjJmm5YjvNYQBsMiwmfftnS9Sxe5i4CZl4CTgXm7pvXOifLt1a6vKrIkGcs1cVrVL1uKVWzIAExx7VSn_Y0I442oMxBXynxBDnDH9pWajGoEZL_TlwTFdW1caQo4DgIg1UjGOqyRFNEzgyjVwuoHxxdm8n8Z1Pg8jbQjAVRUx5UHVxLpQBL7mA6EkkNXdhA2eQOGhyI8CH3n1fmkU"
                                    />
                                    <img
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHvwDB4Is-pNh9YIvB6jU1zOQYJxU4_EWMNpMN5LUfgW3XlcA9cKHWHvjCSoO3xY_Hs1ZbX1x29myAoIVpNrgqeT6xHL2d8JadjuKpp0eWuvM7bxNc5dnnUWVef5r4ePl3Vo3G6olFcepIApXCbmdTDk3njibjRpgGyXwtkepdKT4AwMMI1xa3l-vnArWWA2CsuC403gYH_LPnRx5UFNzK0HHS0-nTwco1iCxbs3HQxIg3rFLyOOWiFfKvxlnDvXOD6vJ3EQ2HBBc"
                                    />
                                    <img
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5dmtBZRb66qucKu029iPsuOYaj91I6UOFOaRS6h3NW-DmQaudAItmvPNE0lgmcq5YI4G_41m1QyGgajpngdhg353w_Y4_Sv5MQjxSqJhVQhXDETJ-ZgQbLhgxtXIscU0NXWEG4Il_NcM_mdflm66TiyIL_mygUYze8mFGpRYiNX9AWX04e85zdWFUP_kg8JM0KPHYDtk7DbMHUPrzuOXOHTbO_rJ1PFYOpZ3T1vN3UVwToMkqC-N318EUiVlIjSupdqYaLAVM4-M"
                                    />
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold">
                                        +2k
                                    </div>
                                </div>
                                <p>Trusted by <span className="text-blue-700 font-bold" >2,000+</span> Instructors</p>
                            </div>
                        </div>
                        <div className="relative lg:ml-10">
                            <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 transform  transition-transform duration-500 ease-out">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">System overview</h3>
                                        <p className="text-xs text-slate-500">Live staticts</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-medium rounded-lg">Export</span>
                                        <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-lg">Settings</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-slate-500 font-medium">Total Students</span>
                                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                                <Users className="text-primary w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">0</div>
                                        <div className="text-xs text-green-500 font-medium mt-1">+0% growth</div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-slate-500 font-medium">Active Courses</span>
                                            <div className="p-1.5 bg-purple-100 rounded-lg">
                                                <Bookmark className="text-purple-600 w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">0</div>
                                        <div className="text-xs text-green-500 font-medium mt-1">+0% growth</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center text-xs font-bold">
                                                JD
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">Machine Learning</div>
                                                <div className="text-[10px] text-slate-500">Dr. Sarah Wilson</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                                                JS
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">Data Structures</div>
                                                <div className="text-[10px] text-slate-500">Prof. John Smith</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                                    </div>
                                </div>
                                <div className="absolute -right-6 bottom-10 bg-white p-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-[3000ms]">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <CheckCircle2 className="text-green-600 w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">System Healthy</div>
                                        <div className="text-[10px] text-slate-500">99.9% Uptime</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful <span className="text-blue-700 font-bold">Features</span> for Modern Education</h2>
                        <p className="text-slate-600">Experience a unified platform designed to streamline administrative tasks and enhance the learning experience.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="text-primary w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Student Analytics</h3>
                            <p className="text-sm text-slate-600">Track enrollment, attendance, and performance metrics in real-time.</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-primary text-sm font-medium">
                                <span>View Stats</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <School className="text-emerald-600 w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Instructor Portal</h3>
                            <p className="text-sm text-slate-600">Manage faculty applications, course assignments, and schedules easily.</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-emerald-600 text-sm font-medium">
                                <span>Manage Staff</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BookOpen className="text-purple-600 w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Course Builder</h3>
                            <p className="text-sm text-slate-600">Intuitive tools to create, approve, and organize curriculum content.</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-purple-600 text-sm font-medium">
                                <span>Create Course</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Clock className="text-amber-500 w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Approvals</h3>
                            <p className="text-sm text-slate-600">Automated workflows for pending course and instructor approvals.</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center text-amber-600 text-sm font-medium">
                                <span>Review Queue</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 bg-background-light overflow-hidden" id="about">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 blur-lg"></div>
                            <div className="relative bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-slate-900">System Metrics</h3>
                                    <a className="text-sm text-primary font-medium hover:underline" href="#">
                                        View Details
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <TrendingUp className="text-green-500 w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">0</div>
                                            <div className="text-xs text-slate-500">Active Users Today</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <CheckCircle2 className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">0</div>
                                            <div className="text-xs text-slate-500">Course Completions</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <MessageSquare className="text-purple-500 w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">0</div>
                                            <div className="text-xs text-slate-500">Messages Sent</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <BarChart3 className="text-green-500 w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">99.9%</div>
                                            <div className="text-xs text-slate-500">System Uptime</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6"><span className="text-green-700 font-bold">About</span> {APP_NAME} Platform</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Built for speed and reliability, {APP_NAME} offers administrators a crystal-clear view of their educational ecosystem. Our platform isn't just about data entry; it's about actionable insights.
                            </p>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                From monitoring system health to approving the next groundbreaking course in Machine Learning, {APP_NAME} puts control back in your hands with a clean, distraction-free interface.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <Check className="text-green-500 w-5 h-5" />
                                    <span className="text-slate-700">Centralized User Management</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="text-green-500 w-5 h-5" />
                                    <span className="text-slate-700">Detailed Reporting & Exports</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="text-green-500 w-5 h-5" />
                                    <span className="text-slate-700">Customizable Admin Permissions</span>
                                </li>
                            </ul>
                            <button className="text-primary font-semibold hover:text-blue-700 flex items-center gap-2 group">
                                Learn more about our mission
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white border-t border-slate-100" id="faq">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked <span className="text-blue-700 font-bold">Questions</span></h2>
                        <p className="text-slate-500">Everything you need to know about the {APP_NAME} ecosystem.</p>
                    </div>
                    <div className="space-y-4">
                        {[
                            {
                                question: 'How do I export system reports?',
                                answer: 'Reports can be exported directly from the dashboard header using the "Export Report" button. We support PDF, CSV, and Excel formats for your convenience.',
                            },
                            {
                                question: 'Is there a limit to the number of instructors?',
                                answer: `No, ${APP_NAME} scales with your institution. You can add unlimited instructors and students depending on your subscription tier.`,
                            },
                            {
                                question: 'Can I customize the dashboard colors?',
                                answer: 'Yes, "System Settings" allows you to modify the branding, including the primary color and logo, to match your organization\'s identity.',
                            },
                        ].map((faq, index) => (
                            <div
                                key={index}
                                className="bg-slate-50 rounded-xl p-4 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="flex items-center justify-between font-medium text-slate-900">
                                    <span>{faq.question}</span>
                                    <ChevronDown className={`text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                </div>
                                {openFaq === index && (
                                    <div className="mt-4 text-slate-600 text-sm leading-relaxed">{faq.answer}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform <span className="text-green-700 font-bold">your institution?</span></h2>
                    <p className="text-slate-500 mb-8 text-lg">Join thousands of administrators managing their LMS efficiently with {APP_NAME}.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to={ROUTES.LOGIN}>
                            <Button size="lg" className="bg-white text-primary hover:bg-green-700  hover:text-white">
                                Login
                            </Button>
                        </Link>
                        <Link to={ROUTES.LOGIN}>
                            <Button size="lg" variant="outline" className="bg-blue-700 text-white  hover:bg-blue-800">
                                Contact Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <img src="/school.svg" alt={`${APP_NAME} logo`} className="w-[30px]" />
                                </div>
                                <span className="text-xl font-bold text-white">{APP_NAME}</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">Empowering education through intelligent management systems.</p>
                            <div className="flex space-x-4">
                                <a className="text-slate-400 hover:text-white transition-colors" href="#">
                                    <Globe className="w-5 h-5" />
                                </a>
                                <a className="text-slate-400 hover:text-white transition-colors" href="#">
                                    <Mail className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Dashboard
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Instructors
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Student Analytics
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        System Status
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Help Center
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Documentation
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        API Reference
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Community
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Terms of Service
                                    </a>
                                </li>
                                <li>
                                    <a className="hover:text-primary transition-colors" href="#">
                                        Cookie Policy
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                        <p>© 2026 {APP_NAME} LMS. All rights reserved.</p>
                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                            <button
                                onClick={toggleDarkMode}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? (
                                    <><Sun className="w-4 h-4" /> Light Mode</>
                                ) : (
                                    <><Moon className="w-4 h-4" /> Dark Mode</>
                                )}
                            </button>
                            <span>Made with <span className="text-red-500">♥</span> for Education</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
