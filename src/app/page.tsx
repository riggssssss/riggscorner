'use client';


import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback, useEffect } from 'react';
import Slide from '@/components/ui/Slide';
import ParallaxImage from '@/components/animations/ParallaxImage';
import { useNavigationStore } from '@/lib/store';
import InteractiveCurtain from '@/components/ui/InteractiveCurtain';
import TimeDisplay from '@/components/ui/TimeDisplay';

const works = [
  {
    id: 1,
    title: 'Nomada',
    category: 'Web Platform',
    year: '7 - 2025',
    description: 'A visually immersive platform designed to elevate the creative workflow. Nomada merges a minimalist, gallery-style aesthetic with robust functionality, featuring a smart algorithm that curates high-fidelity assets based on your interactions.',
    services: ['UX UI Design', 'Full Stack Development', 'Product Design'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768811792/nomada_ggjy78.mov',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_5,f_jpg,q_90/v1768811792/nomada_ggjy78.jpg',
  },
  {
    id: 2,
    title: 'Eternal',
    category: 'E-commerce',
    year: '3 - 2025',
    description: "A modern e-commerce platform specializing in premium artificial trees. 'Eternal' showcases hyper-realistic foliage dynamics and interactive petal particles with real-time physics that float and react to user interaction, bringing nature's movement into the digital space.",
    services: ['3D Motion', 'UX UI Design', 'Ecommerce', 'Full Stack Development'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768812525/Eternal_b13d4h.mp4',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_20,f_jpg,q_90/v1768812525/Eternal_b13d4h.jpg',
  },
  {
    id: 3,
    title: 'Lumina',
    category: 'E-commerce',
    year: '05 - 2025',
    description: 'A minimalist furniture e-commerce experience designed as an interactive portfolio. It features a physics-enabled 3D environment and a dynamic gallery sphere that reacts fluidly to cursor interactions, redefining digital product showcasing.',
    services: ['UX UI Design', 'Ecommerce', 'Full Stack Development', '3d interactions'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768812462/Lumina_sd7xhc.mp4',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_5,f_jpg,q_90/v1768812462/Lumina_sd7xhc.jpg',
  },
];

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
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Update active section based on scroll progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // These thresholds should align with the anchor positions defined below
    // 0.00 - 0.20: Home/Intro
    // 0.20 - 0.35: About
    // 0.35 - 0.85: Work (Covers multiple slides)
    // 0.85 - 1.00: Contact

    if (latest < 0.20) {
      setActiveSection('home');
    } else if (latest >= 0.20 && latest < 0.35) {
      setActiveSection('about');
    } else if (latest >= 0.35 && latest < 0.85) {
      setActiveSection('work');
    } else {
      setActiveSection('contact');
    }
  });

  // Map vertical 0-1 progress to horizontal movement
  // Adjust output range based on total width of horizontal content
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-81%"]);

  // Parallax Transforms
  const riggsX = useTransform(scrollYProgress, [0, 0.2], ["0%", "40%"]); // Moves slower
  const cornerX = useTransform(scrollYProgress, [0, 0.2], ["0%", "50%"]); // Moves slighly faster

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
      if (e.key === 'Escape') {
        setSelectedWorkId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    // This container defines the total SCROLL HEIGHT (Vertical)
    <div ref={containerRef} className="h-[500vh] relative">

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
                <div className="absolute inset-0 flex flex-col justify-between pb-20 pt-24 px-6 md:px-20 pointer-events-none">
                  {/* Top — Name & role */}
                  <motion.div
                    className="flex flex-col gap-1"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.76, 0, 0.24, 1] }}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  >
                    <span className="text-xs uppercase tracking-widest text-gray-400">Adrián García</span>
                    <span className="text-xs uppercase tracking-widest" style={{ color: '#c98a97' }}>UI/UX Designer · Frontend Developer</span>
                  </motion.div>

                  {/* Bottom — tagline + info grid */}
                  <div className="flex flex-col gap-8">
                    <motion.h1
                      className="text-[5vw] leading-[1] font-normal tracking-tight pointer-events-auto"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97' }}
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
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
              <Slide className="w-[80vw] bg-transparent relative shrink-0 flex items-center pointer-events-none">
                <div className="max-w-4xl px-20 relative pointer-events-auto">
                  <h2 className="text-3xl md:text-5xl leading-[1.1] font-normal -tracking-[0.03em] mb-6" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#c98a97' }}>Who.</h2>
                  <h2 className="text-3xl md:text-5xl leading-[1.2] font-normal text-black mix-blend-hard-light -tracking-[0.03em] relative z-10" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    UI/UX Designer & Frontend Developer crafting <span className="text-accent italic" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>thoughtful</span> digital experiences — where aesthetics meet precision.
                  </h2>
                  <div className="mt-20 flex gap-4 items-center pl-2">
                    <motion.div
                      className="w-2 h-2 bg-accent rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="uppercase tracking-widest text-xs text-gray-500">Based in <span className="text-accent">Castellón, Spain.</span> Open to freelance projects.</span>
                  </div>
                </div>
              </Slide>

              {/* 03. About Slide */}
              <Slide className="w-[90vw] bg-transparent relative shrink-0 flex items-center pointer-events-none">
                <div className="w-full px-20 grid grid-cols-[1fr_1fr_1fr] gap-16 pointer-events-auto" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {/* Col 1 — Intro */}
                  <div className="flex flex-col justify-center">
                    <p className="text-xs uppercase tracking-widest text-accent mb-4">Adrián García</p>
                    <h3 className="text-[2.2vw] font-normal leading-[1.15] text-black -tracking-[0.02em] mb-6">
                      Product Designer <span className="text-[#c98a97]">+</span> Frontend Developer based in Castellón, Spain
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Full Stack developer with a strong frontend focus. I build clear, functional and visually coherent interfaces — where logic meets aesthetics.
                    </p>
                  </div>

                  {/* Col 2 — Skills & Languages */}
                  <div className="flex flex-col justify-center gap-10">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent mb-4">Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {['JavaScript', 'TypeScript', 'React', 'Next.js', 'Kotlin', 'Java', 'SQL', 'Figma', 'CSS'].map(s => (
                          <span key={s} className="text-xs border border-[#ecd8db] text-gray-600 px-3 py-1 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent mb-4">Languages</p>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <span>Spanish — Native</span>
                        <span>Valencian — C1</span>
                        <span>English — B2</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 3 — Education & Contact */}
                  <div className="flex flex-col justify-center gap-10">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent mb-4">Education</p>
                      <div className="flex flex-col gap-3 text-sm text-gray-600">
                        <div>
                          <p className="text-black font-normal">Multiplatform App Development</p>
                          <p className="text-xs text-gray-400">2nd year · DAM</p>
                        </div>
                        <div>
                          <p className="text-black font-normal">UX Design Fundamentals</p>
                          <p className="text-xs text-gray-400">IBM SkillsBuild</p>
                        </div>
                        <div>
                          <p className="text-black font-normal">Music Degree — Guitar</p>
                          <p className="text-xs text-gray-400">2014–2020 · Mestre Tàrrega</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent mb-4">Contact</p>
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <span>adrian2000gg@gmail.com</span>
                        <span>+34 641 211 926</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Slide>

              {/* 04. Works Slides - REWORKED */}
              {works.map((work, index) => {
                return (
                  <Slide key={work.id} className="w-[85vw] bg-transparent relative shrink-0 flex items-center justify-center px-10 pointer-events-none">
                    <div className="w-full max-w-[70vw] h-[80vh] flex flex-col justify-center relative group pointer-events-auto">

                      {/* Video/Image Container - Exact Video Dimensions */}
                      <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
                        <motion.div
                          ref={(el) => { workRefs.current[work.id] = el; }}
                          className="w-full h-full relative cursor-pointer rounded-2xl overflow-hidden"
                          onClick={() => handleWorkClick(work.id)}
                          whileHover={{ scale: 0.98 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="w-full h-full overflow-hidden border border-gray-200 bg-gray-100 relative rounded-2xl">
                            {/* Media Content - WITH PARALLAX */}
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

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 flex items-center justify-center">
                              <div className="bg-white text-black px-6 py-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 text-sm font-bold uppercase tracking-widest shadow-xl">
                                View Project
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Content Below */}
                      <div className="flex justify-between items-start mt-8">
                        <div>
                          <span className="text-xs font-mono mb-2 block text-accent">0{index + 1} / {work.year}</span>
                          <h3 className="text-4xl md:text-6xl font-medium tracking-tighter uppercase group-hover:italic transition-all duration-300 font-serif">{work.title}</h3>
                        </div>
                        <span className="text-sm uppercase tracking-widest border border-accent text-accent px-4 py-1 rounded-full">{work.category}</span>
                      </div>
                    </div>
                  </Slide>
                );
              })}

              {/* 04. Contact / Footer Slide */}
              <Slide className="w-screen bg-transparent text-black relative shrink-0 flex items-center justify-center pointer-events-none">
                <div className="w-full flex flex-col items-center justify-center text-center pointer-events-auto">
                  <h2 className="text-[18vw] leading-[0.8] font-bold uppercase tracking-tighter mb-12 font-serif">
                    Let's<br /><span className="font-serif text-accent italic">Talk</span>
                  </h2>
                  <div className="flex gap-20 text-lg uppercase tracking-widest">
                    <a href="mailto:adriangarciagarcia.dev@gmail.com" className="hover:text-accent hover:underline hover:decoration-accent decoration-2 underline-offset-4 transition-colors">Email</a>
                    <a href="https://instagram.com/riggscorner" className="hover:text-accent hover:underline hover:decoration-accent decoration-2 underline-offset-4 transition-colors">Instagram</a>
                    <a href="https://linkedin.com/in/adriangarciagarcia" className="hover:text-accent hover:underline hover:decoration-accent decoration-2 underline-offset-4 transition-colors">LinkedIn</a>
                  </div>
                  <p className="absolute bottom-10 text-gray-400 text-xs tracking-widest uppercase">© 2025 Adrián García</p>
                </div>
              </Slide>

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
                    className="fixed top-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:scale-110 transition-transform cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, delay: 0.5 }} // Delayed entry
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </motion.button>

                  {/* Hero Image / Video - Browser Screen Proportions */}
                  <div className="w-full px-20 pt-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
                      className="w-full max-w-5xl mx-auto bg-gray-100 relative shrink-0 rounded-2xl overflow-hidden border border-gray-200/60"
                      style={{ aspectRatio: '2/1' }}
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
                            <span className="text-sm font-mono text-accent mb-4 block">0{work.id} — {work.year}</span>
                            <h1 className="text-8xl md:text-9xl font-serif tracking-tighter leading-none">{work.title}</h1>
                          </motion.div>
                        </div>
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}
                          className="text-right"
                        >
                          <span className="text-sm uppercase tracking-widest border border-accent text-accent px-5 py-1.5 rounded-full">{work.category}</span>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                        <div className="md:col-span-1 overflow-hidden">
                          <motion.div variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}>
                            <ul className="text-sm space-y-1.5 font-medium leading-relaxed text-accent">
                              {/* Dynamic Tech Stack List */}
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
                            className="text-base md:text-lg leading-relaxed font-light text-gray-700"
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
