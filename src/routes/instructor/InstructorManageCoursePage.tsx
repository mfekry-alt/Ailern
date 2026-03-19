import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Trash2, ChevronDown, ChevronUp,
    Video, FileText, 
    ArrowLeft, Save, GripVertical
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
    const base = "px-3 py-1 rounded-full text-xs font-semibold";
    if (status === 'Published') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30`;
    if (status === 'Draft') return `${base} bg-gray-100 text-gray-700 dark:bg-zinc-800`;
    return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30`;
};

const inputCls = "w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-sm";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1";

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
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Course Content</h1>
                            <p className="text-sm text-gray-500">Course ID: {id}</p>
                        </div>
                    </div>
                    <button type="button" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-500/20">
                        <Save className="w-4 h-4" /> Save All Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Curriculum Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Curriculum</h2>
                            <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">+ New Section</button>
                        </div>

                        {sections.map((section, sIdx) => (
                            <Card key={section.id} variant="elevated" className="overflow-hidden border-gray-200 dark:border-zinc-800">
                                <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 flex items-center gap-4">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                    <label htmlFor={`sec-title-${section.id}`} className="sr-only">Section Title</label>
                                    <input
                                        id={`sec-title-${section.id}`}
                                        type="text"
                                        className="bg-transparent border-none focus:ring-0 font-bold text-lg p-0 flex-1"
                                        value={section.title}
                                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                    />
                                    <button type="button" className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <CardContent className="p-4 space-y-3">
                                    {section.lectures.map((lecture) => (
                                        <div key={lecture.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                                            <div className="p-4 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleLecture(section.id, lecture.id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                                                >
                                                    {lecture.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <Video className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <input
                                                    id={`lec-title-${lecture.id}`}
                                                    type="text"
                                                    className="bg-transparent border-none focus:ring-0 text-sm font-medium flex-1"
                                                    value={lecture.title}
                                                    onChange={() => { }} // Handle change
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => deleteLecture(section.id, lecture.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Fix Syntax Error (Removed misplaced fragment) */}
                                            {lecture.expanded && (
                                                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-800/20">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Materials</span>
                                                        <button type="button" className="text-xs text-blue-600 font-bold">+ Add Material</button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {lecture.materials.length === 0 ? (
                                                            <p className="text-xs text-gray-400 italic">No materials added yet.</p>
                                                        ) : lecture.materials.map(m => (
                                                            <div key={m.id} className="flex items-center gap-2 text-sm p-2 bg-white dark:bg-zinc-800 rounded border border-gray-100 dark:border-zinc-700">
                                                                <FileText className="w-3 h-3" /> {m.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all cursor-pointer">
                                        + Add Lecture
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Right Column: Settings & Stats */}
                    <div className="space-y-6">
                        <Card variant="elevated">
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-bold">Course Status</h3>
                                <div className={getStatusBadgeClasses('Published')}>Published</div>
                                <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                                    <div>
                                        <label htmlFor="price-input" className={labelCls}>Course Price ($)</label>
                                        <input id="price-input" type="number" className={inputCls} defaultValue="49.99" />
                                    </div>
                                    <div>
                                        <label htmlFor="category-select" className={labelCls}>Category</label>
                                        <select id="category-select" className={inputCls}>
                                            <option>Development</option>
                                            <option>Design</option>
                                            <option>Business</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};