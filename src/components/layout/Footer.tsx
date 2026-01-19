import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full py-12 px-6 bg-black text-white flex flex-col md:flex-row justify-between items-end">
            <div className="mb-8 md:mb-0">
                <h2 className="text-6xl md:text-9xl font-bold tracking-tighter leading-none">
                    Let's<br />Talk
                </h2>
            </div>
            <div className="flex gap-8 uppercase text-sm tracking-widest">
                <Link href="mailto:hello@example.com" className="hover:opacity-50 transition-opacity">Email</Link>
                <Link href="#" className="hover:opacity-50 transition-opacity">Instagram</Link>
                <Link href="#" className="hover:opacity-50 transition-opacity">LinkedIn</Link>
            </div>
        </footer>
    );
}
