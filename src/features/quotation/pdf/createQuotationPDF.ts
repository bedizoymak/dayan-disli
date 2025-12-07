import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fontRobotoRegular, fontRobotoBold } from "@/lib/pdfAssets/font-roboto";

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
  const primary = [56, 22, 100]; // #381664
  const today = new Date().toLocaleDateString("tr-TR");
  const tableHead = [240, 240, 240];

  // Fonts
  doc.addFileToVFS("Roboto-Regular.ttf", fontRobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", fontRobotoBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  // HEADER
  const drawHeader = () => {
    doc.setFillColor(247, 246, 248);
    doc.rect(0, 0, pageWidth, 30, "F");

    const logoImg = new Image();
    logoImg.src = "/logo-header.png";
    doc.addImage(logoImg, "PNG", marginX, 5, 20, 20);

    doc.setFont("Roboto", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...primary);
    doc.text("TEKLİF", pageWidth - marginX, 15, { align: "right" });

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Teklif No: ${teklifNo}`, pageWidth - marginX, 21, { align: "right" });
    doc.text(`Tarih: ${today}`, pageWidth - marginX, 26, { align: "right" });
  };

  // FOOTER
  const drawFooter = () => {
    const pageInfo = doc.getCurrentPageInfo();
    const pageNumber = pageInfo.pageNumber;

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.setFont("Roboto", "normal");
    doc.text(
      "İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul | Tel: +90 536 583 74 20 | E-mail: info@dayandisli.com | Web: www.dayandisli.com",
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );

    doc.text(`Sayfa ${pageNumber}`, pageWidth - marginX, pageHeight - 5, { align: "right" });
  };

  // DRAW HEADER
  drawHeader();

  let y = 40;
  doc.setTextColor(60, 60, 60);

  // SATICI
  doc.setDrawColor(220, 220, 220);
  doc.rect(marginX, y, pageWidth / 2 - marginX * 1.5, 35);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.text("SATICI BİLGİLERİ", marginX + 2, y + 5);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.text("DAYAN DİŞLİ & PROFİL TAŞLAMA", marginX + 2, y + 10);
  doc.text("İkitelli OSB İstanbul", marginX + 2, y + 15);
  doc.text("Tel: +90 536 583 74 20", marginX + 2, y + 20);
  doc.text("Email: info@dayandisli.com", marginX + 2, y + 25);

  // ALICI
  const rightX = pageWidth / 2 + 2;
  doc.rect(rightX, y, pageWidth / 2 - marginX * 1.5, 35);
  doc.setFont("Roboto", "bold");
  doc.text("ALICI BİLGİLERİ", rightX + 2, y + 5);

  doc.setFont("Roboto", "normal");
  doc.text(formData.firma, rightX + 2, y + 10);
  doc.text(formData.ilgiliKisi, rightX + 2, y + 15);
  doc.text(formData.tel, rightX + 2, y + 20);
  doc.text(formData.email, rightX + 2, y + 25);

  y += 45;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.text("Aşağıda belirtilen ürünler ve hizmetler için hazırlanan fiyat teklifimiz:", marginX, y);

  // TABLE
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

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // TOTALS
  const labelX = pageWidth - 60;
  const valueX = pageWidth - marginX;

  doc.setFontSize(9);
  doc.text("Ara Toplam:", labelX, finalY);
  doc.text(formatCurrencyFn(calculateSubtotal(), formData.activeCurrency), valueX, finalY, { align: "right" });

  doc.text("KDV (%20):", labelX, finalY + 6);
  doc.text(formatCurrencyFn(calculateKDV(), formData.activeCurrency), valueX, finalY + 6, { align: "right" });

  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.text("Genel Toplam:", labelX, finalY + 12);
  doc.text(formatCurrencyFn(calculateTotal(), formData.activeCurrency), valueX, finalY + 12, { align: "right" });
  doc.setFont("Roboto", "normal");

  // NOTES
  let notesY = finalY + 25;
  const notes = [
    "Teklifin geçerlilik süresi 15 gündür.",
    "Ödeme: %50 peşin, %50 teslimatta.",
    "Teslim süresi sipariş onayından itibaren 4 haftadır.",
    "Fiyatlarımıza KDV dahil değildir."
  ];

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.text("NOTLAR VE ŞARTLAR", marginX, notesY);
  doc.setFont("Roboto", "normal");

  notesY += 5;
  notes.forEach(note => {
    doc.circle(marginX + 1, notesY - 1.5, 0.7, "F");
    doc.text(note, marginX + 5, notesY);
    notesY += 5;
  });

  // SIGN
  doc.text("Yetkili İmza", pageWidth - 40, finalY + 25);
  doc.setDrawColor(160, 160, 160);
  doc.setLineDash([2, 2], 0);
  doc.line(pageWidth - 60, finalY + 45, pageWidth - 10, finalY + 45);

  return doc;
};
