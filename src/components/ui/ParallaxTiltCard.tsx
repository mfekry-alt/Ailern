import { useMemo, useRef, useState, type HTMLAttributes, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

const RESET_TRANSFORM = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

export interface ParallaxTiltCardProps extends HTMLAttributes<HTMLDivElement> {
    intensity?: number;
    scale?: number;
}

export const ParallaxTiltCard = ({
    children,
    className,
    style,
    intensity = 5,
    scale = 1.006,
    onMouseMove,
    onMouseLeave,
    ...props
}: ParallaxTiltCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState(RESET_TRANSFORM);
    const [isResetting, setIsResetting] = useState(true);

    const prefersReducedMotion = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    );

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        onMouseMove?.(e);
        if (prefersReducedMotion || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (((y - centerY) / centerY) * -intensity).toFixed(2);
        const rotateY = (((x - centerX) / centerX) * -intensity).toFixed(2);

        setIsResetting(false);
        setTransform(
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
        );
    };

    const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(e);
        setIsResetting(true);
        setTransform(RESET_TRANSFORM);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                transform,
                transformStyle: 'preserve-3d',
                transition: isResetting
                    ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms ease'
                    : 'transform 120ms linear',
            }}
            className={cn('will-change-transform', className)}
            {...props}
        >
            {children}
        </div>
    );
};
