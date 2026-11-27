"use client";

import { useEffect, useRef, useState } from "react";

export interface MotionPosterHeroProps {
  gifSrc: string;
  /** Omit when no static frame is available; a neutral background is used. */
  finalFrameSrc?: string;
  durationMs: number;
  alt: string;
  onComplete?: () => void;
}

const LOAD_TIMEOUT_MS = 10_000;
const MAX_DURATION_MS = 120_000;

/** Locks the document, including iOS Safari, and restores only touched styles. */
function lockScroll(): () => void {
  const root = document.documentElement;
  const body = document.body;
  const x = window.scrollX;
  const y = window.scrollY;
  const saved: Array<[CSSStyleDeclaration, string, string, string]> = [];
  const set = (style: CSSStyleDeclaration, name: string, value: string) => {
    saved.push([style, name, style.getPropertyValue(name), style.getPropertyPriority(name)]);
    style.setProperty(name, value, "important");
  };
  set(root.style, "overflow", "hidden");
  set(root.style, "overscroll-behavior", "none");
  set(body.style, "position", "fixed");
  set(body.style, "top", `${-y}px`);
  set(body.style, "left", `${-x}px`);
  set(body.style, "width", "100%");
  set(body.style, "overflow", "hidden");
  const blockTouch = (event: TouchEvent) => {
    if (event.touches.length === 1 && event.cancelable) event.preventDefault();
  };
  document.addEventListener("touchmove", blockTouch, { passive: false });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    document.removeEventListener("touchmove", blockTouch);
    for (const [style, name, value, priority] of saved.reverse()) {
      if (value) style.setProperty(name, value, priority);
      else style.removeProperty(name);
    }
    // Restores the existing position only; never navigates to the next section.
    const behavior = root.style.getPropertyValue("scroll-behavior");
    const priority = root.style.getPropertyPriority("scroll-behavior");
    root.style.setProperty("scroll-behavior", "auto", "important");
    window.scrollTo({ left: x, top: y, behavior: "instant" });
    if (behavior) root.style.setProperty("scroll-behavior", behavior, priority);
    else root.style.removeProperty("scroll-behavior");
  };
}

/** One opening per mounted instance. Change its key to intentionally replay. */
export default function MotionPosterHero(props: MotionPosterHeroProps) {
  return <PosterRun key={JSON.stringify([props.gifSrc, props.finalFrameSrc, props.durationMs])} {...props} />;
}

function PosterRun({ gifSrc, finalFrameSrc, durationMs, alt, onComplete }: MotionPosterHeroProps) {
  const [phase, setPhase] = useState<"initial" | "playing" | "complete">("initial");
  const [frameReady, setFrameReady] = useState(false);
  const gifRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const finishRef = useRef<() => void>(() => {});
  const loadedRef = useRef<() => void>(() => {});
  const completedRef = useRef(false);
  const callbackRef = useRef(onComplete);
  useEffect(() => { callbackRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (completedRef.current) return;
    let disposed = false;
    let started = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let deadline = Date.now() + LOAD_TIMEOUT_MS;
    let unlock = () => {};
    const finish = () => {
      if (disposed || completedRef.current) return;
      completedRef.current = true;
      clearTimeout(timer);
      unlock(); // Release before user callbacks, even if they throw.
      setPhase("complete");
      callbackRef.current?.();
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) finish(); };
    const checkDeadline = () => { if (Date.now() >= deadline) finish(); };
    finishRef.current = finish;
    loadedRef.current = () => {
      if (disposed || completedRef.current || started) return;
      started = true;
      clearTimeout(timer);
      deadline = Date.now() + durationMs;
      timer = setTimeout(finish, durationMs);
    };

    if (motion.matches || !gifSrc.trim() || !Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) {
      finish();
    } else {
      unlock = lockScroll();
      timer = setTimeout(finish, LOAD_TIMEOUT_MS);
      setPhase("playing");
      // Handles already-cached images and Strict Mode effect reinstallation.
      if (gifRef.current?.complete) {
        if (gifRef.current.naturalWidth > 0) loadedRef.current();
        else finish();
      }
    }
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", checkDeadline);
    window.addEventListener("pageshow", checkDeadline);
    return () => {
      disposed = true;
      clearTimeout(timer);
      unlock();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", checkDeadline);
      window.removeEventListener("pageshow", checkDeadline);
    };
  }, [gifSrc, durationMs]);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame?.complete) setFrameReady(frame.naturalWidth > 0);
  }, [finalFrameSrc]);

  const complete = phase === "complete";
  return (
    <section
      aria-label={alt}
      data-motion-poster-state={phase}
      className="relative isolate h-[100svh] min-h-[100svh] w-full overflow-hidden bg-stone-900 text-white"
      style={{ height: "100svh", minHeight: "100svh", position: "relative", overflow: "hidden", backgroundColor: "#1c1917", color: "white" }}
    >
      {/* Native img deliberately preserves GIF playback without optimization. */}
      {finalFrameSrc?.trim() && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={frameRef} src={finalFrameSrc} alt={alt} decoding="async"
          onLoad={() => setFrameReady(true)} onError={() => setFrameReady(false)}
          aria-hidden={!complete || !frameReady}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ visibility: complete && frameReady ? "visible" : "hidden" }} />
      )}
      {phase === "playing" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={gifRef} src={gifSrc} alt={alt} fetchPriority="high"
          onLoad={() => loadedRef.current()} onError={() => finishRef.current()}
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden" />
      )}
      {complete && !frameReady && (
        <div role="img" aria-label={alt} data-poster-fallback className="absolute inset-0 bg-stone-900" />
      )}
      {!complete && (
        <button type="button" onClick={() => finishRef.current()}
          aria-label="오프닝 건너뛰기"
          className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-10 min-h-11 min-w-11 rounded-full bg-black/50 px-4 text-xs tracking-[0.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          SKIP
        </button>
      )}
      {complete && (
        <div className="absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-3 text-white"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,.9)" }}>
          <span className="text-[10px] tracking-[0.3em]">SCROLL TO EXPLORE</span>
          <svg aria-hidden="true" width="20" height="28" viewBox="0 0 20 28" fill="none">
            <path d="M10 1v24m-7-7 7 7 7-7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </section>
  );
}
