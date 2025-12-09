import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2 } from "lucide-react";

// Configure PDF.js worker - use CDN matching installed version
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  blob: Blob | null;
  onClose?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  canNavigateLeft?: boolean;
  canNavigateRight?: boolean;
}

export function PDFViewer({
  blob,
  onClose,
  onNavigateLeft,
  onNavigateRight,
  canNavigateLeft = false,
  canNavigateRight = false,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainersRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const isZoomingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const lastBlobRef = useRef<Blob | null>(null);

  // Calculate base scale to fit viewport
  const calculateBaseScale = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy) => {
    if (!pagesRef.current) return 1;

    const container = pagesRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit width and height
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      return Math.min(scaleX, scaleY);
    } catch (err) {
      console.error("Error calculating base scale:", err);
      return 1;
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Cancel all render tasks
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
    });
    renderTasksRef.current.clear();

    // Clear canvas refs
    canvasRefs.current.clear();
    pageContainersRef.current.clear();

    // Close PDF document
    if (pdfDoc) {
      try {
        pdfDoc.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
    }
  }, [pdfDoc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Load PDF document
  useEffect(() => {
    if (!blob) {
      cleanup();
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setBaseScale(1);
      setScale(1);
      lastBlobRef.current = null;
      // Reset scroll position
      if (pagesRef.current) {
        pagesRef.current.scrollTop = 0;
      }
      return;
    }

    // Reset scale and scroll when blob changes
    if (lastBlobRef.current !== blob) {
      setScale(1);
      lastBlobRef.current = blob;
      // Reset scroll position
      if (pagesRef.current) {
        pagesRef.current.scrollTop = 0;
      }
    }

    setIsLoading(true);
    setError(null);

    const loadPDF = async () => {
      try {
        // Cleanup previous PDF
        cleanup();

        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Calculate base scale to fit viewport
        const fitScale = await calculateBaseScale(pdf);
        setBaseScale(fitScale);
        
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setScale(1);
        
        // Reset scroll position after a brief delay to ensure DOM is ready
        setTimeout(() => {
          if (pagesRef.current) {
            pagesRef.current.scrollTop = 0;
          }
        }, 100);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("PDF yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [blob, calculateBaseScale, cleanup]);

  // Render a single page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return;

      const canvas = canvasRefs.current.get(pageNum);
      const container = pageContainersRef.current.get(pageNum);
      if (!canvas || !container) return;

      try {
        // Cancel previous render task for this page
        const existingTask = renderTasksRef.current.get(pageNum);
        if (existingTask) {
          try {
            existingTask.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        }

        const page = await pdfDoc.getPage(pageNum);
        
        // Calculate final scale: baseScale fits viewport, scale is user zoom (1-4)
        const finalScale = baseScale * scale;
        const viewport = page.getViewport({ scale: finalScale * window.devicePixelRatio });

        // Set canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set container size for proper display (fit to viewport when scale = 1)
        const displayWidth = viewport.width / window.devicePixelRatio;
        const displayHeight = viewport.height / window.devicePixelRatio;
        container.style.width = `${displayWidth}px`;
        container.style.height = `${displayHeight}px`;

        // Render page
        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNum, renderTask);
        await renderTask.promise;
        renderTasksRef.current.delete(pageNum);
      } catch (err) {
        // Ignore cancellation errors
        if ((err as Error).name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
        renderTasksRef.current.delete(pageNum);
      }
    },
    [pdfDoc, baseScale, scale]
  );

  // Recalculate base scale on resize
  useEffect(() => {
    if (!pdfDoc || !pagesRef.current) return;

    const handleResize = async () => {
      const newBaseScale = await calculateBaseScale(pdfDoc);
      setBaseScale(newBaseScale);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (pagesRef.current) {
      resizeObserver.observe(pagesRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [pdfDoc, calculateBaseScale]);

  // Render all pages when PDF, baseScale, or scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || baseScale === 0) return;

    const renderAll = async () => {
      for (let i = 1; i <= numPages; i++) {
        await renderPage(i);
      }
    };

    renderAll();
  }, [pdfDoc, numPages, baseScale, scale, renderPage]);

  // Touch event handlers
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
        scale: scale, // User zoom scale (1-4)
      };
      isZoomingRef.current = true;
    }
  }, [scale]);

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
          setScale(newScale); // Update user zoom scale (1-4)
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

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (isZoomingRef.current) {
        isZoomingRef.current = false;
        pinchStartRef.current = null;
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
      if (deltaTime < 300 && (absDeltaX > 50 || absDeltaY > 50)) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 50 && canNavigateLeft && onNavigateLeft) {
            // Swipe right - go to older quotation
            onNavigateLeft();
            isNavigatingRef.current = true;
          } else if (deltaX < -50 && canNavigateRight && onNavigateRight) {
            // Swipe left - go to newer quotation
            onNavigateRight();
            isNavigatingRef.current = true;
          }
        } else {
          // Vertical swipe
          if (deltaY < -50 && absDeltaY > absDeltaX && onClose) {
            // Swipe up - close modal (only if vertical movement is dominant)
            onClose();
          }
        }
      }

      touchStartRef.current = null;
      touchMoveRef.current = null;
    },
    [onClose, onNavigateLeft, onNavigateRight, canNavigateLeft, canNavigateRight]
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

  // Handle scroll to detect page changes
  useEffect(() => {
    const pagesContainer = pagesRef.current;
    if (!pagesContainer || scale !== 1) return;

    const handleScroll = () => {
      const scrollTop = pagesContainer.scrollTop;
      const containerHeight = pagesContainer.clientHeight;
      const pageNumber = Math.round(scrollTop / containerHeight) + 1;
      if (pageNumber !== currentPage && pageNumber >= 1 && pageNumber <= numPages) {
        setCurrentPage(pageNumber);
      }
    };

    // Use passive listener for better performance
    pagesContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => pagesContainer.removeEventListener("scroll", handleScroll);
  }, [scale, currentPage, numPages]);

  // Keyboard handler for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>PDF yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!pdfDoc || numPages === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        PDF yüklenemedi
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-slate-900"
      style={{ touchAction: scale === 1 ? "pan-y" : "none" }}
    >
      {/* Pages container with scroll-snap */}
      <div
        ref={pagesRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden"
        style={{
          scrollSnapType: scale === 1 ? "y mandatory" : "none",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        }}
      >
        {Array.from({ length: numPages }, (_, i) => {
          const pageNum = i + 1;
          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageContainersRef.current.set(pageNum, el);
              }}
              className="flex items-center justify-center w-full"
              style={{
                height: scale === 1 ? "100vh" : "auto",
                minHeight: scale === 1 ? "100vh" : "auto",
                scrollSnapAlign: scale === 1 ? "start" : "none",
                scrollSnapStop: scale === 1 ? "always" : "none",
                padding: scale > 1 ? "20px" : "0",
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                }}
                className="block"
                style={{
                  maxWidth: scale === 1 ? "100%" : "none",
                  maxHeight: scale === 1 ? "100%" : "none",
                  width: scale === 1 ? "100%" : "auto",
                  height: scale === 1 ? "100%" : "auto",
                  objectFit: scale === 1 ? "contain" : "none",
                  transform: scale > 1 ? `scale(${scale})` : "none",
                  transformOrigin: "center top",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Page indicator */}
      {numPages > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/80 text-white px-3 py-1 rounded-full text-sm">
          {currentPage} / {numPages}
        </div>
      )}

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-4 right-4 bg-slate-800/80 text-white px-3 py-1 rounded-full text-sm">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}

