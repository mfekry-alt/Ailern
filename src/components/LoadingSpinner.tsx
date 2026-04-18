import Lottie from 'lottie-react';
import loaderAnimation from '@/assets/Loader.json';

interface LoadingSpinnerProps {
    fading?: boolean;
}

export const LoadingSpinner = ({ fading = false }: LoadingSpinnerProps) => (
    <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a]"
        style={{
            opacity: fading ? 0 : 1,
            transition: 'opacity 400ms ease-out',
            pointerEvents: fading ? 'none' : 'auto',
        }}
    >
        {/* Glow effect */}
        <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-40 animate-pulse"
            style={{
                background: 'radial-gradient(circle, rgba(15,90,156,0.6) 0%, rgba(116,56,139,0.3) 50%, transparent 70%)',
            }}
        />

        {/* Lottie animation — 200×200, scales down on small screens */}
        <div className="relative w-[200px] h-[200px] max-w-[60vw] max-h-[60vw]">
            <Lottie
                animationData={loaderAnimation}
                loop
                autoplay
                renderer="svg"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    </div>
);
