// components/LoadingSpinner.tsx
import Lottie from 'lottie-react';
import loaderAnimation from '../../public/Loader.json';

const fadeInStyle = `
    @keyframes fadeInLogo {
        from { opacity: 0.7; }
        to { opacity: 1; }
    }
    .logo-fade {
        animation: fadeInLogo 1s ease-in-out infinite;
    }
`;

export const LoadingSpinner = () => (
    <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: 'oklch(20.8% 0.042 265.755)', zIndex: 99 }}
    >
        <style>{fadeInStyle}</style>
        {/* Container with padding and centering */}
        <div className="flex flex-col items-center justify-center gap-4">
            {/* Loader Animation Container - Maintains aspect ratio */}
            <div className="relative w-20 h-20 md:w-24 md:h-24">
                {/* Glow effect background */}
                <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse"
                    style={{
                        background: 'radial-gradient(circle, rgba(74, 144, 226, 0.7) 0%, transparent 70%)',
                    }}
                />

                {/* Lottie Animation Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Lottie
                        animationData={loaderAnimation}
                        loop={true}
                        autoplay={true}
                        className="logo-fade"
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </div>
            </div>
        </div>
    </div>
);
