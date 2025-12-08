import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, FileText, Loader2, Download, Search, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ProductRow } from "../types";

export interface QuotationRecord {
  id: string;
  teklif_no: string;
  firma: string;
  ilgili_kisi: string;
  tel: string;
  email: string;
  konu: string;
  products: string | ProductRow[];
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
  onDownload?: (quotation: QuotationRecord) => void;
  onPreview?: (quotation: QuotationRecord) => void;
}

export function RecentQuotationsPanel({ onPanelOpen, onDownload, onPreview }: RecentQuotationsPanelProps) {
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState<QuotationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recreatingId, setRecreatingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch recent quotations when panel opens
  const fetchRecentQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotations" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000); // High limit to fetch all quotations while preventing performance issues

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

  // Close panel and reset
  const closePanel = () => {
    setPanelOpen(false);
    setVisibleCount(5);
  };

  // Toggle panel
  const handleTogglePanel = () => {
    const newState = !panelOpen;
    setPanelOpen(newState);
    if (newState) {
      fetchRecentQuotes();
      setVisibleCount(5); // Reset to initial count when opening
      onPanelOpen?.();
    } else {
      setVisibleCount(5); // Reset when closing
    }
  };

  // Load more quotations
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  // Handle outside click to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    };

    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelOpen]);

  // Handle download via parent callback
  const handleRecreatePDF = async (quote: QuotationRecord) => {
    if (!onDownload) return;
    
    setRecreatingId(quote.teklif_no);
    try {
      await onDownload(quote);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setRecreatingId(null);
    }
  };

  // Handle preview via parent callback
  const handlePreviewPDF = async (quote: QuotationRecord) => {
    if (!onPreview) return;
    
    setPreviewingId(quote.teklif_no);
    try {
      await onPreview(quote);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setPreviewingId(null);
    }
  };

  // Filter quotations by firma name
  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return recentQuotes;
    }
    return recentQuotes.filter(q => 
      q.firma?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recentQuotes, searchTerm]);

  // Reset visible count when search term changes
  useEffect(() => {
    setVisibleCount(5);
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Get visible quotes based on current count
  const visibleQuotes = useMemo(() => {
    return filteredQuotes.slice(0, visibleCount);
  }, [filteredQuotes, visibleCount]);

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
    <div ref={panelRef} className="mt-6 mb-6">
      {/* Collapsible Header */}
      <button
        onClick={handleTogglePanel}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg transition-all duration-200"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="font-medium">Son Teklifler</span>
          {filteredQuotes.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {filteredQuotes.length}
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
            <>
              {/* Search Bar */}
              <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Firma adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
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
                    {filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          Arama sonucu bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      visibleQuotes.map((quote) => (
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePreviewPDF(quote)}
                            disabled={!onPreview || previewingId === quote.teklif_no}
                            title="Ön İzleme"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {previewingId === quote.teklif_no ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRecreatePDF(quote)}
                            disabled={!onDownload || recreatingId === quote.teklif_no}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {recreatingId === quote.teklif_no ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Load More Button */}
              <div className="px-4 py-3 border-t border-slate-700/50 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Daha Fazla Göster
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
