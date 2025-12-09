import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
}

export function PdfPreviewModal({
  open,
  onOpenChange,
  pdfUrl,
  title,
}: PdfPreviewModalProps) {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ pageNum: number; canvas: HTMLCanvasElement }[]>([]);
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Load PDF document
  useEffect(() => {
    if (!open || !pdfUrl) return;

    const loadPDF = async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setScale(1.5);
      } catch (error) {
        console.error("Error loading PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [open, pdfUrl]);

  // Render a page to canvas
  const renderPage = useCallback(async (
    pageNum: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ) => {
    if (!pdfDocument) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  }, [pdfDocument]);

  // Render main page
  useEffect(() => {
    if (!pdfDocument || !mainCanvasRef.current || currentPage < 1) return;

    renderPage(currentPage, mainCanvasRef.current, scale);
  }, [pdfDocument, currentPage, scale, renderPage]);

  // Generate thumbnails for all pages
  useEffect(() => {
    if (!pdfDocument || !open) return;

    const generateThumbnails = async () => {
      const thumbnailScale = 0.3; // Smaller scale for thumbnails
      const thumbnailsArray: { pageNum: number; canvas: HTMLCanvasElement }[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const canvas = document.createElement("canvas");
        await renderPage(i, canvas, thumbnailScale);
        thumbnailsArray.push({ pageNum: i, canvas });
      }

      setThumbnails(thumbnailsArray);
    };

    generateThumbnails();
  }, [pdfDocument, totalPages, open, renderPage]);

  // Render thumbnails to their canvas refs
  useEffect(() => {
    thumbnails.forEach(({ pageNum, canvas }) => {
      const thumbnailCanvas = thumbnailRefs.current.get(pageNum);
      if (thumbnailCanvas && canvas) {
        const ctx = thumbnailCanvas.getContext("2d");
        if (ctx) {
          thumbnailCanvas.width = canvas.width;
          thumbnailCanvas.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    });
  }, [thumbnails]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentPage, totalPages, onOpenChange]);

  // Clean up blob URL when modal closes
  useEffect(() => {
    if (!open && pdfUrl && pdfUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }
  }, [open, pdfUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPdfDocument(null);
      setCurrentPage(1);
      setTotalPages(0);
      setThumbnails([]);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      // Scroll thumbnail into view
      const thumbnailEl = document.getElementById(`thumbnail-${currentPage - 1}`);
      thumbnailEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      // Scroll thumbnail into view
      const thumbnailEl = document.getElementById(`thumbnail-${currentPage + 1}`);
      thumbnailEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDocument) return;
    
    const containerWidth = containerRef.current.clientWidth - 32; // Account for padding
    pdfDocument.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1 });
      const newScale = containerWidth / viewport.width;
      setScale(newScale);
    });
  };

  const handleThumbnailClick = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700 p-0 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-semibold">
              {title}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Kapat (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Body Section */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Thumbnails Sidebar */}
          <div className="w-[150px] flex-shrink-0 border-r border-slate-700 bg-slate-800 overflow-y-auto">
            <div ref={thumbnailContainerRef} className="p-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : thumbnails.length > 0 ? (
                thumbnails.map(({ pageNum }) => (
                  <div
                    key={pageNum}
                    id={`thumbnail-${pageNum}`}
                    onClick={() => handleThumbnailClick(pageNum)}
                    className={`cursor-pointer rounded border-2 transition-all ${
                      currentPage === pageNum
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                    }`}
                  >
                    <div className="p-1">
                      <canvas
                        ref={(node) => {
                          if (node) {
                            thumbnailRefs.current.set(pageNum, node);
                          } else {
                            thumbnailRefs.current.delete(pageNum);
                          }
                        }}
                        className="w-full h-auto rounded"
                      />
                      <div className="text-xs text-center text-slate-400 mt-1 py-1">
                        {pageNum}
                      </div>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Main Viewer Container */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
            {/* Toolbar */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center justify-center gap-2">
                {/* Previous Page */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Önceki Sayfa (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number */}
                <div className="px-4 py-1.5 bg-slate-700 rounded-md text-sm text-slate-300 min-w-[100px] text-center">
                  {currentPage} / {totalPages}
                </div>

                {/* Next Page */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Sonraki Sayfa (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-600 mx-2" />

                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Fit Width */}
                <button
                  onClick={handleFitWidth}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                  title="Genişliğe Sığdır"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PDF Canvas Container */}
            <div
              ref={containerRef}
              className="flex-1 overflow-auto bg-slate-800 p-4"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">PDF yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <canvas
                    ref={mainCanvasRef}
                    className="shadow-2xl bg-white rounded"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
