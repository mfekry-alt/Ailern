/**
 * Plyr-styled Video Player with watermark and download functionality
 * Custom implementation with logo-based color theme
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Settings, Check } from 'lucide-react';

interface PlyrVideoPlayerProps {
    src: string;
    title?: string;
    onDownload?: () => void;
    /** Callback for video progress updates (currentTime in seconds, immediate flag) */
    onProgress?: (currentTime: number, immediate?: boolean) => void;
    /** Initial playback position in seconds */
    initialTime?: number;
}

// Logo-based purple-blue color palette (Ailern brand identity)
const LOGO_COLORS = {
    primary: '#a6419e',      // Deep navy (أساس اللوجو)
    secondary: '#1B82BD',    // Blue (موجود في العناصر)
    accent: '#6E2C94',       // Soft violet (بديل أهدى من البنفسجي الحالي)
    gradient: 'linear-gradient(135deg, #A6419E 25%, #6E2C94 50%, #1B82BD 100%)',
};

const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
        return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlyrVideoPlayer = ({
    src,
    title,
    onDownload,
    onProgress,
    initialTime = 0,
}: PlyrVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hasResumedRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState(0);

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
    
    // Ref to store callbacks without triggering effect re-runs
    const onProgressRef = useRef(onProgress);
    onProgressRef.current = onProgress;

    const scheduleHideControls = useCallback(() => {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        if (isPlaying) {
            hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    const showControlsHandler = useCallback(() => {
        setShowControls(true);
        scheduleHideControls();
    }, [scheduleHideControls]);
    
    // Refs to access latest callbacks in event listeners without effect re-runs
    const scheduleHideControlsRef = useRef(scheduleHideControls);
    scheduleHideControlsRef.current = scheduleHideControls;
    const showControlsHandlerRef = useRef(showControlsHandler);
    showControlsHandlerRef.current = showControlsHandler;

    // Reset resume flag when initialTime changes (allows re-navigation to different video)
    useEffect(() => {
        hasResumedRef.current = false;
    }, [initialTime, src]);

    // Set initial playback position when video loads - only runs ONCE per initialTime change
    useEffect(() => {
        const video = videoRef.current;
        if (!video || hasResumedRef.current) return;

        const handleLoadedMetadata = () => {
            if (initialTime > 0 && !hasResumedRef.current) {
                hasResumedRef.current = true;
                video.currentTime = initialTime;
                setCurrentTime(initialTime);
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        // If video is already loaded, set time immediately
        if (video.readyState >= 1 && initialTime > 0 && !hasResumedRef.current) {
            hasResumedRef.current = true;
            video.currentTime = initialTime;
            setCurrentTime(initialTime);
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [initialTime, src]);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const handleTimeUpdate = () => {
            const time = video.currentTime;
            setCurrentTime(time);
            // Call progress callback for tracking (throttled in parent)
            onProgressRef.current?.(time, false);
        };
        const handleDurationChange = () => setDuration(video.duration || 0);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => {
            setIsPlaying(false);
            // Trigger immediate save on pause
            onProgressRef.current?.(video.currentTime, true);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            // Trigger immediate save on video end
            onProgressRef.current?.(video.currentTime, true);
        };
        const handleVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };
        const handleWaiting = () => setIsBuffering(true);
        const handleCanPlay = () => setIsBuffering(false);
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            // Reset controls visibility when entering/exiting fullscreen
            setShowControls(true);
            if (isFs && isPlaying) {
                scheduleHideControlsRef.current();
            }
        };

        // Fullscreen-specific mouse tracking
        const handleFullscreenMouseMove = () => {
            if (document.fullscreenElement) {
                showControlsHandlerRef.current();
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('volumechange', handleVolumeChange);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        // Add mouse tracking for fullscreen mode on container
        container.addEventListener('mousemove', handleFullscreenMouseMove);
        container.addEventListener('mouseenter', showControlsHandlerRef.current);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('volumechange', handleVolumeChange);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            container.removeEventListener('mousemove', handleFullscreenMouseMove);
            container.removeEventListener('mouseenter', showControlsHandlerRef.current);
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        };
    // Empty dependency array - setup listeners once on mount
    // Callbacks are accessed via refs to always get latest version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        video.muted = newVolume === 0;
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const progress = progressRef.current;
        const video = videoRef.current;
        if (!progress || !video) return;
        
        const rect = progress.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * duration;
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const progress = progressRef.current;
        if (!progress || !duration) return;
        
        const rect = progress.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        setHoverPosition(e.clientX - rect.left);
        setHoverTime(pos * duration);
    };

    const handleSpeedChange = (speed: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = speed;
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const buffered = videoRef.current?.buffered.length ? 
        (videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / duration) * 100 : 0;

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-black rounded-2xl overflow-hidden group"
            onMouseMove={showControlsHandler}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onMouseEnter={showControlsHandler}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
                preload="metadata"
            />

            {/* Logo Watermark Overlay - Centered with brand glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Centered logo watermark with purple-blue glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{
                        opacity: 0.12,
                        filter: 'drop-shadow(0 0 50px rgba(165, 56, 166, 0.5)) drop-shadow(0 0 100px rgba(23, 113, 175, 0.3))',
                    }}
                >
                    <img
                        src="/logo-removebg.png"
                        alt=""
                        className="w-56 h-56 object-contain"
                        style={{
                            maskImage: 'linear-gradient(135deg, rgba(165, 56, 166, 0.95) 0%, rgba(124, 58, 237, 0.8) 50%, rgba(23, 113, 175, 0.7) 100%)',
                            WebkitMaskImage: 'linear-gradient(135deg, rgba(165, 56, 166, 0.95) 0%, rgba(124, 58, 237, 0.8) 50%, rgba(23, 113, 175, 0.7) 100%)',
                        }}
                    />
                </div>
            </div>

            {/* Big Play Button (center) */}
            {!isPlaying && !isBuffering && (
                <button
                    onClick={togglePlay}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                             w-20 h-20 rounded-full flex items-center justify-center
                             transition-all duration-300 hover:scale-110 z-10"
                    style={{
                        background: LOGO_COLORS.gradient,
                        boxShadow: '0 10px 50px rgba(91, 33, 182, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)',
                    }}
                >
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                </button>
            )}

            {/* Loading Spinner */}
            {isBuffering && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div
                        className="w-12 h-12 border-4 border-white/20 rounded-full animate-spin"
                        style={{ borderTopColor: '#A538A6' }}
                    />
                </div>
            )}

            {/* Title Bar */}
            {title && (
                <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent
                               transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
                </div>
            )}

            {/* Controls Bar - Netflix-like auto hide with smooth transitions */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent
                          transition-all duration-500 ease-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                
                {/* Progress Bar */}
                <div className="px-4 pt-4 pb-2">
                    <div 
                        ref={progressRef}
                        className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress"
                        onClick={handleProgressClick}
                        onMouseMove={handleProgressHover}
                        onMouseLeave={() => setHoverTime(null)}
                    >
                        {/* Buffered Progress */}
                        <div 
                            className="absolute h-full bg-white/30 rounded-full"
                            style={{ width: `${buffered}%` }}
                        />
                        {/* Played Progress */}
                        <div
                            className="absolute h-full rounded-full"
                            style={{
                                width: `${progress}%`,
                                background: LOGO_COLORS.gradient,
                            }}
                        />
                        {/* Hover Preview */}
                        {hoverTime !== null && (
                            <>
                                <div 
                                    className="absolute h-full bg-white/40 rounded-full"
                                    style={{ width: `${(hoverTime / duration) * 100}%` }}
                                />
                                <div 
                                    className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded 
                                             transform -translate-x-1/2 pointer-events-none"
                                    style={{ left: hoverPosition }}
                                >
                                    {formatTime(hoverTime)}
                                </div>
                            </>
                        )}
                        {/* Scrubber Handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                                     shadow-md opacity-0 group-hover/progress:opacity-100 transition-all duration-200
                                     transform -translate-x-1/2 group-hover/progress:scale-110"
                            style={{
                                left: `${progress}%`,
                                background: LOGO_COLORS.gradient,
                                boxShadow: '0 0 12px rgba(165, 56, 166, 0.8)',
                            }}
                        />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2 px-4 pb-4">
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="p-2 text-white transition-colors"
                        style={{ '--hover-color': LOGO_COLORS.accent } as React.CSSProperties}
                        onMouseEnter={(e) => (e.currentTarget.style.color = LOGO_COLORS.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    {/* Time Display */}
                    <span className="text-white text-sm font-medium tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Volume Control - Integrated inline with control bar */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className="p-2 text-white transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#A538A6')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                        >
                            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        {/* Inline Volume Slider */}
                        <div
                            className="relative w-16 h-1 rounded-full cursor-pointer group/volume"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                const newVolume = Math.max(0, Math.min(1, pos));
                                if (videoRef.current) {
                                    videoRef.current.volume = newVolume;
                                    videoRef.current.muted = newVolume === 0;
                                }
                            }}
                        >
                            {/* Track background */}
                            <div className="absolute inset-0 rounded-full bg-white/20" />
                            {/* Filled progress */}
                            <div
                                className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-150"
                                style={{
                                    width: `${(isMuted ? 0 : volume) * 100}%`,
                                    background: LOGO_COLORS.gradient,
                                }}
                            />
                            {/* Hover handle */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover/volume:opacity-100 transition-opacity"
                                style={{
                                    left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)`,
                                    background: '#A538A6',
                                    boxShadow: '0 0 8px rgba(165, 56, 166, 0.8)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Playback Speed */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="flex items-center gap-1 px-2 py-1 text-white text-sm font-medium transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.color = LOGO_COLORS.accent)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                        >
                            <Settings className="w-4 h-4" />
                            {playbackSpeed}x
                        </button>

                        {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-xl">
                                {speeds.map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => handleSpeedChange(speed)}
                                        className="flex items-center justify-between px-4 py-2 text-sm w-full text-white hover:bg-white/10 transition-colors"
                                        style={playbackSpeed === speed ? { color: '#A538A6' } : undefined}
                                    >
                                        {speed}x
                                        {playbackSpeed === speed && <Check className="w-4 h-4 ml-2" style={{ color: '#A538A6' }} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Download Button */}
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            className="p-2 text-white transition-colors"
                            title="Download video"
                            onMouseEnter={(e) => (e.currentTarget.style.color = LOGO_COLORS.accent)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    )}

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-white transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.color = LOGO_COLORS.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlyrVideoPlayer;
