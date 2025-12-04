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

const TeklifSayfasi = () => {
  const { toast } = useToast();
  
  // Customer info state
  const [firma, setFirma] = useState("");
  const [ilgiliKisi, setIlgiliKisi] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [konu, setKonu] = useState("");
  
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

  const addRow = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([...products, { id: newId, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0, doviz: "TRY" }]);
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

  const formatCurrency = (amount: number, currency = "TRY") => {
    const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
    return `${symbols[currency] || "₺"}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
  };

  // Modern PDF Design
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
    
    // Header Background
    doc.setFillColor(13, 59, 102);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Add Logo (top-left on dark bg)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 8, 50, 22);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
      }
    }
    
    // Company Name (if no logo)
    if (!logoBase64) {
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.text("DAYAN DISLI SANAYI", margin, 20);
    }
    
    // Document Info Box (Right side of header)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 75, 8, 60, 30, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(13, 59, 102);
    doc.setFont(fontName, "bold");
    doc.text("FIYAT TEKLIFI", pageWidth - 45, 15, { align: "center" });
    
    doc.setFont(fontName, "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text(`Teklif No: ${teklifNo}`, pageWidth - 70, 22);
    doc.text(`Tarih: ${today}`, pageWidth - 70, 27);
    doc.text(`Sayfa: 1/1`, pageWidth - 70, 32);
    
    // Company Contact Info (Below header)
    let yPos = 52;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(fontName, "normal");
    doc.text("Ikitelli O.S.B. Cevre Sanayi Sitesi, 8. Blok No: 45/47 Basaksehir / Istanbul", margin, yPos);
    doc.text("Tel: +90 536 583 74 20 | E-mail: info@dayandisli.com | Web: dayandisli.com", margin, yPos + 4);

    // Customer Info Section
    yPos = 65;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(13, 59, 102);
    doc.setFont(fontName, "bold");
    doc.text("MUSTERI BILGILERI", margin + 4, yPos + 6);
    
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(fontName, "normal");
    doc.text(`Firma: ${firma}`, margin + 4, yPos + 13);
    doc.text(`Ilgili: ${ilgiliKisi}`, margin + 90, yPos + 13);
    doc.text(`Tel: ${tel}`, margin + 4, yPos + 19);
    doc.text(`E-posta: ${email}`, margin + 90, yPos + 19);
    doc.text(`Konu: ${konu}`, margin + 4, yPos + 25);

    // Intro Text
    yPos = 100;
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(`Sayin ${ilgiliKisi},`, margin, yPos);
    doc.text("Asagida talebiniz dogrultusunda hazirlanan fiyat teklifimizi bilgilerinize sunariz.", margin, yPos + 6);
    doc.text("Iyi calismalar dileriz. Saygilarimizla,", margin, yPos + 12);
    doc.setFont(fontName, "bold");
    doc.text("Hayrettin DAYAN", margin, yPos + 18);

    // Product Table
    yPos = 125;
    const tableBody = products.map((p, idx) => [
      (idx + 1).toString(),
      p.kod,
      p.cins,
      p.malzeme,
      p.miktar.toString(),
      p.birim,
      formatCurrency(p.birimFiyat, p.doviz),
      formatCurrency(calculateRowTotal(p), p.doviz)
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        font: fontName,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [13, 59, 102], 
        textColor: 255, 
        fontStyle: 'bold', 
        font: fontName,
        halign: 'center'
      },
      bodyStyles: { font: fontName },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      head: [['#', 'Kod', 'Urun/Hizmet', 'Malzeme', 'Miktar', 'Birim', 'Birim Fiyat', 'Toplam']],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 45 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' }
      }
    });

    // Totals Box
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(pageWidth - 75, finalY, 60, 32, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont(fontName, "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Ara Toplam:", pageWidth - 72, finalY + 8);
    doc.text(formatCurrency(calculateSubtotal()), pageWidth - 18, finalY + 8, { align: "right" });
    
    doc.text("KDV (%20):", pageWidth - 72, finalY + 16);
    doc.text(formatCurrency(calculateKDV()), pageWidth - 18, finalY + 16, { align: "right" });
    
    doc.setFillColor(13, 59, 102);
    doc.roundedRect(pageWidth - 75, finalY + 20, 60, 10, 0, 0, 'F');
    doc.setFont(fontName, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GENEL TOPLAM:", pageWidth - 72, finalY + 27);
    doc.text(formatCurrency(calculateTotal()), pageWidth - 18, finalY + 27, { align: "right" });

    // Footer Fields
    let footerY = finalY + 45;
    doc.setFontSize(8);
    doc.setFont(fontName, "normal");
    doc.setTextColor(60, 60, 60);

    const footerFields = [
      { label: 'Notlar', value: notlar },
      { label: 'Opsiyon', value: opsiyon },
      { label: 'Teslim Suresi', value: teslimSuresi },
      { label: 'Odeme Sekli', value: odemeSekli },
      { label: 'Teslim Yeri', value: teslimYeri }
    ];

    footerFields.forEach(field => {
      if (field.value) {
        doc.setFont(fontName, "bold");
        doc.setTextColor(13, 59, 102);
        doc.text(field.label + ":", margin, footerY);
        doc.setFont(fontName, "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(field.value, margin + 35, footerY);
        footerY += 6;
      }
    });

    // Signature Section
    footerY = Math.max(footerY + 10, pageHeight - 50);
    
    const signBoxWidth = 50;
    const signBoxHeight = 22;
    const gap = 15;
    const startX = margin;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    // Box 1
    doc.roundedRect(startX, footerY, signBoxWidth, signBoxHeight, 2, 2);
    doc.setFontSize(7);
    doc.setFont(fontName, "bold");
    doc.setTextColor(13, 59, 102);
    doc.text("SIPARIS ONAYI", startX + signBoxWidth/2, footerY + 5, { align: "center" });
    doc.setFont(fontName, "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Kase - Imza", startX + signBoxWidth/2, footerY + signBoxHeight - 4, { align: "center" });

    // Box 2
    doc.roundedRect(startX + signBoxWidth + gap, footerY, signBoxWidth, signBoxHeight, 2, 2);
    doc.setFont(fontName, "bold");
    doc.setTextColor(13, 59, 102);
    doc.text("TEDARIKCI ONAYI", startX + signBoxWidth + gap + signBoxWidth/2, footerY + 5, { align: "center" });
    doc.setFont(fontName, "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Kase - Imza", startX + signBoxWidth + gap + signBoxWidth/2, footerY + signBoxHeight - 4, { align: "center" });

    // Box 3
    doc.roundedRect(startX + (signBoxWidth + gap) * 2, footerY, signBoxWidth, signBoxHeight, 2, 2);
    doc.setFont(fontName, "bold");
    doc.setTextColor(13, 59, 102);
    doc.text("ONAY TARIHI", startX + (signBoxWidth + gap) * 2 + signBoxWidth/2, footerY + 5, { align: "center" });

    // Footer line
    doc.setDrawColor(13, 59, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("DAYAN DISLI SANAYI | www.dayandisli.com | info@dayandisli.com", pageWidth / 2, pageHeight - 10, { align: "center" });

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

  // WhatsApp Share Function
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
      // Generate PDF
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

      // Create message text
      const message = encodeURIComponent(
        `Sayın ${formatName(ilgiliKisi)},\n\n` +
        `*${teklifNo}* numaralı fiyat teklifimiz hazırlanmıştır.\n\n` +
        `📋 *Firma:* ${firma}\n` +
        `💰 *Toplam:* ${formatCurrency(calculateTotal())}\n\n` +
        `Detaylı teklif PDF'i için lütfen e-posta adresinizi paylaşın veya bizimle iletişime geçin.\n\n` +
        `DAYAN DİŞLİ SANAYİ\n` +
        `📞 +90 536 583 74 20\n` +
        `📧 info@dayandisli.com\n` +
        `🌐 dayandisli.com`
      );

      // WhatsApp URL with pre-filled message
      const whatsappUrl = tel 
        ? `https://api.whatsapp.com/send?phone=${tel.replace(/\D/g, '')}&text=${message}`
        : `https://api.whatsapp.com/send?text=${message}`;

      window.open(whatsappUrl, '_blank');

      toast({
        title: "WhatsApp Açıldı",
        description: "Mesaj WhatsApp'ta hazırlandı.",
      });

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
              <Button 
                size="sm" 
                onClick={addRow}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Satır Ekle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">#</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Kod</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Ürün/Hizmet</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Malzeme</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Miktar</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Birim</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Birim Fiyat</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-slate-300">Döviz</th>
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
                      <Select
                        value={product.doviz}
                        onValueChange={(v) => {
                          setProductChanged(true);
                          updateProduct(product.id, "doviz", v);
                        }}
                      >
                        <SelectTrigger className="h-9 w-24 bg-slate-900 border-slate-600 text-white">
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
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-emerald-400 font-mono">
                        {formatCurrency(calculateRowTotal(product), product.doviz)}
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
                  <span className="text-white font-mono">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between py-3 px-4 border-b border-slate-700">
                  <span className="text-slate-400">KDV (%20):</span>
                  <span className="text-white font-mono">{formatCurrency(calculateKDV())}</span>
                </div>
                <div className="flex justify-between py-3 px-4 bg-blue-600">
                  <span className="font-bold text-white">Genel Toplam:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(calculateTotal())}</span>
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
            disabled={!productChanged || isGenerating}
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
                E-posta Gönder
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
