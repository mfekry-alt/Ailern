import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '@/api/services';
import type { SectionDto, SectionFileDto } from '@/api/services/section.service';
import { toast } from 'sonner';
import { 
    Layers, Plus, Loader2, Pencil, Trash2, X, Upload, 
    GripVertical, FileText, Download, Eye, Search, Edit, Check,
    AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Ctx { courseId: string; numericCourseId: number | null }

const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
const isVideoFile = (contentType: string, fileName: string) => {
    if (contentType.toLowerCase().startsWith('video/')) return true;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return VIDEO_EXTS.includes(ext);
};

const sectionSchema = yup.object().shape({
    title: yup.string()
        .min(3, 'Section name must be at least 3 characters.')
        .required('Section name is required.'),
    files: yup.array().of(yup.mixed<File>()).optional().default([])
});

type SectionFormData = yup.InferType<typeof sectionSchema>;

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

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editModalSection, setEditModalSection] = useState<SectionDto | null>(null);
    const [filesModalSection, setFilesModalSection] = useState<SectionDto | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        if (searchParams.get('create')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('create');
            setSearchParams(nextParams, { replace: true });
        }
    };

    const filteredSections = useMemo(() => {
        const term = search.trim().toLowerCase();
        return [...sections]
            .filter(s => s.title.toLowerCase().includes(term) || s.sectionNumber.toString().includes(term))
            .sort((a, b) => a.sectionNumber - b.sectionNumber);
    }, [sections, search]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading sections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#21A9FF]/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6 text-[#21A9FF]" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sections</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredSections.length} Total</p>
                    </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <Plus className="w-4 h-4" /> Create Section
                </button>
            </div>

            {/* Filter */}
            <div className="relative z-10 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 sm:p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search sections by name..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 placeholder:font-medium"
                    />
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
                        <div key={section.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] flex flex-col group hover:shadow-xl hover:shadow-blue-500/5 hover:border-[#21A9FF]/50 transition-all duration-500 overflow-hidden relative">
                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[9px] font-black text-[#21A9FF] bg-[#21A9FF]/10 px-2 py-1 rounded-lg uppercase tracking-widest">Section {section.sectionNumber}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-2 tracking-tight group-hover:text-[#21A9FF] transition-colors leading-tight">{section.title}</h4>
                                <div className="flex items-center gap-2 mt-auto p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Content</p>
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                                            {section.sectionFiles?.length || 0} Material File{(section.sectionFiles?.length !== 1) ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/40 grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/50 mt-auto">
                                <button onClick={() => setEditModalSection(section)} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#21A9FF] hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Edit">
                                    <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Edit</span>
                                </button>
                                <button onClick={() => setFilesModalSection(section)} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Files">
                                    <FileText className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Files</span>
                                </button>
                                <button onClick={() => setSectionToDelete({ id: section.id, title: section.title })} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Delete">
                                    <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Delete</span>
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
                    onClose={handleCloseCreateModal}
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
                    section={sections.find(s => s.id === filesModalSection.id) || filesModalSection}
                    onClose={() => setFilesModalSection(null)}
                    qk={qk}
                />
            )}

            <ConfirmDialog
                open={sectionToDelete !== null}
                title="Delete this section?"
                description={
                    <>
                        <span className="font-bold text-gray-900 dark:text-white">&ldquo;{sectionToDelete?.title}&rdquo;</span>
                        {' '}will be permanently removed along with all its materials.
                    </>
                }
                confirmText="Delete Section"
                onClose={() => setSectionToDelete(null)}
                onConfirm={() => {
                    if (sectionToDelete) {
                        deleteMutation.mutate(sectionToDelete.id, {
                            onSuccess: () => setSectionToDelete(null)
                        });
                    }
                }}
                isPending={deleteMutation.isPending}
            />

        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   Modals
   ═══════════════════════════════════════════════════════════ */

function CreateSectionModal({ numericCourseId, onClose, qk, sections }: { numericCourseId: number; onClose: () => void; qk: any[]; sections: SectionDto[] }) {
    const qc = useQueryClient();
    const [globalError, setGlobalError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SectionFormData>({
        resolver: yupResolver(sectionSchema) as any,
        defaultValues: {
            title: '',
            files: [],
        }
    });

    const files = (watch('files') || []).filter((f): f is File => !!f);

    const onSubmit: SubmitHandler<SectionFormData> = async (data) => {
        setGlobalError('');
        const t = data.title.trim();
        const num = sections.length + 1;
        
        // Uniqueness check
        if (sections.some(s => s.title.toLowerCase() === t.toLowerCase())) {
            setError('title', { message: 'Section name must be unique' });
            return;
        }

        try {
            const section = await sectionService.createSection({ title: t, sectionNumber: num, courseId: numericCourseId });
            
            if (data.files && data.files.length > 0) {
                const validFiles = data.files.filter((f): f is File => !!f);
                const fileMetas = validFiles.map(f => ({ 
                    fileName: f.name, 
                    fileSize: f.size, 
                    contentType: f.type || 'application/octet-stream' 
                }));
                const urls = await sectionService.requestPresignedUrls(section.id, { files: fileMetas });
                await Promise.all(urls.map((url, i) => sectionService.uploadFileToPresignedUrl(url, validFiles[i])));
            }
            
            toast.success('Section created successfully');
            qc.invalidateQueries({ queryKey: qk });
            onClose();
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                mapServerErrors(err.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(err.response.data.errors), 100);
            }
            setGlobalError(err?.response?.data?.message || err.message || 'Failed to create section');
            qc.invalidateQueries({ queryKey: qk });
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
                
                <form onSubmit={handleSubmit(onSubmit, (err) => scrollToFirstError(err))} className="space-y-4">
                    {globalError && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {globalError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Name</label>
                        <input 
                            {...register('title')}
                            disabled={isSubmitting} 
                            placeholder="e.g. Introduction" 
                            className={`w-full bg-gray-50 dark:bg-slate-900/50 border ${errors.title ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-slate-700 focus:ring-[#21A9FF]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-all`} 
                        />
                        {errors.title && <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Include Files (Optional)</label>
                        <div className="flex flex-col gap-2">
                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-300 dark:border-slate-600'}`}>
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Select Files</span>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            setValue('files', [...files, ...newFiles], { shouldValidate: true });
                                        }
                                    }} 
                                />
                            </label>

                            {files.length > 0 && (
                                <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3 flex-1 truncate pr-2">
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                <FileText className="w-5 h-5 text-[#21A9FF]" />
                                            </div>
                                            <div className="truncate pr-2">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setValue('files', files.filter((_, idx) => idx !== i))} 
                                            className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                    <button 
                        type="button"
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 disabled:opacity-50 order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit(onSubmit, (err) => scrollToFirstError(err))} 
                        disabled={isSubmitting} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 order-1 sm:order-2"
                    >
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
    const [globalError, setGlobalError] = useState('');
    const [existingFiles, setExistingFiles] = useState<SectionFileDto[]>(section.sectionFiles || []);
    const [fileToDelete, setFileToDelete] = useState<{ id: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SectionFormData>({
        resolver: yupResolver(sectionSchema) as any,
        defaultValues: {
            title: section.title,
            files: [],
        }
    });

    const files = (watch('files') || []).filter((f): f is File => !!f);

    const removeExistingFile = (file: SectionFileDto) => {
        setFileToDelete({ id: file.id, name: file.fileName });
    };

    const onSubmit: SubmitHandler<SectionFormData> = async (data) => {
        setGlobalError('');
        const t = data.title.trim();
        const num = section.sectionNumber;

        // Uniqueness check
        if (sections.some(s => s.id !== section.id && s.title.toLowerCase() === t.toLowerCase())) {
            setError('title', { message: 'Section name must be unique' });
            return;
        }

        try {
            await sectionService.updateSection(section.id, { id: section.id, title: t, sectionNumber: num });

            if (data.files && data.files.length > 0) {
                const validFiles = data.files.filter((f): f is File => !!f);
                const fileMetas = validFiles.map(f => ({ 
                    fileName: f.name, 
                    fileSize: f.size, 
                    contentType: f.type || 'application/octet-stream' 
                }));
                const urls = await sectionService.requestPresignedUrls(section.id, { files: fileMetas });
                await Promise.all(urls.map((url, i) => sectionService.uploadFileToPresignedUrl(url, validFiles[i])));
            }

            toast.success('Section updated successfully');
            qc.invalidateQueries({ queryKey: qk });
            onClose();
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                mapServerErrors(err.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(err.response.data.errors), 100);
            }
            setGlobalError(err?.response?.data?.message || 'Failed to update section');
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

                <form onSubmit={handleSubmit(onSubmit, (err) => scrollToFirstError(err))} className="space-y-4">
                    {globalError && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {globalError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Section Name</label>
                        <input 
                            {...register('title')}
                            disabled={isSubmitting} 
                            placeholder="Section name" 
                            className={`w-full bg-gray-50 dark:bg-slate-900/50 border ${errors.title ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-slate-700 focus:ring-[#21A9FF]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-all`} 
                        />
                        {errors.title && <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{errors.title.message}</p>}
                    </div>

                    {existingFiles.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Existing Files</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {existingFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50/20 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3.5 flex-1 truncate pr-2">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#21A9FF]/20 dark:border-blue-500/10">
                                                <FileText className="w-5 h-5 text-[#21A9FF]" />
                                            </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-[#21A9FF] truncate">{file.fileName}</p>
                                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter">Uploaded</span>
                                                </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => removeExistingFile(file)} 
                                            className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm" 
                                            title="Remove File"
                                        >
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
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            setValue('files', [...files, ...newFiles], { shouldValidate: true });
                                        }
                                    }} 
                                />
                            </label>
                            {files.length > 0 && (
                                <div className="space-y-2 mt-3 max-h-40 overflow-y-auto pr-1">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3.5 flex-1 truncate pr-2">
                                                <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                    <FileText className="w-5 h-5 text-[#21A9FF]" />
                                                </div>
                                                <div className="truncate pr-2">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setValue('files', files.filter((_, idx) => idx !== i))} 
                                                className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
            </form>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <button 
                    type="button"
                    onClick={onClose} 
                    disabled={isSubmitting} 
                    className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 disabled:opacity-50 order-2 sm:order-1"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit(onSubmit, (err) => scrollToFirstError(err))} 
                    disabled={isSubmitting} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 order-1 sm:order-2"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 
                    Save Changes
                </button>
            </div>

            <ConfirmDialog
                open={fileToDelete !== null}
                title="Remove this file?"
                description={
                    <>
                        <span className="font-bold text-gray-900 dark:text-white">&ldquo;{fileToDelete?.name}&rdquo;</span>
                        {' '}will be permanently deleted from this section.
                    </>
                }
                confirmText="Delete File"
                onClose={() => setFileToDelete(null)}
                onConfirm={async () => {
                    if (fileToDelete) {
                        try {
                            await sectionService.deleteMaterialFile(section.id, fileToDelete.id);
                            setExistingFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
                            qc.invalidateQueries({ queryKey: qk });
                            toast.success('File deleted');
                            setFileToDelete(null);
                        } catch (err) {
                            toast.error('Failed to delete file');
                        }
                    }
                }}
            />
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

    useEffect(() => {
        setLocalFiles([...(section.sectionFiles || [])].sort((a, b) => a.orderIndex - b.orderIndex));
    }, [section.sectionFiles]);

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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk });
            toast.success('Files reordered');
        },
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
                                        <GripVertical className="w-4 h-4 text-[#21A9FF] shrink-0 cursor-grab" />
                                        <div className="w-11 h-11 bg-[#21A9FF] rounded-[1rem] flex items-center justify-center shrink-0 shadow-md shadow-[#21A9FF]/20">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="truncate pr-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{file.fileName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {file.fileUrl && (
                                            isVideoFile(file.contentType, file.fileName) ? (
                                                <button onClick={() => navigate(`/preview?${new URLSearchParams({ url: file.fileUrl, name: file.fileName, type: file.contentType, size: String(file.fileSize) })}`)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 text-[#21A9FF] rounded-xl hover:bg-[#21A9FF]/10 transition-all shadow-sm border border-gray-100 dark:border-slate-700 hover:border-[#21A9FF]/20" title="Play Video">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 text-[#21A9FF] rounded-xl hover:bg-[#21A9FF]/10 transition-all shadow-sm border border-gray-100 dark:border-slate-700 hover:border-[#21A9FF]/20" title="Preview">
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
