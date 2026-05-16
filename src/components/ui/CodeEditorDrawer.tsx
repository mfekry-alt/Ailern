import { useState } from 'react';
import { Drawer } from './Drawer';
import { Code2, Save, Terminal } from 'lucide-react';

interface CodeEditorDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (code: string, language: string) => void;
}

const LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'HTML/CSS', value: 'html' },
    { label: 'SQL', value: 'sql' },
    { label: 'Plain Text', value: 'text' },
];

export const CodeEditorDrawer = ({ isOpen, onClose, onApply }: CodeEditorDrawerProps) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');

    const handleApply = () => {
        if (!code.trim()) return;
        // Format for Tiptap code block or generic markdown
        onApply(code, language);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Insert Code Snippet"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!code.trim()}
                        className="flex-1 py-3 bg-[#21A9FF] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> Insert Snippet
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Language Selection */}
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Programming Language</label>
                    <div className="grid grid-cols-3 gap-2">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.value}
                                onClick={() => setLanguage(lang.value)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                                    language === lang.value 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div>
                    <div className="flex items-center justify-between mb-3 ml-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Code Content</label>
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                            <Terminal className="w-3 h-3" /> {language}
                        </div>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste or type your code here..."
                        className="w-full px-5 py-5 bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl focus:ring-2 focus:ring-blue-500/50 outline-none text-sm font-mono min-h-[300px] leading-relaxed shadow-2xl"
                    />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        The code will be automatically highlighted based on the selected language when displayed to students.
                    </p>
                </div>
            </div>
        </Drawer>
    );
};
