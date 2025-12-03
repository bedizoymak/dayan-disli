import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, FileDown, Loader2, Mail, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFont } from "@/lib/pdfFonts";
import { incrementCounter } from "@/lib/supabaseCounter";

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
}

const MALZEME_OPTIONS = ["C45", "8620", "4140", "16MnCr5", "20MnCr5", "Bronz", "Özel"];
const BIRIM_OPTIONS = ["Adet", "Kg", "Metre", "Set"];

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
    { id: 1, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0 }
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
      // Load Roboto font
      const font = await loadRobotoFont();
      if (font) {
        setFontBase64(font);
      }
      
      // Load logo as base64
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
    setProducts([...products, { id: newId, kod: "", cins: "", malzeme: "C45", miktar: 1, birim: "Adet", birimFiyat: 0 }]);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
  };

  const createPDF = (teklifNo: string): jsPDF => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
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
    
    // Add Logo (top-left)
    const logoStartY = 10;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, logoStartY, 45, 20);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
      }
    }
    
    // Header - Company Info (below logo or at top if no logo)
    const companyInfoStartY = logoBase64 ? logoStartY + 22 : 15;
    
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(fontName, "normal");
    doc.text("Ikitelli O.S.B. Cevre Sanayi Sitesi,", margin, companyInfoStartY);
    doc.text("8. Blok No: 45/47 Basaksehir / Istanbul, 34490", margin, companyInfoStartY + 4);
    doc.text("Tel: +90 536 583 74 20", margin, companyInfoStartY + 8);
    doc.text("E-mail: info@dayandisli.com", margin, companyInfoStartY + 12);
    doc.text("Web: https://dayandisli.com", margin, companyInfoStartY + 16);

    // Header - Document Info Table (Right)
    autoTable(doc, {
      startY: 10,
      margin: { left: pageWidth - 75 },
      tableWidth: 60,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, font: fontName },
      headStyles: { fillColor: [13, 59, 102], textColor: 255, font: fontName },
      bodyStyles: { font: fontName },
      body: [
        ['Teklif Tarihi', today],
        ['Teklif No', teklifNo],
        ['Dokuman No', 'D 0060-1'],
        ['Rev No / Tarih', '01 / ' + today],
        ['Sayfa No', '1/1']
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { cellWidth: 35 }
      }
    });

    // Customer Info Block
    let yPos = companyInfoStartY + 25;
    doc.setDrawColor(13, 59, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(13, 59, 102);
    doc.setFont(fontName, "bold");
    doc.text("MUSTERI BILGILERI", margin, yPos);
    
    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(fontName, "normal");
    doc.text("Firma: " + firma, margin, yPos);
    doc.text("Ilgili: " + ilgiliKisi, margin + 80, yPos);
    yPos += 5;
    doc.text("Tel: " + tel, margin, yPos);
    doc.text("E-posta: " + email, margin + 80, yPos);
    yPos += 5;
    doc.text("Konu: " + konu, margin, yPos);
    doc.text("Hazirlayan: Hayrettin Dayan", margin + 80, yPos);

    // Intro Text
    yPos += 12;
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text("Sayin " + ilgiliKisi + ",", margin, yPos);
    yPos += 6;
    doc.text("Asagida talebiniz ve istenen sartlari tanimlanmis urunlerin/hizmetlerin siparis teklif formudur.", margin, yPos);
    yPos += 5;
    doc.text("Iyi calismalar dileriz.", margin, yPos);
    yPos += 5;
    doc.text("Saygilarimizla,", margin, yPos);
    yPos += 5;
    doc.setFont(fontName, "bold");
    doc.text("Hayrettin DAYAN", margin, yPos);

    // Product Table
    yPos += 10;
    const tableBody = products.map((p, idx) => [
      (idx + 1).toString(),
      p.kod,
      p.cins,
      p.malzeme,
      p.miktar.toString(),
      p.birim,
      formatCurrency(p.birimFiyat),
      formatCurrency(calculateRowTotal(p))
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: fontName },
      headStyles: { fillColor: [13, 59, 102], textColor: 255, fontStyle: 'bold', font: fontName },
      bodyStyles: { font: fontName },
      head: [['NO', 'Urun/Hizmet Kod', 'Urun/Hizmet Cinsi', 'Malzeme', 'Miktar', 'Birim', 'Birim Fiyat', 'Toplam Fiyat']],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' }
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    autoTable(doc, {
      startY: finalY,
      margin: { left: pageWidth - 75 },
      tableWidth: 60,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: fontName },
      bodyStyles: { font: fontName },
      body: [
        [{ content: 'TOPLAM FIYAT', styles: { fontStyle: 'bold' } }, formatCurrency(calculateSubtotal())],
        [{ content: 'KDV %20', styles: { fontStyle: 'bold' } }, formatCurrency(calculateKDV())],
        [{ content: 'GENEL TOPLAM', styles: { fontStyle: 'bold', fillColor: [13, 59, 102], textColor: 255 } }, 
         { content: formatCurrency(calculateTotal()), styles: { fillColor: [13, 59, 102], textColor: 255, fontStyle: 'bold' } }]
      ],
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30, halign: 'right' }
      }
    });

    // Footer Fields
    let footerY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont(fontName, "normal");
    doc.setTextColor(40, 40, 40);

    const footerFields = [
      { label: 'Notlar', value: notlar },
      { label: 'Opsiyon', value: opsiyon },
      { label: 'Ongorulen Teslim Suresi', value: teslimSuresi },
      { label: 'Odeme Sekli', value: odemeSekli },
      { label: 'Teslim Yeri', value: teslimYeri }
    ];

    footerFields.forEach(field => {
      if (field.value) {
        doc.setFont(fontName, "bold");
        doc.text(field.label + ":", margin, footerY);
        doc.setFont(fontName, "normal");
        doc.text(field.value, margin + 45, footerY);
        footerY += 6;
      }
    });

    // Signature Section
    footerY += 10;
    doc.setDrawColor(13, 59, 102);
    doc.setLineWidth(0.3);
    
    const signBoxWidth = 55;
    const signBoxHeight = 25;
    const gap = 10;
    const startX = margin;

    // Box 1: Siparis Onayi
    doc.rect(startX, footerY, signBoxWidth, signBoxHeight);
    doc.setFontSize(7);
    doc.setFont(fontName, "bold");
    doc.text("SIPARIS ONAYI", startX + 2, footerY + 4);
    doc.setFont(fontName, "normal");
    doc.text("KASE - IMZA", startX + 2, footerY + signBoxHeight - 3);

    // Box 2: Tedarikci Onayi
    doc.rect(startX + signBoxWidth + gap, footerY, signBoxWidth, signBoxHeight);
    doc.setFont(fontName, "bold");
    doc.text("TEDARIKCI ONAYI", startX + signBoxWidth + gap + 2, footerY + 4);
    doc.setFont(fontName, "normal");
    doc.text("KASE - IMZA", startX + signBoxWidth + gap + 2, footerY + signBoxHeight - 3);

    // Box 3: Onay Tarihi
    doc.rect(startX + (signBoxWidth + gap) * 2, footerY, signBoxWidth, signBoxHeight);
    doc.setFont(fontName, "bold");
    doc.text("ONAY TARIHI", startX + (signBoxWidth + gap) * 2 + 2, footerY + 4);

    return doc;
  };

  const generatePDF = async () => {
    if (!firma || !ilgiliKisi) {
      toast({
        title: "Eksik Bilgi",
        description: "Lutfen firma ve ilgili kisi bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

try {
  // 🟦 Sayaç artır — TEKLİF NUMARASI AL
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

  // Sayaç → 3 haneli format (001, 002, 003…)
const formattedCounter = String(data).padStart(3, "0");

// Yıl + Ay → yyyymm formatı
const now = new Date();
const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

// Final Teklif No (UI + PDF + E-posta)
const teklifNo = `TR-DAYAN-${yearMonth}${formattedCounter}`;
setCurrentTeklifNo(teklifNo);


  // 🟦 PDF oluştur
  const doc = createPDF(teklifNo);

  // 🟦 PDF indir
  doc.save(teklifNo + ".pdf");

  toast({
    title: "PDF Oluşturuldu",
    description: `${teklifNo} başarıyla indirildi.`,
  });

} catch (e) {
  console.error("PDF generation error:", e);

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
    // Sayaç değerini al (ARTIRMADAN)
    const { data: counterData, error: counterError } = await supabase
      .from("counter")
      .select("value")
      .eq("id", 1)
      .single();

    if (counterError || !counterData) {
      throw new Error("Sayaç bilgisi alınamadı");
    }

    const currentCounter = counterData.value;
    const yil = new Date().getFullYear();
    const ay = String(new Date().getMonth() + 1).padStart(2, "0");
    const sayi = String(currentCounter).padStart(3, "0");

    const teklifNo = `TR-DAYAN-${yil}${ay}${sayi}`;
    setCurrentTeklifNo(teklifNo);

    // PDF üret
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
    // PDF → Base64
    const reader = new FileReader();
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    // 🔥 Kurumsal HTML Mail İçeriği
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


    // Supabase Edge Function çağrısı
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
          subject: `${currentTeklifNo}'lu Fiyat Teklifimiz`,
          html: emailHtml,
          fileBase64: pdfBase64,
          fileName: `${currentTeklifNo}.pdf`,
        }),
        body: JSON.stringify({
  to: email,
  from: "info@dayandisli.com",
  subject: emailSubject,
  html: emailHtml,
  fileBase64: pdfBase64,
  fileName: `${currentTeklifNo}.pdf`
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

    // Modal kapat
    setShowEmailModal(false);
    setPdfPreviewUrl("");
    setPdfBlob(null);
    setCurrentTeklifNo("");

  } catch (err: any) {
    console.error("Email sending error:", err);
    toast({
      title: "Hata",
      description: `E-posta gönderilemedi: ${err.message || "Bilinmeyen hata"}`,
      variant: "destructive",
    });
  } finally {
    setIsSendingEmail(false);
  }
};



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0D3B66] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <img 
              src="https://dayandisli.com/logo.png" 
              alt="Dayan Dişli" 
              className="h-12 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-2xl font-bold">DAYAN DİŞLİ SANAYİ</h1>
              <p className="text-sm opacity-80">Teklif Formu Oluşturucu</p>
            </div>
          </div>
        </div>
      </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
        {currentTeklifNo && (
          <div className="mb-4 text-xl font-bold text-primary border-l-4 border-primary pl-3">
            Teklif No: {currentTeklifNo}
          </div>
        )}

        
        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader className="bg-[#0D3B66] text-white rounded-t-lg">
            <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firma">Firma *</Label>
                <Input id="firma" value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="Firma adı" />
              </div>
              <div>
                <Label htmlFor="ilgili">İlgili Kişi *</Label>
                <Input id="ilgili" value={ilgiliKisi} onChange={(e) => setIlgiliKisi(e.target.value)} placeholder="Ad Soyad" />
              </div>
              <div>
                <Label htmlFor="tel">Telefon</Label>
                <Input id="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+90 XXX XXX XX XX" />
              </div>
              <div>
                <Label htmlFor="email">E-posta *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@firma.com" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="konu">Konu</Label>
                <Input id="konu" value={konu} onChange={(e) => setKonu(e.target.value)} placeholder="Teklif konusu" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Table */}
        <Card className="mb-6">
          <CardHeader className="bg-[#0D3B66] text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Ürün / Hizmet Tablosu</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={addRow}
                className="bg-white text-[#0D3B66] hover:bg-gray-100"
              >
                <Plus className="w-4 h-4 mr-1" /> Satır Ekle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-[#0D3B66]">
                  <th className="text-left py-2 px-2 text-sm font-semibold">NO</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Ürün/Hizmet Kod</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Ürün/Hizmet Cinsi</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Malzeme</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Miktar</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Birim</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Birim Fiyat (₺)</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Toplam (₺)</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-center font-medium">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <Input 
                        value={product.kod} 
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'kod', e.target.value);
                        }}
                        placeholder="Kod"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input 
                        value={product.cins} 
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'cins', e.target.value);
                        }}
                        placeholder="Açıklama"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Select value={product.malzeme} onValueChange={(v) => {
                        setProductChanged(true);
                        updateProduct(product.id, 'malzeme', v);
                      }}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MALZEME_OPTIONS.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2">
                      <Input 
                        type="number" 
                        min="1"
                        value={product.miktar} 
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'miktar', parseInt(e.target.value) || 0);
                        }}
                        className="h-9 w-20"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Select value={product.birim} onValueChange={(v) => {
                        setProductChanged(true);
                        updateProduct(product.id, 'birim', v);
                        }}>
                        <SelectTrigger className="h-9 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BIRIM_OPTIONS.map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2">
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={product.birimFiyat} 
                        onChange={(e) => {
                          setProductChanged(true);
                          updateProduct(product.id, 'birimFiyat', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="py-2 px-2 font-semibold text-[#0D3B66]">
                      {formatCurrency(calculateRowTotal(product))}
                    </td>
                    <td className="py-2 px-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeRow(product.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
              <div className="w-64 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Toplam Fiyat:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">KDV (%20):</span>
                  <span>{formatCurrency(calculateKDV())}</span>
                </div>
                <div className="flex justify-between py-2 bg-[#0D3B66] text-white px-3 rounded">
                  <span className="font-bold">Genel Toplam:</span>
                  <span className="font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Fields */}
        <Card className="mb-6">
          <CardHeader className="bg-[#0D3B66] text-white rounded-t-lg">
            <CardTitle className="text-lg">Ek Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="notlar">Notlar</Label>
                <Textarea 
                  id="notlar" 
                  value={notlar} 
                  onChange={(e) => setNotlar(e.target.value)} 
                  placeholder="Ek notlar..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="opsiyon">Opsiyon</Label>
                <Input id="opsiyon" value={opsiyon} onChange={(e) => setOpsiyon(e.target.value)} placeholder="Opsiyon süresi" />
              </div>
              <div>
                <Label htmlFor="teslimSuresi">Öngörülen Teslim Süresi</Label>
                <Input id="teslimSuresi" value={teslimSuresi} onChange={(e) => setTeslimSuresi(e.target.value)} placeholder="Örn: 15 iş günü" />
              </div>
              <div>
                <Label htmlFor="odemeSekli">Ödeme Şekli</Label>
                <Input id="odemeSekli" value={odemeSekli} onChange={(e) => setOdemeSekli(e.target.value)} placeholder="Örn: %50 peşin, %50 teslimde" />
              </div>
              <div>
                <Label htmlFor="teslimYeri">Teslim Yeri</Label>
                <Input id="teslimYeri" value={teslimYeri} onChange={(e) => setTeslimYeri(e.target.value)} placeholder="Teslim adresi" />
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
            className="bg-[#0D3B66] hover:bg-[#0a2d4f] text-white px-8 py-6 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                PDF Olusturuluyor...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5 mr-2" />
                PDF Olustur
              </>
            )}
          </Button>
          
          <Button 
            size="lg" 
            onClick={handleEmailPreview}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Hazirlaniyor...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                PDF'i Mail At
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D3B66] text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            DAYAN DİŞLİ SANAYİ | İkitelli O.S.B. Çevre Sanayi Sitesi, 8. Blok No: 45/47 Başakşehir / İstanbul
          </p>
          <p className="text-sm opacity-80 mt-1">
            Tel: +90 536 583 74 20 | E-mail: info@dayandisli.com | Web: dayandisli.com
          </p>
        </div>
      </footer>

      {/* Email Preview Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              PDF On Izleme - {currentTeklifNo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 my-4">
            {pdfPreviewUrl && (
              <iframe 
                src={pdfPreviewUrl} 
                className="w-full h-[500px] border rounded-lg"
                title="PDF Preview"
              />
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              <strong>Alici:</strong> {email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>CC:</strong> bediz@dayandisli.com
            </p>
            <p className="text-sm text-gray-600">
              <strong>Konu:</strong> {currentTeklifNo}'lu Fiyat Teklifimiz
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(false)}
              disabled={isSendingEmail}
            >
              <X className="w-4 h-4 mr-2" />
              Iptal
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gonderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gonder
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
