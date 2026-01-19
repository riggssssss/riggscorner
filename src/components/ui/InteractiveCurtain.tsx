'use client';

import { motion, useMotionValue, useTransform, useSpring, useTime } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function InteractiveCurtain() {
    const [columns, setColumns] = useState<number[]>([]);
    const [windowWidth, setWindowWidth] = useState(0);
    const colWidth = 50; // Width of each rectangle in px

    const mouseX = useMotionValue(0);
    const scrollVelocity = useMotionValue(0);
    const time = useTime(); // Continuous time for wind effect

    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            const numCols = Math.ceil(width / colWidth);
            setColumns(Array.from({ length: numCols }, (_, i) => i));
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
        };

        // Track scroll velocity
        let lastScrollY = window.scrollY;
        let lastTime = performance.now();
        let velocityDecay: number;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const currentTime = performance.now();
            const deltaY = currentScrollY - lastScrollY;
            const deltaTime = currentTime - lastTime;

            // Calculate velocity (pixels per millisecond, scaled up for visible effect)
            const velocity = (deltaY / Math.max(deltaTime, 1)) * 50;

            // Clamp velocity to reasonable range
            const clampedVelocity = Math.max(-100, Math.min(100, velocity));
            scrollVelocity.set(clampedVelocity);

            lastScrollY = currentScrollY;
            lastTime = currentTime;

            // Clear existing decay timeout
            clearTimeout(velocityDecay);

            // Decay velocity back to 0 after scrolling stops
            velocityDecay = window.setTimeout(() => {
                scrollVelocity.set(0);
            }, 150);
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(velocityDecay);
        };
    }, [mouseX, scrollVelocity]);

    return (
        <div className="fixed inset-0 z-0 flex pointer-events-none">
            {columns.map((i) => (
                <CurtainColumn
                    key={i}
                    index={i}
                    width={colWidth}
                    windowWidth={windowWidth}
                    mouseX={mouseX}
                    scrollVelocity={scrollVelocity}
                    time={time}
                />
            ))}
        </div>
    );
}

function CurtainColumn({
    index,
    width,
    windowWidth,
    mouseX,
    scrollVelocity,
    time
}: {
    index: number,
    width: number,
    windowWidth: number,
    mouseX: any,
    scrollVelocity: any,
    time: any
}) {
    // Calculate the center X position of this column
    const columnCenterX = index * width + width / 2;

    // Wind Effect (Continuous Sine Wave)
    const windRotation = useTransform(time, (t: number) => {
        const phase = index * 0.2;
        return Math.sin(t * 0.0005 + phase) * 5; // Increased amplitude to 5deg
    });

    // Mouse-based rotation
    const mouseRotation = useTransform(mouseX, (val: number) => {
        const distance = Math.abs(val - columnCenterX);
        if (distance > 300) return 0; // Increased radius
        return 180 * (1 - distance / 300);
    });

    // Scroll-based rotation
    const scrollRotation = useTransform(scrollVelocity, (velocity: number) => {
        const phase = (index * 0.15) % (Math.PI * 2);
        const waveMultiplier = Math.sin(phase + performance.now() * 0.001) * 0.3 + 0.7;
        return velocity * waveMultiplier * 1.5;
    });

    // Combine rotations - Always apply wind for "life"
    const combinedRotation = useTransform(
        [mouseRotation, scrollRotation, windRotation],
        ([mouse, scroll, wind]: number[]) => {
            return (mouse as number) + (scroll as number) * 0.3 + (wind as number);
        }
    );

    // Bouncier Spring Physics
    const smoothRotation = useSpring(combinedRotation, {
        stiffness: 400,  // Snappy
        damping: 15,     // Bouncy/Wobbly
        mass: 1          // Standard mass
    });

    // Parallax Effect for the Background Image
    const parallaxX = useTransform(mouseX, [0, windowWidth], [-10, 10]);
    const smoothParallax = useSpring(parallaxX, { stiffness: 100, damping: 30 });

    return (
        <div
            className="h-full relative pointer-events-auto"
            style={{ width: width, perspective: '1000px' }}
        >
            <motion.div
                className="w-full h-full relative"
                style={{
                    rotateY: smoothRotation,
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Front Face (White/Default) */}
                <div
                    className="absolute inset-0 bg-gray-50 border-r border-gray-100"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Subtle edge shadow */}
                    <div className="absolute inset-y-0 right-0 w-[1px] bg-black/[0.01]" />
                </div>

                {/* Back Face (Image Slice) */}
                <div
                    className="absolute inset-0 bg-white"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    {/* The Image Slice with Parallax */}
                    <motion.div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'url(/hero-texture.png)',
                            backgroundSize: `${windowWidth + 100}px 100vh`,
                            backgroundPositionX: useTransform(smoothParallax, (val) => `calc(-${index * width}px + ${val}px)`),
                            backgroundRepeat: 'no-repeat'
                        }}
                    />

                    {/* Overlay to lighten */}
                    <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
                </div>
            </motion.div>
        </div>
    );
}
