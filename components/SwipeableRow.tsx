"use client";

import { type ReactNode } from "react";
import { useSwipeAction } from "@/lib/useSwipeAction";

interface SwipeableRowProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightColor?: string;
  leftColor?: string;
  disabled?: boolean;
}

export default function SwipeableRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "✓ Feito",
  leftLabel = "✕ Apagar",
  rightColor = "bg-green-400",
  leftColor = "bg-red-400",
  disabled = false,
}: SwipeableRowProps) {
  const { offsetX, swiping, handlers } = useSwipeAction({
    threshold: 100,
    onSwipeRight: disabled ? undefined : onSwipeRight,
    onSwipeLeft: disabled ? undefined : onSwipeLeft,
  });

  const absX = Math.abs(offsetX);
  const showRight = offsetX > 20;
  const showLeft = offsetX < -20;
  const triggered = absX > 100;

  return (
    <div className="relative overflow-hidden rounded-2xl" data-swipe-action>
      {/* Background action indicators */}
      {showRight && (
        <div className={`absolute inset-0 ${rightColor} rounded-2xl flex items-center pl-4 transition-opacity motion-reduce:transition-none ${triggered ? "opacity-100" : "opacity-60"}`}>
          <span className={`text-white font-semibold text-sm transition-transform motion-reduce:transition-none motion-reduce:transform-none ${triggered ? "scale-110" : ""}`}>
            {rightLabel}
          </span>
        </div>
      )}
      {showLeft && (
        <div className={`absolute inset-0 ${leftColor} rounded-2xl flex items-center justify-end pr-4 transition-opacity motion-reduce:transition-none ${triggered ? "opacity-100" : "opacity-60"}`}>
          <span className={`text-white font-semibold text-sm transition-transform motion-reduce:transition-none motion-reduce:transform-none ${triggered ? "scale-110" : ""}`}>
            {leftLabel}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        className={`relative z-10 ${swiping ? "transition-none" : "transition-transform duration-300 ease-out motion-reduce:transition-none"}`}
      >
        {children}
      </div>
    </div>
  );
}
