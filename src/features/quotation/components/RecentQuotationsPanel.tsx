import { useState } from "react";
import { ChevronDown, FileText, Loader2, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ProductRow } from "../types";

interface QuotationRecord {
  id: string;
  teklif_no: string;
  firma: string;
  ilgili_kisi: string;
  tel: string;
  email: string;
  konu: string;
  products: ProductRow[];
  active_currency: string;
  notlar: string;
  opsiyon: string;
  teslim_suresi: string;
  odeme_sekli: string;
  teslim_yeri: string;
  subtotal: number;
  kdv: number;
  total: number;
  created_at: string;
}

interface RecentQuotationsPanelProps {
  onPanelOpen?: () => void;
  onDownload?: (teklifNo: string) => void;
}

export function RecentQuotationsPanel({ onPanelOpen, onDownload }: RecentQuotationsPanelProps) {
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState<QuotationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recreatingId, setRecreatingId] = useState<string | null>(null);

  // Fetch recent quotations when panel opens
  const fetchRecentQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotations" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentQuotes((data as QuotationRecord[]) || []);
    } catch (error) {
      console.error("Failed to fetch recent quotations:", error);
      toast({
        title: "Hata",
        description: "Son teklifler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle panel
  const handleTogglePanel = () => {
    const newState = !panelOpen;
    setPanelOpen(newState);
    if (newState) {
      fetchRecentQuotes();
      onPanelOpen?.();
    }
  };

  // Handle download via parent callback
  const handleRecreatePDF = async (teklifNo: string) => {
    if (!onDownload) return;
    
    setRecreatingId(teklifNo);
    try {
      await onDownload(teklifNo);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setRecreatingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-6">
      {/* Collapsible Header */}
      <button
        onClick={handleTogglePanel}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg transition-all duration-200"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="font-medium">Son Teklifler</span>
          {recentQuotes.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {recentQuotes.length}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          panelOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="ml-2 text-slate-400">Yükleniyor...</span>
            </div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Henüz kayıtlı teklif bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Teklif No
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Firma
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Oluşturma Tarihi
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      İndir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {recentQuotes.map((quote) => (
                    <tr 
                      key={quote.id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-blue-400 font-medium">
                          {quote.teklif_no}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {quote.firma}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRecreatePDF(quote.teklif_no)}
                          disabled={!onDownload || recreatingId === quote.teklif_no}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {recreatingId === quote.teklif_no ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
