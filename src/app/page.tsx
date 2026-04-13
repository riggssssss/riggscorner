'use client';


import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Slide from '@/components/ui/Slide';
import { useNavigationStore } from '@/lib/store';
import InteractiveCurtain from '@/components/ui/InteractiveCurtain';
import TimeDisplay from '@/components/ui/TimeDisplay';
import { works } from '@/data/works';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveSection } = useNavigationStore();
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null);
  const workRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Shared transition configuration for consistent entry/exit
  const workTransition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const };

  // Handle work click - expand directly
  const handleWorkClick = (workId: number) => {
    setSelectedWorkId(workId);
  };

  // Create a scroll height approximate to (Number of Slides * 100vh) or custom feels
  // This "ghost" height creates the scrollable area
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const chatOpenedRef = useRef(false);

  // Update active section based on scroll progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.12) {
      setActiveSection('home');
    } else if (latest >= 0.12 && latest < 0.28) {
      setActiveSection('about');
    } else if (latest >= 0.28 && latest < 0.85) {
      setActiveSection('work');
    } else {
      setActiveSection('contact');
    }

    // Open chatbot when reaching the end
    if (latest >= 0.995 && !chatOpenedRef.current) {
      chatOpenedRef.current = true;
      window.dispatchEvent(new CustomEvent('open-chat'));
    }
    // Reset so it can trigger again if user scrolls back and forward
    if (latest < 0.9) {
      chatOpenedRef.current = false;
    }
  });

  // Map vertical 0-1 progress to horizontal movement
  // Adjust output range based on total width of horizontal content
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-79.6%"]);

  // Parallax Transforms

  // Hero parallax — subtle vertical drift on scroll
  const heroTaglineY = useTransform(scrollYProgress, [0, 0.15], ["0%", "-18%"]);
  const heroTopY = useTransform(scrollYProgress, [0, 0.15], ["0%", "-10%"]);
  const heroInfoY = useTransform(scrollYProgress, [0, 0.15], ["0%", "-6%"]);

  // Who slide — driven directly by scrollYProgress, no state
  const whoOpacity = useTransform(scrollYProgress, [0.03, 0.08, 0.26, 0.32], [0, 1, 1, 0]);
  const whoY = useTransform(scrollYProgress, [0.03, 0.08, 0.26, 0.32], [20, 0, 0, -20]);

  // Parallax for work images - moves slightly right as container moves left
  const parallaxX = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  // Work Parallax removed as per user request to prevent overlapping
  // RE-ADDED simple parallax for internal image movement

  // Fade out curtain after first section (Home/Intro)
  // Starts fading at 5% (immediately upon scroll), fully invisible by 15% (before 'Who')
  const curtainOpacity = useTransform(scrollYProgress, [0.05, 0.15], [1, 0]);

  // Physics/Mask logic removed


  // Lock body scroll when work is expanded
  useEffect(() => {
    if (selectedWorkId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedWorkId]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedWorkId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open project from ChatBot navigation
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: number }>).detail.id;
      setSelectedWorkId(id);
    };
    window.addEventListener('open-project', handler);
    return () => window.removeEventListener('open-project', handler);
  }, []);

  return (
    // This container defines the total SCROLL HEIGHT (Vertical)
    <div ref={containerRef} className="h-[540vh] relative">

      {/* Invisible Anchors for Navigation */}
      <div id="home" className="absolute top-0 w-full h-px" />
      <div id="about" className="absolute top-[20%] w-full h-px" />
      <div id="work" className="absolute top-[35%] w-full h-px" />
      <div id="contact" className="absolute top-[90%] w-full h-px" />


      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="w-full h-full flex items-center overflow-hidden"
        >

          {/* Interactive Curtain Background - Only visible in first section */}
          <motion.div style={{ opacity: curtainOpacity }} className="absolute inset-0 z-0">
            <InteractiveCurtain />
          </motion.div>

          {/* Time Display - Bottom Right - Fades with Curtain */}
          <motion.div
            style={{ opacity: curtainOpacity }}
            className="absolute bottom-8 right-8 z-50 pointer-events-none"
          >
            <TimeDisplay />
          </motion.div>


          {/* Main Content Wrapper - Animates (Pushes) when work is expanded */}
          <motion.div
            className="w-full h-full"
            animate={{
              y: selectedWorkId ? '-20vh' : '0vh',
            }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* The Track that moves horizontally */}
            {/* ADDED pointer-events-none to track so mouse goes through to background curtain */}
            <motion.div style={{ x }} className="flex h-full w-[fit-content] relative z-10 will-change-transform pointer-events-none">

              {/* 01. Hero Slide */}
              <Slide className="w-[100vw] bg-transparent relative shrink-0 z-50 pointer-events-none">
                <div className="absolute inset-0 px-6 md:px-20 pointer-events-none">
                  {/* Top — Name & role */}
                  <motion.div
                    className="flex flex-col gap-1 absolute top-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.76, 0, 0.24, 1] }}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', y: heroTopY }}
                  >
                    <span className="text-xs uppercase tracking-widest text-gray-400">Adrián García</span>
                    <span className="text-xs uppercase tracking-widest" style={{ color: '#c98a97' }}>UI/UX Designer · Frontend Developer</span>
                  </motion.div>

                  {/* Bottom — tagline + info grid */}
                  <div className="absolute bottom-8 left-6 md:left-20 right-6 md:right-20 flex flex-col gap-8">
                    <motion.h1
                      className="text-[5vw] leading-[1] font-normal tracking-tight pointer-events-auto"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97', y: heroTaglineY }}
                      initial={{ opacity: 0, y: 60 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                    >
                      design build & repeat
                    </motion.h1>

                    {/* Info row */}
                    <motion.div
                      className="flex gap-16 pointer-events-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 0.8 }}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', y: heroInfoY }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Based in</span>
                        <span className="text-sm text-gray-700">Castellón, Spain</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Available for</span>
                        <span className="text-sm text-gray-700">Freelance · Full-time</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Contact</span>
                        <span className="text-sm text-gray-700">adrian2000gg@gmail.com</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </Slide>

              {/* 02. Introduction Slide */}
              <Slide className="w-[90vw] bg-transparent relative shrink-0 flex items-center pointer-events-none">
                <div className="w-full px-20 relative pointer-events-auto">
                  <motion.div style={{ opacity: whoOpacity, y: whoY }}>

                    {/* Index label */}
                    <div className="mb-6">
                      <h2
                        className="text-3xl md:text-5xl leading-[1.1] font-normal -tracking-[0.03em]"
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97' }}
                      >
                        Who.
                      </h2>
                    </div>

                    {/* Main statement — same size as before */}
                    <h2
                      className="text-3xl md:text-5xl leading-[1.2] font-normal -tracking-[0.03em] mb-12 max-w-3xl"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    >
                      Passionate about <span style={{ color: '#c98a97' }} className="italic font-serif">design</span> and typography. I build digital products that feel intuitive, look intentional, and actually work.
                    </h2>

                    {/* Skills row */}
                    <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-0">
                      {['React', 'Next.js', 'TypeScript', 'Figma', 'Motion', 'Node.js'].map((skill, i, arr) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                          className="text-xs uppercase tracking-widest text-gray-400 whitespace-nowrap"
                          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        >
                          {skill}{i < arr.length - 1 ? <span className="ml-3 text-gray-300">·</span> : null}
                        </motion.span>
                      ))}
                    </div>

                  </motion.div>
                </div>
              </Slide>

              {/* 03. Works Slides */}
              {works.map((work, index) => {
                return (
                  <Slide key={work.id} className="w-[100vw] bg-transparent relative shrink-0 flex items-center justify-start pl-20 pointer-events-none">
                    <div className="h-[80vh] flex flex-col justify-center relative group pointer-events-auto" style={{ width: 'calc(100vw - 500px)' }}>

                      {/* Video/Image Container */}
                      <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
                        <motion.div
                          ref={(el) => { workRefs.current[work.id] = el; }}
                          className="w-full h-full relative cursor-pointer rounded-2xl overflow-hidden"
                          onClick={() => handleWorkClick(work.id)}
                          whileHover={{ scale: 0.985 }}
                          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                        >
                          <div className="w-full h-full overflow-hidden bg-gray-100 relative rounded-2xl" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                            {/* Media */}
                            <motion.div
                              className="w-[120%] h-full relative -left-[10%]"
                              style={{ x: parallaxX }}
                            >
                              {work.mediaType === 'video' ? (
                                <video
                                  src={work.src}
                                  poster={work.poster}
                                  muted
                                  loop
                                  playsInline
                                  className="w-full h-full object-cover"
                                  onMouseEnter={(e) => e.currentTarget.play()}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-full h-full bg-gray-200"
                                  style={{ backgroundImage: `url(${work.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                />
                              )}
                            </motion.div>

                            {/* Hover overlay — circle + */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
                              <div
                                className="w-16 h-16 rounded-full border border-white/80 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500"
                                style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.12)' }}
                              >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                                  <line x1="9" y1="2" x2="9" y2="16" />
                                  <line x1="2" y1="9" x2="16" y2="9" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Content Below */}
                      <div className="flex justify-between items-end mt-7">
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-xs uppercase tracking-widest text-gray-400"
                            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          >
                            {String(index + 1).padStart(2, '0')} — {work.year}
                          </span>
                          <h3
                            className="text-5xl md:text-7xl font-normal tracking-tighter"
                            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#1a1a1a' }}
                          >
                            {work.title}
                          </h3>
                        </div>
                        <span
                          className="text-xs uppercase tracking-widest mb-2"
                          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97' }}
                        >
                          {work.category}
                        </span>
                      </div>
                    </div>
                  </Slide>
                );
              })}

              {/* 03b. Coming soon slide */}
              <Slide className="w-[100vw] bg-transparent relative shrink-0 flex items-center justify-start pl-20 pointer-events-none">
                <div className="h-[80vh] flex flex-col justify-center pointer-events-auto" style={{ width: 'calc(100vw - 500px)' }}>
                  <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
                    <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: '#eedde1' }}>
                      <div className="skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-7">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-widest" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#e8c4cc' }}>03 — 2025</span>
                      <h3 className="text-5xl md:text-7xl font-normal tracking-tighter" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#e0b8c0' }}>
                        Coming soon
                      </h3>
                    </div>
                  </div>
                </div>
              </Slide>

              {/* Trailing space so chatbot doesn't overlap last project */}
              <div className="w-[480px] shrink-0 h-full" />

            </motion.div>
          </motion.div>

          {/* Close Wrapper */}
        </div>
      </div>

      {/* Expanded Work View */}
      <AnimatePresence mode="wait">
        {selectedWorkId && (
          <motion.div
            key="expanded-work-view"
            className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-y-auto overscroll-contain rounded-t-3xl" // Added rounded-t-3xl for the curtain look
            style={{ touchAction: 'pan-y' }}
            data-lenis-prevent
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={workTransition}
          >
            {(() => {
              const work = works.find(w => w.id === selectedWorkId);
              if (!work) return null;

              return (
                <>
                  {/* Close Button */}
                  <motion.button
                    onClick={() => setSelectedWorkId(null)}
                    className="fixed top-8 right-8 z-50 flex items-center gap-2 cursor-pointer group"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors duration-300">Close</span>
                    <div className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center group-hover:border-black/40 group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                  </motion.button>

                  {/* Hero Image / Video - Browser Screen Proportions */}
                  <div className="w-full px-20 pt-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
                      className="w-full max-w-[68rem] mx-auto bg-gray-100 relative shrink-0 rounded-2xl overflow-hidden border border-gray-200/60"
                      style={{ aspectRatio: '16/9' }}
                    >
                      {/* Dynamic Media Logic */}
                      {work.mediaType === 'video' ? (
                        <video
                          src={work.src}
                          poster={work.poster}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover transform scale-105" // Slight zoom for cinematic feel
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-gray-200"
                          style={{ backgroundImage: `url(${work.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="max-w-6xl mx-auto px-8 md:px-12 pt-6 pb-16 w-full">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: {},
                        visible: {
                          transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.4
                          }
                        }
                      }}
                    >
                      <div className="flex justify-between items-end mb-12 border-b border-black/10 pb-12">
                        <div className="overflow-hidden">
                          <motion.div variants={{
                            hidden: { y: "100%" },
                            visible: { y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}>
                            <span className="text-xs uppercase tracking-widest text-gray-400 mb-4 block" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>0{work.id} — {work.year}</span>
                            <h1 className="text-7xl md:text-8xl font-normal tracking-tight leading-none" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{work.title}</h1>
                          </motion.div>
                        </div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}
                          className="text-right"
                        >
                          <span className="text-xs uppercase tracking-widest" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97' }}>{work.category}</span>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                        <div className="md:col-span-1 overflow-hidden">
                          <motion.div variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}>
                            <ul className="text-sm space-y-1.5 font-medium leading-relaxed text-accent" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                              {work.services?.map((service, i) => (
                                <li key={i}>{service}</li>
                              ))}
                            </ul>
                          </motion.div>
                        </div>
                        <div className="md:col-span-2 overflow-hidden">
                          <motion.p
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                            }}
                            className="text-base md:text-lg leading-relaxed font-light text-gray-700" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          >
                            {work.description}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              );
            })()}
          </motion.div >
        )}
      </AnimatePresence>
    </div>
  );
}
