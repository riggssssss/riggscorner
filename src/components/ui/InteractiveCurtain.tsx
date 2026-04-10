'use client';

import { useState, useEffect } from 'react';

export default function InteractiveCurtain() {
    const [columns, setColumns] = useState<number[]>([]);
    const colWidth = 60;

    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth;
            const numCols = Math.ceil(width / colWidth);
            setColumns(Array.from({ length: numCols }, (_, i) => i));
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    return (
        <div className="fixed inset-0 z-0 flex pointer-events-none">
            {columns.map((i) => (
                <div
                    key={i}
                    className="h-full"
                    style={{
                        width: colWidth,
                        background: '#fdf6f7',
                        borderRight: '1px solid #f5eced',
                    }}
                />
            ))}
        </div>
    );
}
