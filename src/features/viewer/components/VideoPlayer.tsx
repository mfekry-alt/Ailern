import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    Settings,
} from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { cn } from '@/lib/utils';

export function VideoPlayer() {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const { currentFile, setProgress, setStatus } = useViewerStore();

    // Custom UI State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Video.js
    useEffect(() => {
        if (!videoRef.current || !currentFile) return;

        const videoElement = document.createElement('video-js');
        videoElement.classList.add('vjs-fill');
        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
            controls: false, // We use our own React controls
            fluid: true,
            sources: [
                {
                    src: currentFile.url,
                    type: currentFile.url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
                },
            ],
            preload: 'auto',
            html5: {
                vhs: {
                    overrideNative: true,
                },
            },
        }, () => {
            playerRef.current = player;
            setStatus('ready');

            // Event Listeners
            player.on('play', () => setIsPlaying(true));
            player.on('pause', () => setIsPlaying(false));
            player.on('timeupdate', () => {
                setCurrentTime(player.currentTime() || 0);
                setProgress((player.currentTime() || 0) / (player.duration() || 1));
            });
            player.on('durationchange', () => setDuration(player.duration() || 0));
            player.on('volumechange', () => {
                setVolume(player.volume() || 0);
                setIsMuted(player.muted() || false);
            });
            player.on('waiting', () => setIsBuffering(true));
            player.on('playing', () => setIsBuffering(false));
            player.on('ratechange', () => setPlaybackRate(player.playbackRate() || 1));
            player.on('ended', () => {
                setIsPlaying(false);
                setProgress(1);
            });
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [currentFile, setStatus, setProgress]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                if (!showSettings) {
                   setShowControls(false);
                }
            }, 3000);
        }
    }, [isPlaying, showSettings]);

    const handleMouseLeave = useCallback(() => {
        if (isPlaying && !showSettings) {
            setShowControls(false);
        }
    }, [isPlaying, showSettings]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!playerRef.current) return;
            
            switch(e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    playerRef.current.currentTime((playerRef.current.currentTime() || 0) + 5);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    playerRef.current.currentTime((playerRef.current.currentTime() || 0) - 5);
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (playerRef.current.paused()) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        playerRef.current.muted(!playerRef.current.muted());
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const newVolume = parseFloat(e.target.value);
        playerRef.current.volume(newVolume);
        if (newVolume > 0 && playerRef.current.muted()) {
            playerRef.current.muted(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const time = parseFloat(e.target.value);
        playerRef.current.currentTime(time);
        setCurrentTime(time);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const changePlaybackRate = (rate: number) => {
        if (!playerRef.current) return;
        playerRef.current.playbackRate(rate);
        setShowSettings(false);
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => showSettings && setShowSettings(false)}
        >
            {/* Video Container */}
            <div 
                ref={videoRef} 
                className="w-full h-full absolute inset-0 cursor-pointer"
                onClick={togglePlay}
            />

            {/* Buffering Spinner */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Custom Overlay Controls */}
            <div 
                className={cn(
                    "absolute bottom-0 left-0 right-0 px-6 py-8 pt-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
                    (showControls || !isPlaying) ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Seek Bar */}
                <div className="relative w-full h-1.5 group/seek mb-4 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200 group-hover/seek:h-2.5">
                        <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-100"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={togglePlay}
                            className="hover:text-primary-400 transition-colors focus:outline-none"
                        >
                            {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
                        </button>

                        <div className="flex items-center gap-3 group/volume relative">
                            <button onClick={toggleMute} className="hover:text-primary-400 transition-colors focus:outline-none">
                                {isMuted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-in-out flex items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 accent-primary-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="text-sm font-medium tracking-wide font-mono opacity-90">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettings(!showSettings);
                                }}
                                className={cn(
                                    "hover:text-primary-400 transition-colors focus:outline-none",
                                    showSettings && "text-primary-400"
                                )}
                            >
                                <Settings className="h-6 w-6" />
                            </button>
                            
                            {/* Settings Menu */}
                            {showSettings && (
                                <div 
                                    className="absolute bottom-full right-0 mb-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl p-2 min-w-[120px] animate-in slide-in-from-bottom-2 fade-in shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="text-xs font-semibold text-zinc-400 px-3 py-2 uppercase tracking-wider">Speed</div>
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => changePlaybackRate(rate)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-zinc-800",
                                                playbackRate === rate ? "text-primary-400 font-medium bg-zinc-800/50" : "text-zinc-200"
                                            )}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={toggleFullscreen}
                            className="hover:text-primary-400 transition-colors focus:outline-none"
                        >
                            {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
