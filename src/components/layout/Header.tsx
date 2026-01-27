'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useNavigationStore } from '@/lib/store';
import { useRef } from 'react';

// Magnetic link component
function MagneticLink({
    href,
    children,
    isActive,
    onClick
}: {
    href: string;
    children: React.ReactNode;
    isActive: boolean;
    onClick?: (e: React.MouseEvent) => void;
}) {
    const ref = useRef<HTMLAnchorElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        ref.current.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;
        ref.current.style.transform = 'translate(0, 0)';
    };

    return (
        <Link
            ref={ref}
            href={href}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            data-magnetic
            data-cursor-text="View"
            className={`relative transition-all duration-500 ease-out ${isActive
                ? 'opacity-100'
                : 'opacity-50 hover:opacity-100'
                }`}
        >
            <span className="relative z-10">{children}</span>
            {/* Animated underline */}
            <motion.span
                className="absolute -bottom-1 left-0 h-[1px] bg-white origin-left"
                initial={false}
                animate={{
                    scaleX: isActive ? 1 : 0,
                    opacity: isActive ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                style={{ width: '100%' }}
            />
        </Link>
    );
}

export default function Header() {
    const { activeSection } = useNavigationStore();

    return (
        <motion.header
            className="fixed top-0 left-0 w-full z-40 px-6 md:px-10 py-6 flex justify-between items-center mix-blend-difference text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            {/* Logo with stagger animation */}
            <Link
                href="/"
                className="group relative overflow-hidden"
                data-magnetic
                data-cursor-text="Home"
            >
                <motion.span
                    className="text-xl font-bold tracking-tighter uppercase inline-block"
                    whileHover={{ y: -30 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                    Adrian Garcia
                </motion.span>
                <motion.span
                    className="text-xl font-bold tracking-tighter uppercase absolute top-0 left-0"
                    initial={{ y: 30 }}
                    whileHover={{ y: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                    Adrian Garcia
                </motion.span>
            </Link>

            {/* Navigation with magnetic effect */}
            <nav className="hidden md:flex gap-10 uppercase text-sm tracking-widest">
                <MagneticLink
                    href="#about"
                    isActive={activeSection === 'about'}
                    onClick={(e) => {
                        e.preventDefault();
                        (window as any).lenis?.scrollTo('#about', {
                            duration: 2.0,
                            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }}
                >
                    About
                </MagneticLink>
                <MagneticLink
                    href="#work"
                    isActive={activeSection === 'work'}
                    onClick={(e) => {
                        e.preventDefault();
                        (window as any).lenis?.scrollTo('#work', {
                            duration: 2.0,
                            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }}
                >
                    Work
                </MagneticLink>
                <MagneticLink
                    href="#contact"
                    isActive={activeSection === 'contact'}
                    onClick={(e) => {
                        e.preventDefault();
                        (window as any).lenis?.scrollTo('#contact', {
                            duration: 2.0,
                            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }}
                >
                    Contact
                </MagneticLink>
            </nav>

            {/* Premium mobile menu button */}
            <motion.button
                className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-magnetic
            >
                <motion.span className="w-full h-[1px] bg-white origin-center" />
                <motion.span className="w-3/4 h-[1px] bg-white origin-center" />
            </motion.button>
        </motion.header>
    );
}
