'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = { role: 'user' | 'assistant'; content: string };

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const QUICK = ['What do you do?', 'Available for work?', 'Your projects', 'Get in touch'];
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey — I'm here to tell you about Adrián and his work. What would you like to know?",
};

// Icons
const IconRestart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const IconMinimize = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
);

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, ready]);

  const handleExpandComplete = () => {
    if (isOpen) {
      setReady(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleOpen = () => { setReady(false); setIsOpen(true); };
  const handleClose = () => { setReady(false); setIsOpen(false); };

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise(r => setTimeout(r, 300));
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setRestarting(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9998]" style={{ fontFamily: FONT }}>
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 340 : 188,
          height: isOpen ? 500 : 48,
          borderRadius: isOpen ? 20 : 999,
        }}
        transition={{
          width:        { duration: 0.38, delay: isOpen ? 0 : 0.38,    ease: [0.76, 0, 0.24, 1] },
          height:       { duration: 0.44, delay: isOpen ? 0.32 : 0,     ease: [0.76, 0, 0.24, 1] },
          borderRadius: { duration: 0.15, delay: isOpen ? 0.32 : 0.38,  ease: [0.76, 0, 0.24, 1] },
        }}
        onAnimationComplete={handleExpandComplete}
        style={{
          background: '#1a1a1a',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          cursor: isOpen ? 'default' : 'pointer',
        }}
        onClick={!isOpen ? handleOpen : undefined}
      >
        {/* ── Header ── */}
        <div
          className="shrink-0 flex items-center px-5"
          style={{ height: 48, justifyContent: isOpen ? 'space-between' : 'center' }}
        >
          {/* Left: label */}
          <span
            className="text-white text-xs tracking-widest whitespace-nowrap"
            style={{ fontFamily: FONT }}
          >
            {isOpen ? 'Chat' : "let's work together"}
          </span>

          {/* Right: actions — only when open */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1"
              >
                {/* Restart */}
                <ActionBtn
                  onClick={e => { e.stopPropagation(); handleRestart(); }}
                  title="Restart conversation"
                  disabled={loading || restarting}
                >
                  <IconRestart />
                </ActionBtn>

                {/* Minimize */}
                <ActionBtn
                  onClick={e => { e.stopPropagation(); handleClose(); }}
                  title="Minimize"
                >
                  <IconMinimize />
                </ActionBtn>
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
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        style={{
                          background: m.role === 'user' ? '#c98a97' : '#2a2a2a',
                          color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.82)',
                          borderRadius: 14,
                          borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                          borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
                          padding: '9px 14px',
                          fontSize: 13,
                          lineHeight: 1.55,
                          maxWidth: '82%',
                          fontFamily: FONT,
                        }}
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div style={{ background: '#2a2a2a', borderRadius: 14, borderBottomLeftRadius: 4, padding: '11px 14px' }}>
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            style={{ width: 5, height: 5, borderRadius: '50%', background: '#c98a97' }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {messages.length === 1 && !restarting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="px-4 pb-3 flex flex-wrap gap-1.5"
                >
                  {QUICK.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      style={{
                        border: '1px solid rgba(201,138,151,0.3)',
                        color: '#c98a97',
                        background: 'transparent',
                        borderRadius: 999,
                        padding: '5px 11px',
                        fontSize: 11,
                        fontFamily: FONT,
                        cursor: 'pointer',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(201,138,151,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(201,138,151,0.5)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(201,138,151,0.3)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Input */}
              <div className="px-4 pb-4">
                <form
                  onSubmit={e => { e.preventDefault(); send(input); }}
                  style={{
                    background: '#242424',
                    borderRadius: 12,
                    padding: '9px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={loading || restarting}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 12,
                      fontFamily: FONT,
                      opacity: restarting ? 0.4 : 1,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading || restarting}
                    style={{
                      opacity: input.trim() && !loading && !restarting ? 1 : 0.2,
                      transition: 'opacity 0.2s',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: '#c98a97',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <IconSend />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Small icon button used in header
function ActionBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'rgba(255,255,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 8,
        transition: 'color 0.15s, background 0.15s',
        opacity: disabled ? 0.3 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
