import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Loader2,
    CheckCircle,
} from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { cn } from '@/lib/utils';

const SAVE_INTERVAL_MS = 5000;
const COMPLETION_THRESHOLD = 0.9;

export function VideoPlayer() {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const saveIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const {
        currentFile,
        completed,
        saveProgress,
        loadSavedProgress,
        markCompleted,
        setStatus,
    } = useViewerStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Initialize Video.js
    useEffect(() => {
        if (!videoRef.current || !currentFile) return;

        const savedRatio = loadSavedProgress(currentFile.id);
        const videoElement = document.createElement('video-js');
        videoElement.classList.add('vjs-fill');
        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
            controls: false,
            fluid: true,
            sources: [
                {
                    src: currentFile.url,
                    type: currentFile.url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
                },
            ],
            preload: 'auto',
            html5: { vhs: { overrideNative: true } },
        }, () => {
            playerRef.current = player;
            setStatus('ready');

            player.on('play', () => { setIsPlaying(true); setHasStarted(true); });
            player.on('pause', () => setIsPlaying(false));
            player.on('timeupdate', () => {
                const ct = player.currentTime() || 0;
                const dur = player.duration() || 1;
                setCurrentTime(ct);
                const ratio = ct / dur;
                saveProgress(ratio);
                if (ratio >= COMPLETION_THRESHOLD) markCompleted();
            });
            player.on('durationchange', () => {
                const dur = player.duration() || 0;
                setDuration(dur);
                if (savedRatio > 0 && savedRatio < COMPLETION_THRESHOLD) {
                    player.currentTime(savedRatio * dur);
                }
            });
            player.on('volumechange', () => {
                setVolume(player.volume() || 0);
                setIsMuted(player.muted() || false);
            });
            player.on('waiting', () => setIsBuffering(true));
            player.on('playing', () => setIsBuffering(false));
            player.on('ratechange', () => setPlaybackRate(player.playbackRate() || 1));
            player.on('ended', () => {
                setIsPlaying(false);
                saveProgress(1);
                markCompleted();
            });
        });

        saveIntervalRef.current = setInterval(() => {
            if (playerRef.current) {
                const ct = playerRef.current.currentTime() || 0;
                const dur = playerRef.current.duration() || 1;
                saveProgress(ct / dur);
            }
        }, SAVE_INTERVAL_MS);

        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [currentFile, setStatus, saveProgress, markCompleted, loadSavedProgress]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, []);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                if (!showSpeedMenu) setShowControls(false);
            }, 3000);
        }
    }, [isPlaying, showSpeedMenu]);

    const handleMouseLeave = useCallback(() => {
        if (isPlaying && !showSpeedMenu) setShowControls(false);
    }, [isPlaying, showSpeedMenu]);

    // Keyboard shortcuts
    useEffect(() => {
        const togglePlayRef = () => {
            const p = playerRef.current;
            if (!p) return;
            p.paused() ? p.play() : p.pause();
        };
        const toggleMuteRef = () => {
            const p = playerRef.current;
            if (!p) return;
            p.muted(!p.muted());
        };
        const toggleFsRef = () => {
            if (!containerRef.current) return;
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!playerRef.current) return;
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlayRef();
                    break;
                case 'ArrowRight':
                case 'l':
                    e.preventDefault();
                    playerRef.current.currentTime((playerRef.current.currentTime() || 0) + (e.key === 'l' ? 10 : 5));
                    break;
                case 'ArrowLeft':
                case 'j':
                    e.preventDefault();
                    playerRef.current.currentTime((playerRef.current.currentTime() || 0) - (e.key === 'j' ? 10 : 5));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    playerRef.current.volume(Math.min((playerRef.current.volume() || 0) + 0.1, 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    playerRef.current.volume(Math.max((playerRef.current.volume() || 0) - 0.1, 0));
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFsRef();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMuteRef();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const togglePlay = () => {
        if (!playerRef.current) return;
        playerRef.current.paused() ? playerRef.current.play() : playerRef.current.pause();
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        playerRef.current.muted(!playerRef.current.muted());
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const v = parseFloat(e.target.value);
        playerRef.current.volume(v);
        if (v > 0 && playerRef.current.muted()) playerRef.current.muted(false);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const t = parseFloat(e.target.value);
        playerRef.current.currentTime(t);
        setCurrentTime(t);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch { /* ignore */ }
    };

    const changePlaybackRate = (rate: number) => {
        if (!playerRef.current) return;
        playerRef.current.playbackRate(rate);
        setShowSpeedMenu(false);
    };

    const formatTime = (s: number) => {
        if (!Number.isFinite(s) || s < 0) return '00:00';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const remaining = Math.max(0, duration - currentTime);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => showSpeedMenu && setShowSpeedMenu(false)}
        >
            {/* Video element */}
            <div ref={videoRef} className="w-full h-full absolute inset-0 cursor-pointer" onClick={togglePlay} />

            {/* Big play overlay before start */}
            {!hasStarted && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors pointer-events-auto"
                    >
                        <Play className="w-10 h-10 text-white fill-current ml-1" />
                    </button>
                </div>
            )}

            {/* Completion badge */}
            {completed && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                </div>
            )}

            {/* Buffering */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-6 pt-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30",
                    (showControls || !isPlaying) ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Timeline */}
                <div className="relative w-full h-2 group/seek mb-5 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        step={0.1}
                        onChange={handleSeek}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200 group-hover/seek:h-2.5">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-100"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div
                        className="absolute h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity duration-200 -ml-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${progressPercent}%` }}
                    />
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <button onClick={togglePlay} className="hover:text-blue-400 transition-colors focus:outline-none">
                            {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume relative">
                            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors focus:outline-none">
                                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-in-out flex items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 accent-blue-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="text-xs sm:text-sm font-medium tracking-wide font-mono opacity-90 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                            <span className="hidden sm:inline text-white/50 ml-2">(-{formatTime(remaining)})</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-5">
                        {/* Speed */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                                className={cn("hover:text-blue-400 transition-colors focus:outline-none text-xs font-semibold px-2 py-1 rounded bg-white/10", showSpeedMenu && "text-blue-400")}
                            >
                                {playbackRate}x
                            </button>
                            {showSpeedMenu && (
                                <div
                                    className="absolute bottom-full right-0 mb-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl p-2 min-w-[140px] animate-in slide-in-from-bottom-2 fade-in shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="text-[10px] font-semibold text-zinc-400 px-3 py-2 uppercase tracking-wider">Playback Speed</div>
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => changePlaybackRate(rate)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-zinc-800",
                                                playbackRate === rate ? "text-blue-400 font-medium bg-zinc-800/50" : "text-zinc-200"
                                            )}
                                        >
                                            {rate === 1 ? 'Normal' : `${rate}x`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors focus:outline-none">
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
