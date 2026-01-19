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
    year: '2024',
    description: 'An AI-powered image resource platform for graphic designers. Featuring a personalized AI system that learns your style preferences, delivering tailored image suggestions and custom AI-generated visuals that evolve with your creative taste.',
    services: ['Product Design', 'AI Integration', 'UX/UI Design', 'Full-Stack Development'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768811792/nomada_ggjy78.mov',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_5,f_jpg,q_90/v1768811792/nomada_ggjy78.jpg',
  },
  {
    id: 2,
    title: 'Eternal',
    category: 'Immersive Experience',
    year: '2024',
    description: 'A cinematic digital journey exploring the concept of infinite loops and temporal distortion. This project seeks to bridge the gap between static imagery and fluid motion, creating a meditative visual experience.',
    services: ['Creative Direction', '3D Motion', 'Sound Design', 'WebGL'],
    mediaType: 'video',
    src: 'https://res.cloudinary.com/dfedae5mn/video/upload/v1768812525/Eternal_b13d4h.mp4',
    poster: 'https://res.cloudinary.com/dfedae5mn/video/upload/so_20,f_jpg,q_90/v1768812525/Eternal_b13d4h.jpg',
  },
  {
    id: 3,
    title: 'Lumina',
    category: 'Interactive Light',
    year: '2024',
    description: 'An experimental study on light, shadow, and perception. "Lumina" utilizes real-time raytracing techniques to create an interactive environment where light reacts dynamically to user input and environmental variables.',
    services: ['Interaction Design', 'Shaders', 'Performance', 'Creative Coding'],
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
  const workTransition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };

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
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-85%"]);

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
      // Create a style element to hide scrollbar without layout shift if needed, 
      // but simple overflow: hidden is usually fine for lenis.
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedWorkId]);

  return (
    // This container defines the total SCROLL HEIGHT (Vertical)
    <div ref={containerRef} className="h-[500vh] relative">

      {/* Invisible Anchors for Navigation */}
      <div id="home" className="absolute top-0 w-full h-px" />
      <div id="about" className="absolute top-[20%] w-full h-px" />
      <div id="work" className="absolute top-[35%] w-full h-px" />
      <div id="contact" className="absolute top-[90%] w-full h-px" />


      {/* Sticky Viewport Wrapper */}
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        <div
          className="w-full h-full bg-white flex items-center overflow-hidden"
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
                <div className="absolute inset-0 flex flex-col justify-end pb-20 px-6 md:px-20 pointer-events-none">
                  {/* The Text Groups */}
                  <motion.div
                    style={{ x: riggsX }}
                  >
                    <motion.h1
                      className="text-[14vw] leading-[0.8] font-bold tracking-tighter font-serif pb-2 text-black mix-blend-hard-light pointer-events-auto"
                      /* clip-path removed here as requested in previous turn for 'riggs' */
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                    >
                      riggs
                    </motion.h1>
                  </motion.div>
                  <motion.div
                    style={{ x: cornerX }}
                  >
                    <motion.h1
                      className="text-[14vw] leading-[0.8] font-bold tracking-tighter ml-[10vw] font-sans pb-2 text-black mix-blend-hard-light pointer-events-auto"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 85%)' }}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
                    >
                      corner
                    </motion.h1>
                  </motion.div>



                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-8 left-10 flex gap-4 items-center uppercase text-sm tracking-widest text-gray-400 z-[70] pointer-events-auto"
                  >
                    <span>(Scroll)</span>
                    <div className="h-[1px] w-24 bg-gray-400"></div>
                  </motion.div>
                </div>
              </Slide>

              {/* 02. Introduction Slide */}
              <Slide className="w-[80vw] bg-transparent relative shrink-0 flex items-center pointer-events-none">
                <div className="max-w-4xl px-20 relative pointer-events-auto">
                  <h2 className="text-5xl md:text-7xl leading-[1.1] font-medium text-gray-200 -tracking-[0.04em] mb-6">Who.</h2>
                  <h2 className="text-5xl md:text-7xl leading-[1.1] font-medium text-black mix-blend-hard-light -tracking-[0.04em] relative z-10">
                    Crafting digital experiences with a focus on <span className="font-serif text-black italic">motion</span>, typography, and minimalist aesthetics.
                  </h2>
                  <div className="mt-20 flex gap-4 items-center pl-2">
                    <motion.div
                      className="w-2 h-2 bg-black rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="uppercase tracking-widest text-xs text-gray-500">Based in Castellon, Spain. Available for freelance.</span>
                  </div>
                </div>
              </Slide>

              {/* 03. Works Slides - REWORKED */}
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
                      <div className="flex justify-between items-start mt-8 border-t border-black/10 pt-6">
                        <div>
                          <span className="text-xs font-mono mb-2 block text-gray-400">0{index + 1} / {work.year}</span>
                          <h3 className="text-4xl md:text-6xl font-medium tracking-tighter uppercase group-hover:italic transition-all duration-300 font-serif">{work.title}</h3>
                        </div>
                        <span className="text-sm uppercase tracking-widest border border-gray-200 px-4 py-1 rounded-full">{work.category}</span>
                      </div>
                    </div>
                  </Slide>
                );
              })}

              {/* 04. Contact / Footer Slide */}
              <Slide className="w-[100vw] bg-transparent text-black relative shrink-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center justify-center text-center pointer-events-auto">
                  <h2 className="text-[18vw] leading-[0.8] font-bold uppercase tracking-tighter mb-12 hover:italic transition-all cursor-pointer font-serif">
                    Let's<br />Talk
                  </h2>
                  <div className="flex gap-20 text-lg uppercase tracking-widest">
                    <a href="mailto:hello@adrian.com" className="hover:line-through decoration-2">Email</a>
                    <a href="#" className="hover:line-through decoration-2">Instagram</a>
                    <a href="#" className="hover:line-through decoration-2">LinkedIn</a>
                  </div>
                  <p className="absolute bottom-10 text-gray-400 text-xs tracking-widest uppercase">© 2024 Adrian Garcia</p>
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
                            <span className="text-sm font-mono text-gray-400 mb-4 block">0{work.id} — {work.year}</span>
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
                          <span className="text-sm uppercase tracking-widest border border-black px-5 py-1.5 rounded-full">{work.category}</span>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                        <div className="md:col-span-1 overflow-hidden">
                          <motion.div variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
                          }}>
                            <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">Tech Stack</p>
                            <ul className="text-sm space-y-1.5 font-medium leading-relaxed">
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
