import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFont } from "@/lib/pdfFonts";
import { QuotationFormData, ProductRow } from "../types";
import { formatName } from "./useQuotationForm";


export function useQuotationPDF() {
  const { toast } = useToast();
  
  // PDF generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [fontBase64, setFontBase64] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

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

  // Enhanced PDF Design
  const createPDF = (
    teklifNo: string,
    formData: QuotationFormData,
    calculateRowTotal: (row: ProductRow) => number,
    calculateSubtotal: () => number,
    calculateKDV: () => number,
    calculateTotal: () => number,
    formatCurrencyFn: (amount: number, currency?: string) => string
  ): jsPDF => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;
    const primaryColor = [0, 51, 102]; // DAYAN Mavi
    const tableHead = [235, 245, 255]; // Açık Mavi
    const today = new Date().toLocaleDateString("tr-TR");

    // === Embed Font ===
    if (fontBase64) {
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
      doc.setFont("Roboto");
    }
    doc.setFontSize(10);

    const drawHeader = () => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 30, "F");
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", marginX, 6, 40, 18);
        } catch (e) {
          console.error('Failed to add logo to PDF:', e);
        }
      }
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("Roboto", "bold");
      doc.text("TEKLİF", pageWidth - marginX, 18, { align: "right" });
    };

    const drawFooter = () => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFont("Roboto", "normal");
      doc.text(
        "İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul | Tel: +90 536 583 74 20 | Email: info@dayandisli.com | Web: www.dayandisli.com",
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      const pageNo = (doc as any).internal.pages.length;
      doc.text(`Sayfa ${pageNo}`, pageWidth - marginX, pageHeight - 4, { align: "right" });
    };

    // İlk sayfada çiz
    drawHeader();
    drawFooter();

    // SATIŞCI & ALICI Kartları
    let y = 40;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    doc.text("SATICI BİLGİLERİ", marginX, y);
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    y += 5;
    doc.text("DAYAN DİŞLİ & PROFİL TAŞLAMA", marginX, y);
    y += 5;
    doc.text("İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul", marginX, y);
    y += 5;
    doc.text("Tel: +90 536 583 74 20", marginX, y);
    y += 5;
    doc.text("Email: info@dayandisli.com", marginX, y);

    const rightX = pageWidth / 2;
    y = 40;
    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    doc.text("ALICI BİLGİLERİ", rightX, y);
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    y += 5;
    doc.text(formData.firma || "-", rightX, y);
    y += 5;
    doc.text(formData.ilgiliKisi || "-", rightX, y);
    y += 5;
    doc.text(formData.tel || "-", rightX, y);
    y += 5;
    doc.text(formData.email || "-", rightX, y);
    y += 5;
    doc.text(formData.teslimYeri || "-", rightX, y);

    y += 12;
    doc.setFontSize(10);
    doc.text(`Teklif No: ${teklifNo}`, marginX, y);
    y += 6;
    doc.text(`Tarih: ${today}`, marginX, y);

    // Ürün Tablosu
    const tableData = formData.products.map((p: ProductRow, i: number) => [
      (i + 1).toString(),
      p.kod || "-",
      p.cins || "-",
      p.malzeme,
      p.miktar.toString(),
      p.birim,
      formatCurrencyFn(p.birimFiyat, formData.activeCurrency),
      "%20",
      formatCurrencyFn(calculateRowTotal(p), formData.activeCurrency)
    ]);

    autoTable(doc, {
      startY: y + 10,
      theme: "grid",
      headStyles: {
        fillColor: [tableHead[0], tableHead[1], tableHead[2]] as [number, number, number],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        font: "Roboto"
      },
      styles: {
        font: "Roboto",
        fontSize: 8
      },
      head: [["#", "Kod", "Ürün", "Malzeme", "Miktar", "Birim", "Birim Fiyat", "KDV", "Toplam"]],
      body: tableData,
      margin: { left: marginX, right: marginX },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // TOPLAM ALANI
    const labelX = pageWidth - 50;
    const valX = pageWidth - marginX;
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    doc.text("Ara Toplam:", labelX, finalY);
    doc.text(formatCurrencyFn(calculateSubtotal(), formData.activeCurrency), valX, finalY, { align: "right" });
    doc.text("KDV (%20):", labelX, finalY + 6);
    doc.text(formatCurrencyFn(calculateKDV(), formData.activeCurrency), valX, finalY + 6, { align: "right" });
    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    doc.text("Genel Toplam:", labelX, finalY + 12);
    doc.text(formatCurrencyFn(calculateTotal(), formData.activeCurrency), valX, finalY + 12, { align: "right" });

    return doc;
  };

  // PDF Download Handler
  const generatePDF = async (
    teklifNo: string,
    formData: QuotationFormData,
    calculateRowTotal: (row: ProductRow) => number,
    calculateSubtotal: () => number,
    calculateKDV: () => number,
    calculateTotal: () => number,
    formatCurrencyFn: (amount: number, currency?: string) => string
  ) => {
    if (!formData.firma || !formData.ilgiliKisi) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen firma ve ilgili kişi bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const doc = createPDF(teklifNo, formData, calculateRowTotal, calculateSubtotal, calculateKDV, calculateTotal, formatCurrencyFn);
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

  // Create PDF Preview
  const createPDFPreview = async (
    teklifNo: string,
    formData: QuotationFormData,
    calculateRowTotal: (row: ProductRow) => number,
    calculateSubtotal: () => number,
    calculateKDV: () => number,
    calculateTotal: () => number,
    formatCurrencyFn: (amount: number, currency?: string) => string
  ): Promise<Blob> => {
    setIsGenerating(true);

    try {
      const doc = createPDF(teklifNo, formData, calculateRowTotal, calculateSubtotal, calculateKDV, calculateTotal, formatCurrencyFn);
      const pdfOutput = doc.output("blob");
      setPdfBlob(pdfOutput);

      const previewUrl = URL.createObjectURL(pdfOutput);
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(previewUrl);

      return pdfOutput;
    } catch (error) {
      console.error(error);
      toast({
        title: "Hata",
        description: "Önizleme oluşturulamadı!",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Send Email Handler
  const sendEmail = async (
    teklifNo: string,
    formData: QuotationFormData,
    pdfBlob: Blob,
    calculateRowTotal: (row: ProductRow) => number,
    calculateSubtotal: () => number,
    calculateKDV: () => number,
    calculateTotal: () => number,
    formatCurrencyFn: (amount: number, currency?: string) => string
  ) => {
    if (!pdfBlob || !teklifNo) {
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
 
  <p><strong>Sayın ${formatName(formData.ilgiliKisi)},</strong></p><br/>

  <p>Tarafınıza hazırlanan fiyat teklifimiz ekte bilginize sunulmuştur.</p>

  <p><strong>Teklif No:</strong> <strong>${teklifNo}</strong></p><br/>

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
          to: formData.email,
          bcc: 'bediz@dayandisli.com',
          subject: `${teklifNo} No'lu Fiyat Teklifi`,
          html: emailHtml,
          firma: formData.firma,
          ilgiliKisi: formatName(formData.ilgiliKisi),
          tel: formData.tel,
          konu: formData.konu,

          products: formData.products.map(p => ({
            kod: p.kod,
            cins: p.cins,
            malzeme: p.malzeme,
            miktar: p.miktar,
            birim: p.birim,
            birimFiyat: formatCurrencyFn(p.birimFiyat, formData.activeCurrency),
            toplam: formatCurrencyFn(calculateRowTotal(p), formData.activeCurrency)
          })),

          araToplam: formatCurrencyFn(calculateSubtotal(), formData.activeCurrency),
          kdv: formatCurrencyFn(calculateKDV(), formData.activeCurrency),
          genelToplam: formatCurrencyFn(calculateTotal(), formData.activeCurrency),
          notlar: formData.notlar,
          opsiyon: formData.opsiyon,
          teslimSuresi: formData.teslimSuresi,
          odemeSekli: formData.odemeSekli,
          teslimYeri: formData.teslimYeri,
          teklifNo: teklifNo,
          pdfBase64,
          pdfFileName: `${teklifNo}.pdf`
        }
      });

      if (error) throw error;

      toast({
        title: "E-posta Gönderildi",
        description: `Teklif ${formData.email} adresine başarıyla gönderildi.`,
      });

    } catch (error) {
      console.error("Email send error:", error);
      toast({
        title: "Hata",
        description: "E-posta gönderilemedi.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp Share Handler
  const shareWhatsApp = async (
    teklifNo: string,
    formData: QuotationFormData,
    pdfBlob: Blob,
    calculateTotal: () => number,
    formatCurrencyFn: (amount: number, currency?: string) => string
  ) => {
    if (!pdfBlob || !teklifNo) {
      toast({
        title: "Hata",
        description: "PDF hazır değil!",
        variant: "destructive"
      });
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      const pdfFile = new File([pdfBlob], `${teklifNo}.pdf`, { type: "application/pdf" });

      const messageText = `Merhaba, fiyat teklifleri ekte yer almaktadır:

📋 *Teklif No:* ${teklifNo}
🏢 *Firma:* ${formData.firma}
👤 *İlgili:* ${formatName(formData.ilgiliKisi)}
💰 *Toplam:* ${formatCurrencyFn(calculateTotal(), formData.activeCurrency)}

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
            description: "PDF başarıyla paylaşıldı.",
          });
        } catch (shareError) {
          if ((shareError as Error).name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
        // Fallback: Open WhatsApp Web with message only
        const fallbackMessage = encodeURIComponent(
          `Merhaba, fiyat teklifleri ekte yer almaktadır:\n\n` +
          `📋 Teklif No: ${teklifNo}\n` +
          `🏢 Firma: ${formData.firma}\n` +
          `👤 İlgili: ${formatName(formData.ilgiliKisi)}\n` +
          `💰 Toplam: ${formatCurrencyFn(calculateTotal(), formData.activeCurrency)}\n\n` +
          `PDF dosyasını e-posta ile gönderebiliriz.\n\n` +
          `DAYAN DİŞLİ SANAYİ\n` +
          `📞 +90 536 583 74 20\n` +
          `📧 info@dayandisli.com`
        );

        const whatsappUrl = formData.tel 
          ? `https://api.whatsapp.com/send?phone=${formData.tel.replace(/\D/g, '')}&text=${fallbackMessage}`
          : `https://api.whatsapp.com/send?text=${fallbackMessage}`;

        window.open(whatsappUrl, '_blank');

        // Download PDF for manual attachment
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfBlob);
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
      throw error;
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return {
    // PDF state
    pdfBlob,
    pdfPreviewUrl,
    isGenerating,
    isSendingEmail,
    isSendingWhatsApp,
    
    // Actions
    generatePDF,
    createPDFPreview,
    sendEmail,
    shareWhatsApp,
  };
}

