import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, Trash2, FileDown, Loader2, Mail, Send, X, 
  Building2, User, Phone, AtSign, FileText, Package, 
  Calculator, Banknote, Calendar, Truck, CreditCard, MapPin,
  MessageCircle, Settings, ArrowLeft, Users, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFont } from "@/lib/pdfFonts";

function formatName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(word =>
      word.charAt(0).toLocaleUpperCase("tr-TR") +
      word.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}

interface ProductRow {
  id: number;
  kod: string;
  cins: string;
  malzeme: string;
  miktar: number;
  birim: string;
  birimFiyat: number;
  doviz: string;
}

interface CustomerProfile {
  id: string;
  firma: string;
  ilgili_kisi: string;
  telefon: string;
  email: string;
  konu: string;
}

const MALZEME_OPTIONS = ["C45", "8620", "4140", "16MnCr5", "20MnCr5", "Bronz", "Özel"];
const BIRIM_OPTIONS = ["Adet", "Kg", "Metre", "Set"];
const DOVIZ_OPTIONS = [
  { value: "TRY", label: "₺ TRY", symbol: "₺" },
  { value: "USD", label: "$ USD", symbol: "$" },
  { value: "EUR", label: "€ EUR", symbol: "€" },
];

// Static conversion rates (TRY as base)
const EXCHANGE_RATES: Record<string, number> = {
  TRY: 1,
  USD: 34.50,
  EUR: 37.00,
};

const TeklifSayfasi = () => {
  const { toast } = useToast();
  
  // Customer info state
  const [firma, setFirma] = useState("");
  const [ilgiliKisi, setIlgiliKisi] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [konu, setKonu] = useState("");
  
  // Active currency for all products
  const [activeCurrency, setActiveCurrency] = useState("TRY");
  
  // Product rows state
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: "TRY" }
  ]);
  
  // Footer fields state
  const [notlar, setNotlar] = useState("");
  const [opsiyon, setOpsiyon] = useState("");
  const [teslimSuresi, setTeslimSuresi] = useState("");
  const [odemeSekli, setOdemeSekli] = useState("");
  const [teslimYeri, setTeslimYeri] = useState("");
  
  // PDF generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [fontBase64, setFontBase64] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>("");
  
  // Modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  
  // Counter & tracking state
  const [currentTeklifNo, setCurrentTeklifNo] = useState("");
  const [formChanged, setFormChanged] = useState(true); // Start as true so first action generates new number
  const [lastFinalizedTeklifNo, setLastFinalizedTeklifNo] = useState("");
  const formSnapshotRef = useRef<string>("");

  // Customer autofill state
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCustomers = customers.filter(c =>
  (c.firma?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
  (c.ilgili_kisi?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
  (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
);



  // Get form snapshot for change detection
  const getFormSnapshot = () => {
    return JSON.stringify({
      firma, ilgiliKisi, tel, email, konu,
      products, notlar, opsiyon, teslimSuresi, odemeSekli, teslimYeri, activeCurrency
    });
  };

  // Check if form has changed since last finalized quotation
  const checkFormChanged = () => {
    const currentSnapshot = getFormSnapshot();
    return currentSnapshot !== formSnapshotRef.current;
  };

  // Mark form as finalized (save snapshot)
  const markFormFinalized = () => {
    formSnapshotRef.current = getFormSnapshot();
    setFormChanged(false);
  };

  // Load font and logo on mount
  useEffect(() => {
    const loadAssets = async () => {
      const font = await loadRobotoFont();
      if (font) {
        setFontBase64(font);
      }
      
      try {
        const logoResponse = await fetch('/logo-header.png');
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(logoBlob);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };
    
    loadAssets();
  }, []);

  // Track form changes
  useEffect(() => {
    if (lastFinalizedTeklifNo && checkFormChanged()) {
      setFormChanged(true);
    }
  }, [firma, ilgiliKisi, tel, email, konu, products, notlar, opsiyon, teslimSuresi, odemeSekli, teslimYeri, activeCurrency]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Load customers from Supabase
  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customer_profile')
        .select('*')
        .order('firma', { ascending: true });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: "Hata",
        description: "Müşteri listesi yüklenemedi.",
        variant: "destructive"
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Select customer and autofill
  const selectCustomer = (customer: CustomerProfile) => {
    setFirma(customer.firma || "");
    setIlgiliKisi(customer.ilgili_kisi || "");
    setTel(customer.telefon || "");
    setEmail(customer.email || "");
    setKonu(customer.konu || "");
    setShowCustomerModal(false);
    setFormChanged(true);
    
    toast({
      title: "Müşteri Seçildi",
      description: `${customer.firma} bilgileri dolduruldu.`,
    });
  };

  // Currency conversion helper
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const amountInTRY = amount * EXCHANGE_RATES[fromCurrency];
    return amountInTRY / EXCHANGE_RATES[toCurrency];
  };

  // Handle global currency change with conversion
  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === activeCurrency) return;

    const updatedProducts = products.map(p => ({
      ...p,
      birimFiyat: convertCurrency(p.birimFiyat, activeCurrency, newCurrency),
      doviz: newCurrency
    }));

    setProducts(updatedProducts);
    setActiveCurrency(newCurrency);
    setFormChanged(true);
  };

  const addRow = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([...products, { id: newId, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: activeCurrency }]);
    setFormChanged(true);
  };

  const removeRow = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
      setFormChanged(true);
    }
  };

  const updateProduct = (id: number, field: keyof ProductRow, value: string | number) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    setFormChanged(true);
  };

  const calculateRowTotal = (row: ProductRow) => row.miktar * row.birimFiyat;
  const calculateSubtotal = () => products.reduce((sum, p) => sum + calculateRowTotal(p), 0);
  const calculateKDV = () => calculateSubtotal() * 0.20;
  const calculateTotal = () => calculateSubtotal() + calculateKDV();

  const formatCurrency = (amount: number, currency = activeCurrency) => {
    const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
    return `${symbols[currency] || "₺"}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR');

  // Get or generate teklif number
  const getOrGenerateTeklifNo = async (): Promise<string | null> => {
    // If form hasn't changed and we have a finalized number, reuse it
    if (!formChanged && lastFinalizedTeklifNo) {
      return lastFinalizedTeklifNo;
    }

    // Generate new number
    try {
      const { data, error } = await supabase.rpc("increment_monthly_counter");
      if (error || !data) {
        console.error("Counter error:", error);
        return null;
      }

      const formattedCounter = String(data).padStart(3, "0");
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const teklifNo = `TR-DAYAN-${yearMonth}${formattedCounter}`;
      
      return teklifNo;
    } catch (error) {
      console.error("Counter generation error:", error);
      return null;
    }
  };

  // Enhanced PDF Design
  const createPDF = (teklifNo: string): jsPDF => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const today = formatDate(new Date());
    
    // Embed Roboto font for Turkish character support
    if (fontBase64) {
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
      doc.setFont("Roboto");
    }

    const fontName = fontBase64 ? "Roboto" : "helvetica";
    
    // ===== HEADER SECTION =====
    // Clean white header with border
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 38, 'F');
    
    // Bottom border line
    doc.setDrawColor(59, 130, 246); // blue-500
    doc.setLineWidth(1);
    doc.line(0, 38, pageWidth, 38);
    
    // Add Logo (top-left)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 8, 42, 18);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont(fontName, "bold");
        doc.text("DAYAN DISLI SANAYI", margin, 18);
      }
    } else {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont(fontName, "bold");
      doc.text("DAYAN DISLI SANAYI", margin, 18);
    }
    
    // TEKLİF title and info (Right side)
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont(fontName, "bold");
    doc.text("TEKLIF", pageWidth - margin, 16, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont(fontName, "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`No: ${teklifNo}`, pageWidth - margin, 24, { align: "right" });
    doc.text(`Tarih: ${today}`, pageWidth - margin, 30, { align: "right" });
    
    // Page info
    doc.text("SAYFA 1 / 1", pageWidth - margin, 36, { align: "right" });

    // ===== TWO-COLUMN INFO SECTION =====
    let yPos = 46;
    const leftColWidth = (pageWidth - 2 * margin - 8) / 2;
    const rightColX = margin + leftColWidth + 8;
    
    // Left Column - SATICI (Seller)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, yPos, leftColWidth, 42, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, leftColWidth, 42, 2, 2, 'S');
    
    doc.setFontSize(9);
    doc.setFont(fontName, "bold");
    doc.setTextColor(59, 130, 246); // blue-500
    doc.text("SATICI", margin + 4, yPos + 6);
    
    doc.setFontSize(8);
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("DAYAN DISLI SANAYI", margin + 4, yPos + 13);
    
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Ikitelli O.S.B. Cevre Sanayi Sitesi", margin + 4, yPos + 19);
    doc.text("8. Blok No: 45/47", margin + 4, yPos + 24);
    doc.text("Basaksehir / Istanbul 34490", margin + 4, yPos + 29);
    doc.text("Tel: +90 536 583 74 20", margin + 4, yPos + 35);
    doc.text("info@dayandisli.com", margin + 4, yPos + 40);
    
    // Right Column - ALICI (Customer)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightColX, yPos, leftColWidth, 42, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightColX, yPos, leftColWidth, 42, 2, 2, 'S');
    
    doc.setFontSize(9);
    doc.setFont(fontName, "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("ALICI", rightColX + 4, yPos + 6);
    
    doc.setFontSize(8);
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(firma || "-", rightColX + 4, yPos + 13);
    
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Ilgili: ${ilgiliKisi || "-"}`, rightColX + 4, yPos + 19);
    doc.text(`Tel: ${tel || "-"}`, rightColX + 4, yPos + 25);
    doc.text(`E-posta: ${email || "-"}`, rightColX + 4, yPos + 31);
    if (konu) {
      doc.text(`Konu: ${konu}`, rightColX + 4, yPos + 37);
    }

    // ===== INTRO TEXT =====
    yPos += 48;
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont(fontName, "normal");
    doc.text(`Sayin ${ilgiliKisi || "Yetkili"},`, margin, yPos);
    doc.text("Asagida talebiniz dogrultusunda hazirlanan fiyat teklifimizi bilgilerinize sunariz.", margin, yPos + 5);

    // ===== PRODUCT TABLE =====
    yPos += 12;
    
    const tableBody = products.map((p, idx) => [
      (idx + 1).toString(),
      p.kod || "-",
      p.cins || "-",
      p.malzeme,
      p.miktar.toString(),
      p.birim,
      formatCurrency(p.birimFiyat, activeCurrency),
      "%20",
      formatCurrency(calculateRowTotal(p), activeCurrency)
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3.5, 
        font: fontName,
        lineColor: [203, 213, 225], // slate-300
        lineWidth: 0.2,
        textColor: [51, 65, 85] // slate-700
      },
      headStyles: { 
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        font: fontName,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: { font: fontName },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      head: [['#', 'Kod', 'Hizmet / Urun', 'Malzeme', 'Miktar', 'Birim', 'Birim Fiyat', 'KDV', 'Toplam']],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 18 },
        2: { cellWidth: 42 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 24, halign: 'right' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      }
    });

    // ===== TOTALS SECTION =====
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    const totalsWidth = 80;
    const totalsX = pageWidth - margin - totalsWidth;
    
    // Totals container with clean lines
    const totalsData = [
      { label: "ARA TOPLAM", value: formatCurrency(calculateSubtotal(), activeCurrency), bold: false },
      { label: "BRUT TOPLAM", value: formatCurrency(calculateSubtotal(), activeCurrency), bold: false },
      { label: "TOPLAM K.D.V (%20)", value: formatCurrency(calculateKDV(), activeCurrency), bold: false },
      { label: "GENEL TOPLAM", value: formatCurrency(calculateTotal(), activeCurrency), bold: true },
    ];

    let totalsY = finalY;
    totalsData.forEach((item, idx) => {
      const isLast = idx === totalsData.length - 1;
      const rowHeight = isLast ? 10 : 7;
      
      if (isLast) {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(totalsX, totalsY, totalsWidth, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(idx % 2 === 0 ? 248 : 241, idx % 2 === 0 ? 250 : 245, idx % 2 === 0 ? 252 : 249);
        doc.rect(totalsX, totalsY, totalsWidth, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.rect(totalsX, totalsY, totalsWidth, rowHeight, 'S');
        doc.setTextColor(71, 85, 105);
      }
      
      doc.setFontSize(isLast ? 9 : 8);
      doc.setFont(fontName, item.bold ? "bold" : "normal");
      doc.text(item.label, totalsX + 4, totalsY + (isLast ? 6.5 : 5));
      doc.text(item.value, totalsX + totalsWidth - 4, totalsY + (isLast ? 6.5 : 5), { align: "right" });
      
      totalsY += rowHeight;
    });

    // ===== FOOTER FIELDS =====
    let footerY = totalsY + 12;
    
    const footerFields = [
      { label: 'Notlar', value: notlar },
      { label: 'Opsiyon', value: opsiyon },
      { label: 'Teslim Suresi', value: teslimSuresi },
      { label: 'Odeme Sekli', value: odemeSekli },
      { label: 'Teslim Yeri', value: teslimYeri }
    ].filter(f => f.value);

    if (footerFields.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, footerY - 2, pageWidth - 2 * margin, 6, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.setFont(fontName, "bold");
      doc.text("EK BILGILER", margin + 3, footerY + 2);
      
      footerY += 8;
      doc.setFontSize(8);
      
      footerFields.forEach(field => {
        doc.setFont(fontName, "bold");
        doc.setTextColor(59, 130, 246);
        doc.text(field.label + ":", margin, footerY);
        doc.setFont(fontName, "normal");
        doc.setTextColor(71, 85, 105);
        
        const maxWidth = pageWidth - 2 * margin - 30;
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, margin + 30, footerY);
        footerY += (lines.length * 4) + 2;
      });
    }

    // ===== SIGNATURE SECTION =====
    footerY = Math.max(footerY + 10, pageHeight - 50);
    
    const signBoxWidth = 50;
    const signBoxHeight = 22;
    const gap = 10;
    const startX = margin;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    const signatureBoxes = [
      { title: "SIPARIS ONAYI", subtitle: "Kase - Imza" },
      { title: "TEDARIKCI ONAYI", subtitle: "Kase - Imza" },
      { title: "ONAY TARIHI", subtitle: "__ / __ / ____" }
    ];

    signatureBoxes.forEach((box, idx) => {
      const boxX = startX + (signBoxWidth + gap) * idx;
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(boxX, footerY, signBoxWidth, signBoxHeight, 2, 2, 'FD');
      
      doc.setFontSize(7);
      doc.setFont(fontName, "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(box.title, boxX + signBoxWidth/2, footerY + 5, { align: "center" });
      
      doc.setFont(fontName, "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(box.subtitle, boxX + signBoxWidth/2, footerY + signBoxHeight - 4, { align: "center" });
    });

    // Contact closing
    doc.setFontSize(8);
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Iyi calismalar dileriz. Saygilarimizla,", pageWidth - margin, footerY + 6, { align: "right" });
    doc.setTextColor(59, 130, 246);
    doc.text("Hayrettin DAYAN", pageWidth - margin, footerY + 11, { align: "right" });

    // ===== FOOTER BAR =====
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("DAYAN DISLI SANAYI | www.dayandisli.com | info@dayandisli.com | +90 536 583 74 20", pageWidth / 2, pageHeight - 4, { align: "center" });

    return doc;
  };

  // PDF Download Handler
  const generatePDF = async () => {
    if (!firma || !ilgiliKisi) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen firma ve ilgili kişi bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const teklifNo = await getOrGenerateTeklifNo();
      if (!teklifNo) {
        toast({
          title: "Sayaç Hatası",
          description: "Teklif numarası alınamadı!",
          variant: "destructive",
        });
        return;
      }

      setCurrentTeklifNo(teklifNo);
      setLastFinalizedTeklifNo(teklifNo);
      markFormFinalized();

      const doc = createPDF(teklifNo);
      doc.save(teklifNo + ".pdf");

      toast({
        title: "PDF Oluşturuldu",
        description: `${teklifNo} başarıyla indirildi.`,
      });

    } catch (e) {
      console.error("PDF generation error:", e);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Email Preview Handler
  const handleEmailPreview = async () => {
    if (!firma || !ilgiliKisi || !email) {
      toast({
        title: "Eksik Bilgi",
        description: "Firma, ilgili kişi ve e-posta zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const teklifNo = await getOrGenerateTeklifNo();
      if (!teklifNo) {
        throw new Error("Teklif numarası alınamadı");
      }

      setCurrentTeklifNo(teklifNo);

      const doc = createPDF(teklifNo);
      const pdfOutput = doc.output("blob");
      setPdfBlob(pdfOutput);

      const previewUrl = URL.createObjectURL(pdfOutput);
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(previewUrl);

      setShowEmailModal(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Hata",
        description: "Önizleme oluşturulamadı!",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Send Email Handler
  const handleSendEmail = async () => {
    if (!pdfBlob || !currentTeklifNo) {
      toast({
        title: "Hata",
        description: "PDF hazır değil!",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const pdfBase64 = await base64Promise;
      const emailHtml = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6;">
 
  <p><strong>Sayın ${formatName(ilgiliKisi)},</strong></p><br/>

  <p>Tarafınıza hazırlanan fiyat teklifimiz ekte bilginize sunulmuştur.</p>

  <p><strong>Teklif No:</strong> <strong>${currentTeklifNo}</strong></p><br/>

  <p>Her türlü sorunuz için memnuniyetle yardımcı olmaktan mutluluk duyarız.</p><br/>



  <p>
  <!-- LOGO -->
  <div style="text-align: left; margin-bottom: 20px;">
    <img src="https://dayandisli.com/logo-header.png"
         alt="DAYAN Dişli Logo"
         style="max-width: 240px; height: auto;" />
  </div>
    <strong>DAYAN DİŞLİ & PROFİL TAŞLAMA</strong><br/>
    <strong>📞 +90 536 583 74 20</strong><br/>
    <strong>📧 info@dayandisli.com</strong><br/>
    <strong>🌐 www.dayandisli.com</strong>
  </p>
</div>
`;


      const { error } = await supabase.functions.invoke('send-quotation-email', {
  body: {
    to: email,
    bcc: 'bediz@dayandisli.com',
    subject: `${currentTeklifNo} No'lu Fiyat Teklifi`,
    html: emailHtml,
    firma,
    ilgiliKisi: formatName(ilgiliKisi),
    tel,
    konu,

    // 🔽 BURAYA YAPIŞTIR
    products: products.map(p => ({
      kod: p.kod,
      cins: p.cins,
      malzeme: p.malzeme,
      miktar: p.miktar,
      birim: p.birim,
      birimFiyat: formatCurrency(p.birimFiyat, activeCurrency),
      toplam: formatCurrency(calculateRowTotal(p), activeCurrency)
    })),

    araToplam: formatCurrency(calculateSubtotal(), activeCurrency),
    kdv: formatCurrency(calculateKDV(), activeCurrency),
    genelToplam: formatCurrency(calculateTotal(), activeCurrency),
    notlar,
    opsiyon,
    teslimSuresi,
    odemeSekli,
    teslimYeri,
    teklifNo: currentTeklifNo,
    pdfBase64,
    pdfFileName: `${currentTeklifNo}.pdf`
  }
});


      if (error) throw error;

      // Mark as finalized after successful send
      setLastFinalizedTeklifNo(currentTeklifNo);
      markFormFinalized();

      toast({
        title: "E-posta Gönderildi",
        description: `Teklif ${email} adresine başarıyla gönderildi.`,
      });

      setShowEmailModal(false);

    } catch (error) {
      console.error("Email send error:", error);
      toast({
        title: "Hata",
        description: "E-posta gönderilemedi.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp Preview Handler
  const handleWhatsAppPreview = async () => {
    if (!firma || !ilgiliKisi) {
      toast({
        title: "Eksik Bilgi",
        description: "Firma ve ilgili kişi zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const teklifNo = await getOrGenerateTeklifNo();
      if (!teklifNo) {
        throw new Error("Teklif numarası alınamadı");
      }

      setCurrentTeklifNo(teklifNo);

      const doc = createPDF(teklifNo);
      const pdfOutput = doc.output("blob");
      setPdfBlob(pdfOutput);

      setShowWhatsAppModal(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Hata",
        description: "WhatsApp önizlemesi oluşturulamadı!",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = async () => {
    if (!pdfBlob || !currentTeklifNo) {
      toast({
        title: "Hata",
        description: "PDF hazır değil!",
        variant: "destructive"
      });
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      const pdfFile = new File([pdfBlob], `${currentTeklifNo}.pdf`, { type: "application/pdf" });

      const messageText = `Merhaba, fiyat teklifleri ekte yer almaktadır:

📋 *Teklif No:* ${currentTeklifNo}
🏢 *Firma:* ${firma}
👤 *İlgili:* ${formatName(ilgiliKisi)}
💰 *Toplam:* ${formatCurrency(calculateTotal(), activeCurrency)}

DAYAN DİŞLİ SANAYİ
📞 +90 536 583 74 20
📧 info@dayandisli.com
🌐 dayandisli.com`;

      // Check if Web Share API with files is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `${currentTeklifNo} - Fiyat Teklifi`,
            text: messageText
          });
          
          // Mark as finalized after successful share
          setLastFinalizedTeklifNo(currentTeklifNo);
          markFormFinalized();

          toast({
            title: "Paylaşıldı",
            description: "PDF başarıyla paylaşıldı.",
          });

          setShowWhatsAppModal(false);
        } catch (shareError) {
          if ((shareError as Error).name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
        // Fallback: Open WhatsApp Web with message only
        const fallbackMessage = encodeURIComponent(
          `Merhaba, fiyat teklifleri ekte yer almaktadır:\n\n` +
          `📋 Teklif No: ${currentTeklifNo}\n` +
          `🏢 Firma: ${firma}\n` +
          `👤 İlgili: ${formatName(ilgiliKisi)}\n` +
          `💰 Toplam: ${formatCurrency(calculateTotal(), activeCurrency)}\n\n` +
          `PDF dosyasını e-posta ile gönderebiliriz.\n\n` +
          `DAYAN DİŞLİ SANAYİ\n` +
          `📞 +90 536 583 74 20\n` +
          `📧 info@dayandisli.com`
        );

        const whatsappUrl = tel 
          ? `https://api.whatsapp.com/send?phone=${tel.replace(/\D/g, '')}&text=${fallbackMessage}`
          : `https://api.whatsapp.com/send?text=${fallbackMessage}`;

        window.open(whatsappUrl, '_blank');

        // Download PDF for manual attachment
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfBlob);
        downloadLink.download = `${currentTeklifNo}.pdf`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);

        // Mark as finalized
        setLastFinalizedTeklifNo(currentTeklifNo);
        markFormFinalized();

        toast({
          title: "WhatsApp Açıldı",
          description: "PDF indirildi. WhatsApp'a manuel olarak ekleyebilirsiniz.",
        });

        setShowWhatsAppModal(false);
      }

    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast({
        title: "Hata",
        description: "WhatsApp paylaşımı başarısız oldu.",
        variant: "destructive"
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/apps" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  TEKLİF OLUŞTURUCU
                </h1>
                <p className="text-xs text-slate-400">Dayan Dişli Sanayi</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link to="/apps">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Teklif No Display */}
        {currentTeklifNo && (
          <div className="mb-6 flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-semibold text-white">Teklif No: {currentTeklifNo}</span>
            {!formChanged && (
              <span className="text-xs text-green-400 ml-2">(Kaydedildi)</span>
            )}
          </div>
        )}

        {/* Customer Information */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                Müşteri Bilgileri
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  loadCustomers();
                  setShowCustomerModal(true);
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Müşteri Seç
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firma" className="text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Firma *
                </Label>
                <Input 
                  id="firma" 
                  value={firma} 
                  onChange={(e) => { setFirma(e.target.value); setFormChanged(true); }} 
                  placeholder="Firma adı"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ilgili" className="text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" /> İlgili Kişi *
                </Label>
                <Input 
                  id="ilgili" 
                  value={ilgiliKisi} 
                  onChange={(e) => { setIlgiliKisi(e.target.value); setFormChanged(true); }} 
                  placeholder="Ad Soyad"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tel" className="text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Telefon
                </Label>
                <Input 
                  id="tel" 
                  value={tel} 
                  onChange={(e) => { setTel(e.target.value); setFormChanged(true); }} 
                  placeholder="+90 XXX XXX XX XX"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                  <AtSign className="w-4 h-4" /> E-posta *
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setFormChanged(true); }} 
                  placeholder="email@firma.com"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="konu" className="text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Konu
                </Label>
                <Input 
                  id="konu" 
                  value={konu} 
                  onChange={(e) => { setKonu(e.target.value); setFormChanged(true); }} 
                  placeholder="Teklif konusu"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Table */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                Ürün / Hizmet Tablosu
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Global Currency Selector */}
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-slate-400" />
                  <Select value={activeCurrency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger className="w-28 h-9 bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {DOVIZ_OPTIONS.map(m => (
                        <SelectItem key={m.value} value={m.value} className="text-white hover:bg-slate-700">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  size="sm" 
                  onClick={addRow}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-1" /> Satır Ekle
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">#</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Kod</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Ürün/Hizmet</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Malzeme</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Miktar</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Birim</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Birim Fiyat ({DOVIZ_OPTIONS.find(d => d.value === activeCurrency)?.symbol})</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Toplam</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-2 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <Input 
                        value={product.kod} 
                        onChange={(e) => updateProduct(product.id, 'kod', e.target.value)}
                        placeholder="Kod"
                        className="h-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        value={product.cins} 
                        onChange={(e) => updateProduct(product.id, 'cins', e.target.value)}
                        placeholder="Açıklama"
                        className="h-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select value={product.malzeme} onValueChange={(v) => updateProduct(product.id, 'malzeme', v)}>
                        <SelectTrigger className="h-9 bg-slate-900 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {MALZEME_OPTIONS.map(m => (
                            <SelectItem key={m} value={m} className="text-white hover:bg-slate-700">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        type="number" 
                        min="1"
                        value={product.miktar} 
                        onChange={(e) => updateProduct(product.id, 'miktar', parseInt(e.target.value) || 1)}
                        className="h-9 w-20 bg-slate-900 border-slate-600 text-white text-center"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select value={product.birim} onValueChange={(v) => updateProduct(product.id, 'birim', v)}>
                        <SelectTrigger className="h-9 w-24 bg-slate-900 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {BIRIM_OPTIONS.map(b => (
                            <SelectItem key={b} value={b} className="text-white hover:bg-slate-700">{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={product.birimFiyat} 
                        onChange={(e) => updateProduct(product.id, 'birimFiyat', parseFloat(e.target.value) || 0)}
                        className="h-9 w-28 bg-slate-900 border-slate-600 text-white text-right"
                      />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-semibold text-emerald-400 font-mono">
                        {formatCurrency(calculateRowTotal(product), activeCurrency)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeRow(product.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        disabled={products.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-72 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="flex justify-between py-3 px-4 border-b border-slate-700">
                  <span className="text-slate-400">Ara Toplam:</span>
                  <span className="text-white font-mono">{formatCurrency(calculateSubtotal(), activeCurrency)}</span>
                </div>
                <div className="flex justify-between py-3 px-4 border-b border-slate-700">
                  <span className="text-slate-400">KDV (%20):</span>
                  <span className="text-white font-mono">{formatCurrency(calculateKDV(), activeCurrency)}</span>
                </div>
                <div className="flex justify-between py-3 px-4 bg-blue-600">
                  <span className="font-bold text-white">Genel Toplam:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(calculateTotal(), activeCurrency)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Fields */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-400" />
              </div>
              Ek Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notlar" className="text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Notlar
                </Label>
                <Textarea 
                  id="notlar" 
                  value={notlar} 
                  onChange={(e) => { setNotlar(e.target.value); setFormChanged(true); }} 
                  placeholder="Ek notlar..."
                  rows={3}
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opsiyon" className="text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Opsiyon
                </Label>
                <Input 
                  id="opsiyon" 
                  value={opsiyon} 
                  onChange={(e) => { setOpsiyon(e.target.value); setFormChanged(true); }} 
                  placeholder="Opsiyon süresi"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teslimSuresi" className="text-slate-300 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Öngörülen Teslim Süresi
                </Label>
                <Input 
                  id="teslimSuresi" 
                  value={teslimSuresi} 
                  onChange={(e) => { setTeslimSuresi(e.target.value); setFormChanged(true); }} 
                  placeholder="Örn: 15 iş günü"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odemeSekli" className="text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Ödeme Şekli
                </Label>
                <Input 
                  id="odemeSekli" 
                  value={odemeSekli} 
                  onChange={(e) => { setOdemeSekli(e.target.value); setFormChanged(true); }} 
                  placeholder="Örn: %50 peşin, %50 teslimde"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teslimYeri" className="text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Teslim Yeri
                </Label>
                <Input 
                  id="teslimYeri" 
                  value={teslimYeri} 
                  onChange={(e) => { setTeslimYeri(e.target.value); setFormChanged(true); }} 
                  placeholder="Teslim adresi"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-base shadow-lg shadow-blue-600/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5 mr-2" />
                PDF İndir
              </>
            )}
          </Button>
          
          <Button 
            size="lg" 
            onClick={handleEmailPreview}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-base shadow-lg shadow-emerald-600/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Hazırlanıyor...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Mail Gönder
              </>
            )}
          </Button>

          <Button 
            size="lg" 
            onClick={handleWhatsAppPreview}
            disabled={isGenerating || isSendingWhatsApp || !firma || !ilgiliKisi}
            className="bg-green-500 hover:bg-green-600 text-white px-8 h-14 text-base shadow-lg shadow-green-500/25"
          >
            {isSendingWhatsApp ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Açılıyor...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp ile Gönder
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} DAYAN DİŞLİ SANAYİ | İkitelli O.S.B. Çevre Sanayi Sitesi, 8. Blok No: 45/47 Başakşehir / İstanbul
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Tel: +90 536 583 74 20 | E-mail: info@dayandisli.com | Web: dayandisli.com
          </p>
        </div>
      </footer>

      {/* Email Preview Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-blue-400" />
              E-posta Önizleme - {currentTeklifNo}
            </DialogTitle>
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
                  <span className="text-emerald-400 font-bold ml-2">{formatCurrency(calculateTotal(), activeCurrency)}</span>
                </div>
              </div>
            </div>

            {pdfPreviewUrl && (
              <div className="border border-slate-600 rounded-lg overflow-hidden">
                <iframe 
                  src={pdfPreviewUrl} 
                  className="w-full h-[300px] bg-white"
                  title="PDF Preview"
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(false)}
              disabled={isSendingEmail}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSendingEmail ? (
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

      {/* WhatsApp Preview Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5 text-green-400" />
              WhatsApp Paylaşım - {currentTeklifNo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Teklif No:</span>
                  <span className="text-white font-mono">{currentTeklifNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firma:</span>
                  <span className="text-white">{firma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">İlgili:</span>
                  <span className="text-white">{formatName(ilgiliKisi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toplam:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(calculateTotal(), activeCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
              <p className="text-xs text-green-300 mb-2">Gönderilecek Mesaj:</p>
              <p className="text-sm text-slate-300 italic">
                "Merhaba, fiyat teklifleri ekte yer almaktadır:"
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowWhatsAppModal(false)}
              disabled={isSendingWhatsApp}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button 
              onClick={handleWhatsAppShare}
              disabled={isSendingWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Paylaşılıyor...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp ile Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Selection Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              Müşteri Seç
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">

  {/* ARAMA KUTUSU → BURAYA EKLENİYOR */}
  <div className="mb-3">
    <Input
      placeholder="Ara: firma, kişi veya e-posta..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
    />
  </div>

            {loadingCustomers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="ml-2 text-slate-400">Yükleniyor...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Kayıtlı müşteri bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full p-3 text-left bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-colors"
                  >
                    <p className="text-white font-medium">{customer.firma}</p>
                    <p className="text-sm text-slate-400">{customer.ilgili_kisi} • {customer.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCustomerModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeklifSayfasi;
