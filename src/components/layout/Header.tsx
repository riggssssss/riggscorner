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

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const NAV_LINKS = [
    { label: 'About',   target: '#about'   },
    { label: 'Work',    target: '#work'     },
    { label: 'Contact', target: '#contact'  },
] as const;

export default function Header() {
    const { activeSection } = useNavigationStore();
    const scrollTo = (target: string) => {
        (window as any).lenis?.scrollTo(target, {
            duration: 2.0,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
    };

    return (
        <>
            <motion.header
                className="fixed top-0 left-0 w-full z-40 px-6 md:px-10 py-6 flex justify-end items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-10 uppercase text-xs tracking-widest" style={{ fontFamily: FONT }}>
                    {NAV_LINKS.map(({ label, target }) => (
                        <MagneticLink
                            key={label}
                            href={target}
                            isActive={activeSection === label.toLowerCase()}
                            onClick={(e) => {
                                e.preventDefault();
                                scrollTo(target);
                            }}
                        >
                            {label}
                        </MagneticLink>
                    ))}
                </nav>

            </motion.header>

        </>
    );
}
