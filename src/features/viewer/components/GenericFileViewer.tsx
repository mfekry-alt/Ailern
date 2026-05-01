import { Download, FileIcon } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { Button } from '@/components/ui/Button';

export function GenericFileViewer() {
    const { currentFile } = useViewerStore();

    if (!currentFile) return null;

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-zinc-950 p-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col items-center max-w-sm w-full text-center transition-all duration-300 hover:shadow-md">
                <div className="h-24 w-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FileIcon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {currentFile.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 font-medium">
                    {formatSize(currentFile.size)}
                </p>

                <Button
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                        // Trigger download
                        const a = document.createElement('a');
                        a.href = currentFile.url;
                        a.download = currentFile.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                >
                    <Download className="h-5 w-5" />
                    Download File
                </Button>
            </div>
        </div>
    );
}
