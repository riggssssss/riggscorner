'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TimeDisplay() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!time) return null;

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    const day = time.getDate();
    const month = time.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    return (
        <div className="flex flex-col gap-1 items-end text-right text-black">
            {/* Time */}
            <div className="flex items-center gap-1 font-mono text-xs tracking-widest">
                <span>{hours}</span>
                <span className="animate-pulse">:</span>
                <span>{minutes}</span>
                <span className="opacity-50 text-[10px]">:{seconds}</span>
            </div>

            {/* Date */}
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                {day} {month}
            </div>
        </div>
    );
}
