import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Globe, Mail } from 'lucide-react';

export const HomePage = () => {
    // مصفوفة لينكات الفوتر عشان الكود يبقى أنظف ونبعد عن تكرار الـ JSX
    const platformLinks = [
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Instructors', path: '/instructors' },
        { label: 'System Status', path: '/status' },
    ];

    const socialLinks = [
        { icon: Globe, label: 'Website', href: 'https://example.com' },
        { icon: Mail, label: 'Email', href: 'mailto:info@example.com' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* ... بقية محتوى الصفحة ... */}

            {/* Footer Section - المكان اللي كان فيه المشاكل */}
            <footer className="bg-zinc-900 py-12 text-white">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h4 className="text-white font-semibold mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            {platformLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Connect</h4>
                        <div className="flex space-x-4">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-white transition-colors"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};