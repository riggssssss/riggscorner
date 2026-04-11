'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────
type MessageType = 'text' | 'skills' | 'projects' | 'availability' | 'contact';

// Action button — either opens a rich card or triggers navigation
type ActionBtn =
  | { label: string; kind: 'rich'; type: MessageType }
  | { label: string; kind: 'nav';  target: string }     // scroll to #section
  | { label: string; kind: 'project'; id: number }      // open project detail

type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: MessageType;
  ts?: string; // timestamp HH:MM
};

// ── Constants ─────────────────────────────────────────────────────────────
const FONT    = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const W_CLOSED = 148;
const W_OPEN   = 420;
const H_CLOSED = 50;
const MARGIN   = 32;

const QUICK: ActionBtn[] = [
  { label: 'Skills',        kind: 'rich', type: 'skills'       },
  { label: 'Projects',      kind: 'rich', type: 'projects'     },
  { label: 'Availability',  kind: 'rich', type: 'availability' },
  { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
];

// Context-aware suggestions shown after each assistant reply
const SUGGESTIONS: Record<MessageType | 'text', ActionBtn[]> = {
  text: [
    { label: 'Skills',        kind: 'rich', type: 'skills'       },
    { label: 'Projects',      kind: 'rich', type: 'projects'     },
    { label: 'Availability',  kind: 'rich', type: 'availability' },
    { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
  ],
  skills: [
    { label: 'Projects',      kind: 'rich', type: 'projects'     },
    { label: 'Availability',  kind: 'rich', type: 'availability' },
    { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
    { label: '↓ See my work', kind: 'nav',  target: '#work'      },
  ],
  projects: [
    { label: 'Nomada',        kind: 'project', id: 1 },
    { label: 'Eternal',       kind: 'project', id: 2 },
    { label: 'Lumina',        kind: 'project', id: 3 },
    { label: 'Skills',        kind: 'rich', type: 'skills'       },
    { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
  ],
  availability: [
    { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
    { label: 'Skills',        kind: 'rich', type: 'skills'       },
    { label: 'Projects',      kind: 'rich', type: 'projects'     },
    { label: '↓ Contact',     kind: 'nav',  target: '#contact'   },
  ],
  contact: [
    { label: 'Skills',        kind: 'rich', type: 'skills'       },
    { label: 'Projects',      kind: 'rich', type: 'projects'     },
    { label: 'Availability',  kind: 'rich', type: 'availability' },
    { label: '↓ See my work', kind: 'nav',  target: '#work'      },
  ],
};

const THINKING = [
  'Thinking...', 'Let me check that...', 'Good question...', 'On it...',
  'Digging through the archive...', 'Crafting a response...',
  'Reading between the lines...', 'Almost there...',
];

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey — I'm here to tell you about Adrián and his work. What would you like to know?",
  ts: now(),
};

// ── Soft notification chime via Web Audio API ─────────────────────────────
function playPop() {
  try {
    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Two soft sine tones — a gentle rising interval (C5 → E5)
    const freqs = [523.25, 659.25];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.10;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    });

    setTimeout(() => ctx.close(), 900);
  } catch {}
}

const KEYWORDS = new Set([
  'adrián', 'adrian', 'ui', 'ux', 'ui/ux', 'frontend', 'developer', 'designer',
  'react', 'next.js', 'typescript', 'javascript', 'figma', 'nomada', 'eternal',
  'lumina', 'castellón', 'spain', 'freelance', 'available', 'projects', 'design',
  'build', 'code', 'full', 'stack', 'product', 'experience',
]);

// ── Icons ─────────────────────────────────────────────────────────────────
const IconRestart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
  </svg>
);
const IconMinimize = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ── Thinking indicator ────────────────────────────────────────────────────
function ThinkingIndicator() {
  const [phraseIdx] = useState(() => Math.floor(Math.random() * THINKING.length));
  const phrase = THINKING[phraseIdx];
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {phrase.split('').map((char, i) => (
        <motion.span
          key={i}
          animate={{ color: ['rgba(255,255,255,0.25)', '#c98a97', 'rgba(255,255,255,0.25)'] }}
          transition={{ duration: 1.8, delay: i * 0.06, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontFamily: FONT, fontSize: 13, whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

// ── Animated text with keyword highlights ─────────────────────────────────
function AnimatedText({ text, isNew }: { text: string; isNew: boolean }) {
  const words = (text || '').split(' ');
  return (
    <span>
      {words.map((word, i) => {
        const clean = word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ/.]/g, '').toLowerCase();
        const isPink = KEYWORDS.has(clean);
        return (
          <motion.span
            key={i}
            initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: isNew ? i * 0.018 : 0, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'inline-block', marginRight: '0.28em', color: isPink ? '#c98a97' : 'inherit', fontWeight: isPink ? 500 : 400 }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}

// ── Rich UI cards ─────────────────────────────────────────────────────────

const SKILLS = [
  { cat: 'Frontend',   items: ['React', 'Next.js', 'TypeScript', 'CSS'] },
  { cat: 'Design',     items: ['Figma', 'UI/UX', 'Motion', 'Prototyping'] },
  { cat: 'Backend',    items: ['Node.js', 'Java', 'Kotlin', 'SQL'] },
];

function SkillsCard({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}
    >
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', fontFamily: FONT, lineHeight: 1.65, margin: 0 }}>
        I'm a <span style={{ color: '#c98a97' }}>Frontend Developer</span> with a strong eye for <span style={{ color: '#c98a97' }}>design</span> — I build interfaces that are clean, fast and precise.
      </p>
      {SKILLS.map((g, gi) => (
        <motion.div
          key={g.cat}
          initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: isNew ? 0.1 + gi * 0.08 : 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: FONT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{g.cat}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {g.items.map(s => (
              <span key={s} style={{ fontSize: 13, fontFamily: FONT, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '5px 12px' }}>{s}</span>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const PROJECTS = [
  { id: 1, name: 'Nomada',  cat: 'Web Platform', year: '2025', desc: 'Smart asset curation with immersive UI.' },
  { id: 2, name: 'Eternal', cat: 'E-commerce',   year: '2025', desc: '3D physics + petal particles in real-time.' },
  { id: 3, name: 'Lumina',  cat: 'E-commerce',   year: '2025', desc: 'Physics-enabled 3D furniture experience.' },
];

function ProjectsCard({ isNew }: { isNew: boolean }) {
  const openProject = (id: number) => {
    window.dispatchEvent(new CustomEvent('open-project', { detail: { id } }));
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
    >
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', fontFamily: FONT, lineHeight: 1.65, margin: '0 0 10px' }}>
        Here are my recent <span style={{ color: '#c98a97' }}>projects</span>. Tap one to open it.
      </p>
      {PROJECTS.map((p, i) => (
        <motion.button
          key={p.name}
          initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: isNew ? 0.08 + i * 0.08 : 0 }}
          onClick={() => openProject(p.id)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'transparent',
            border: 'none',
            borderBottom: i < PROJECTS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            padding: '13px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s',
            borderRadius: 8,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: FONT, width: 16 }}>0{i + 1}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', fontFamily: FONT, fontWeight: 500 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FONT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.cat}</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,138,151,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </motion.button>
      ))}
    </motion.div>
  );
}

function AvailabilityCard({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}
    >
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', fontFamily: FONT, lineHeight: 1.65, margin: 0 }}>
        Currently <span style={{ color: '#c98a97' }}>open</span> to new opportunities — freelance and full-time.
      </p>
      {[
        { label: 'Freelance',  detail: 'Projects, MVPs, redesigns' },
        { label: 'Full-time',  detail: 'Remote or Castellón area' },
        { label: 'Part-time',  detail: 'Open to discuss' },
      ].map((row, i) => (
        <motion.div
          key={row.label}
          initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: isNew ? 0.1 + i * 0.08 : 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, width: '100%', boxSizing: 'border-box' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', fontFamily: FONT }}>{row.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontFamily: FONT }}>{row.detail}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c98a97', flexShrink: 0 }} />
        </motion.div>
      ))}
    </motion.div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: '13px 16px',
  fontSize: 14,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: FONT,
  outline: 'none',
  transition: 'border-color 0.2s',
};

function ContactCard({ isNew, onSent }: { isNew: boolean; onSent: (msg: string) => void }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    // C — open mailto so the message actually reaches Adrián
    const subject = encodeURIComponent(`Message from ${name} via portfolio`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.open(`mailto:adrian2000gg@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
    onSent(`My name is ${name}, email: ${email}. Message: ${message}`);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '28px 0', fontFamily: FONT }}
      >
        <div style={{ fontSize: 26, marginBottom: 10 }}>✦</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>Message sent.</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)' }}>Adrián will get back to you soon.</div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}
    >
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', fontFamily: FONT, lineHeight: 1.65, margin: '0 0 4px' }}>
        Drop a message — <span style={{ color: '#c98a97' }}>Adrián</span> will get back to you.
      </p>
      {[
        { placeholder: 'Your name',  value: name,  onChange: setName,  type: 'text'  },
        { placeholder: 'Your email', value: email, onChange: setEmail, type: 'email' },
      ].map((f, i) => (
        <motion.input
          key={f.placeholder}
          initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: isNew ? 0.08 + i * 0.07 : 0 }}
          type={f.type}
          placeholder={f.placeholder}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          required
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,138,151,0.45)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
        />
      ))}
      <motion.textarea
        initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: isNew ? 0.22 : 0 }}
        placeholder="What's on your mind?"
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        rows={4}
        style={{ ...inputStyle, resize: 'none' }}
        onFocus={e => (e.target.style.borderColor = 'rgba(201,138,151,0.45)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          background: 'rgba(201,138,151,0.12)',
          border: '1px solid rgba(201,138,151,0.3)',
          borderRadius: 12,
          padding: '14px',
          fontSize: 14,
          color: '#c98a97',
          fontFamily: FONT,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,138,151,0.22)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(201,138,151,0.12)')}
      >
        Send message
      </motion.button>
    </motion.form>
  );
}

// ── Message renderer ──────────────────────────────────────────────────────
function MessageContent({ msg, isNew, onContactSent }: { msg: Message; isNew: boolean; onContactSent: (text: string) => void }) {
  if (msg.role === 'user') {
    return <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 14, lineHeight: 1.65 }}>{msg.content}</span>;
  }
  switch (msg.type) {
    case 'skills':       return <SkillsCard isNew={isNew} />;
    case 'projects':     return <ProjectsCard isNew={isNew} />;
    case 'availability': return <AvailabilityCard isNew={isNew} />;
    case 'contact':      return <ContactCard isNew={isNew} onSent={onContactSent} />;
    default:
      return (
        <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONT, fontSize: 14, lineHeight: 1.65 }}>
          <AnimatedText text={msg.content} isNew={isNew} />
        </span>
      );
  }
}

// ── Main component ────────────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen]         = useState(false);
  const [ready, setReady]           = useState(false);
  const [messages, setMessages]     = useState<Message[]>([INITIAL_MESSAGE]);
  const [newIdx, setNewIdx]         = useState<number | null>(null);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [hOpen, setHOpen]           = useState(600);
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calc = () => setHOpen(window.innerHeight - MARGIN * 2);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Block page scroll (Lenis + native) when chat is open
  useEffect(() => {
    if (!isOpen) return;
    // Stop Lenis
    (window as any).lenis?.stop();
    // Block native scroll/touch
    const prevent = (e: Event) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      e.preventDefault();
    };
    document.addEventListener('wheel', prevent, { passive: false });
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      (window as any).lenis?.start();
      document.removeEventListener('wheel', prevent);
      document.removeEventListener('touchmove', prevent);
    };
  }, [isOpen]);

  // B — scroll to bottom using container scrollTop directly (avoids Lenis interference)
  useEffect(() => {
    if (!ready) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, ready]);

  const handleExpandComplete = () => {
    if (isOpen) { setReady(true); setTimeout(() => inputRef.current?.focus(), 50); }
  };

  const handleOpen  = () => { setReady(false); setIsOpen(true); };
  const handleClose = () => { setReady(false); setIsOpen(false); };

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise(r => setTimeout(r, 280));
    setMessages([INITIAL_MESSAGE]);
    setNewIdx(0);
    setInput('');
    setRestarting(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Quick reply with rich UI — no AI call needed
  const sendRich = (label: string, type: MessageType) => {
    const t = now();
    const userMsg: Message = { role: 'user', content: label, ts: t };
    const richMsg: Message = { role: 'assistant', content: '', type, ts: t };
    setMessages(prev => {
      const next = [...prev, userMsg, richMsg];
      setNewIdx(next.length - 1);
      return next;
    });
  };

  // A — feedback message before navigating away
  const sendNavFeedback = (text: string, cb: () => void) => {
    const t = now();
    setMessages(prev => {
      const next = [...prev, { role: 'assistant' as const, content: text, ts: t }];
      setNewIdx(next.length - 1);
      return next;
    });
    setTimeout(cb, 700);
  };

  // Dispatch any action button
  const handleAction = (btn: ActionBtn) => {
    if (btn.kind === 'rich') {
      sendRich(btn.label, btn.type);
    } else if (btn.kind === 'nav') {
      const label = btn.target === '#work' ? 'Taking you to my work →' : 'Taking you to the contact section →';
      sendNavFeedback(label, () => {
        handleClose();
        setTimeout(() => {
          (window as any).lenis?.scrollTo(btn.target, {
            duration: 2.0,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }, 500);
      });
    } else if (btn.kind === 'project') {
      const names: Record<number, string> = { 1: 'Nomada', 2: 'Eternal', 3: 'Lumina' };
      sendNavFeedback(`Opening ${names[btn.id]} →`, () => {
        handleClose();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-project', { detail: { id: btn.id } }));
        }, 500);
      });
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text, ts: now() }];
    setMessages(next);
    setNewIdx(next.length - 1);
    setInput('');
    setLoading(true);

    // Human-like typing delay — feels like the bot is thinking before replying
    const thinkDelay = 600 + Math.random() * 800;

    try {
      // Strip rich-card messages (empty content) — Groq rejects empty content
      const apiMessages = next
        .filter(m => m.content && m.content.trim() !== '')
        .map(({ role, content }) => ({ role, content }));

      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      const content = (data.content || '').trim();

      if (!content || data.error) {
        throw new Error(data.error || 'empty response');
      }

      await new Promise(r => setTimeout(r, thinkDelay));

      setMessages(prev => {
        const updated = [...prev, { role: 'assistant' as const, content, ts: now() }];
        setNewIdx(updated.length - 1);
        return updated;
      });

      // Play sound after message is set — slight delay so it lands with the text
      setTimeout(playPop, 120);
    } catch {
      await new Promise(r => setTimeout(r, thinkDelay));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        ts: now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSent = (text: string) => send(text);

  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-[9998]" style={{ fontFamily: FONT }}>

      <motion.div
        initial={false}
        animate={{
          width: isOpen ? W_OPEN : W_CLOSED,
          height: isOpen ? hOpen : H_CLOSED,
          borderRadius: isOpen ? 24 : 999,
        }}
        transition={{
          width:        { duration: 0.40, delay: isOpen ? 0 : 0.40,   ease: [0.76, 0, 0.24, 1] },
          height:       { duration: 0.46, delay: isOpen ? 0.34 : 0,    ease: [0.76, 0, 0.24, 1] },
          borderRadius: { duration: 0.15, delay: isOpen ? 0.34 : 0.40, ease: [0.76, 0, 0.24, 1] },
        }}
        onAnimationComplete={handleExpandComplete}
        onClick={!isOpen ? handleOpen : undefined}
        style={{
          background: isOpen ? '#2c2c2c' : 'linear-gradient(135deg, #2c2c2c 0%, #3a2e30 60%, #2c2c2c 100%)',
          overflow: 'hidden',
          boxShadow: isOpen ? 'none' : '0 0 0 1px rgba(201,138,151,0.12)',
          display: 'flex',
          flexDirection: 'column',
          cursor: isOpen ? 'default' : 'pointer',
        }}
      >
        {/* ── Header ── */}
        <div
          className="shrink-0 flex items-center px-5"
          style={{ height: H_CLOSED, justifyContent: isOpen ? 'space-between' : 'center' }}
        >
          {!isOpen && (
            <motion.div
              style={{ width: 10, height: 10, borderRadius: '50%', marginRight: 9, flexShrink: 0, position: 'relative', overflow: 'hidden' }}
              animate={{ scale: [1, 1.28, 0.95, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: [0.33, 0, 0.66, 1], repeatDelay: 1.2, times: [0, 0.2, 0.38, 0.55, 1] }}
            >
              <motion.div
                style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}
                animate={{ background: [
                  'radial-gradient(circle at 30% 30%, #ffffff, #c98a97)',
                  'radial-gradient(circle at 70% 70%, #c98a97, #ffffff)',
                  'radial-gradient(circle at 30% 70%, #ffffff, #c98a97)',
                  'radial-gradient(circle at 30% 30%, #ffffff, #c98a97)',
                ]}}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
          {!isOpen ? (
            <motion.span
              style={{
                fontFamily: FONT, fontSize: 14, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 40%, #d4a0aa 65%, #ffffff 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              animate={{ backgroundPosition: ['100% 0%', '-100% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            >
              let&apos;s talk!
            </motion.span>
          ) : (
            <span style={{ fontFamily: FONT, fontSize: 14, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>
              Chat
            </span>
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-0.5">
                <ActionBtn onClick={e => { e.stopPropagation(); handleRestart(); }} title="New conversation" disabled={loading || restarting}><IconRestart /></ActionBtn>
                <ActionBtn onClick={e => { e.stopPropagation(); handleClose(); }} title="Minimize"><IconMinimize /></ActionBtn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Content ── */}
        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: restarting ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto flex flex-col gap-5"
                style={{ padding: '20px 20px 12px', overscrollBehavior: 'contain' }}
                onWheel={e => {
                  const el = e.currentTarget;
                  const atTop    = el.scrollTop === 0 && e.deltaY < 0;
                  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
                  if (atTop || atBottom) e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* D — sender + timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: m.role === 'assistant' ? 2 : 0, paddingRight: m.role === 'user' ? 2 : 0 }}>
                        <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
                          {m.role === 'user' ? 'You' : 'Adrián'}
                        </span>
                        {m.ts && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: FONT }}>{m.ts}</span>
                        )}
                      </div>
                      <div style={{ maxWidth: m.role === 'user' ? '85%' : '100%' }}>
                        <MessageContent msg={m} isNew={i === newIdx} onContactSent={handleContactSent} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex flex-col items-start gap-1">
                    <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT, paddingLeft: 2 }}>Adrián</span>
                    <ThinkingIndicator />
                  </motion.div>
                )}
              </div>

              {/* Contextual suggestions — always shown after last assistant message */}
              {!loading && !restarting && (() => {
                const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
                const key = (lastAssistant?.type ?? 'text') as MessageType | 'text';
                const suggestions = messages.length === 1 ? QUICK : SUGGESTIONS[key];
                return (
                  <motion.div
                    key={key + messages.length}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}
                  >
                    {suggestions.map((q, i) => (
                      <motion.button
                        key={q.label}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 + i * 0.04 }}
                        onClick={() => handleAction(q)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 999,
                          padding: '7px 16px',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.75)',
                          fontFamily: FONT,
                          cursor: 'pointer',
                          letterSpacing: '0.01em',
                          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(201,138,151,0.1)';
                          e.currentTarget.style.borderColor = 'rgba(201,138,151,0.4)';
                          e.currentTarget.style.color = '#c98a97';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                        }}
                      >
                        {q.label}
                      </motion.button>
                    ))}
                  </motion.div>
                );
              })()}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Input */}
              <div style={{ padding: '14px 20px 18px' }}>
                <form
                  onSubmit={e => { e.preventDefault(); send(input); }}
                  style={{ background: '#444444', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,138,151,0.3)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={loading || restarting}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: FONT, opacity: restarting ? 0.4 : 1, letterSpacing: '0.01em' }}
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || loading || restarting}
                    whileTap={input.trim() ? { scale: 0.88 } : {}}
                    style={{ opacity: input.trim() && !loading && !restarting ? 1 : 0.2, transition: 'opacity 0.2s', background: 'none', border: 'none', cursor: input.trim() ? 'pointer' : 'default', padding: 0, color: '#c98a97', display: 'flex', alignItems: 'center' }}
                  >
                    <IconSend />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────
function ActionBtn({ children, onClick, title, disabled }: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      style={{ background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, transition: 'color 0.15s, background 0.15s', opacity: disabled ? 0.3 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; } }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
