import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, Monitor } from 'lucide-react';

export const VideoViewerPage = () => {
    const { courseId } = useParams<{ courseId: string; fileId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const videoUrl = searchParams.get('url');
    const decodedUrl = videoUrl ? decodeURIComponent(videoUrl) : null;

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [decodedUrl]);

    const handleBack = () => {
        if (courseId) {
            navigate(`/courses/${courseId}/sections`);
        } else {
            navigate(-1);
        }
    };

    if (!decodedUrl) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-8 transition-colors">
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 p-8 rounded-[2rem] max-w-md text-center shadow-xl">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Video Not Available
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">
                        The video URL is missing or invalid. Please go back and try again.
                    </p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors w-full flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sections
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Sections
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">Loading video...</p>
                    </div>
                )}

                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Monitor className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-white/80 font-bold mb-2">Failed to load video</p>
                        <p className="text-white/50 text-sm mb-4">The video could not be played.</p>
                        <button
                            onClick={handleBack}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                )}

                <video
                    ref={videoRef}
                    src={decodedUrl}
                    controls
                    autoPlay
                    onCanPlay={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                    className={`w-full max-w-6xl rounded-2xl shadow-2xl ${
                        isLoading || hasError ? 'opacity-0' : 'opacity-100'
                    } transition-opacity duration-300`}
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                />
            </div>
        </div>
    );
};
