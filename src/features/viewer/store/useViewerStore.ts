import { create } from 'zustand';

export type FileType = 'video' | 'pdf' | 'other';

export interface ViewerFile {
    id: string;
    url: string;
    name: string;
    type: FileType;
    size?: number; // in bytes
}

interface ViewerState {
    currentFile: ViewerFile | null;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
    progress: number; // 0 to 1 for video, or page number for pdf

    setFile: (file: ViewerFile) => void;
    setStatus: (status: 'idle' | 'loading' | 'ready' | 'error', error?: string | null) => void;
    setProgress: (progress: number) => void;
    clear: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
    currentFile: null,
    status: 'idle',
    error: null,
    progress: 0,

    setFile: (file) =>
        set({ currentFile: file, status: 'loading', error: null, progress: 0 }),
    setStatus: (status, error?: string | null) =>
        set({ status, error: error === null || error === undefined ? null : error }),
    setProgress: (progress) => set({ progress }),
    clear: () => set({ currentFile: null, status: 'idle', error: null, progress: 0 }),
}));
