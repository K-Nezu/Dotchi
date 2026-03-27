"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show splash once per session
    if (sessionStorage.getItem("dotchi_splash_shown")) return;
    sessionStorage.setItem("dotchi_splash_shown", "1");
    setShow(true);

    const fadeTimer = setTimeout(() => setFadeOut(true), 1200);
    const hideTimer = setTimeout(() => setShow(false), 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-foreground flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <h1 className="text-4xl text-white animate-splash-logo" style={{ fontFamily: "var(--font-logo)" }}>
        Dotchi
      </h1>
      <p className="text-sm text-white/60 mt-3 animate-splash-tagline">
        5分だけ、知らない誰かに決めてもらう
      </p>
    </div>
  );
}
