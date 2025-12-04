import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
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
  MessageCircle, Settings, ArrowLeft
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
  USD: 34.50,  // 1 USD = 34.50 TRY
  EUR: 37.00,  // 1 EUR = 37.00 TRY
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [currentTeklifNo, setCurrentTeklifNo] = useState("");
  const [productChanged, setProductChanged] = useState(false);

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Currency conversion helper
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    // Convert to TRY first, then to target currency
    const amountInTRY = amount * EXCHANGE_RATES[fromCurrency];
    return amountInTRY / EXCHANGE_RATES[toCurrency];
  };

  const addRow = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([...products, { id: newId, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: activeCurrency }]);
    setProductChanged(true);
  };

  const removeRow = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
      setProductChanged(true);
    }
  };

  const updateProduct = (id: number, field: keyof ProductRow, value: string | number) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const calculateRowTotal = (row: ProductRow) => row.miktar * row.birimFiyat;
  
  const calculateSubtotal = () => products.reduce((sum, p) => sum + calculateRowTotal(p), 0);
  
  const calculateKDV = () => calculateSubtotal() * 0.20;
  
  const calculateTotal = () => calculateSubtotal() + calculateKDV();

  const formatCurrency = (amount: number, currency = activeCurrency) => {
    const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
    return `${symbols[currency] || "₺"}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
  };

  // Enhanced PDF Design
  const createPDF = (teklifNo: string): jsPDF => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
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
    // Header Background with gradient effect
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 42, 'F');
    
    // Accent line
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 42, pageWidth, 2, 'F');
    
    // Add Logo (top-left on dark bg)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 10, 45, 20);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
      }
    }
    
    // Company Name (if no logo)
    if (!logoBase64) {
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.text("DAYAN DISLI SANAYI", margin, 22);
    }
    
    // Document Info Box (Right side of header)
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(pageWidth - 70, 8, 55, 28, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246); // blue-500
    doc.setFont(fontName, "bold");
    doc.text("FIYAT TEKLIFI", pageWidth - 42.5, 16, { align: "center" });
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 65, 19, pageWidth - 20, 19);
    
    doc.setFont(fontName, "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`No: ${teklifNo}`, pageWidth - 65, 25);
    doc.text(`Tarih: ${today}`, pageWidth - 65, 30);
    
    // ===== COMPANY CONTACT =====
    let yPos = 52;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont(fontName, "normal");
    doc.text("Ikitelli O.S.B. Cevre Sanayi Sitesi, 8. Blok No: 45/47 Basaksehir / Istanbul", margin, yPos);
    doc.text("Tel: +90 536 583 74 20 | E-mail: info@dayandisli.com | Web: dayandisli.com", margin, yPos + 4);

    // ===== CUSTOMER INFO SECTION =====
    yPos = 66;
    
    // Section header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont(fontName, "bold");
    doc.text("MUSTERI BILGILERI", margin + 4, yPos + 5.5);
    
    // Customer details box
    yPos += 10;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 22, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    
    const col1X = margin + 4;
    const col2X = pageWidth / 2 + 5;
    
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Firma:", col1X, yPos + 6);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(firma || "-", col1X + 18, yPos + 6);
    
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Ilgili:", col2X, yPos + 6);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(ilgiliKisi || "-", col2X + 18, yPos + 6);
    
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Tel:", col1X, yPos + 12);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(tel || "-", col1X + 18, yPos + 12);
    
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("E-posta:", col2X, yPos + 12);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(email || "-", col2X + 18, yPos + 12);
    
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Konu:", col1X, yPos + 18);
    doc.setFont(fontName, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(konu || "-", col1X + 18, yPos + 18);

    // ===== INTRO TEXT =====
    yPos += 28;
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Sayin ${ilgiliKisi || "Yetkili"},`, margin, yPos);
    doc.text("Asagida talebiniz dogrultusunda hazirlanan fiyat teklifimizi bilgilerinize sunariz.", margin, yPos + 5);
    doc.setFont(fontName, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Iyi calismalar dileriz. Saygilarimizla,", margin, yPos + 10);
    doc.setTextColor(59, 130, 246);
    doc.text("Hayrettin DAYAN", margin, yPos + 15);

    // ===== PRODUCT TABLE =====
    yPos += 22;
    
    const tableBody = products.map((p, idx) => [
      (idx + 1).toString(),
      p.kod || "-",
      p.cins || "-",
      p.malzeme,
      p.miktar.toString(),
      p.birim,
      formatCurrency(p.birimFiyat, activeCurrency),
      formatCurrency(calculateRowTotal(p), activeCurrency)
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 4, 
        font: fontName,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.2,
        textColor: [51, 65, 85] // slate-700
      },
      headStyles: { 
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        font: fontName,
        halign: 'center',
        cellPadding: 5
      },
      bodyStyles: { font: fontName },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      head: [['#', 'Kod', 'Urun/Hizmet', 'Malzeme', 'Miktar', 'Birim', 'Birim Fiyat', 'Toplam']],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 42 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 27, halign: 'right' },
        7: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
      }
    });

    // ===== TOTALS BOX =====
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;
    
    // Totals container
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(totalsX, finalY, totalsWidth, 36, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.roundedRect(totalsX, finalY, totalsWidth, 36, 3, 3, 'S');
    
    // Subtotal
    doc.setFontSize(9);
    doc.setFont(fontName, "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Ara Toplam:", totalsX + 5, finalY + 8);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(calculateSubtotal(), activeCurrency), totalsX + totalsWidth - 5, finalY + 8, { align: "right" });
    
    // KDV
    doc.setTextColor(100, 116, 139);
    doc.text("KDV (%20):", totalsX + 5, finalY + 16);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(calculateKDV(), activeCurrency), totalsX + totalsWidth - 5, finalY + 16, { align: "right" });
    
    // Divider line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(totalsX + 5, finalY + 21, totalsX + totalsWidth - 5, finalY + 21);
    
    // Grand Total
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(totalsX, finalY + 24, totalsWidth, 12, 0, 0, 'F');
    // Bottom corners
    doc.roundedRect(totalsX, finalY + 24, totalsWidth, 12, 3, 3, 'F');
    doc.setFillColor(15, 23, 42);
    doc.rect(totalsX, finalY + 24, totalsWidth, 6, 'F');
    
    doc.setFont(fontName, "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("GENEL TOPLAM:", totalsX + 5, finalY + 31);
    doc.text(formatCurrency(calculateTotal(), activeCurrency), totalsX + totalsWidth - 5, finalY + 31, { align: "right" });

    // ===== FOOTER FIELDS =====
    let footerY = finalY + 50;
    
    const footerFields = [
      { label: 'Notlar', value: notlar },
      { label: 'Opsiyon', value: opsiyon },
      { label: 'Teslim Suresi', value: teslimSuresi },
      { label: 'Odeme Sekli', value: odemeSekli },
      { label: 'Teslim Yeri', value: teslimYeri }
    ].filter(f => f.value);

    if (footerFields.length > 0) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(margin, footerY - 4, pageWidth - 2 * margin, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont(fontName, "bold");
      doc.text("EK BILGILER", margin + 4, footerY + 1.5);
      
      footerY += 8;
      doc.setFontSize(8);
      
      footerFields.forEach(field => {
        doc.setFont(fontName, "bold");
        doc.setTextColor(59, 130, 246); // blue-500
        doc.text(field.label + ":", margin, footerY);
        doc.setFont(fontName, "normal");
        doc.setTextColor(71, 85, 105); // slate-600
        
        // Handle long text wrapping
        const maxWidth = pageWidth - 2 * margin - 35;
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, margin + 35, footerY);
        footerY += (lines.length * 4) + 3;
      });
    }

    // ===== SIGNATURE SECTION =====
    footerY = Math.max(footerY + 15, pageHeight - 55);
    
    const signBoxWidth = 52;
    const signBoxHeight = 24;
    const gap = 12;
    const startX = margin;

    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);

    // Signature boxes
    const signatureBoxes = [
      { title: "SIPARIS ONAYI", subtitle: "Kase - Imza" },
      { title: "TEDARIKCI ONAYI", subtitle: "Kase - Imza" },
      { title: "ONAY TARIHI", subtitle: "__ / __ / ____" }
    ];

    signatureBoxes.forEach((box, idx) => {
      const boxX = startX + (signBoxWidth + gap) * idx;
      
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(boxX, footerY, signBoxWidth, signBoxHeight, 3, 3, 'FD');
      
      doc.setFontSize(7);
      doc.setFont(fontName, "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(box.title, boxX + signBoxWidth/2, footerY + 5, { align: "center" });
      
      doc.setFont(fontName, "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(box.subtitle, boxX + signBoxWidth/2, footerY + signBoxHeight - 4, { align: "center" });
    });

    // ===== FOOTER BAR =====
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("DAYAN DISLI SANAYI | www.dayandisli.com | info@dayandisli.com | +90 536 583 74 20", pageWidth / 2, pageHeight - 5, { align: "center" });

    return doc;
  };

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
      const { data, error } = await supabase.rpc("increment_monthly_counter");

      if (error || !data) {
        console.error("Counter error:", error);
        toast({
          title: "Sayaç Hatası",
          description: "Teklif numarası alınamadı!",
          variant: "destructive",
        });
        return;
      }

      const formattedCounter = String(data).padStart(3, "0");
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const teklifNo = `TR-DAYAN-${yearMonth}${formattedCounter}`;
      setCurrentTeklifNo(teklifNo);

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
      setProductChanged(false);
    }
  };

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
      const { data: counterData, error: counterError } = await supabase
        .from("counter")
        .select("value")
        .eq("id", 1)
        .single();

      if (counterError || !counterData) {
        throw new Error("Sayaç bilgisi alınamadı");
      }

      const currentCounter = counterData.value + 1;
      const yil = new Date().getFullYear();
      const ay = String(new Date().getMonth() + 1).padStart(2, "0");
      const sayi = String(currentCounter).padStart(3, "0");

      const teklifNo = `TR-DAYAN-${yil}${ay}${sayi}`;
      setCurrentTeklifNo(teklifNo);

      const doc = createPDF(teklifNo);
      const pdfOutput = doc.output("blob");
      setPdfBlob(pdfOutput);

      const previewUrl = URL.createObjectURL(pdfOutput);
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

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Hata",
        description: "Müşteri e-posta adresi boş olamaz.",
        variant: "destructive",
      });
      return;
    }

    if (!pdfBlob || !currentTeklifNo) {
      toast({
        title: "Hata",
        description: "PDF oluşturulamadı.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const reader = new FileReader();
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const formattedName = formatName(ilgiliKisi);
      const today = new Date().toLocaleDateString("tr-TR");
      const emailSubject = `${currentTeklifNo} No'lu Fiyat Teklifi`;

      const emailHtml = `
Sayın ${formattedName},<br><br>
Tarafınıza hazırlanan fiyat teklifimiz ekte bilginize sunulmuştur.<br><br>
<b>Teklif No:</b> ${currentTeklifNo}<br>
<b>Tarih:</b> ${today}<br><br>
Her türlü sorunuz için memnuniyetle yardımcı olmaktan mutluluk duyarız.<br><br>
Saygılarımızla,<br>
<b>DAYAN DİŞLİ & Profil Taşlama</b><br>
0 (212) XXX XX XX<br>
info@dayandisli.com<br>
www.dayandisli.com<br>
`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quotation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: email,
            from: "info@dayandisli.com",
            subject: emailSubject,
            html: emailHtml,
            bcc: "bediz@dayandisli.com",
            fileBase64: pdfBase64,
            fileName: `${currentTeklifNo}.pdf`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Function returned error:", data);
        throw new Error(data.error || "Function error");
      }

      toast({
        title: "Başarılı!",
        description: "Teklif başarıyla e-posta olarak gönderildi.",
      });

      setShowEmailModal(false);
      setPdfPreviewUrl("");
      setPdfBlob(null);
      setCurrentTeklifNo("");

    } catch (err: unknown) {
      console.error("Email sending error:", err);
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast({
        title: "Hata",
        description: `E-posta gönderilemedi: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp Share Function with Web Share API
  const handleWhatsAppShare = async () => {
    if (!firma || !ilgiliKisi) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen firma ve ilgili kişi bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      // Generate teklif number
      let teklifNo = currentTeklifNo;
      
      if (!teklifNo) {
        const { data: counterData } = await supabase
          .from("counter")
          .select("value")
          .eq("id", 1)
          .single();

        const currentCounter = (counterData?.value || 0) + 1;
        const yil = new Date().getFullYear();
        const ay = String(new Date().getMonth() + 1).padStart(2, "0");
        const sayi = String(currentCounter).padStart(3, "0");
        teklifNo = `TR-DAYAN-${yil}${ay}${sayi}`;
      }

      // Create PDF
      const doc = createPDF(teklifNo);
      const pdfOutput = doc.output("blob");
      
      // Create File object from Blob
      const pdfFile = new File([pdfOutput], `${teklifNo}.pdf`, { type: "application/pdf" });

      // Message text
      const messageText = `Merhaba, fiyat teklifleri ekte yer almaktadır:

📋 *Teklif No:* ${teklifNo}
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
            title: `${teklifNo} - Fiyat Teklifi`,
            text: messageText
          });
          
          toast({
            title: "Paylaşıldı",
            description: "PDF başarıyla paylaşım için hazırlandı.",
          });
        } catch (shareError) {
          // User cancelled or share failed - fallback to WhatsApp Web
          if ((shareError as Error).name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
        // Fallback: Open WhatsApp Web with message only
        const fallbackMessage = encodeURIComponent(
          `Merhaba, fiyat teklifleri ekte yer almaktadır:\n\n` +
          `📋 Teklif No: ${teklifNo}\n` +
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

        // Also download the PDF for manual attachment
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfOutput);
        downloadLink.download = `${teklifNo}.pdf`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);

        toast({
          title: "WhatsApp Açıldı",
          description: "PDF indirildi. WhatsApp'a manuel olarak ekleyebilirsiniz.",
        });
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
          </div>
        )}

        {/* Customer Information */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              Müşteri Bilgileri
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
                  onChange={(e) => setFirma(e.target.value)} 
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
                  onChange={(e) => setIlgiliKisi(e.target.value)} 
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
                  onChange={(e) => setTel(e.target.value)} 
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
                  onChange={(e) => setEmail(e.target.value)} 
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
                  onChange={(e) => setKonu(e.target.value)} 
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
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                Ürün / Hizmet Tablosu
              </div>
              <div className="flex items-center gap-3">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'kod', e.target.value);
                        }}
                        placeholder="Kod"
                        className="h-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        value={product.cins} 
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'cins', e.target.value);
                        }}
                        placeholder="Açıklama"
                        className="h-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select value={product.malzeme} onValueChange={(v) => {
                        setProductChanged(true);
                        updateProduct(product.id, 'malzeme', v);
                      }}>
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
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'miktar', parseInt(e.target.value) || 0);
                        }}
                        className="h-9 w-20 bg-slate-900 border-slate-600 text-white"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select value={product.birim} onValueChange={(v) => {
                        setProductChanged(true);
                        updateProduct(product.id, 'birim', v);
                      }}>
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
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'birimFiyat', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 w-28 bg-slate-900 border-slate-600 text-white"
                      />
                    </td>
                    <td className="py-3 px-2">
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
                  onChange={(e) => setNotlar(e.target.value)} 
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
                  onChange={(e) => setOpsiyon(e.target.value)} 
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
                  onChange={(e) => setTeslimSuresi(e.target.value)} 
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
                  onChange={(e) => setOdemeSekli(e.target.value)} 
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
                  onChange={(e) => setTeslimYeri(e.target.value)} 
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
                PDF İndir / Önizle
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
            onClick={handleWhatsAppShare}
            disabled={isSendingWhatsApp || !firma || !ilgiliKisi}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-blue-400" />
              PDF Önizleme - {currentTeklifNo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 my-4">
            {pdfPreviewUrl && (
              <iframe 
                src={pdfPreviewUrl} 
                className="w-full h-[500px] border border-slate-600 rounded-lg bg-white"
                title="PDF Preview"
              />
            )}
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-slate-700">
            <p className="text-sm text-slate-300">
              <strong className="text-blue-400">Alıcı:</strong> {email}
            </p>
            <p className="text-sm text-slate-300">
              <strong className="text-blue-400">BCC:</strong> bediz@dayandisli.com
            </p>
            <p className="text-sm text-slate-300">
              <strong className="text-blue-400">Konu:</strong> {currentTeklifNo} No'lu Fiyat Teklifi
            </p>
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
    </div>
  );
};

export default TeklifSayfasi;