import confetti from "canvas-confetti";
import { ToastAction } from "@/components/ui/toast";

const BRAND_COLORS = ["#7C5CFF", "#F2739B", "#E8B75C", "#4FC3B4", "#A98BFF"];

/** Small confetti pop — fired when a task or vendor step is completed. */
export function celebrateSmall(x = 0.5, y = 0.7) {
  confetti({
    particleCount: 45,
    spread: 62,
    startVelocity: 32,
    gravity: 0.9,
    scalar: 0.85,
    ticks: 140,
    origin: { x, y },
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
  });
}

/** Bigger celebration — a whole phase finished, or the blueprint is revealed. */
export function celebrateBig() {
  const end = Date.now() + 700;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.75 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.75 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/**
 * Destructive actions go through this so every one of them can be undone.
 * `undo` receives the deleted record and re-creates it.
 */
export function showUndo(toast, { title, description, undo, duration = 7000 }) {
  toast({
    title,
    description,
    duration,
    action: (
      <ToastAction altText="Undo" onClick={undo}>
        Undo
      </ToastAction>
    ),
  });
}