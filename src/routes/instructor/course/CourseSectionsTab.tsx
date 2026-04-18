import { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '@/api/services';
import type { SectionDto, SectionFileDto } from '@/api/services/section.service';
import { toast } from 'sonner';
import {
    Layers, Plus, Loader2, Pencil, Trash2, X, Check,
    Upload, GripVertical, FileText, ChevronDown, ChevronRight, Download, Eye
} from 'lucide-react';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseSectionsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();
    const qc = useQueryClient();
    const qk = ['sections', numericCourseId];

    const { data: sections = [], isLoading } = useQuery<SectionDto[]>({
        queryKey: qk,
        queryFn: () => sectionService.getSectionsByCourse(numericCourseId!),
        enabled: !!numericCourseId,
    });

    // ── Create section ──
    const [newTitle, setNewTitle] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [createError, setCreateError] = useState('');

    const createMutation = useMutation({
        mutationFn: (cmd: { title: string; sectionNumber: number; courseId: number }) =>
            sectionService.createSection(cmd),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk });
            setNewTitle('');
            setNewNumber('');
            setCreateError('');
            toast.success('Section created');
        },
        onError: (err: any) => {
            setCreateError(err?.response?.data?.message || err?.message || 'Failed to create section');
        },
    });

    const handleCreate = () => {
        setCreateError('');
        const title = newTitle.trim();
        const num = Number(newNumber);
        if (!title) { setCreateError('Section name is required'); return; }
        if (sections.some(s => s.title.toLowerCase() === title.toLowerCase())) {
            setCreateError('Section name must be unique'); return;
        }
        if (!Number.isFinite(num) || num < 1) { setCreateError('Section number must be greater than 0'); return; }
        createMutation.mutate({ title, sectionNumber: num, courseId: numericCourseId! });
    };

    // ── Edit section ──
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editNumber, setEditNumber] = useState('');
    const [editError, setEditError] = useState('');

    const updateMutation = useMutation({
        mutationFn: ({ id, cmd }: { id: string; cmd: { title: string; sectionNumber: number } }) =>
            sectionService.updateSection(id, cmd),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk });
            setEditingId(null);
            setEditError('');
            toast.success('Section updated');
        },
        onError: (err: any) => {
            setEditError(err?.response?.data?.message || 'Failed to update section');
        },
    });

    const startEdit = (s: SectionDto) => {
        setEditingId(s.id);
        setEditTitle(s.title);
        setEditNumber(String(s.sectionNumber));
        setEditError('');
    };

    const handleUpdate = () => {
        setEditError('');
        const title = editTitle.trim();
        const num = Number(editNumber);
        if (!title) { setEditError('Section name is required'); return; }
        if (sections.some(s => s.id !== editingId && s.title.toLowerCase() === title.toLowerCase())) {
            setEditError('Section name must be unique'); return;
        }
        if (!Number.isFinite(num) || num < 1) { setEditError('Section number must be greater than 0'); return; }
        updateMutation.mutate({ id: editingId!, cmd: { title, sectionNumber: num } });
    };

    // ── Delete section ──
    const deleteMutation = useMutation({
        mutationFn: (id: string) => sectionService.deleteSection(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk });
            toast.success('Section deleted');
        },
        onError: () => toast.error('Failed to delete section'),
    });

    // ── Expanded sections for materials ──
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading sections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-500" /> Sections
            </h2>

            {/* Create section form */}
            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-500" /> Add New Section
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Section name"
                        className="flex-[3] bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
                    />
                    <input
                        value={newNumber}
                        onChange={e => setNewNumber(e.target.value)}
                        type="number"
                        min={1}
                        placeholder="Section #"
                        className="flex-1 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 justify-center"
                    >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                    </button>
                </div>
                {createError && <p className="text-xs font-bold text-red-500 mt-2">{createError}</p>}
            </div>

            {/* Sections list */}
            {sections.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No sections yet</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create your first section above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections
                        .slice()
                        .sort((a, b) => a.sectionNumber - b.sectionNumber)
                        .map(section => (
                            <div key={section.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                {editingId === section.id ? (
                                    /* ── Inline edit ── */
                                    <div className="p-5 space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                placeholder="Section name"
                                                className="flex-[3] bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
                                            />
                                            <input
                                                value={editNumber}
                                                onChange={e => setEditNumber(e.target.value)}
                                                type="number"
                                                min={1}
                                                placeholder="Section #"
                                                className="flex-1 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        {editError && <p className="text-xs font-bold text-red-500">{editError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
                                                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-slate-600">
                                                <X className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Display mode ── */
                                    <>
                                        <div className="p-5 flex items-center gap-4">
                                            <button onClick={() => setExpandedId(expandedId === section.id ? null : section.id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                                {expandedId === section.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                            </button>
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm shrink-0">
                                                {section.sectionNumber}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate">{section.title}</h4>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">
                                                    Section #{section.sectionNumber}
                                                    {section.sectionFiles && ` · ${section.sectionFiles.length} file${section.sectionFiles.length !== 1 ? 's' : ''}`}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => startEdit(section)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { if (window.confirm('Delete this section?')) deleteMutation.mutate(section.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded: Material files */}
                                        {expandedId === section.id && (
                                            <MaterialFilesPanel sectionId={section.id} files={section.sectionFiles ?? []} queryKey={qk} />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   Material Files Panel — upload, list, reorder, delete
   ═══════════════════════════════════════════════════════════ */
const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
const isVideoFile = (contentType: string, fileName: string) => {
    if (contentType.toLowerCase().startsWith('video/')) return true;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return VIDEO_EXTS.includes(ext);
};

function MaterialFilesPanel({ sectionId, files: initialFiles, queryKey }: { sectionId: string; files: SectionFileDto[]; queryKey: unknown[] }) {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [localFiles, setLocalFiles] = useState<SectionFileDto[]>(() =>
        [...initialFiles].sort((a, b) => a.orderIndex - b.orderIndex)
    );
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        setUploading(true);

        try {
            const fileMetas = Array.from(fileList).map(f => ({
                fileName: f.name,
                fileSize: f.size,
                contentType: f.type || 'application/octet-stream',
            }));

            const urls = await sectionService.requestPresignedUrls(sectionId, { files: fileMetas });

            await Promise.all(
                urls.map((url, i) => sectionService.uploadFileToPresignedUrl(url, fileList[i]))
            );

            toast.success(`${fileList.length} file${fileList.length > 1 ? 's' : ''} uploaded`);
            qc.invalidateQueries({ queryKey });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const deleteFileMutation = useMutation({
        mutationFn: (fileId: string) => sectionService.deleteMaterialFile(sectionId, fileId),
        onSuccess: (_d, fileId) => {
            setLocalFiles(prev => prev.filter(f => f.id !== fileId));
            qc.invalidateQueries({ queryKey });
            toast.success('File removed');
        },
        onError: () => toast.error('Failed to delete file'),
    });

    const reorderMutation = useMutation({
        mutationFn: (orderedIds: string[]) => sectionService.reorderMaterialFiles(sectionId, { orderedFilesIds: orderedIds }),
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
        <div className="border-t border-gray-100 dark:border-slate-700/50 px-5 pb-5 pt-4 bg-gray-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Material Files</p>
                <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${uploading ? 'bg-gray-200 dark:bg-slate-700 text-gray-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'}`}>
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            {localFiles.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">No files yet. Upload materials above.</p>
            ) : (
                <div className="space-y-1.5">
                    {localFiles.map((file, idx) => (
                        <div
                            key={file.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={e => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 group hover:border-blue-300 dark:hover:border-slate-500 transition-colors cursor-grab active:cursor-grabbing ${dragIdx === idx ? 'opacity-50' : ''}`}
                        >
                            <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
                            <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.fileName}</p>
                                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase">
                                    {file.contentType?.split('/').pop() || 'file'} · {(file.fileSize / 1024).toFixed(0)} KB
                                </p>
                            </div>
                            {file.fileUrl && (
                                isVideoFile(file.contentType, file.fileName)
                                    ? <button
                                        onClick={() => navigate(`/preview?${new URLSearchParams({ url: file.fileUrl, name: file.fileName, type: file.contentType, size: String(file.fileSize) })}`)}
                                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        title="Play video"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    : <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Preview file">
                                        <Eye className="w-3.5 h-3.5" />
                                      </a>
                            )}
                            {file.fileUrl && (
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" download={file.fileName} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Download file">
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                            )}
                            <button onClick={() => deleteFileMutation.mutate(file.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete file">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
