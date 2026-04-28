import { create } from 'zustand';

export type FileType = 'video' | 'pdf' | 'image' | 'audio' | 'other';

export interface ViewerFile {
    id: string;
    url: string;
    name: string;
    type: FileType;
    size?: number;
}

const storageKey = (id: string) => `ailern-viewer-progress-${id}`;

interface ViewerState {
    currentFile: ViewerFile | null;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
    progress: number;
    completed: boolean;

    setFile: (file: ViewerFile) => void;
    setStatus: (status: 'idle' | 'loading' | 'ready' | 'error', error?: string | null) => void;
    setProgress: (progress: number) => void;
    saveProgress: (progress: number) => void;
    loadSavedProgress: (fileId: string) => number;
    markCompleted: () => void;
    clear: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
    currentFile: null,
    status: 'idle',
    error: null,
    progress: 0,
    completed: false,

    setFile: (file) => {
        const saved = get().loadSavedProgress(file.id);
        set({
            currentFile: file,
            status: 'loading',
            error: null,
            progress: saved,
            completed: false,
        });
    },

    setStatus: (status, error = null) => set({ status, error }),

    setProgress: (progress) => set({ progress }),

    saveProgress: (progress) => {
        const { currentFile } = get();
        if (!currentFile) return;
        try {
            localStorage.setItem(storageKey(currentFile.id), String(progress));
        } catch {
            // storage quota exceeded — silently ignore
        }
        set({ progress });
    },

    loadSavedProgress: (fileId) => {
        try {
            const raw = localStorage.getItem(storageKey(fileId));
            if (!raw) return 0;
            const val = parseFloat(raw);
            return Number.isFinite(val) && val >= 0 ? val : 0;
        } catch {
            return 0;
        }
    },

    markCompleted: () => set({ completed: true }),

    clear: () =>
        set({ currentFile: null, status: 'idle', error: null, progress: 0, completed: false }),
}));
