import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PDFViewer } from "./PDFViewer";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGestureControls } from "../hooks/useGestureControls";

interface QuotationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  teklifNo: string;
  onDownload?: () => void;
  onNavigateLeft?: () => void | Promise<void>;
  onNavigateRight?: () => void | Promise<void>;
  onPreviewLeft?: () => Promise<Blob | null>;
  onPreviewRight?: () => Promise<Blob | null>;
  canNavigateLeft?: boolean;
  canNavigateRight?: boolean;
  isNavigating?: boolean;
}

type TransitionPhase = "idle" | "dragging" | "animating";

export function QuotationPreviewModal({
  open,
  onOpenChange,
  pdfBlob,
  teklifNo,
  onDownload,
  onNavigateLeft,
  onNavigateRight,
  onPreviewLeft,
  onPreviewRight,
  canNavigateLeft = false,
  canNavigateRight = false,
  isNavigating = false,
}: QuotationPreviewModalProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // iOS-style transition states
  const [dragX, setDragX] = useState(0);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [nextPageBlob, setNextPageBlob] = useState<Blob | null>(null);
  const [prevPageBlob, setPrevPageBlob] = useState<Blob | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  
  // Animation target values
  const [animatingX, setAnimatingX] = useState(0);
  const animationRef = useRef<number | null>(null);
  const commitCallbackRef = useRef<(() => void) | null>(null);
  
  // Container width for calculations
  const containerWidthRef = useRef(0);

  const handleClose = () => {
    onOpenChange(false);
  };

  // Update container width
  useEffect(() => {
    if (containerRef.current) {
      containerWidthRef.current = containerRef.current.clientWidth;
    }
    
    const updateWidth = () => {
      if (containerRef.current) {
        containerWidthRef.current = containerRef.current.clientWidth;
      }
    };
    
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [open]);

  // Handle dragX changes from gesture controls
  const handleDragXChange = useCallback((x: number) => {
    if (transitionPhase !== "idle" && transitionPhase !== "dragging") return;
    
    setDragX(x);
    
    if (transitionPhase === "idle" && Math.abs(x) > 10) {
      setTransitionPhase("dragging");
    }
    
    // Preload next/prev pages when dragging
    const width = containerWidthRef.current || window.innerWidth;
    const threshold = width * 0.1; // Start loading at 10% drag
    
    if (x < -threshold && canNavigateRight && !nextPageBlob && !isLoadingNext && onPreviewRight) {
      setIsLoadingNext(true);
      onPreviewRight()
        .then((blob) => {
          if (blob instanceof Blob) {
            setNextPageBlob(blob);
          }
        })
        .catch((err) => {
          console.error("Failed to load next page preview:", err);
        })
        .finally(() => {
          setIsLoadingNext(false);
        });
    }
    
    if (x > threshold && canNavigateLeft && !prevPageBlob && !isLoadingPrev && onPreviewLeft) {
      setIsLoadingPrev(true);
      onPreviewLeft()
        .then((blob) => {
          if (blob instanceof Blob) {
            setPrevPageBlob(blob);
          }
        })
        .catch((err) => {
          console.error("Failed to load prev page preview:", err);
        })
        .finally(() => {
          setIsLoadingPrev(false);
        });
    }
  }, [transitionPhase, canNavigateRight, canNavigateLeft, nextPageBlob, prevPageBlob, isLoadingNext, isLoadingPrev, onPreviewRight, onPreviewLeft]);

  // Handle swipe end with velocity and distance
  const handleSwipeEnd = useCallback(
    (velocity: number, distance: number, direction: "left" | "right" | null) => {
      if (transitionPhase !== "dragging") return;
      
      const width = containerWidthRef.current || window.innerWidth;
      const distanceThreshold = width * 0.3; // 30% of width
      const velocityThreshold = 0.35; // px/ms
      
      const shouldCommit =
        (velocity > velocityThreshold || Math.abs(distance) > distanceThreshold) &&
        direction !== null;
      
      if (shouldCommit) {
        // Commit transition
        setTransitionPhase("animating");
        const targetX = direction === "left" ? -width : width;
        setAnimatingX(targetX);
        
        // Store callback to execute after animation
        commitCallbackRef.current = async () => {
          try {
            if (direction === "left" && onNavigateRight) {
              await onNavigateRight();
            } else if (direction === "right" && onNavigateLeft) {
              await onNavigateLeft();
            }
          } catch (err) {
            console.error("Navigation error:", err);
          }
          
          // Reset states
          setDragX(0);
          setAnimatingX(0);
          setNextPageBlob(null);
          setPrevPageBlob(null);
          setTransitionPhase("idle");
          commitCallbackRef.current = null;
        };
        
        // Complete animation after 250ms
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        animationRef.current = window.setTimeout(() => {
          if (commitCallbackRef.current) {
            commitCallbackRef.current();
          }
        }, 250);
      } else {
        // Cancel (snap back)
        setTransitionPhase("animating");
        setAnimatingX(0);
        
        // Reset after animation
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        animationRef.current = window.setTimeout(() => {
          setDragX(0);
          setAnimatingX(0);
          setNextPageBlob(null);
          setPrevPageBlob(null);
          setTransitionPhase("idle");
        }, 250);
      }
    },
    [transitionPhase, onNavigateLeft, onNavigateRight]
  );

  // Gesture controls
  const { scale, offset, isPinching, isDragging, resetScale } = useGestureControls({
    containerRef: viewerRef,
    onClose: handleClose,
    onNext: () => {}, // Handled by swipe end
    onPrev: () => {}, // Handled by swipe end
    onDragXChange: handleDragXChange,
    onSwipeEnd: handleSwipeEnd,
  });

  // Button navigation handlers (with animation)
  const handleNextWithAnimation = useCallback(() => {
    if (!onNavigateRight || !canNavigateRight || transitionPhase !== "idle") return;
    
    const width = containerWidthRef.current || window.innerWidth;
    setTransitionPhase("animating");
    setAnimatingX(-width);
    
    commitCallbackRef.current = async () => {
      try {
        if (onNavigateRight) {
          await onNavigateRight();
        }
      } catch (err) {
        console.error("Navigation error:", err);
      }
      setDragX(0);
      setAnimatingX(0);
      setNextPageBlob(null);
      setPrevPageBlob(null);
      setTransitionPhase("idle");
      commitCallbackRef.current = null;
    };
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    animationRef.current = window.setTimeout(() => {
      if (commitCallbackRef.current) {
        commitCallbackRef.current();
      }
    }, 250);
  }, [onNavigateRight, canNavigateRight, transitionPhase]);

  const handlePrevWithAnimation = useCallback(() => {
    if (!onNavigateLeft || !canNavigateLeft || transitionPhase !== "idle") return;
    
    const width = containerWidthRef.current || window.innerWidth;
    setTransitionPhase("animating");
    setAnimatingX(width);
    
    commitCallbackRef.current = async () => {
      try {
        if (onNavigateLeft) {
          await onNavigateLeft();
        }
      } catch (err) {
        console.error("Navigation error:", err);
      }
      setDragX(0);
      setAnimatingX(0);
      setNextPageBlob(null);
      setPrevPageBlob(null);
      setTransitionPhase("idle");
      commitCallbackRef.current = null;
    };
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    animationRef.current = window.setTimeout(() => {
      if (commitCallbackRef.current) {
        commitCallbackRef.current();
      }
    }, 250);
  }, [onNavigateLeft, canNavigateLeft, transitionPhase]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (pdfBlob) {
      const link = document.createElement("a");
      const url = URL.createObjectURL(pdfBlob);
      link.href = url;
      link.download = `${teklifNo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      resetScale();
      setDragX(0);
      setAnimatingX(0);
      setTransitionPhase("idle");
      setNextPageBlob(null);
      setPrevPageBlob(null);
      commitCallbackRef.current = null;
    }
  }, [open, resetScale]);

  // Reset when PDF changes (external navigation)
  useEffect(() => {
    if (open && pdfBlob && transitionPhase === "idle") {
      resetScale();
      setDragX(0);
      setAnimatingX(0);
      setNextPageBlob(null);
      setPrevPageBlob(null);
    }
  }, [open, pdfBlob, transitionPhase, resetScale]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Calculate positions for pages
  const width = containerWidthRef.current || window.innerWidth;
  const currentPageX = transitionPhase === "animating" ? animatingX : dragX;
  
  // Next page position (enters from right with parallax)
  let nextPageX = width; // Default: off screen right
  if (transitionPhase === "dragging" && dragX < 0) {
    // During drag left: show next page with parallax
    nextPageX = width + dragX * 0.25;
  } else if (transitionPhase === "animating" && animatingX < 0) {
    // During commit left: animate next page to center
    nextPageX = 0;
  }
  
  // Previous page position (enters from left with parallax)
  let prevPageX = -width; // Default: off screen left
  if (transitionPhase === "dragging" && dragX > 0) {
    // During drag right: show prev page with parallax
    prevPageX = -width + dragX * 0.25;
  } else if (transitionPhase === "animating" && animatingX > 0) {
    // During commit right: animate prev page to center
    prevPageX = 0;
  }

  const isAnimating = transitionPhase === "animating";
  const springTransition = "transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700 p-0 [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Teklif Önizleme - {teklifNo}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {(canNavigateLeft || canNavigateRight) && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePrevWithAnimation}
                    disabled={!canNavigateLeft || transitionPhase !== "idle"}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
                    title="Önceki teklif"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextWithAnimation}
                    disabled={!canNavigateRight || transitionPhase !== "idle"}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
                    title="Sonraki teklif"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!pdfBlob}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-hidden relative bg-slate-900"
        >
          {/* Previous page preview (left side) */}
          {canNavigateLeft && onPreviewLeft && (prevPageBlob || dragX > 0 || (isAnimating && animatingX > 0)) && (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `translate3d(${prevPageX}px, 0, 0)`,
                transition: isAnimating ? springTransition : "none",
                zIndex: dragX > 0 || (isAnimating && animatingX > 0) ? 2 : 1,
              }}
            >
              <PDFViewer
                blob={prevPageBlob}
                onClose={handleClose}
                canNavigateLeft={false}
                canNavigateRight={false}
              />
            </div>
          )}

          {/* Current page */}
          <div
            ref={viewerRef}
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate3d(${currentPageX + offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: "center center",
              transition: isAnimating
                ? springTransition
                : isPinching
                ? "none"
                : "transform 0.12s ease-out",
              willChange: "transform",
              zIndex: 3,
            }}
          >
            <PDFViewer
              blob={pdfBlob}
              onClose={handleClose}
              onNavigateLeft={handlePrevWithAnimation}
              onNavigateRight={handleNextWithAnimation}
              canNavigateLeft={canNavigateLeft}
              canNavigateRight={canNavigateRight}
            />
          </div>

          {/* Next page preview (right side) */}
          {canNavigateRight && onPreviewRight && (nextPageBlob || dragX < 0 || (isAnimating && animatingX < 0)) && (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `translate3d(${nextPageX}px, 0, 0)`,
                transition: isAnimating ? springTransition : "none",
                zIndex: dragX < 0 || (isAnimating && animatingX < 0) ? 2 : 1,
              }}
            >
              <PDFViewer
                blob={nextPageBlob}
                onClose={handleClose}
                canNavigateLeft={false}
                canNavigateRight={false}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
