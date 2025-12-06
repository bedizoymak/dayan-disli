import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFont } from "@/lib/pdfFonts";
import { QuotationFormData, ProductRow } from "../types";
import { formatName } from "./useQuotationForm";

const formatDate = (date: Date) => date.toLocaleDateString('tr-TR');

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
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const today = formatDate(new Date());
    
    const { firma, ilgiliKisi, tel, email, konu, products, activeCurrency, notlar, opsiyon, teslimSuresi, odemeSekli, teslimYeri } = formData;
    
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
      formatCurrencyFn(p.birimFiyat, activeCurrency),
      "%20",
      formatCurrencyFn(calculateRowTotal(p), activeCurrency)
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
      { label: "ARA TOPLAM", value: formatCurrencyFn(calculateSubtotal(), activeCurrency), bold: false },
      { label: "BRUT TOPLAM", value: formatCurrencyFn(calculateSubtotal(), activeCurrency), bold: false },
      { label: "TOPLAM K.D.V (%20)", value: formatCurrencyFn(calculateKDV(), activeCurrency), bold: false },
      { label: "GENEL TOPLAM", value: formatCurrencyFn(calculateTotal(), activeCurrency), bold: true },
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

