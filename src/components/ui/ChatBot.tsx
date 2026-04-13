'use client';

import { useState, useRef, useEffect } from 'react';
import { works } from '@/data/works';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────
type MessageType = 'text' | 'skills' | 'projects' | 'availability' | 'contact' | 'about';

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

const pillLabelVariants = {
  hidden: {
    clipPath: 'inset(0 100% 0 0)',
    transition: { duration: 0.001 },
  },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.38, ease: [0.76, 0, 0.24, 1] },
  },
  exitWipe: {
    clipPath: 'inset(0 0% 0 100%)',
    transition: { duration: 0.18, ease: [0.76, 0, 0.24, 1] },
  },
};

const QUICK: ActionBtn[] = [
  { label: 'About me',      kind: 'rich', type: 'about'        },
  { label: 'Skills',        kind: 'rich', type: 'skills'       },
  { label: 'Projects',      kind: 'rich', type: 'projects'     },
  { label: 'Availability',  kind: 'rich', type: 'availability' },
  { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
];

// All possible rich/nav/project actions — used to build dynamic suggestions
const ALL_RICH: ActionBtn[] = [
  { label: 'About me',      kind: 'rich', type: 'about'        },
  { label: 'Skills',        kind: 'rich', type: 'skills'       },
  { label: 'Projects',      kind: 'rich', type: 'projects'     },
  { label: 'Availability',  kind: 'rich', type: 'availability' },
  { label: 'Get in touch',  kind: 'rich', type: 'contact'      },
];
const PROJECT_BTNS: ActionBtn[] = [
  { label: 'Nomada',  kind: 'project', id: 1 },
  { label: 'Lumina',  kind: 'project', id: 3 },
];
// Returns up to 4 contextual suggestions, filtering out cards already seen
function getSuggestions(messages: Message[]): ActionBtn[] {
  if (messages.length <= 1) return QUICK;

  // Track which rich types have already been shown as cards
  const seenTypes = new Set<string>(
    messages
      .filter(m => m.role === 'assistant' && m.type)
      .map(m => m.type as string)
  );

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  const lastType = lastAssistant?.type;

  // After projects card — show project links first, then unseen rich cards
  if (lastType === 'projects') {
    const rest = ALL_RICH
      .filter(b => b.kind === 'rich' && !seenTypes.has(b.type))
      .slice(0, 2);
    return [...PROJECT_BTNS, ...rest].slice(0, 4);
  }

  // After availability or skills — show unseen rich cards only
  if (lastType === 'availability' || lastType === 'skills') {
    const unseen = ALL_RICH.filter(b => b.kind === 'rich' && !seenTypes.has(b.type));
    return unseen.slice(0, 4);
  }

  // After contact or plain text — show unseen rich cards
  const unseen = ALL_RICH.filter(b => b.kind === 'rich' && !seenTypes.has(b.type));
  if (unseen.length >= 2) return unseen.slice(0, 4);

  // Most things seen — suggest projects
  return [...unseen, ...PROJECT_BTNS].slice(0, 4);
}

const THINKING = [
  'Thinking...', 'Good question...', 'On it...',
  'Let me think...', 'Give me a sec...', 'Almost...',
  'Processing at human speed...', 'Reading between the lines...',
];

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey! I'm Adrián — glad you stopped by. Ask me anything, I don't bite.",
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

// ── Thinking indicator ────────────────────────────────────────────────────
function ThinkingIndicator() {
  // useRef so each mount picks a fresh random phrase (useState initializer runs once per instance lifetime)
  const phrase = useRef(THINKING[Math.floor(Math.random() * THINKING.length)]).current;
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

// ── Markdown inline parser ─────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Patterns: **bold**, *italic*, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0, match: RegExpExecArray | null;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={idx++}>{text.slice(last, match.index)}</span>);
    }
    if (match[2]) {
      nodes.push(<strong key={idx++} style={{ color: '#e8b4be', fontWeight: 600 }}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={idx++} style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>{match[3]}</em>);
    } else if (match[4] && match[5]) {
      nodes.push(<a key={idx++} href={match[5]} target="_blank" rel="noopener noreferrer" style={{ color: '#c98a97', textDecoration: 'underline', textUnderlineOffset: 3 }}>{match[4]}</a>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(<span key={idx++}>{text.slice(last)}</span>);
  return nodes;
}

// ── Animated text with keyword highlights + markdown ──────────────────────
function AnimatedText({ text, isNew }: { text: string; isNew: boolean }) {
  const lines = (text || '').split('\n');
  let wordCounter = 0;
  return (
    <span style={{ display: 'block' }}>
      {lines.map((line, li) => {
        // Unordered list item
        const isList = /^[-*•]\s+/.test(line);
        const content = isList ? line.replace(/^[-*•]\s+/, '') : line;
        const words = content.split(' ');
        const rendered = (
          <span key={li} style={{ display: isList ? 'flex' : 'inline', gap: isList ? 6 : 0, alignItems: isList ? 'baseline' : undefined }}>
            {isList && <span style={{ color: '#c98a97', flexShrink: 0, marginRight: 2 }}>·</span>}
            {words.map((word, wi) => {
              const wIdx = wordCounter++;
              const clean = word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ/.]/g, '').toLowerCase();
              const isPink = KEYWORDS.has(clean);
              return (
                <motion.span
                  key={wi}
                  initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: isNew ? wIdx * 0.016 : 0, ease: [0.23, 1, 0.32, 1] }}
                  style={{ display: 'inline-block', marginRight: '0.28em', color: isPink ? '#c98a97' : 'inherit', fontWeight: isPink ? 500 : 400 }}
                >
                  {parseInline(word)}
                </motion.span>
              );
            })}
          </span>
        );
        return (
          <span key={li} style={{ display: isList ? 'block' : 'inline' }}>
            {rendered}
            {!isList && li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

// ── Rich UI cards ─────────────────────────────────────────────────────────

const SKILLS = [
  {
    cat: 'Frontend',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    items: ['React', 'Next.js', 'TypeScript', 'CSS', 'Framer Motion'],
  },
  {
    cat: 'Design',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    items: ['Figma', 'UI/UX', 'Motion', 'Prototyping'],
  },
  {
    cat: 'Backend',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    items: ['Node.js', 'Java', 'Kotlin', 'SQL'],
  },
];

function SkillsCard({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}
    >
      {/* Header */}
      <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontFamily: FONT, lineHeight: 1.7, margin: 0 }}>
          Frontend dev with a <span style={{ color: '#e8b4be', fontWeight: 500 }}>design-first</span> approach. I build interfaces that feel right, not just work right.
        </p>
      </div>

      {/* Skill groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SKILLS.map((g, gi) => (
          <motion.div
            key={g.cat}
            initial={isNew ? { opacity: 0, x: -8 } : { opacity: 1 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: isNew ? 0.1 + gi * 0.07 : 0 }}
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
          >
            {/* Label col */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 78, paddingTop: 3 }}>
              <span style={{ color: 'rgba(201,138,151,0.7)' }}>{g.icon}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{g.cat}</span>
            </div>
            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {g.items.map((s, si) => (
                <motion.span
                  key={s}
                  initial={isNew ? { opacity: 0, scale: 0.88 } : { opacity: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: isNew ? 0.15 + gi * 0.07 + si * 0.04 : 0 }}
                  style={{
                    fontSize: 12, fontFamily: FONT, color: 'rgba(255,255,255,0.82)',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6, padding: '3px 10px', lineHeight: 1.6,
                  }}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProjectsCard({ isNew }: { isNew: boolean }) {
  const openProject = (id: number) => {
    window.dispatchEvent(new CustomEvent('open-project', { detail: { id } }));
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}
    >
      {works.map((p, i) => (
        <motion.div
          key={p.id}
          initial={isNew ? { opacity: 0, y: 8 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: isNew ? i * 0.1 : 0 }}
          style={{
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.11)',
            overflow: 'hidden',
          }}
        >
          {/* Top: title + meta */}
          <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.92)', fontFamily: FONT, fontWeight: 400, marginBottom: 5, letterSpacing: '-0.01em' }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{p.category}</span>
                <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>{p.year}</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: FONT, fontVariantNumeric: 'tabular-nums', paddingTop: 3 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Description */}
          <div style={{ padding: '0 18px 14px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: FONT, lineHeight: 1.7, margin: 0 }}>
              {p.description}
            </p>
          </div>

          {/* Services */}
          <div style={{ padding: '0 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.services.map(s => (
              <span key={s} style={{
                fontSize: 10, fontFamily: FONT, color: 'rgba(201,138,151,0.85)',
                background: 'rgba(201,138,151,0.1)', border: '1px solid rgba(201,138,151,0.22)',
                borderRadius: 5, padding: '3px 8px', letterSpacing: '0.03em',
              }}>{s}</span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => openProject(p.id)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: 'none', borderTop: '1px solid rgba(255,255,255,0.09)',
              padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,138,151,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: FONT, letterSpacing: '0.02em' }}>Open case study</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(201,138,151,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}

const AVAILABILITY_MODES = [
  {
    label: 'Freelance',
    detail: 'One-off projects, MVPs, redesigns',
    sub: 'Flexible scope & timeline',
  },
  {
    label: 'Full-time',
    detail: 'Remote or Castellón area',
    sub: 'Looking for product-focused teams',
  },
  {
    label: 'Part-time',
    detail: 'Side collaboration or consulting',
    sub: 'A few hours a week, open to discuss',
  },
];

function AvailabilityCard({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', width: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.11)', overflow: 'hidden' }}
    >
      {/* Status header */}
      <motion.div
        initial={isNew ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: isNew ? 0.04 : 0 }}
        style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }}>
            <motion.div
              animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#c98a97' }}
            />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#c98a97' }} />
          </div>
          <span style={{ fontSize: 10, color: '#c98a97', fontFamily: FONT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Available now</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: FONT, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
          Open to new work as of {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} — whether it's a quick project or something longer. I'm based in Castellón but work <span style={{ color: '#c98a97' }}>fully remote</span>.
        </p>
      </motion.div>

      {/* Mode rows */}
      {AVAILABILITY_MODES.map((row, i) => (
        <motion.div
          key={row.label}
          initial={isNew ? { opacity: 0, x: -6 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, delay: isNew ? 0.12 + i * 0.08 : 0 }}
          style={{
            padding: '14px 20px',
            borderBottom: i < AVAILABILITY_MODES.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontFamily: FONT, fontWeight: 400, marginBottom: 3 }}>{row.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontFamily: FONT, marginBottom: 1 }}>{row.detail}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{row.sub}</div>
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(201,138,151,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      ))}

      {/* Footer nudge */}
      <motion.div
        initial={isNew ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: isNew ? 0.38 : 0 }}
        style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
      >
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: FONT }}>
          Not sure what fits? Just ask — we'll figure it out.
        </span>
      </motion.div>
    </motion.div>
  );
}

function AboutCard({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.11)', overflow: 'hidden' }}
    >
      {/* Bio block */}
      <motion.div
        initial={isNew ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: isNew ? 0.05 : 0 }}
        style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: FONT, lineHeight: 1.75, margin: 0, fontWeight: 400 }}>
          I'm a frontend developer and designer from Castellón, Spain. Currently studying Software Developer DAM while building real products — I care a lot about the UI <span style={{ color: '#c98a97' }}>feeling right</span>, not just working right.
        </p>
      </motion.div>

      {/* Facts */}
      {[
        { label: 'Based in',   value: 'Castellón, Spain' },
        { label: 'Studies',    value: 'Software Developer DAM' },
        { label: 'Certified',  value: 'IBM UX Design Fundamentals' },
        { label: 'Languages',  value: 'Spanish · Valencian · English' },
      ].map((row, i) => (
        <motion.div
          key={row.label}
          initial={isNew ? { opacity: 0, x: -6 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, delay: isNew ? 0.12 + i * 0.07 : 0 }}
          style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
            padding: '12px 20px',
            borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: FONT, letterSpacing: '0.09em', textTransform: 'uppercase', flexShrink: 0 }}>{row.label}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: FONT, textAlign: 'right' }}>{row.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)',
  fontFamily: FONT,
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
};

function ContactCard({ isNew, onSent }: { isNew: boolean; onSent: (msg: string) => void }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Send failed');
      setSent(true);
      onSent(`My name is ${name}, email: ${email}. Message: ${message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ textAlign: 'center', padding: '32px 0', fontFamily: FONT }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{ fontSize: 28, marginBottom: 14, color: '#c98a97' }}
        >
          ✦
        </motion.div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', marginBottom: 6, fontWeight: 500 }}>Message sent.</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>I'll get back to you soon — promise.</div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={isNew ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontFamily: FONT, fontWeight: 500, marginBottom: 3 }}>Get in touch</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontFamily: FONT, lineHeight: 1.5 }}>I read every message. Usually reply within 24h.</div>
      </div>

      {/* Inputs row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { placeholder: 'Name',  value: name,  onChange: setName,  type: 'text'  },
          { placeholder: 'Email', value: email, onChange: setEmail, type: 'email' },
        ].map((f, i) => (
          <motion.input
            key={f.placeholder}
            initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: isNew ? 0.08 + i * 0.06 : 0 }}
            type={f.type}
            placeholder={f.placeholder}
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            required
            disabled={sending}
            style={{ ...inputStyle, flex: 1, minWidth: 0, opacity: sending ? 0.6 : 1 }}
            onFocus={e => { e.target.style.borderColor = 'rgba(201,138,151,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
          />
        ))}
      </div>

      <motion.textarea
        initial={isNew ? { opacity: 0, y: 6 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: isNew ? 0.2 : 0 }}
        placeholder="What's on your mind?"
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        disabled={sending}
        rows={3}
        style={{ ...inputStyle, resize: 'none', lineHeight: 1.6, opacity: sending ? 0.6 : 1 }}
        onFocus={e => { e.target.style.borderColor = 'rgba(201,138,151,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
        onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      />

      {error && (
        <div style={{ fontSize: 12, color: '#e8706a', fontFamily: FONT, padding: '6px 10px', background: 'rgba(232,112,106,0.08)', border: '1px solid rgba(232,112,106,0.18)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      <motion.button
        type="submit"
        disabled={sending}
        whileTap={!sending ? { scale: 0.97 } : {}}
        initial={isNew ? { opacity: 0, y: 4 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: isNew ? 0.28 : 0 }}
        style={{
          width: '100%', background: sending ? 'rgba(201,138,151,0.07)' : 'rgba(201,138,151,0.1)',
          border: '1px solid rgba(201,138,151,0.22)',
          borderRadius: 10, padding: '11px', fontSize: 13, color: '#c98a97', fontFamily: FONT,
          cursor: sending ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
          transition: 'background 0.2s, border-color 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}
        onMouseEnter={e => { if (!sending) { e.currentTarget.style.background = 'rgba(201,138,151,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,138,151,0.35)'; } }}
        onMouseLeave={e => { e.currentTarget.style.background = sending ? 'rgba(201,138,151,0.07)' : 'rgba(201,138,151,0.1)'; e.currentTarget.style.borderColor = 'rgba(201,138,151,0.22)'; }}
      >
        {sending ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', width: 12, height: 12, border: '1.5px solid rgba(201,138,151,0.3)', borderTopColor: '#c98a97', borderRadius: '50%' }}
            />
            Sending...
          </>
        ) : (
          <>
            Send message
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </>
        )}
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
    case 'about':        return <div style={{ paddingBottom: 12 }}><AboutCard isNew={isNew} /></div>;
    case 'skills':       return <div style={{ paddingBottom: 12 }}><SkillsCard isNew={isNew} /></div>;
    case 'projects':     return <div style={{ paddingBottom: 12 }}><ProjectsCard isNew={isNew} /></div>;
    case 'availability': return <div style={{ paddingBottom: 12 }}><AvailabilityCard isNew={isNew} /></div>;
    case 'contact':      return <div style={{ paddingBottom: 12 }}><ContactCard isNew={isNew} onSent={onContactSent} /></div>;
    default:
      return (
        <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONT, fontSize: 14, lineHeight: 1.65 }}>
          <AnimatedText text={msg.content} isNew={isNew} />
        </span>
      );
  }
}

// ── Mobile chatbot — floating button + bottom sheet ───────────────────────
function MobileChatBot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [INITIAL_MESSAGE];
    try {
      const saved = localStorage.getItem('chatbot-messages-mobile');
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        return parsed.length > 0 ? parsed : [INITIAL_MESSAGE];
      }
    } catch {}
    return [INITIAL_MESSAGE];
  });
  const [newIdx, setNewIdx]             = useState<number | null>(null);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [restarting, setRestarting]     = useState(false);
  const [shake, setShake]               = useState(false);
  const [sending, setSending]           = useState(false);
  const [showChat, setShowChat]         = useState(false);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const userScrolledRef = useRef(false);

  // Persist messages
  useEffect(() => {
    try { localStorage.setItem('chatbot-messages-mobile', JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showChat) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!userScrolledRef.current) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, showChat]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = showChat ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showChat]);

  // Listen for open-chat event (e.g. from Contact CTA button)
  useEffect(() => {
    const handler = () => setShowChat(true);
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise(r => setTimeout(r, 280));
    try { localStorage.removeItem('chatbot-messages-mobile'); } catch {}
    setMessages([INITIAL_MESSAGE]);
    setNewIdx(0);
    setInput('');
    setRestarting(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sendRich = (label: string, type: MessageType) => {
    userScrolledRef.current = false;
    const t = now();
    setMessages(prev => {
      const next = [...prev, { role: 'user' as const, content: label, ts: t }, { role: 'assistant' as const, content: '', type, ts: t }];
      setNewIdx(next.length - 1);
      return next;
    });
  };

  const sendNavFeedback = (text: string, cb: () => void) => {
    const t = now();
    setMessages(prev => {
      const next = [...prev, { role: 'assistant' as const, content: text, ts: t }];
      setNewIdx(next.length - 1);
      return next;
    });
    setTimeout(cb, 700);
  };

  const handleAction = (btn: ActionBtn) => {
    if (btn.kind === 'rich') {
      sendRich(btn.label, btn.type);
    } else if (btn.kind === 'nav') {
      const label = btn.target === '#work' ? 'Taking you to my work →' : 'Taking you to the contact section →';
      sendNavFeedback(label, () => {
        setShowChat(false);
        // Wait for sheet close animation (450ms) + body overflow restore + extra buffer
        setTimeout(() => {
          const el = document.querySelector(btn.target) as HTMLElement | null;
          if ((window as any).lenis) {
            (window as any).lenis.scrollTo(btn.target, {
              duration: 2.0,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          } else if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 600);
      });
    } else if (btn.kind === 'project') {
      const name = works.find(w => w.id === btn.id)?.title ?? 'project';
      sendNavFeedback(`Opening ${name} →`, () => {
        setShowChat(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-project', { detail: { id: btn.id } }));
        }, 500);
      });
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    userScrolledRef.current = false;
    setSending(true);
    setTimeout(() => setSending(false), 500);
    const next: Message[] = [...messages, { role: 'user', content: text, ts: now() }];
    setMessages(next);
    setNewIdx(next.length - 1);
    setInput('');
    setLoading(true);
    setStreamingText('');

    try {
      const apiMessages = next
        .filter(m => m.content && m.content.trim() !== '')
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) throw new Error('Stream unavailable');

      setLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText(accumulated);
        if (!userScrolledRef.current) {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        }
      }

      const finalContent = accumulated.trim();
      if (!finalContent) throw new Error('empty response');
      setStreamingText('');
      setMessages(prev => {
        const updated = [...prev, { role: 'assistant' as const, content: finalContent, ts: now() }];
        setNewIdx(updated.length - 1);
        return updated;
      });
      setTimeout(playPop, 80);
    } catch {
      setStreamingText('');
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, algo se rompió. ¿Lo intentamos de nuevo?', ts: now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSent = (text: string) => send(text);

  return (
    <>
      {/* ── Floating pill button — visible when sheet is closed ── */}
      <AnimatePresence>
        {!showChat && (
          <motion.button
            key="chat-pill"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            onClick={() => setShowChat(true)}
            style={{
              position: 'fixed', bottom: 24, right: 16, zIndex: 9998,
              background: 'linear-gradient(135deg, #000 0%, #1a0d0f 60%, #000 100%)',
              borderRadius: 999, padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 0 1px rgba(201,138,151,0.2), 0 8px 32px rgba(0,0,0,0.3)',
              border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
              <motion.div
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#c98a97' }}
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#c98a97' }} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>let's talk!</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet + backdrop ── */}
      <AnimatePresence>
        {showChat && (
          <>
            {/* Backdrop */}
            <motion.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowChat(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9997,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Sheet */}
            <motion.div
              key="chat-sheet"
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              data-lenis-prevent
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '88vh', zIndex: 9998,
                background: '#000',
                borderRadius: '20px 20px 0 0',
                display: 'flex', flexDirection: 'column',
                fontFamily: FONT, touchAction: 'none',
              }}
            >
              {/* Drag handle */}
              <div style={{ padding: '12px 0 6px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Sheet header */}
              <div style={{
                height: 56, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #c98a97 0%, #e8b4be 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.55)', fontFamily: FONT,
                  }}>A</div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, fontWeight: 400 }}>Adrián García</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ActionBtn onClick={e => { e.stopPropagation(); handleRestart(); }} title="Nueva conversación" disabled={loading || restarting}><IconRestart /></ActionBtn>
                  <ActionBtn onClick={e => { e.stopPropagation(); setShowChat(false); }} title="Cerrar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </ActionBtn>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 28px', display: 'flex', flexDirection: 'column', gap: 20, overscrollBehavior: 'contain' }}
                onScroll={e => {
                  const el = e.currentTarget;
                  userScrolledRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
                }}
              >
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: m.role === 'assistant' ? 2 : 0, paddingRight: m.role === 'user' ? 2 : 0 }}>
                        <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>{m.role === 'user' ? 'Tú' : 'Adrián'}</span>
                        {m.ts && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: FONT }}>{m.ts}</span>}
                      </div>
                      <div style={{ maxWidth: m.role === 'user' ? '85%' : '100%' }}>
                        <MessageContent msg={m} isNew={i === newIdx} onContactSent={handleContactSent} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT, paddingLeft: 2 }}>Adrián</span>
                    <ThinkingIndicator />
                  </motion.div>
                )}

                {/* Streaming text */}
                {!loading && streamingText && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT, paddingLeft: 2 }}>Adrián</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONT, fontSize: 14, lineHeight: 1.65 }}>
                      <AnimatedText text={streamingText} isNew={false} />
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ display: 'inline-block', width: 2, height: '1em', background: '#c98a97', borderRadius: 1, marginLeft: 2, verticalAlign: 'text-bottom' }}
                      />
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Suggestions */}
              {!loading && !streamingText && !restarting && (() => {
                const suggestions = getSuggestions(messages);
                return (
                  <div style={{ padding: '8px 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 7, flexShrink: 0 }}>
                    {suggestions.map((q: ActionBtn) => {
                      const isProject = q.kind === 'project';
                      return (
                        <button
                          key={q.label}
                          onClick={() => handleAction(q)}
                          style={{
                            background: isProject ? 'rgba(201,138,151,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isProject ? 'rgba(201,138,151,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 999, padding: '7px 14px', fontSize: 12,
                            color: isProject ? '#c98a97' : 'rgba(255,255,255,0.75)',
                            fontFamily: FONT, cursor: 'pointer',
                            letterSpacing: '0.01em', whiteSpace: 'nowrap',
                          }}
                        >
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

              {/* Input */}
              <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', flexShrink: 0 }}>
                <motion.form
                  onSubmit={e => { e.preventDefault(); if (!input.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; } send(input); }}
                  animate={shake ? { x: [0, -6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  style={{ background: 'rgba(50,50,50,0.9)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregúntame lo que quieras..."
                    disabled={loading || restarting}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: FONT, opacity: restarting ? 0.4 : 1 }}
                  />
                  <motion.button
                    type="submit"
                    disabled={loading || restarting}
                    whileTap={input.trim() ? { scale: 0.88 } : {}}
                    style={{ opacity: input.trim() && !loading && !restarting ? 1 : 0.25, transition: 'opacity 0.2s', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#c98a97', display: 'flex', alignItems: 'center', overflow: 'hidden', width: 20, height: 20 }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {sending ? (
                        <motion.span key="sending" initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }} style={{ display: 'flex', alignItems: 'center' }}><IconSend /></motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }} style={{ display: 'flex', alignItems: 'center' }}><IconSend /></motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Desktop chat component ────────────────────────────────────────────────
function DesktopChatBot() {
  const [isOpen, setIsOpen]         = useState(false);
  const [ready, setReady]           = useState(false);
  const [pillReady, setPillReady]   = useState(true);
  const [messages, setMessages]     = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [INITIAL_MESSAGE];
    try {
      const saved = localStorage.getItem('chatbot-messages');
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        return parsed.length > 0 ? parsed : [INITIAL_MESSAGE];
      }
    } catch {}
    return [INITIAL_MESSAGE];
  });
  const [newIdx, setNewIdx]             = useState<number | null>(null);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [restarting, setRestarting]     = useState(false);
  const [hOpen, setHOpen]               = useState(600);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [shake, setShake]               = useState(false);
  const [sending, setSending]           = useState(false);
  const userScrolledRef = useRef(false);
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calc = () => setHOpen(window.innerHeight - MARGIN * 2);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Persist conversation
  useEffect(() => {
    try { localStorage.setItem('chatbot-messages', JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Open chat from external event (e.g. scroll end) and show contact card
  useEffect(() => {
    const handler = () => {
      if (!isOpen) {
        handleOpen();
        setTimeout(() => sendRich('Get in touch', 'contact'), 900);
      }
    };
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, [isOpen]);

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

  // Smart auto-scroll — only if user hasn't scrolled up manually
  useEffect(() => {
    if (!ready) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!userScrolledRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, ready]);

  // Track scroll + block scroll bleed into page (Lenis listens on window so onWheel React isn't enough)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledRef.current = distFromBottom > 80;
      setShowScrollTop(el.scrollTop > 120);
    };
    const onWheel = (e: WheelEvent) => {
      const atTop    = el.scrollTop === 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom) e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, [ready]);

  const handleExpandComplete = () => {
    if (isOpen) { setReady(true); setTimeout(() => inputRef.current?.focus(), 50); }
  };

  const handleOpen  = () => { setReady(false); setPillReady(false); setIsOpen(true); };
  const handleClose = () => {
    setReady(false);
    setIsOpen(false);
    setPillReady(false);
    setTimeout(() => setPillReady(true), 820);
  };

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise(r => setTimeout(r, 280));
    try { localStorage.removeItem('chatbot-messages'); } catch {}
    setMessages([INITIAL_MESSAGE]);
    setNewIdx(0);
    setInput('');
    setRestarting(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Quick reply with rich UI — no AI call needed
  const sendRich = (label: string, type: MessageType) => {
    userScrolledRef.current = false;
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
      const name = works.find(w => w.id === btn.id)?.title ?? 'project';
      sendNavFeedback(`Opening ${name} →`, () => {
        handleClose();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-project', { detail: { id: btn.id } }));
        }, 500);
      });
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    userScrolledRef.current = false;
    setSending(true);
    setTimeout(() => setSending(false), 500);
    const next: Message[] = [...messages, { role: 'user', content: text, ts: now() }];
    setMessages(next);
    setNewIdx(next.length - 1);
    setInput('');
    setLoading(true);
    setStreamingText('');

    try {
      const apiMessages = next
        .filter(m => m.content && m.content.trim() !== '')
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) throw new Error('Stream unavailable');

      // Switch from loading indicator to streaming mode
      setLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText(accumulated);
        // Keep scroll locked to bottom while streaming
        if (!userScrolledRef.current) {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        }
      }

      // Commit streamed text as a real message and clear streaming state
      const finalContent = accumulated.trim();
      if (!finalContent) throw new Error('empty response');
      setStreamingText('');
      setMessages(prev => {
        const updated = [...prev, { role: 'assistant' as const, content: finalContent, ts: now() }];
        setNewIdx(updated.length - 1);
        return updated;
      });
      setTimeout(playPop, 80);
    } catch {
      setStreamingText('');
      setLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Oops, something broke on my end. Try again?',
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
          background: isOpen ? '#000' : 'linear-gradient(135deg, #000 0%, #1a0d0f 60%, #000 100%)',
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
          <motion.span
            style={{
              fontFamily: FONT, fontSize: 14, letterSpacing: '0.08em', whiteSpace: 'nowrap',
              background: isOpen ? 'none' : 'linear-gradient(90deg, #ffffff 0%, #c98a97 40%, #e8b4be 60%, #ffffff 100%)',
              backgroundSize: isOpen ? 'auto' : '200% auto',
              WebkitBackgroundClip: isOpen ? 'unset' : 'text',
              WebkitTextFillColor: isOpen ? 'rgba(255,255,255,0.9)' : 'transparent',
              color: isOpen ? 'rgba(255,255,255,0.9)' : 'transparent',
            }}
            animate={!isOpen ? { backgroundPosition: ['0% center', '200% center'] } : {}}
            transition={!isOpen ? { duration: 4, repeat: Infinity, ease: 'linear' } : {}}
          >
            {isOpen ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #c98a97 0%, #e8b4be 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.55)', letterSpacing: 0, fontFamily: FONT,
                }}>A</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 400, letterSpacing: '0.02em', fontFamily: FONT }}>Adrián García</span>
              </span>
            ) : "let's talk!"}
          </motion.span>

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
              style={{ position: 'relative' }}
            >
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto flex flex-col gap-5"
                style={{ padding: '20px 20px 12px', overscrollBehavior: 'contain' }}
              >
                {/* Scroll-to-top */}
                <AnimatePresence>
                  {showScrollTop && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', marginBottom: -12, pointerEvents: 'none' }}
                    >
                      <button
                        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                          pointerEvents: 'all',
                          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
                          padding: '4px 11px 4px 9px', display: 'flex', alignItems: 'center', gap: 5,
                          cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: FONT, fontSize: 11, letterSpacing: '0.04em',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#c98a97'; e.currentTarget.style.borderColor = 'rgba(201,138,151,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        top
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* Streaming text — shown while response is being received */}
                {!loading && streamingText && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-start gap-1">
                    <span style={{ fontSize: 11, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)', fontFamily: FONT, paddingLeft: 2 }}>Adrián</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: FONT, fontSize: 14, lineHeight: 1.65 }}>
                      <AnimatedText text={streamingText} isNew={false} />
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ display: 'inline-block', width: 2, height: '1em', background: '#c98a97', borderRadius: 1, marginLeft: 2, verticalAlign: 'text-bottom' }}
                      />
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Contextual suggestions — always shown after last assistant message */}
              {!loading && !streamingText && !restarting && (() => {
                const suggestions = getSuggestions(messages);
                return (
                  <motion.div
                    key={messages.length}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}
                  >
                    {suggestions.map((q: ActionBtn, i: number) => {
                      const isProject = q.kind === 'project';
                      return (
                        <motion.button
                          key={q.label}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.05 + i * 0.04 }}
                          onClick={() => handleAction(q)}
                          style={{
                            background: isProject ? 'rgba(201,138,151,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isProject ? 'rgba(201,138,151,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 999,
                            padding: '7px 16px',
                            fontSize: 12,
                            color: isProject ? '#c98a97' : 'rgba(255,255,255,0.75)',
                            fontFamily: FONT,
                            cursor: 'pointer',
                            letterSpacing: '0.01em',
                            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(201,138,151,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(201,138,151,0.5)';
                            e.currentTarget.style.color = '#c98a97';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = isProject ? 'rgba(201,138,151,0.1)' : 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = isProject ? 'rgba(201,138,151,0.3)' : 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = isProject ? '#c98a97' : 'rgba(255,255,255,0.75)';
                          }}
                        >
                          {q.label}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                );
              })()}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Input */}
              <div style={{ padding: '14px 20px 18px' }}>
                <motion.form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!input.trim()) {
                      setShake(true);
                      setTimeout(() => setShake(false), 500);
                      return;
                    }
                    send(input);
                  }}
                  animate={shake ? { x: [0, -6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}
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
                    disabled={loading || restarting}
                    whileTap={input.trim() ? { scale: 0.88 } : {}}
                    style={{ opacity: input.trim() && !loading && !restarting ? 1 : 0.25, transition: 'opacity 0.2s', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#c98a97', display: 'flex', alignItems: 'center', overflow: 'hidden', width: 20, height: 20 }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {sending ? (
                        <motion.span
                          key="sending"
                          initial={{ y: 0, opacity: 1 }}
                          animate={{ y: -20, opacity: 0 }}
                          exit={{ y: 20, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <IconSend />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <IconSend />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Root export — picks desktop vs mobile ─────────────────────────────────
export default function ChatBot() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!mounted) return null;
  return isMobile ? <MobileChatBot /> : <DesktopChatBot />;
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
