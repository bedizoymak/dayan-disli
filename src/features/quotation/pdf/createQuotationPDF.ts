import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fontRobotoRegular, fontRobotoBold } from "@/lib/pdfAssets/font-roboto";
import { logoBase64 } from "@/lib/pdfAssets/logo-dayan";
import { QuotationFormData, ProductRow } from "../types";

export const createQuotationPDF = (
  teklifNo: string,
  formData: QuotationFormData,
  calculateRowTotal: (row: ProductRow) => number,
  calculateSubtotal: () => number,
  calculateKDV: () => number,
  calculateTotal: () => number,
  formatCurrencyFn: (amount: number, currency?: string) => string
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const primaryColor: [number, number, number] = [0, 51, 102];
  const tableHead: [number, number, number] = [235, 245, 255];

  const today = new Date().toLocaleDateString("tr-TR");

  // Font yükle
  doc.addFileToVFS("Roboto-Regular.ttf", fontRobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

  doc.addFileToVFS("Roboto-Bold.ttf", fontRobotoBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  doc.setFont("Roboto", "normal");

  const drawHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 22, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", marginX, 4, 30, 14);
    }

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Roboto", "bold");
    doc.text("TEKLİF", pageWidth - marginX, 10, { align: "right" });

    doc.setFontSize(9);
    doc.text(`Teklif No: ${teklifNo}`, pageWidth - marginX, 16, { align: "right" });
    doc.text(`Tarih: ${today}`, pageWidth - marginX, 20, { align: "right" });
  };

  const drawFooter = () => {
    const pageInfo = doc.getCurrentPageInfo();
    const pageNumber = pageInfo.pageNumber;

    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.setFont("Roboto", "normal");
    doc.text(
      "İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul | Tel: +90 536 583 74 20 | Email: info@dayandisli.com | Web: www.dayandisli.com",
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );

    doc.text(`Sayfa ${pageNumber}`, pageWidth - marginX, pageHeight - 5, { align: "right" });
  };

  // ******** HEADER ********
  drawHeader();

  let y = 30;
  doc.setTextColor(60, 60, 60);

  // SATICI & ALICI KARTLARI
  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.text("SATICI BİLGİLERİ", marginX, y);
  doc.setFont("Roboto", "normal");
  y += 5;
  doc.text("DAYAN DİŞLİ & PROFİL TAŞLAMA", marginX, y);
  y += 5;
  doc.text("İkitelli O.S.B. İstanbul", marginX, y);
  y += 5;
  doc.text("Tel: +90 536 583 74 20", marginX, y);
  y += 5;
  doc.text("Email: info@dayandisli.com", marginX, y);

  const rightX = pageWidth / 2;
  y = 30;
  doc.setFont("Roboto", "bold");
  doc.text("ALICI BİLGİLERİ", rightX, y);
  doc.setFont("Roboto", "normal");
  y += 5;
  doc.text(formData.firma, rightX, y);
  y += 5;
  doc.text(formData.ilgiliKisi, rightX, y);
  y += 5;
  doc.text(formData.tel, rightX, y);
  y += 5;
  doc.text(formData.email, rightX, y);

  y += 15;
  doc.setFontSize(10);
  doc.text("Aşağıda belirtilen ürün ve hizmetler için hazırlanan teklif:", marginX, y);

  // ******** ÜRÜN TABLOSU ********
  const tableData = formData.products.map((p: ProductRow, i) => [
    i + 1,
    p.kod,
    p.cins,
    p.malzeme,
    p.miktar.toString(),
    p.birim,
    formatCurrencyFn(p.birimFiyat, formData.activeCurrency),
    "%20",
    formatCurrencyFn(calculateRowTotal(p), formData.activeCurrency)
  ]);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    head: [["No", "Kod", "Ürün", "Malz.", "Miktar", "Birim", "Birim Fiyat", "KDV", "Toplam"]],
    body: tableData,
    headStyles: { fillColor: tableHead, textColor: [50, 50, 50], fontStyle: "bold" },
    styles: { font: "Roboto", fontSize: 8 },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // ******** TOPLAMLAR ********
  const labelX = pageWidth - 60;
  const valueX = pageWidth - marginX;

  doc.setFontSize(9);
  doc.text("Ara Toplam:", labelX, finalY);
  doc.text(formatCurrencyFn(calculateSubtotal(), formData.activeCurrency), valueX, finalY, { align: "right" });

  doc.text("KDV (%20):", labelX, finalY + 5);
  doc.text(formatCurrencyFn(calculateKDV(), formData.activeCurrency), valueX, finalY + 5, { align: "right" });

  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.text("Genel Toplam:", labelX, finalY + 11);
  doc.text(formatCurrencyFn(calculateTotal(), formData.activeCurrency), valueX, finalY + 11, { align: "right" });

  doc.setFont("Roboto", "normal");
  return doc;
};
