import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadRobotoFont } from "@/lib/pdfFonts";
import { QuotationFormData, ProductRow } from "../types";

// Load assets (font and logo) for PDF generation
async function loadPDFAssets(): Promise<{ fontBase64: string; logoBase64: string }> {
  const font = await loadRobotoFont();
  let logoBase64 = "";

  try {
    const logoResponse = await fetch('/logo-header.png');
    const logoBlob = await logoResponse.blob();
    const reader = new FileReader();
    logoBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(logoBlob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  return { fontBase64: font || "", logoBase64 };
}

// Enhanced PDF Design
export async function createQuotationPDF(
  teklifNo: string,
  formData: QuotationFormData,
  calculateRowTotal: (row: ProductRow) => number,
  calculateSubtotal: () => number,
  calculateKDV: () => number,
  calculateTotal: () => number,
  formatCurrencyFn: (amount: number, currency?: string) => string
): Promise<jsPDF> {
  // Load assets
  const { fontBase64, logoBase64 } = await loadPDFAssets();

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
}

