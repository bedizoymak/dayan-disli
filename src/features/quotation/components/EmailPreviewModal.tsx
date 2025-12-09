import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Send, X, Download } from "lucide-react";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTeklifNo: string;
  email: string;
  firma: string;
  ilgiliKisi: string;
  pdfPreviewUrl: string;
  total: number;
  activeCurrency: string;
  isSending: boolean;
  onSend: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
  formatName: (name: string) => string;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  currentTeklifNo,
  email,
  firma,
  ilgiliKisi,
  pdfPreviewUrl,
  total,
  activeCurrency,
  isSending,
  onSend,
  formatCurrency,
  formatName,
}: EmailPreviewModalProps) {
  const handleDownload = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = `${currentTeklifNo}.pdf`;
    link.click();
  };

  return (
    <>
      <style>{`
        iframe[title*=".pdf"] ~ * .toolbarButton#download,
        iframe[title*=".pdf"] ~ * #download,
        .toolbarButton#download {
          display: none !important;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-blue-400" />
                E-posta Önizleme - {currentTeklifNo}
              </DialogTitle>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!pdfPreviewUrl}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            </div>
          </DialogHeader>
        
        <div className="flex-1 min-h-0 my-4 space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Alıcı:</p>
                <p className="text-white font-medium">{email}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">BCC:</p>
                <p className="text-white font-medium">bediz@dayandisli.com</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 mb-1">Konu:</p>
                <p className="text-white font-medium">{currentTeklifNo} No'lu Fiyat Teklifi</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Teklif Özeti:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Firma:</span>
                <span className="text-white ml-2">{firma}</span>
              </div>
              <div>
                <span className="text-slate-400">İlgili:</span>
                <span className="text-white ml-2">{formatName(ilgiliKisi)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Toplam:</span>
                <span className="text-emerald-400 font-bold ml-2">{formatCurrency(total, activeCurrency)}</span>
              </div>
            </div>
          </div>

          {pdfPreviewUrl && (
            <div className="border border-slate-600 rounded-lg overflow-hidden relative">
              <style>{`
                iframe[title="${currentTeklifNo}.pdf"] + * .toolbarButton#download,
                iframe[title="${currentTeklifNo}.pdf"] ~ * .toolbarButton#download,
                iframe[title="${currentTeklifNo}.pdf"] ~ * #download {
                  display: none !important;
                }
              `}</style>
              <iframe
                src={`${pdfPreviewUrl}#filename=${encodeURIComponent(currentTeklifNo)}.pdf`}
                className="w-full h-[300px] bg-white"
                title={`${currentTeklifNo}.pdf`}
              />
            </div>
          )}

        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
          <Button 
            onClick={onSend}
            disabled={isSending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gönder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

