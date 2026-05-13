import { useRef, useState, useEffect } from 'react';
import { Drawer } from './Drawer';
import { Eraser, Pencil, RotateCcw, Save, Trash2 } from 'lucide-react';

interface WhiteboardDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (imageDataUrl: string) => void;
}

export const WhiteboardDrawer = ({ isOpen, onClose, onApply }: WhiteboardDrawerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#21A9FF');
    const [lineWidth, setLineWidth] = useState(3);

    useEffect(() => {
        if (isOpen) {
            // Give it a moment to render then initialize
            setTimeout(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                
                // Clear and set defaults
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
            }, 100);
        }
    }, [isOpen]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleApply = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onApply(canvas.toDataURL());
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Whiteboard / Sketch"
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
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Insert into Question
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Tools */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-1">
                        {['#000000', '#21A9FF', '#F43F5E', '#10B981'].map(c => (
                            <button
                                key={c}
                                onClick={() => {
                                    setColor(c);
                                    if (canvasRef.current) canvasRef.current.getContext('2d')!.strokeStyle = c;
                                }}
                                className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${color === c ? 'scale-110 border-white ring-2 ring-blue-500 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button onClick={clear} className="p-2 text-slate-500 hover:text-rose-500 transition-colors" title="Clear All">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Container */}
                <div className="relative aspect-video bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-inner">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={450}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair touch-none"
                    />
                    {!isDrawing && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Start Drawing...</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Tip: Use your mouse or stylus to sketch diagrams. When ready, click "Insert" to add it to your question text.
                </div>
            </div>
        </Drawer>
    );
};
