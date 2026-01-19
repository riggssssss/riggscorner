'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

interface ParallaxImageProps {
    src: string;
    alt: string;
    className?: string;
}

export default function ParallaxImage({ src, alt, className }: ParallaxImageProps) {
    const container = useRef(null);

    // Track scroll progress of the container relative to the viewport
    const { scrollXProgress } = useScroll({
        target: container,
        offset: ['start end', 'end start']
    });

    // Map scroll progress to horizontal movement (parallax)
    const x = useTransform(scrollXProgress, [0, 1], ['0%', '-20%']);
    const scale = useTransform(scrollXProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

    return (
        <div ref={container} className={`relative overflow-hidden ${className}`}>
            <motion.div style={{ x, scale }} className="w-[120%] h-full relative -left-[10%]">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                />
            </motion.div>
        </div>
    );
}
