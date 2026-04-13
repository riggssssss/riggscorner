"use client";

import { useEffect, useState } from "react";

const words = [
  "hello",
  "hola",
  "bonjour",
];

const TYPING_SPEED = 70;
const PAUSE_AFTER_WORD = 350;
const ERASE_SPEED = 30;

// Pre-calculate total duration for progress bar
function estimateTotalMs() {
  let total = 0;
  for (let i = 0; i < words.length; i++) {
    total += words[i].length * TYPING_SPEED;
    total += PAUSE_AFTER_WORD;
    if (i < words.length - 1) total += words[i].length * ERASE_SPEED;
  }
  total += 800; // final pause before fade
  return total;
}

const TOTAL_MS = estimateTotalMs();

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "erasing">("typing");
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  // Progress bar ticker
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / TOTAL_MS, 1));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Typing machine
  useEffect(() => {
    const currentWord = words[wordIndex];

    if (phase === "typing") {
      if (displayed.length < currentWord.length) {
        const t = setTimeout(() => {
          setDisplayed(currentWord.slice(0, displayed.length + 1));
        }, TYPING_SPEED);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("pausing"), PAUSE_AFTER_WORD);
        return () => clearTimeout(t);
      }
    }

    if (phase === "pausing") {
      if (wordIndex === words.length - 1) {
        const t = setTimeout(() => {
          setProgress(1);
          setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 500);
          }, 150);
        }, 800);
        return () => clearTimeout(t);
      }
      setPhase("erasing");
    }

    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => {
          setDisplayed((d) => d.slice(0, d.length - 1));
        }, ERASE_SPEED);
        return () => clearTimeout(t);
      } else {
        setWordIndex((i) => i + 1);
        setPhase("typing");
      }
    }
  }, [displayed, phase, wordIndex, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      {/* Typed word */}
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontSize: "clamp(0.7rem, 1.2vw, 0.875rem)",
          letterSpacing: "0.2em",
          color: "#fff",
          minWidth: "10ch",
          textAlign: "center",
        }}
      >
        {displayed}
        <span
          style={{
            display: "inline-block",
            width: "1px",
            height: "0.85em",
            backgroundColor: "#fff",
            marginLeft: "2px",
            verticalAlign: "middle",
            animation: "blink 0.7s step-end infinite",
          }}
        />
      </span>

      {/* Progress bar — below text */}
      <div
        style={{
          marginTop: "1.25rem",
          width: "5rem",
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            height: "1px",
            backgroundColor: "#fff",
            width: `${progress * 100}%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
