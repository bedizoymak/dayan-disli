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
  const today = new Date().toLocaleDateString("tr-TR");

  // ---- Fonts ----
  doc.addFileToVFS("Roboto-Regular.ttf", fontRobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

  doc.addFileToVFS("Roboto-Bold.ttf", fontRobotoBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  doc.setFont("Roboto", "normal");
  doc.setTextColor(55, 65, 81); // text-gray-700

  // ---- HEADER (tasarımdaki gibi) ----
  const drawHeader = (pageNumber: number, totalPages: number) => {
    // Üst border
    doc.setDrawColor(229, 231, 235); // border-gray-200
    doc.setLineWidth(0.4);
    doc.line(0, 24, pageWidth, 24);

    // Logo + Firma adı
    const logoImg = new Image();
    logoImg.src = "/logo-header.png";
    doc.addImage(logoImg, "PNG", marginX, 6, 30, 15);

    doc.setFont("Roboto", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55); // text-gray-800
    doc.text("DAYAN DİŞLİ & PROFİL TAŞLAMA", marginX + 34, 16);

    // Sağda TEKLİF + Teklif No + Tarih
    doc.setFont("Roboto", "bold");
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text("TEKLİF", pageWidth - marginX, 14, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.text(`Teklif No: ${teklifNo}`, pageWidth - marginX, 20, { align: "right" });
    doc.text(`Tarih: ${today}`, pageWidth - marginX, 24, { align: "right" });
  };

  // ---- FOOTER (tasarımdaki gibi) ----
  const drawFooter = (pageNumber: number, totalPages: number) => {
    // Arka plan bar
    doc.setFillColor(243, 244, 246); // bg-gray-100
    doc.rect(0, pageHeight - 14, pageWidth, 14, "F");

    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81); // text-gray-700

    const footerText =
      "Adres: İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul  |  " +
      "Tel: +90 536 583 74 20  |  " +
      "Email: info@dayandisli.com  |  " +
      "Web: www.dayandisli.com";

    doc.text(footerText, pageWidth / 2, pageHeight - 8.5, {
      align: "center",
    });

    doc.text(
      `Sayfa ${pageNumber} / ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 8.5,
      { align: "right" }
    );
  };

  // ---- GÖVDE İÇERİK (HEADER/FOOTER HARİÇ) ----

  let y = 32; // Header’dan sonraki boşluk

  // SATICI & ALICI kart genişliği
  const cardGap = 6;
  const cardWidth = (pageWidth - 2 * marginX - cardGap) / 2;
  const cardHeight = 38;

  // ---- SATICI BİLGİLERİ ----
  doc.setDrawColor(229, 231, 235); // border-gray-200
  doc.setFillColor(249, 250, 251); // bg-gray-50
  doc.rect(marginX, y, cardWidth, cardHeight, "FD");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text("SATICI BİLGİLERİ", marginX + 3, y + 6);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // label text-gray-500

  let lineY = y + 12;
  const labelX = marginX + 3;
  const valueX = marginX + 28;

  const sellerRows: [string, string][] = [
    ["Firma Adı:", "DAYAN DİŞLİ & PROFİL TAŞLAMA"],
    ["İlgili Kişi:", "Hayrettin Dayan"],
    ["Adres:", "İkitelli O.S.B. Çevre Sanayi Sitesi"],
    ["Telefon:", "+90 536 583 74 20"],
    ["Email:", "info@dayandisli.com"],
  ];

  sellerRows.forEach(([label, value]) => {
    doc.text(label, labelX, lineY);
    doc.setTextColor(55, 65, 81); // value text-gray-700
    doc.text(value, valueX, lineY);
    doc.setTextColor(107, 114, 128);
    lineY += 5;
  });

  // ---- ALICI BİLGİLERİ ----
  const buyerX = marginX + cardWidth + cardGap;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.rect(buyerX, y, cardWidth, cardHeight, "FD");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text("ALICI BİLGİLERİ", buyerX + 3, y + 6);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  lineY = y + 12;
  const buyerLabelX = buyerX + 3;
  const buyerValueX = buyerX + 28;

  const buyerRows: [string, string][] = [
    ["Firma Adı:", formData.firma || ""],
    ["İlgili Kişi:", formData.ilgiliKisi || ""],
    ["Adres:", ""],
    ["Telefon:", formData.tel || ""],
    ["Email:", formData.email || ""],
  ];

  buyerRows.forEach(([label, value]) => {
    doc.text(label, buyerLabelX, lineY);
    doc.setTextColor(55, 65, 81);
    doc.text(value || "-", buyerValueX, lineY);
    doc.setTextColor(107, 114, 128);
    lineY += 5;
  });

  // ---- AÇIKLAMA METNİ ----
  y = y + cardHeight + 10;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text(
    "Aşağıda belirtilen ürünler ve hizmetler için hazırlanan fiyat teklifimiz bilgilerinize sunulmuştur.",
    marginX,
    y
  );

  // ---- ÜRÜN TABLOSU ----
  const tableStartY = y + 6;

  const tableHead = [
    [
      "No",
      "Kod",
      "Açıklama",
      "Malzeme",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "KDV",
      "Toplam",
    ],
  ];

  const tableBody = formData.products.map((p: ProductRow, index) => [
    index + 1,
    p.kod || "",
    p.cins || "",
    p.malzeme || "",
    p.miktar.toString(),
    p.birim || "",
    formatCurrencyFn(p.birimFiyat, formData.activeCurrency),
    "%20",
    formatCurrencyFn(calculateRowTotal(p), formData.activeCurrency),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: {
      font: "Roboto",
      fontSize: 8,
      textColor: [75, 85, 99], // gray-600
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [243, 244, 246], // bg-gray-100
      textColor: [75, 85, 99],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // bg-gray-50
    },
    columnStyles: {
      0: { cellWidth: 10 }, // No
      2: { cellWidth: 40 }, // Açıklama
      4: { halign: "right" }, // Miktar
      6: { halign: "right" }, // Birim Fiyat
      7: { halign: "right" }, // KDV
      8: { halign: "right" }, // Toplam
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY;

  // ---- TOPLAM KUTUSU (sağda, tasarımdaki gibi) ----
  const totalsCardWidth = 60;
  const totalsX = pageWidth - marginX - totalsCardWidth;
  let totalsY = finalTableY + 6;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, totalsY, totalsCardWidth, 24, "S");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  const labelColX = totalsX + 3;
  const valueColX = totalsX + totalsCardWidth - 3;

  const araToplam = calculateSubtotal();
  const kdv = calculateKDV();
  const genelToplam = calculateTotal();

  // Ara Toplam
  doc.text("Ara Toplam", labelColX, totalsY + 7);
  doc.setTextColor(55, 65, 81);
  doc.text(
    formatCurrencyFn(araToplam, formData.activeCurrency),
    valueColX,
    totalsY + 7,
    { align: "right" }
  );

  // KDV
  doc.setTextColor(107, 114, 128);
  doc.text("KDV (%20)", labelColX, totalsY + 13);
  doc.setTextColor(55, 65, 81);
  doc.text(
    formatCurrencyFn(kdv, formData.activeCurrency),
    valueColX,
    totalsY + 13,
    { align: "right" }
  );

  // Genel Toplam
  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text("Genel Toplam", labelColX, totalsY + 20);
  doc.text(
    formatCurrencyFn(genelToplam, formData.activeCurrency),
    valueColX,
    totalsY + 20,
    { align: "right" }
  );

  // ---- NOTLAR & İMZA ----
  let notesY = totalsY + 32;

  // Notlar
  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text("NOTLAR VE ŞARTLAR", marginX, notesY);

  const notes = [
    "Teklifin geçerlilik süresi 15 gündür.",
    "Ödeme: %50 peşin, %50 teslimatta.",
    "Teslim süresi sipariş onayından itibaren 4 haftadır.",
    "Fiyatlarımıza KDV dahil değildir.",
  ];

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  let bulletY = notesY + 5;
  notes.forEach((note) => {
    doc.circle(marginX + 1.5, bulletY - 1.5, 0.6, "F");
    doc.text(note, marginX + 5, bulletY);
    bulletY += 4.5;
  });

  // İmza alanı (sağ)
  const signBoxX = pageWidth - marginX - 48;
  const signBoxWidth = 48;
  const signBaseline = notesY + 28;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text("Yetkili İmza", signBoxX + signBoxWidth / 2, notesY + 5, {
    align: "center",
  });

  doc.setDrawColor(156, 163, 175); // border-gray-400
  doc.setLineWidth(0.4);
  (doc as any).setLineDash([2, 2], 0);
  doc.line(
    signBoxX + 4,
    signBaseline,
    signBoxX + signBoxWidth - 4,
    signBaseline
  );
  (doc as any).setLineDash([] as any, 0);

  // ---- GÖRSEL ALANI (PHOTO AREA) ----
  const photoY = bulletY + 6;
  const photoHeight = 40;

  doc.setDrawColor(209, 213, 219); // border-gray-300
  doc.setLineWidth(0.6);
  (doc as any).setLineDash([3, 3], 0);
  doc.rect(marginX, photoY, pageWidth - 2 * marginX, photoHeight, "S");
  (doc as any).setLineDash([] as any, 0);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "GÖRSEL ALANI",
    pageWidth / 2,
    photoY + photoHeight / 2 + 3,
    { align: "center" }
  );

  // ---- HEADER & FOOTER TÜM SAYFALARA UYGULA ----
  const totalPages = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    doc.setPage(pageNumber);
    drawHeader(pageNumber, totalPages);
    drawFooter(pageNumber, totalPages);
  }

  return doc;
};
