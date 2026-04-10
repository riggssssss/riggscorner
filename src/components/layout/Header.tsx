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
            href={href}
            onClick={onClick}
            className={`relative transition-all duration-300 ease-out ${isActive ? 'text-[#c98a97]' : 'text-gray-400 hover:text-gray-700'}`}
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        >
            <span className="relative z-10">{children}</span>
            <motion.span
                className="absolute -bottom-1 left-0 h-[1px] origin-left"
                style={{ width: '100%', backgroundColor: '#c98a97' }}
                initial={false}
                animate={{ scaleX: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            />
        </Link>
    );
}

export default function Header() {
    const { activeSection } = useNavigationStore();

    return (
        <motion.header
            className="fixed top-0 left-0 w-full z-40 px-6 md:px-10 py-6 flex justify-end items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            {/* Navigation */}
            <nav className="hidden md:flex gap-10 uppercase text-xs tracking-widest" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
