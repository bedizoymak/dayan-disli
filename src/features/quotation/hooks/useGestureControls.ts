import { useEffect, useRef, useState, useCallback } from "react";

interface GestureOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SWIPE_DISTANCE = 50;
const SWIPE_TIME = 400;

export function useGestureControls({
  containerRef,
  onClose,
  onNext,
  onPrev,
}: GestureOptions) {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const isZoomingRef = useRef(false);

  const updateScale = useCallback((next: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    scaleRef.current = clamped;
    setScale(clamped);
  }, []);

  const updateOffset = useCallback((dx: number, dy: number) => {
    const current = offsetRef.current;
    const next = { x: current.x + dx, y: current.y + dy };
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const resetScaleAndOffset = useCallback(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsPinching(false);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      touchMoveRef.current = null;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      pinchStartRef.current = { distance, scale: scaleRef.current };
      isZoomingRef.current = true;
      setIsPinching(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isZoomingRef.current && e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        if (pinchStartRef.current) {
          const scaleFactor = distance / pinchStartRef.current.distance;
          const newScale = pinchStartRef.current.scale * scaleFactor;
          updateScale(newScale);
        }
        return;
      }

      if (e.touches.length === 1 && touchStartRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        touchMoveRef.current = { x: touch.clientX, y: touch.clientY };

        if (scaleRef.current === 1) return;

        if (lastTouchRef.current) {
          e.preventDefault();
          const moveDx = touch.clientX - lastTouchRef.current.x;
          const moveDy = touch.clientY - lastTouchRef.current.y;
          lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
          updateOffset(moveDx, moveDy);
        }
      }
    },
    [updateScale, updateOffset]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (isZoomingRef.current) {
        isZoomingRef.current = false;
        pinchStartRef.current = null;
        setIsPinching(false);
      }

      if (!touchStartRef.current || !touchMoveRef.current) {
        touchStartRef.current = null;
        touchMoveRef.current = null;
        lastTouchRef.current = null;
        return;
      }

      const dx = touchMoveRef.current.x - touchStartRef.current.x;
      const dy = touchMoveRef.current.y - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      if (scaleRef.current === 1 && dt < SWIPE_TIME) {
        if (Math.abs(dx) > SWIPE_DISTANCE) {
          if (dx > 0) onPrev();
          else onNext();
        } else if (Math.abs(dy) > SWIPE_DISTANCE) {
          if (dy < 0) onClose();
        }
      }

      touchStartRef.current = null;
      touchMoveRef.current = null;
      lastTouchRef.current = null;
    },
    [onClose, onNext, onPrev]
  );

  const handleTouchCancel = useCallback(() => {
    isZoomingRef.current = false;
    pinchStartRef.current = null;
    touchStartRef.current = null;
    touchMoveRef.current = null;
    lastTouchRef.current = null;
    setIsPinching(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    scale,
    offset,
    isPinching,
    resetScale: resetScaleAndOffset,
  };
}
