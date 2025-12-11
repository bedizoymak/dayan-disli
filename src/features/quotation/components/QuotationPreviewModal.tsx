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
}: QuotationPreviewModalProps) {
  const [transitionClass, setTransitionClass] = useState("");
  const prevPdfBlobRef = useRef<Blob | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // iOS-style slide state
  const [transitionX, setTransitionX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const handleClose = () => {
    onOpenChange(false);
  };

  // --- iOS-style slide animations (only X ekseninde) ---
  function animateNext() {
    if (isAnimating) return;

    setIsAnimating(true);

    // Sağdan içeri gelsin
    setTransitionX(window.innerWidth);

    requestAnimationFrame(() => {
      setTransitionX(0);
    });

    if (animationRef.current) {
      window.clearTimeout(animationRef.current);
    }
    animationRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      setTransitionX(0);
    }, 220);
  }

  function animatePrev() {
    if (isAnimating) return;

    setIsAnimating(true);

    // Soldan içeri gelsin
    setTransitionX(-window.innerWidth);

    requestAnimationFrame(() => {
      setTransitionX(0);
    });

    if (animationRef.current) {
      window.clearTimeout(animationRef.current);
    }
    animationRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      setTransitionX(0);
    }, 220);
  }

  // --- Wrapper navigation with animation ---
  function handleNextWithAnimation() {
    if (!onNavigateRight || !canNavigateRight || isAnimating) return;
    animateNext();
    onNavigateRight();
  }

  function handlePrevWithAnimation() {
    if (!onNavigateLeft || !canNavigateLeft || isAnimating) return;
    animatePrev();
    onNavigateLeft();
  }

  // Gesture controls: swipe → animasyonlu navigate
  const { scale, offset, isPinching, resetScale } = useGestureControls({
    containerRef: viewerRef,
    onClose: handleClose,
    onNext: handleNextWithAnimation,
    onPrev: handlePrevWithAnimation,
  });

  // Hafif fade/slide effect (mevcut isNavigating mantığını koruyorum)
  useEffect(() => {
    if (isNavigating) {
      if (prevPdfBlobRef.current !== pdfBlob && prevPdfBlobRef.current !== null) {
        setTransitionClass("opacity-0 translate-x-4");
      } else {
        setTransitionClass("opacity-0 translate-x-2");
      }

      const timer = window.setTimeout(() => {
        setTransitionClass("opacity-100 translate-x-0");
      }, 200);

      return () => window.clearTimeout(timer);
    } else {
      setTransitionClass("opacity-100 translate-x-0");
    }

    prevPdfBlobRef.current = pdfBlob;
  }, [isNavigating, pdfBlob]);

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

  // Reset scale and offset when preview opens
  useEffect(() => {
    if (open) {
      resetScale();
      setTransitionX(0);
    }
  }, [open, resetScale]);

  // Reset when PDF changes (başka teklif açıldığında zoom’u sıfırla)
  useEffect(() => {
    if (open && pdfBlob !== prevPdfBlobRef.current && prevPdfBlobRef.current !== null) {
      resetScale();
      setTransitionX(0);
    }
  }, [open, pdfBlob, resetScale]);

  // Timeout cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        window.clearTimeout(animationRef.current);
      }
    };
  }, []);

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
                    disabled={!canNavigateLeft || isNavigating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
                    title="Önceki teklif"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextWithAnimation}
                    disabled={!canNavigateRight || isNavigating}
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
          className={`flex-1 min-h-0 overflow-hidden relative transition-all duration-200 ease-out ${transitionClass}`}
        >
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
              onNavigateLeft={handlePrevWithAnimation}
              onNavigateRight={handleNextWithAnimation}
              canNavigateLeft={canNavigateLeft}
              canNavigateRight={canNavigateRight}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
