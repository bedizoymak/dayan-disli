import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PDFViewer } from "./PDFViewer";
import { useEffect, useState, useRef } from "react";

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
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const prevPdfBlobRef = useRef<Blob | null>(null);

  // Handle slide transitions when navigating
  useEffect(() => {
    if (isNavigating) {
      // Determine slide direction based on blob change
      if (prevPdfBlobRef.current !== pdfBlob && prevPdfBlobRef.current !== null) {
        // This is a navigation - determine direction from context
        // We'll use a simple heuristic: if navigating left, slide right (out), then left (in)
        // For now, we'll use a generic slide animation
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
    } else {
      setTransitionClass("opacity-100 translate-x-0");
      setSlideDirection(null);
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

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700 p-0 [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Teklif Önizleme - {teklifNo}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Navigation buttons */}
              {(canNavigateLeft || canNavigateRight) && (
                <>
                  <Button
                    variant="outline"
                    onClick={onNavigateLeft}
                    disabled={!canNavigateLeft || isNavigating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
                    title="Önceki teklif"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onNavigateRight}
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
        
        <div className={`flex-1 min-h-0 overflow-hidden relative transition-all duration-300 ease-in-out ${transitionClass}`}>
          <PDFViewer
            blob={pdfBlob}
            onClose={handleClose}
            onNavigateLeft={onNavigateLeft}
            onNavigateRight={onNavigateRight}
            canNavigateLeft={canNavigateLeft}
            canNavigateRight={canNavigateRight}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

