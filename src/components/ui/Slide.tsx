'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SlideProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    width?: string;
}

export default function Slide({ children, className, width = 'w-[100vw]', ...props }: SlideProps) {
    return (
        <motion.section
            className={cn(
                'h-screen flex-shrink-0 flex items-center justify-center relative overflow-hidden px-10 md:px-20',
                width,
                className
            )}
            {...props}
        >
            {children}
        </motion.section>
    );
}
