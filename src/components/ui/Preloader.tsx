'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = ['Design', 'Motion', 'Code', 'Experience'];

export default function Preloader() {
    const [loading, setLoading] = useState(true);
    const [wordIndex, setWordIndex] = useState(0);
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        try {
            const hasLoaded = sessionStorage.getItem('hasLoaded');
            if (hasLoaded) {
                setLoading(false);
                return;
            }
        } catch (e) {
            // Handle errors silently
        }

        // Word cycling animation
        const wordInterval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % words.length);
        }, 400);

        // Percentage counter
        const interval = setInterval(() => {
            setPercentage((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    clearInterval(wordInterval);
                    setTimeout(() => {
                        setLoading(false);
                        try {
                            sessionStorage.setItem('hasLoaded', 'true');
                        } catch (e) { }
                    }, 600);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 8) + 2;
            });
        }, 50);

        return () => {
            clearInterval(interval);
            clearInterval(wordInterval);
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{
                        clipPath: 'inset(0 0 100% 0)',
                        transition: { duration: 1, ease: [0.76, 0, 0.24, 1] }
                    }}
                >
                    {/* Animated word */}
                    <div className="relative h-24 overflow-hidden mb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={wordIndex}
                                className="text-6xl md:text-8xl font-serif tracking-tighter"
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -60, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            >
                                {words[wordIndex]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress bar */}
                    <div className="w-48 h-[1px] bg-white/20 relative overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>

                    {/* Percentage */}
                    <motion.div
                        className="mt-4 text-sm font-mono tracking-widest text-white/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {String(Math.min(percentage, 100)).padStart(3, '0')}%
                    </motion.div>

                    {/* Corner decorations */}
                    <div className="absolute top-8 left-8 text-xs uppercase tracking-widest text-white/30">
                        Loading
                    </div>
                    <div className="absolute bottom-8 right-8 text-xs uppercase tracking-widest text-white/30">
                        Portfolio ©2024
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
