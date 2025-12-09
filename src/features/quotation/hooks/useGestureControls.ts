import { useEffect, useRef, useState, useCallback } from "react";

interface GestureOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function useGestureControls({ containerRef, onClose, onNext, onPrev }: GestureOptions) {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const isZoomingRef = useRef(false);
  const isNavigatingRef = useRef(false);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for swipe
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchMoveRef.current = null;
      isNavigatingRef.current = false;
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      pinchStartRef.current = {
        distance,
        scale: scale,
      };
      isZoomingRef.current = true;
      setIsPinching(true);
    }
  }, [scale]);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isZoomingRef.current && e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        e.stopPropagation();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (pinchStartRef.current) {
          const scaleChange = distance / pinchStartRef.current.distance;
          const newScale = Math.max(1, Math.min(4, pinchStartRef.current.scale * scaleChange));
          setScale(newScale);
        }
      } else if (e.touches.length === 1 && touchStartRef.current && scale === 1) {
        // Single touch swipe (only when not zoomed)
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        
        // Only prevent default if it's a horizontal swipe (for navigation)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          e.preventDefault();
        }
        
        touchMoveRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }
    },
    [scale]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (isZoomingRef.current) {
        isZoomingRef.current = false;
        pinchStartRef.current = null;
        setIsPinching(false);
        return;
      }

      if (!touchStartRef.current || !touchMoveRef.current) {
        touchStartRef.current = null;
        touchMoveRef.current = null;
        return;
      }

      const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
      const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Swipe detection (minimum 50px movement, max 300ms)
      // Only allow navigation when scale === 1
      if (scale === 1 && deltaTime < 300 && (absDeltaX > 50 || absDeltaY > 50)) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 50) {
            // Swipe right - go to previous quotation
            onPrev();
            isNavigatingRef.current = true;
          } else if (deltaX < -50) {
            // Swipe left - go to next quotation
            onNext();
            isNavigatingRef.current = true;
          }
        } else {
          // Vertical swipe
          if (deltaY < -50 && absDeltaY > absDeltaX) {
            // Swipe up - close modal
            onClose();
          }
        }
      }

      touchStartRef.current = null;
      touchMoveRef.current = null;
    },
    [scale, onClose, onNext, onPrev]
  );

  // Attach touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Reset scale when modal closes or PDF changes
  const resetScale = useCallback(() => {
    setScale(1);
    setIsPinching(false);
  }, []);

  return {
    scale,
    isPinching,
    resetScale,
  };
}

