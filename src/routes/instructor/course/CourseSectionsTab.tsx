import { useState, useRef, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '@/api/services';
import type { SectionDto, SectionFileDto } from '@/api/services/section.service';
import { toast } from 'sonner';
import { Layers, Plus, Loader2, Pencil, Trash2, X, Upload, GripVertical, FileText, Download, Eye, Search, Edit, Check } from 'lucide-react';

interface Ctx { courseId: string; numericCourseId: number | null }

const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
const isVideoFile = (contentType: string, fileName: string) => {
    if (contentType.toLowerCase().startsWith('video/')) return true;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return VIDEO_EXTS.includes(ext);
};

export const CourseSectionsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();
    const qc = useQueryClient();
    const qk = ['sections', numericCourseId];

    const { data: sections = [], isLoading } = useQuery<SectionDto[]>({
        queryKey: qk,
        queryFn: () => sectionService.getSectionsByCourse(numericCourseId!),
        enabled: !!numericCourseId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => sectionService.deleteSection(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk });
            toast.success('Section deleted');
        },
        onError: () => toast.error('Failed to delete section'),
    });

    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editModalSection, setEditModalSection] = useState<SectionDto | null>(null);
    const [filesModalSection, setFilesModalSection] = useState<SectionDto | null>(null);

    const filteredSections = useMemo(() => {
        const term = search.trim().toLowerCase();
        return [...sections]
            .filter(s => s.title.toLowerCase().includes(term) || s.sectionNumber.toString().includes(term))
            .sort((a, b) => a.sectionNumber - b.sectionNumber);
    }, [sections, search]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading sections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-6 h-6 text-blue-600" /> Sections
                </h2>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-600/25 active:scale-95">
                    <Plus className="w-4 h-4" /> Create Section
                </button>
            </div>

            {/* Filter */}
            <div className="relative z-30 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-700/50 flex shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white font-semibold transition-all" />
                </div>
            </div>

            {/* Content list */}
            {filteredSections.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No sections found</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create a section to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredSections.map(section => (
                        <div key={section.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl flex flex-col group hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-500 transition-all overflow-hidden">
                            {/* Card Header (Badge) */}
                            <div className="p-5 pb-0 flex justify-between items-start">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                                    SECTION {section.sectionNumber}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2">{section.title}</h4>
                                <div className="flex items-center gap-2 mt-auto text-xs text-gray-500 dark:text-slate-400 font-semibold mb-2">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>{section.sectionFiles?.length || 0} Material File{(section.sectionFiles?.length !== 1) ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/40 grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700/50 mt-auto">
                                <button onClick={() => setEditModalSection(section)} className="py-3.5 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all" title="Edit Section">
                                    <Edit className="w-4 h-4" />
                                    <span className="text-[10px] font-bold leading-none tracking-wide uppercase">Edit</span>
                                </button>
                                <button onClick={() => setFilesModalSection(section)} className="py-3.5 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all" title="Manage Files">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-[10px] font-bold leading-none tracking-wide uppercase">Files</span>
                                </button>
                                <button onClick={() => { if (window.confirm('Delete this section?')) deleteMutation.mutate(section.id); }} className="py-3.5 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Delete Section">
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-[10px] font-bold leading-none tracking-wide uppercase">Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateSectionModal
                    numericCourseId={numericCourseId!}
                    onClose={() => setIsCreateModalOpen(false)}
                    qk={qk}
                    sections={sections}
                />
            )}
            {editModalSection && (
                <EditSectionModal
                    section={editModalSection}
                    onClose={() => setEditModalSection(null)}
                    qk={qk}
                    sections={sections}
                />
            )}
            {filesModalSection && (
                <SectionFilesModal
                    section={filesModalSection}
                    onClose={() => setFilesModalSection(null)}
                    qk={qk}
                />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   Modals
   ═══════════════════════════════════════════════════════════ */

function CreateSectionModal({ numericCourseId, onClose, qk, sections }: { numericCourseId: number; onClose: () => void; qk: any[]; sections: SectionDto[] }) {
    const qc = useQueryClient();
    const [title, setTitle] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreate = async () => {
        setError('');
        const t = title.trim();
        const num = Number(newNumber);
        if (!t) return setError('Section name is required');
        if (sections.some(s => s.title.toLowerCase() === t.toLowerCase())) return setError('Section name must be unique');
        if (!Number.isFinite(num) || num < 1) return setError('Section number must be valid');

        setIsSubmitting(true);
        try {
            const section = await sectionService.createSection({ title: t, sectionNumber: num, courseId: numericCourseId });
            if (files.length > 0) {
                const fileMetas = files.map(f => ({ fileName: f.name, fileSize: f.size, contentType: f.type || 'application/octet-stream' }));
                const urls = await sectionService.requestPresignedUrls(section.id, { files: fileMetas });
                await Promise.all(urls.map((url, i) => sectionService.uploadFileToPresignedUrl(url, files[i])));
            }
            toast.success('Section created successfully');
            qc.invalidateQueries({ queryKey: qk });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to create section');
            qc.invalidateQueries({ queryKey: qk }); // partial creation could have happened
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Section</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Name</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} disabled={isSubmitting} placeholder="e.g. Introduction" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Number</label>
                        <input value={newNumber} onChange={e => setNewNumber(e.target.value)} type="number" min={1} disabled={isSubmitting} placeholder="e.g. 1" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Include Files (Optional)</label>
                        <div className="flex flex-col gap-2">
                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-300 dark:border-slate-600'}`}>
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Select Files</span>
                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                                    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                }} />
                            </label>
                            {files.length > 0 && (
                                <div className="space-y-1.5 mt-2">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3.5 flex-1 truncate pr-2">
                                            <div className="w-11 h-11 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="truncate pr-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5 truncate">
                                                    <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 shrink-0">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter">New Attached</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition">Cancel</button>
                    <button onClick={handleCreate} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Save Section
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditSectionModal({ section, onClose, qk, sections }: { section: SectionDto; onClose: () => void; qk: any[]; sections: SectionDto[] }) {
    const qc = useQueryClient();
    const [title, setTitle] = useState(section.title);
    const [editNumber, setEditNumber] = useState(String(section.sectionNumber));
    const [existingFiles, setExistingFiles] = useState<SectionFileDto[]>(section.sectionFiles || []);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const removeExistingFile = async (fileId: string) => {
        if (!window.confirm('Delete this file?')) return;
        try {
            await sectionService.deleteMaterialFile(section.id, fileId);
            setExistingFiles(prev => prev.filter(f => f.id !== fileId));
            qc.invalidateQueries({ queryKey: qk });
            toast.success('File deleted');
        } catch (err) {
            toast.error('Failed to delete file');
        }
    };

    const handleUpdate = async () => {
        setError('');
        const t = title.trim();
        const num = Number(editNumber);
        if (!t) return setError('Section name is required');
        if (sections.some(s => s.id !== section.id && s.title.toLowerCase() === t.toLowerCase())) return setError('Section name must be unique');
        if (!Number.isFinite(num) || num < 1) return setError('Section number must be valid');

        setIsSubmitting(true);
        try {
            await sectionService.updateSection(section.id, { id: section.id, title: t, sectionNumber: num });

            if (files.length > 0) {
                const fileMetas = files.map(f => ({ fileName: f.name, fileSize: f.size, contentType: f.type || 'application/octet-stream' }));
                const urls = await sectionService.requestPresignedUrls(section.id, { files: fileMetas });
                await Promise.all(urls.map((url, i) => sectionService.uploadFileToPresignedUrl(url, files[i])));
            }

            toast.success('Section updated successfully');
            qc.invalidateQueries({ queryKey: qk });
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update section');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Section</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Name</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} disabled={isSubmitting} placeholder="Section name" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Number</label>
                        <input value={editNumber} onChange={e => setEditNumber(e.target.value)} type="number" min={1} disabled={isSubmitting} placeholder="Section #" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white" />
                    </div>

                    {existingFiles.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Existing Files</label>
                            <div className="space-y-2">
                                {existingFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3.5 bg-blue-50/20 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3.5 flex-1 truncate pr-2">
                                            <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50 dark:border-blue-500/10">
                                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">{file.fileName}</p>
                                                    <div className="flex flex-col gap-1 mt-0.5">
                                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter">Previously Uploaded</span>
                                                    </div>
                                                </div>
                                        </div>
                                        <button onClick={() => removeExistingFile(file.id)} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm" title="Remove File">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Upload New Files</label>
                        <div className="flex flex-col gap-2">
                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-300 dark:border-slate-600'}`}>
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Select Files</span>
                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                                    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                }} />
                            </label>
                            {files.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3.5 flex-1 truncate pr-2">
                                                <div className="w-11 h-11 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="truncate pr-2">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 truncate">
                                                        <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 shrink-0">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                                        <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter">New Attached</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition">Cancel</button>
                    <button onClick={handleUpdate} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function SectionFilesModal({ section, onClose, qk }: { section: SectionDto; onClose: () => void; qk: any[] }) {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [localFiles, setLocalFiles] = useState<SectionFileDto[]>(() =>
        [...(section.sectionFiles || [])].sort((a, b) => a.orderIndex - b.orderIndex)
    );
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    const deleteFileMutation = useMutation({
        mutationFn: (fileId: string) => sectionService.deleteMaterialFile(section.id, fileId),
        onSuccess: (_d, fileId) => {
            setLocalFiles(prev => prev.filter(f => f.id !== fileId));
            qc.invalidateQueries({ queryKey: qk });
            toast.success('File removed');
        },
        onError: () => toast.error('Failed to delete file'),
    });

    const reorderMutation = useMutation({
        mutationFn: (orderedIds: string[]) => sectionService.reorderMaterialFiles(section.id, { orderedFilesIds: orderedIds }),
        onSuccess: () => toast.success('Files reordered'),
        onError: () => toast.error('Reorder failed'),
    });

    const handleDragStart = (idx: number) => setDragIdx(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        const updated = [...localFiles];
        const [moved] = updated.splice(dragIdx, 1);
        updated.splice(idx, 0, moved);
        setLocalFiles(updated);
        setDragIdx(idx);
    };
    const handleDragEnd = () => {
        setDragIdx(null);
        reorderMutation.mutate(localFiles.map(f => f.id));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Section Files</h2>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{section.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-slate-900/30">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Manage Files</p>
                    </div>

                    {localFiles.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium text-sm">No files uploaded to this section yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {localFiles.map((file, idx) => (
                                <div
                                    key={file.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={e => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center justify-between p-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing ${dragIdx === idx ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-4 flex-1 truncate pr-2">
                                        <GripVertical className="w-4 h-4 text-blue-400 dark:text-blue-500/50 shrink-0 cursor-grab" />
                                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1rem] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="truncate pr-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{file.fileName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {file.fileUrl && (
                                            isVideoFile(file.contentType, file.fileName) ? (
                                                <button onClick={() => navigate(`/preview?${new URLSearchParams({ url: file.fileUrl, name: file.fileName, type: file.contentType, size: String(file.fileSize) })}`)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-200" title="Play Video">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-200" title="Preview">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <footer className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0 bg-white dark:bg-slate-900">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors hover:bg-gray-200">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
