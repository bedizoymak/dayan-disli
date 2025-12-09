import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QuotationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfPreviewUrl?: string;
  teklifNo: string;
}

export function QuotationPreviewModal({
  open,
  onOpenChange,
  pdfPreviewUrl,
  teklifNo,
}: QuotationPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700 p-0 [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Teklif Önizleme - {teklifNo}
            </DialogTitle>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 p-6 overflow-hidden">
          {pdfPreviewUrl ? (
            <iframe
            src={`${pdfPreviewUrl}#filename=${encodeURIComponent(`${teklifNo}.pdf`)}`}
            className="w-full h-full rounded-lg bg-slate-900"
            title={`${teklifNo}.pdf`}
          />
          
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              PDF yükleniyor...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

