import React, { useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Upload, 
    FileText, 
    File as FileIcon, 
    X, 
    Trash2, 
    Eye, 
    Sparkles, 
    AlertCircle, 
    CheckCircle2, 
    Loader2,
    FilePieChart,
    Plus,
    Clock,
    FileBadge,
    Database,
    Search,
    Filter,
    BrainCircuit
} from 'lucide-react';
import { PDFThumbnail } from '@/components/PDFThumbnail';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

// --- Interfaces ---

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
    course: any;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    url?: string;
}

// --- Helpers ---

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileIcon className="w-8 h-8 text-blue-500" />;
    if (['ppt', 'pptx'].includes(ext || '')) return <FileBadge className="w-8 h-8 text-orange-500" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
};

export const CourseAIAssistantTab = () => {
    const { courseId } = useOutletContext<CourseContext>();
    
    // --- State ---
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Handlers ---

    const validateFile = (file: File) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'text/plain'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.ppt') && !file.name.endsWith('.pptx')) {
            return 'Unsupported file type. Please upload PDF, DOCX, or PPT.';
        }
        if (file.size > maxSize) {
            return 'File too large. Maximum size is 10MB.';
        }
        return null;
    };

    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileList = Array.from(files);
        
        fileList.forEach(file => {
            const error = validateFile(file);
            const uploadId = Math.random().toString(36).substring(7);

            if (error) {
                toast.error(error, { description: file.name });
                return;
            }

            // Create uploading entry
            const newFile: UploadingFile = {
                id: uploadId,
                file,
                progress: 0,
                status: 'uploading'
            };

            setUploadingFiles(prev => [...prev, newFile]);

            // Simulate upload (replace with actual API call)
            simulateUpload(newFile);
        });
    }, []);

    const simulateUpload = (uploadingFile: UploadingFile) => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                
                // Finalize upload
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
                setUploadedFiles(prev => [
                    {
                        id: Math.random().toString(36).substring(7),
                        name: uploadingFile.file.name,
                        size: uploadingFile.file.size,
                        type: uploadingFile.file.type,
                        url: URL.createObjectURL(uploadingFile.file),
                        uploadDate: new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    },
                    ...prev
                ]);
                toast.success('File uploaded successfully', { description: uploadingFile.file.name });
            } else {
                setUploadingFiles(prev => prev.map(f => 
                    f.id === uploadingFile.id ? { ...f, progress: Math.round(currentProgress) } : f
                ));
            }
        }, 300);
    };

    const cancelUpload = (id: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== id));
        toast.info('Upload cancelled');
    };

    const deleteFile = (id: string, name: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
        toast.success('File deleted', { description: name });
    };

    // --- Drag and Drop Logic ---

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const filteredFiles = uploadedFiles.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Powered
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        AI Exam <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Assistant</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Upload course materials like lecture notes, presentations, or PDFs. Our AI will analyze them to help you generate comprehensive exams and assist in grading student answers accurately.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Upload & Progress */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Upload Card */}
                    <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-300 overflow-hidden shadow-sm">
                        <CardContent className="p-0">
                            <div 
                                className={`p-8 flex flex-col items-center text-center gap-4 cursor-pointer transition-colors ${isDragging ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-indigo-500 text-white scale-110 rotate-3 shadow-xl shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <Upload className={`w-10 h-10 ${isDragging ? 'animate-bounce' : ''}`} />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Upload Materials</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        Drag & drop files here or <span className="text-indigo-600 dark:text-indigo-400 font-bold">browse</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    {['PDF', 'DOCX', 'PPT'].map(type => (
                                        <span key={type} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700 uppercase tracking-tighter">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2">Max 10MB per file</p>
                                
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    multiple 
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Uploading List */}
                    {uploadingFiles.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Uploading ({uploadingFiles.length})</h3>
                            <div className="space-y-3">
                                {uploadingFiles.map(file => (
                                    <div key={file.id} className="bg-white dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 animate-in slide-in-from-left-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                                    <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{file.file.name}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatFileSize(file.file.size)} • {file.progress}%</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => cancelUpload(file.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                                style={{ width: `${file.progress}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Uploaded Files List */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Search & Stats */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search materials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-6 px-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Files</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{uploadedFiles.length}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Storage</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{formatFileSize(uploadedFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Files List */}
                    {uploadedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6">
                            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center relative">
                                <Database className="w-14 h-14 text-slate-200 dark:text-slate-700" />
                                <div className="absolute top-2 right-2 p-2 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30 animate-bounce">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">No files uploaded yet</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                                    Start by uploading course materials to help the AI assistant understand your course content.
                                </p>
                            </div>
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Upload First File
                            </Button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <Search className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold">No materials match "{searchQuery}"</p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="text-indigo-600 dark:text-indigo-400 text-sm font-black hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredFiles.map((file, idx) => (
                                <div 
                                    key={file.id} 
                                    className="group bg-white dark:bg-slate-900/60 p-4 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 animate-in zoom-in-95"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Preview Section - The "First Page" */}
                                    <div className="relative h-44 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] overflow-hidden mb-5 border border-slate-100 dark:border-slate-700/50 group-hover:shadow-inner transition-all">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                            {getFileIcon(file.name)}
                                        </div>
                                        
                                        {/* Real PDF Thumbnail Rendering */}
                                        <div className="absolute inset-0 p-3">
                                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500 origin-bottom">
                                                {file.url && file.name.toLowerCase().endsWith('.pdf') ? (
                                                    <PDFThumbnail url={file.url} className="w-full h-full" />
                                                ) : (
                                                    /* Fallback for non-PDF files or missing URL */
                                                    <div className="p-4 space-y-2 h-full flex flex-col justify-center">
                                                        <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                                        <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full" />
                                                        <div className="h-1.5 w-5/6 bg-slate-50 dark:bg-slate-800/50 rounded-full" />
                                                        <div className="h-24 w-full bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10 flex items-center justify-center mt-4">
                                                            {getFileIcon(file.name)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Actions overlay */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <button 
                                                className="p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 dark:text-slate-300 rounded-2xl shadow-lg border border-white dark:border-slate-700 transition-all hover:scale-110 active:scale-95"
                                                title="Preview Full Screen"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteFile(file.id, file.name)}
                                                className="p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-600 hover:text-red-500 rounded-2xl shadow-lg border border-white dark:border-slate-700 transition-all hover:scale-110 active:scale-95"
                                                title="Delete Material"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1 px-1">
                                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight" title={file.name}>
                                            {file.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {file.uploadDate}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <span className="flex items-center gap-1">
                                                <FilePieChart className="w-3 h-3" />
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between px-1">
                                        <div className="flex -space-x-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                                            <div className="w-7 h-7 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />
                                            <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20">
                                            Analyzed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant Context Footer */}
            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                        <BrainCircuit className="w-12 h-12 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h3 className="text-2xl font-black">Ready to generate?</h3>
                        <p className="text-indigo-100 font-medium">
                            Once your materials are uploaded, you can head to the Quizzes or Assignments tab to start generating smart assessments powered by this data.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl shadow-black/10 hover:shadow-white/20 transition-all hover:-translate-y-1 active:scale-95">
                        Go to Quizzes
                    </button>
                </div>
            </div>
        </div>
    );
};
