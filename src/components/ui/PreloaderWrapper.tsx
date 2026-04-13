"use client";

import { useState } from "react";
import Preloader from "./Preloader";

export default function PreloaderWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  return (
    <>
      {!done && <Preloader onDone={() => setDone(true)} />}
      <div
        style={{
          opacity: done ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
