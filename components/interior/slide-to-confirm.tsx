"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;
const CROSSFADE = {
  type: "spring",
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const;
const INSTANT = { duration: 0 } as const;

const KNOB = 44;
const INSET = 8;
const KEY_HOLD = 600;
const THRESHOLD = 0.82;
const FADE_BY = 0.6;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type UseSlideToConfirmOptions = {
  onConfirm: () => void | boolean;
  label?: string;
  threshold?: number;
  resetAfter?: number;
  disabled?: boolean;
};

export function useSlideToConfirm({
  onConfirm,
  label = "Slide to confirm",
  threshold = THRESHOLD,
  resetAfter = 0,
  disabled = false,
}: UseSlideToConfirmOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const travel = useMotionValue(0);
  const [max, setMax] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false);
  const held = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;

  const fill = useTransform(() => x.get() - travel.get());
  const hint = useTransform(
    () => 1 - Math.min(1, x.get() / Math.max(1, travel.get() * FADE_BY)),
  );

  const settle = useCallback(
    (to: number) => animate(x, to, reduced ? INSTANT : CELL),
    [x, reduced],
  );

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const next = Math.max(0, track.clientWidth - KNOB - INSET);
      travel.set(next);
      setMax(next);
      x.set(locked.current ? next : Math.min(x.get(), next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [travel, x]);

  const finish = () => {
    if (locked.current || disabled) return;
    if (confirm.current() === false) {
      settle(0);
      return;
    }
    locked.current = true;
    setConfirmed(true);
    settle(max);
  };

  const reset = useCallback(() => {
    locked.current = false;
    setConfirmed(false);
    settle(0);
  }, [settle]);

  useEffect(() => {
    if (!confirmed || resetAfter <= 0) return;
    const back = setTimeout(reset, resetAfter);
    return () => clearTimeout(back);
  }, [confirmed, resetAfter, reset]);

  const knobProps = {
    type: "button" as const,
    "aria-label": label,
    "aria-disabled": disabled || confirmed || undefined,
    drag: disabled || confirmed ? (false as const) : ("x" as const),
    dragConstraints: { left: 0, right: max },
    dragElastic: 0,
    dragMomentum: false,
    onDragEnd: () => {
      if (max > 0 && x.get() >= max * threshold) finish();
      else settle(0);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (e.repeat || held.current || locked.current || disabled) return;
      animate(x, max, reduced ? INSTANT : { duration: KEY_HOLD / 1000, ease: "linear" });
      held.current = setTimeout(() => {
        held.current = null;
        finish();
      }, KEY_HOLD);
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if ((e.key !== "Enter" && e.key !== " ") || !held.current) return;
      clearTimeout(held.current);
      held.current = null;
      settle(0);
    },
    onBlur: () => {
      if (!held.current) return;
      clearTimeout(held.current);
      held.current = null;
      settle(0);
    },
    style: { x, width: KNOB, touchAction: "none" as const },
  };

  return { trackRef, knobProps, fill, hint, confirmed, reset };
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

export type SlideToConfirmProps = {
  onConfirm: () => void | boolean;
  label?: string;
  confirmedLabel?: string;
  threshold?: number;
  resetAfter?: number;
  disabled?: boolean;
  className?: string;
};

export function SlideToConfirm({
  onConfirm,
  label = "Slide to confirm",
  confirmedLabel = "Confirmed",
  threshold = THRESHOLD,
  resetAfter = 0,
  disabled = false,
  className = "",
}: SlideToConfirmProps) {
  const { trackRef, knobProps, fill, hint, confirmed } = useSlideToConfirm({
    onConfirm,
    label,
    threshold,
    resetAfter,
    disabled,
  });

  const reduced = useReducedMotion();
  const hintId = useId();
  const fade = reduced ? INSTANT : CROSSFADE;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] w-full select-none overflow-hidden rounded-[14px] border border-stone-200 bg-white p-1 shadow-[inset_0_1px_2px_rgba(28,25,23,0.07)] transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:border-[#4568FF] has-[:focus-visible]:shadow-[inset_0_1px_2px_rgba(28,25,23,0.07),0_10px_20px_-14px_rgba(69,104,255,0.6)] dark:border-white/[0.16] dark:bg-[#1D1D1A] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] dark:has-[:focus-visible]:border-[#93B0FF] dark:has-[:focus-visible]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_10px_20px_-14px_rgba(147,176,255,0.5)] ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ x: fill }}
        className="absolute inset-0 rounded-[13px] bg-stone-800 dark:bg-stone-100"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center whitespace-nowrap text-[13px] font-medium"
      >
        <motion.span
          initial={false}
          animate={{ opacity: confirmed ? 0 : 1 }}
          transition={fade}
          className="col-start-1 row-start-1"
        >
          <motion.span
            style={{ opacity: hint }}
            className="block text-stone-700 dark:text-stone-200"
          >
            {label}
          </motion.span>
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: confirmed ? 1 : 0 }}
          transition={fade}
          className="col-start-1 row-start-1 text-white dark:text-stone-900"
        >
          {confirmedLabel}
        </motion.span>
      </span>

      <motion.button
        {...knobProps}
        aria-describedby={hintId}
        className={`relative z-10 grid h-full place-items-center rounded-[10px] border-2 border-white bg-stone-800 text-white outline-none dark:border-stone-900 dark:bg-stone-100 dark:text-stone-900 ${
          disabled || confirmed
            ? "cursor-default"
            : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: confirmed ? 0 : 1 }}
          transition={fade}
          className="col-start-1 row-start-1 grid"
        >
          <ArrowIcon />
        </motion.span>
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: confirmed ? 1 : 0 }}
          transition={fade}
          className="col-start-1 row-start-1 grid"
        >
          <CheckIcon />
        </motion.span>
      </motion.button>

      <span id={hintId} className="sr-only">
        Slide right to confirm, or hold Enter or Space. Releasing early
        cancels and nothing happens.
      </span>

      <span role="status" aria-live="polite" className="sr-only">
        {confirmed ? confirmedLabel : ""}
      </span>
    </div>
  );
}
