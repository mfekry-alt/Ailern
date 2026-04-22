import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Trash2, ChevronDown, ChevronUp,
    Video, FileText, 
    ArrowLeft, Save, GripVertical,
    Settings, Layout, Layers, Sparkles, Plus, PlayCircle, BookOpen
} from 'lucide-react';

// ─── Interfaces ─────────────────────────────────────────────────────────

interface Material { id: string; title: string; type: 'pdf' | 'link' | 'doc'; }
interface Lecture { id: string; title: string; type: 'video' | 'article'; expanded: boolean; materials: Material[]; }
interface Section { id: string; title: string; lectures: Lecture[]; }

// ─── State Reducer Helpers (Fix S2004 - Outside Component) ─────────────

const mutateUpdateSection = (sections: Section[], sid: string, title: string) =>
    sections.map(s => (s.id === sid ? { ...s, title } : s));

const mutateToggleLecture = (sections: Section[], sid: string, lid: string) =>
    sections.map(s => {
        if (s.id !== sid) return s;
        return {
            ...s,
            lectures: s.lectures.map(l => (l.id === lid ? { ...l, expanded: !l.expanded } : l))
        };
    });

const mutateRemoveLecture = (sections: Section[], sid: string, lid: string) =>
    sections.map(s => {
        if (s.id !== sid) return s;
        return { ...s, lectures: s.lectures.filter(l => l.id !== lid) };
    });

// ─── UI Helpers (Fix S3358) ──────────────────────────────────────────────

const getStatusBadgeClasses = (status: string) => {
    const base = "px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300";
    if (status === 'Published') return `${base} bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20`;
    if (status === 'Draft') return `${base} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700`;
    return `${base} bg-[#21A9FF]/10 text-[#21A9FF] border-[#21A9FF]/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20`;
};

const inputCls = "w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-[#21A9FF]/10 focus:border-[#21A9FF] text-sm font-medium transition-all duration-300 outline-none";
const labelCls = "block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1";

// ─── Main Component ─────────────────────────────────────────────────────

export const InstructorManageCoursePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sections, setSections] = useState<Section[]>([
        {
            id: 's1',
            title: 'Getting Started',
            lectures: [
                { id: 'l1', title: 'Introduction', type: 'video', expanded: false, materials: [] }
            ]
        }
    ]);

    // Handlers
    const updateSectionTitle = (sid: string, val: string) => setSections(prev => mutateUpdateSection(prev, sid, val));
    const toggleLecture = (sid: string, lid: string) => setSections(prev => mutateToggleLecture(prev, sid, lid));
    const deleteLecture = (sid: string, lid: string) => setSections(prev => mutateRemoveLecture(prev, sid, lid));

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 sm:p-8 lg:p-12 transition-colors duration-500 font-sans selection:bg-[#21A9FF]/30 pb-32">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-fade-in">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm active:scale-95 text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <Layout className="w-8 h-8 text-[#21A9FF]" />
                                Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#21A9FF] to-indigo-600">Content</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Course ID: <span className="font-mono text-xs">{id}</span>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="group flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-base transition-all duration-300 shadow-2xl hover:shadow-[#21A9FF]/25 hover:-translate-y-1 active:scale-95">
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Save All Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Curriculum Management */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#21A9FF]/10 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-[#21A9FF]" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Curriculum <span className="text-sm font-medium text-slate-400 ml-2">({sections.length} Sections)</span></h2>
                            </div>
                            <button type="button" className="flex items-center gap-2 text-sm font-black text-[#21A9FF] hover:text-[#0094F2] bg-[#21A9FF]/10 hover:bg-[#21A9FF]/20 px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer">
                                <Plus className="w-4 h-4" /> New Section
                            </button>
                        </div>

                        <div className="space-y-6">
                            {sections.map((section, sIdx) => (
                                <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${sIdx * 100}ms` }}>
                                    <Card variant="elevated" className="overflow-hidden border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-500">
                                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing text-slate-400">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                            <input
                                                id={`sec-title-${section.id}`}
                                                type="text"
                                                className="bg-transparent border-none focus:ring-0 font-black text-xl p-0 flex-1 text-slate-900 dark:text-white placeholder:text-slate-400"
                                                value={section.title}
                                                placeholder="Section Title..."
                                                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                            />
                                            <button type="button" className="text-slate-400 hover:text-red-500 p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90 cursor-pointer">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <CardContent className="p-6 space-y-4">
                                            {section.lectures.map((lecture, lIdx) => (
                                                <div key={lecture.id} className="group border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900/60 hover:border-[#21A9FF]/50 transition-all duration-300">
                                                    <div className={`p-4 flex items-center gap-4 transition-colors ${lecture.expanded ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleLecture(section.id, lecture.id)}
                                                            className={`p-2.5 rounded-2xl transition-all duration-300 ${lecture.expanded ? 'bg-[#21A9FF] text-white shadow-lg shadow-[#21A9FF]/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-[#21A9FF]'} cursor-pointer`}
                                                        >
                                                            {lecture.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                            {lecture.type === 'video' ? <PlayCircle className="w-5 h-5 text-[#21A9FF]" /> : <BookOpen className="w-5 h-5 text-indigo-600" />}
                                                        </div>
                                                        <input
                                                            id={`lec-title-${lecture.id}`}
                                                            type="text"
                                                            className="bg-transparent border-none focus:ring-0 text-base font-bold flex-1 text-slate-700 dark:text-slate-200"
                                                            value={lecture.title}
                                                            placeholder="Lecture Title..."
                                                            onChange={() => { }} // Handle change
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteLecture(section.id, lecture.id)}
                                                            className="p-2.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4.5 h-4.5" />
                                                        </button>
                                                    </div>

                                                    {lecture.expanded && (
                                                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 animate-in slide-in-from-top-2 duration-300">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecture Assets & Materials</span>
                                                                <button type="button" className="flex items-center gap-1.5 text-xs font-black text-[#21A9FF] hover:text-[#0094F2] bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95">
                                                                    <Plus className="w-3.5 h-3.5" /> Add Material
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {lecture.materials.length === 0 ? (
                                                                    <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                                                        <p className="text-xs text-slate-400 italic">No materials added yet.</p>
                                                                    </div>
                                                                ) : lecture.materials.map(m => (
                                                                    <div key={m.id} className="flex items-center justify-between gap-3 text-sm p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group/item">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                                                <FileText className="w-4 h-4 text-indigo-600" />
                                                                            </div>
                                                                            <span className="font-medium text-slate-600 dark:text-slate-300">{m.title}</span>
                                                                        </div>
                                                                        <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all">
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-black text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF] hover:bg-[#21A9FF]/5 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2">
                                                <Plus className="w-4 h-4" /> Add New Lecture
                                            </button>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Settings & Stats */}
                    <div className="space-y-8">
                        <Card variant="elevated" className="border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900/60 shadow-sm sticky top-8">
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-[#21A9FF]/10 rounded-xl">
                                        <Settings className="w-5 h-5 text-[#21A9FF]" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Course Settings</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <span className={labelCls}>Publication Status</span>
                                    <div className="flex">
                                        <div className={getStatusBadgeClasses('Published')}>Published</div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label htmlFor="price-input" className={labelCls}>Course Price</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input id="price-input" type="number" className={`${inputCls} pl-10`} defaultValue="49.99" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="category-select" className={labelCls}>Primary Category</label>
                                        <div className="relative">
                                            <select id="category-select" className={`${inputCls} appearance-none`}>
                                                <option>Development</option>
                                                <option>Design</option>
                                                <option>Business</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button className="w-full py-4 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 active:scale-95">
                                        Update Settings
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};