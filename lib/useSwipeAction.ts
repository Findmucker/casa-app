"use client";

import { useRef, useState, useCallback } from "react";

interface SwipeState {
  offsetX: number;
  swiping: boolean;
}

interface UseSwipeActionOptions {
  threshold?: number;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export function useSwipeAction({
  threshold = 100,
  onSwipeRight,
  onSwipeLeft,
}: UseSwipeActionOptions) {
  const [state, setState] = useState<SwipeState>({ offsetX: 0, swiping: false });
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lockedRef = useRef<"horizontal" | "vertical" | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    lockedRef.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;

    // Lock direction after 10px of movement
    if (!lockedRef.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    if (lockedRef.current !== "horizontal") return;

    // Prevent tab swipe and scrolling
    e.stopPropagation();

    // Only allow swipe right if onSwipeRight exists, left if onSwipeLeft exists
    if (dx > 0 && !onSwipeRight) return;
    if (dx < 0 && !onSwipeLeft) return;

    // Dampen past threshold
    const dampenedX = Math.abs(dx) > threshold
      ? Math.sign(dx) * (threshold + (Math.abs(dx) - threshold) * 0.3)
      : dx;

    setState({ offsetX: dampenedX, swiping: true });
  }, [threshold, onSwipeRight, onSwipeLeft]);

  const onTouchEnd = useCallback(() => {
    if (!startRef.current) return;

    const { offsetX } = state;

    if (offsetX > threshold && onSwipeRight) {
      // Animate out to the right
      setState({ offsetX: 400, swiping: false });
      setTimeout(() => {
        onSwipeRight();
        setState({ offsetX: 0, swiping: false });
      }, 200);
    } else if (offsetX < -threshold && onSwipeLeft) {
      // Animate out to the left
      setState({ offsetX: -400, swiping: false });
      setTimeout(() => {
        onSwipeLeft();
        setState({ offsetX: 0, swiping: false });
      }, 200);
    } else {
      // Snap back
      setState({ offsetX: 0, swiping: false });
    }

    startRef.current = null;
    lockedRef.current = null;
  }, [state.offsetX, threshold, onSwipeRight, onSwipeLeft]);

  return {
    offsetX: state.offsetX,
    swiping: state.swiping,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
