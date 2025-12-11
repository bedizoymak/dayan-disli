import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PDFViewer } from "./PDFViewer";
import { useEffect, useState, useRef } from "react";
import { useGestureControls } from "../hooks/useGestureControls";

interface QuotationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  teklifNo: string;
  onDownload?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  canNavigateLeft?: boolean;
  canNavigateRight?: boolean;
  isNavigating?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export function QuotationPreviewModal({
  open,
  onOpenChange,
  pdfBlob,
  teklifNo,
  onDownload,
  onNavigateLeft,
  onNavigateRight,
  canNavigateLeft = false,
  canNavigateRight = false,
  isNavigating = false,
  onNext,
  onPrev,
}: QuotationPreviewModalProps) {
  
  const [transitionClass, setTransitionClass] = useState("");
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const prevPdfBlobRef = useRef<Blob | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [transitionX, setTransitionX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const handleClose = () => {
    onOpenChange(false);
  };

  // -------------------------------
  // iOS Slide Animations
  // -------------------------------
  const animateNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTransitionX(window.innerWidth);
    requestAnimationFrame(() => {
      setTransitionX(0);
    });

    animationRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      setTransitionX(0);
    }, 220);
  };

  const animatePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTransitionX(-window.innerWidth);
    requestAnimationFrame(() => {
      setTransitionX(0);
    });

    animationRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      setTransitionX(0);
    }, 220);
  };

  // -------------------------------
  // Navigation Wrappers
  // -------------------------------
  const handleNextWithAnimation = () => {
    if (!onNext || !canNavigateRight || isAnimating) return;
    animateNext();
    onNext();
  };

  const handlePrevWithAnimation = () => {
    if (!onPrev || !canNavigateLeft || isAnimating) return;
    animatePrev();
    onPrev();
  };

  // -------------------------------
  // Gesture Controls
  // -------------------------------
  const { scale, offset, isPinching, resetScale } = useGestureControls({
    containerRef: viewerRef,
    onClose: handleClose,
    onNext: handleNextWithAnimation,
    onPrev: handlePrevWithAnimation,
  });

  // -------------------------------
  // Subtle Fade/Translate Transition When Changing PDF
  // -------------------------------
  useEffect(() => {
    if (isNavigating) {
      if (prevPdfBlobRef.current !== pdfBlob && prevPdfBlobRef.current !== null) {
        setSlideDirection("left");
        setTransitionClass("opacity-0 translate-x-full");
      } else {
        setTransitionClass("opacity-0 translate-x-4");
      }

      const timer = setTimeout(() => {
        setTransitionClass("opacity-100 translate-x-0");
        setSlideDirection(null);
      }, 300);

      return () => clearTimeout(timer);
    }

    setTransitionClass("opacity-100 translate-x-0");
    setSlideDirection(null);
    prevPdfBlobRef.current = pdfBlob;
  }, [isNavigating, pdfBlob]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${teklifNo}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset transformations on open
  useEffect(() => {
    if (open) resetScale();
  }, [open, resetScale]);

  // Reset when PDF changes
  useEffect(() => {
    if (open && pdfBlob !== prevPdfBlobRef.current && prevPdfBlobRef.current !== null) {
      resetScale();
    }
  }, [open, pdfBlob, resetScale]);

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
                    onClick={onNavigateLeft}
                    disabled={!canNavigateLeft || isNavigating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={onNavigateRight}
                    disabled={!canNavigateRight || isNavigating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
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

        <div className={`flex-1 min-h-0 overflow-hidden relative transition-all duration-300 ease-in-out ${transitionClass}`}>
          
          <div
            ref={viewerRef}
            className="relative touch-none w-full h-full overflow-hidden"
            style={{
              transform: `translate3d(${transitionX + offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: "center center",
              transition: isAnimating
                ? "transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)"
                : isPinching
                ? "none"
                : "transform 0.12s ease-out",
              willChange: "transform",
            }}
          >
            <PDFViewer
              blob={pdfBlob}
              onClose={handleClose}
              onNavigateLeft={onNavigateLeft}
              onNavigateRight={onNavigateRight}
              canNavigateLeft={canNavigateLeft}
              canNavigateRight={canNavigateRight}
            />
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
