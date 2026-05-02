"use client";

import { useState, useRef, useCallback } from "react";

interface DragState {
  dragging: boolean;
  dragIndex: number | null;
  overIndex: number | null;
}

interface UseDragReorderOptions<T> {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function useDragReorder<T>({ items, onReorder }: UseDragReorderOptions<T>) {
  const [state, setState] = useState<DragState>({
    dragging: false,
    dragIndex: null,
    overIndex: null,
  });

  const dragItemRef = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  // HTML5 Drag handlers
  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    setState({ dragging: true, dragIndex: index, overIndex: null });
  }, []);

  const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setState((s) => ({ ...s, overIndex: index }));
  }, []);

  const handleDragEnd = useCallback(() => {
    const from = dragItemRef.current;
    const to = state.overIndex;
    if (from !== null && to !== null && from !== to) {
      onReorder(from, to);
    }
    dragItemRef.current = null;
    setState({ dragging: false, dragIndex: null, overIndex: null });
  }, [state.overIndex, onReorder]);

  // Touch handlers for mobile drag
  const handleTouchDragStart = useCallback((index: number) => (e: React.TouchEvent) => {
    dragItemRef.current = index;
    touchStartY.current = e.touches[0].clientY;
    setState({ dragging: true, dragIndex: index, overIndex: null });
  }, []);

  const handleTouchDragMove = useCallback((e: React.TouchEvent) => {
    if (dragItemRef.current === null) return;
    const y = e.touches[0].clientY;

    // Find which item we're over
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        setState((s) => ({ ...s, overIndex: i }));
        break;
      }
    }
  }, []);

  const handleTouchDragEnd = useCallback(() => {
    const from = dragItemRef.current;
    const to = state.overIndex;
    if (from !== null && to !== null && from !== to) {
      onReorder(from, to);
    }
    dragItemRef.current = null;
    setState({ dragging: false, dragIndex: null, overIndex: null });
  }, [state.overIndex, onReorder]);

  const getDragHandleProps = useCallback((index: number) => ({
    draggable: true,
    onDragStart: handleDragStart(index),
    onDragEnd: handleDragEnd,
    style: { cursor: "grab", touchAction: "none" as const },
    // Touch drag via the grip handle
    onTouchStart: handleTouchDragStart(index),
    onTouchMove: handleTouchDragMove,
    onTouchEnd: handleTouchDragEnd,
  }), [handleDragStart, handleDragEnd, handleTouchDragStart, handleTouchDragMove, handleTouchDragEnd]);

  const getItemProps = useCallback((index: number) => ({
    ref: setItemRef(index),
    onDragOver: handleDragOver(index),
    className: state.dragIndex === index
      ? "opacity-40 scale-95 transition-all"
      : state.overIndex === index && state.dragging
      ? "border-t-2 border-amber-400 transition-all"
      : "transition-all",
  }), [setItemRef, handleDragOver, state]);

  return {
    dragging: state.dragging,
    dragIndex: state.dragIndex,
    overIndex: state.overIndex,
    getDragHandleProps,
    getItemProps,
  };
}
