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

  // ---- HEADER (Güncellendi) ----
const drawHeader = (pageNumber: number, totalPages: number) => {
  // Üst ince çizgi
  doc.setDrawColor(55, 65, 81);
doc.setLineWidth(0.6);
doc.line(0, 28, pageWidth, 28);


 // Logo
const logoImg = new Image();
logoImg.src = "/logo-header.png";
doc.addImage(logoImg, "PNG", marginX, 6, 40, 17);

  // Başlık
doc.setFont("Roboto", "bold");
doc.setFontSize(14);
doc.setTextColor(55, 65, 81);

const titleText = "SİPARİŞ FİYAT TEKLİFİ";
const titleWidth = doc.getTextWidth(titleText);
const titleX = (pageWidth - titleWidth) / 2;
const titleY = 17;

doc.text(titleText, titleX, titleY);

// --- Sağ bilgi kutusu ---
const fontSize = 7;
const rightMargin = 5;
const paddingX = 3;
const paddingY = 2;
const lineGap = 4;

// Dosya No hesaplama → "D 001-1"
const teklifSuffix = teklifNo.slice(-3).trim();
const documentNo = `D ${teklifSuffix}-1`;

const labelDate = "Tarih: ";
const valueDate = "    " + today; // 3 boşluk

const labelDoc  = "Dosya No: ";
const valueDoc  = "    " + documentNo; // 3 boşluk

const labelOffer = "Teklif No: ";
const valueOffer = "    " + teklifNo; // 3 boşluk

// En geniş etiket hizası için ölçüm
doc.setFont("Roboto", "bold");
doc.setFontSize(fontSize);
const labelMaxWidth = Math.max(
  doc.getTextWidth(labelDate),
  doc.getTextWidth(labelDoc),
  doc.getTextWidth(labelOffer)
);

// Kutu genişliği (etiket + en geniş değer)
doc.setFont("Roboto", "normal");
const valueWidths = [
  doc.getTextWidth(valueDate),
  doc.getTextWidth(valueDoc),
  doc.getTextWidth(valueOffer),
];

const boxTextWidth = labelMaxWidth + Math.max(...valueWidths);

// Kutu ölçüleri
const boxWidth = boxTextWidth + paddingX * 2;
const boxHeight = 17;

// Dikey ortalama: başlık çizgisi referanslı
const boxY = (6 + 22) / 2 - boxHeight / 2;
const boxX = pageWidth - rightMargin - boxWidth;

// Kutu çizimi
doc.setFillColor(245, 245, 245);
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5, "FD");

// Metin yerleşimi (sol hizalı)
let y = boxY + 6;
const x = boxX + paddingX;

// Satır 1: Tarih
doc.setFont("Roboto", "bold");
doc.text(labelDate, x, y);
doc.setFont("Roboto", "normal");
doc.text(valueDate, x + labelMaxWidth, y);

// Satır 2: Dosya No
y += lineGap;
doc.setFont("Roboto", "bold");
doc.text(labelDoc, x, y);
doc.setFont("Roboto", "normal");
doc.text(valueDoc, x + labelMaxWidth, y);

// Satır 3: Teklif No
y += lineGap;
doc.setFont("Roboto", "bold");
doc.text(labelOffer, x, y);
doc.setFont("Roboto", "normal");
doc.text(valueOffer, x + labelMaxWidth, y);

};


 // ---- FOOTER (Kurumsal + İnce Bar) ----
const drawFooter = (pageNumber: number, totalPages: number) => {
  const footerHeight = 7;

  doc.setFillColor(243, 244, 246);
  doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);

  const currentYear = new Date().getFullYear();

const line1 = `© ${currentYear} DAYAN DİŞLİ SANAYİ | İkitelli O.S.B. Çevre Sanayi Sitesi 8. Blok No:45/47 Başakşehir / İstanbul`;



  doc.text(line1, pageWidth / 2, pageHeight - footerHeight + 4.5, { align: "center" });

  doc.setFontSize(7).setTextColor(120, 120, 120);
  doc.text(
    `Sayfa ${pageNumber} / ${totalPages}`,
    pageWidth - marginX,
    pageHeight - 2.5,
    { align: "right" }
  );
};


    // ---- GÖVDE İÇERİK (HEADER/FOOTER HARİÇ) ----
    let y = 32;

    // SATICI - ALICI Kart Hizalama
    const cardGap = 6;
    const cardWidth = (pageWidth - 2 * marginX - cardGap) / 2;
    const maxValueWidth = cardWidth - 35;
    const buyerX = marginX + cardWidth + cardGap;
  
    const sellerRows = [
      ["Firma Adı:", "DAYAN DİŞLİ & PROFİL TAŞLAMA"],
      ["İlgili Kişi:", "Hayrettin Dayan"],
      ["Telefon:", "+90 536 583 74 20"],
      ["Email:", "info@dayandisli.com"],
    ];
  
    const buyerRows = [
      ["Firma Adı:", formData.firma || "-"],
      ["İlgili Kişi:", formData.ilgiliKisi || "-"],
      ["Telefon:", formData.tel || "-"],
      ["Email:", formData.email || "-"],
    ];
  
    const rowHeights = sellerRows.map((row, i) => {
      const sLines = doc.splitTextToSize(row[1], maxValueWidth).length;
      const bLines = doc.splitTextToSize(buyerRows[i][1], maxValueWidth).length;
   
      const maxLines = Math.max(sLines, bLines);
   
      // Sadece "Firma Adı" satırları için satır yüksekliği azalt
      if (i === 0) {
        return maxLines * 2; // 🔹 daha kompakt, test edilmiş değer
      }
      return maxLines * 5; // diğerlerinde dokunma
    });
   
  
    const cardHeight = 5 + rowHeights.reduce((sum, h) => sum + h, 0);
  
    // Kart Çerçeveleri
    doc.setDrawColor(229,231,235);
    doc.setFillColor(249,250,251);
    doc.rect(marginX, y, cardWidth, cardHeight, "FD");
    doc.rect(buyerX, y, cardWidth, cardHeight, "FD");
  
    // Başlıklar
    doc.setFont("Roboto", "bold").setFontSize(9).setTextColor(31,41,55);
    doc.text("TEDARİKÇİ BİLGİLERİ", marginX + 3, y + 6);
    doc.text("MÜŞTERİ BİLGİLERİ", buyerX + 3, y + 6);
  
    // İçerik Yazımı
    doc.setFont("Roboto","normal").setFontSize(8);
    let offsetY = y + 12;
  
    sellerRows.forEach(([label, sValue], i) => {
      const bValue = buyerRows[i][1];
      const sText = doc.splitTextToSize(sValue, maxValueWidth);
      const bText = doc.splitTextToSize(bValue, maxValueWidth);
  
      // Label'lar
      doc.setTextColor(107,114,128);
      doc.text(label, marginX + 3, offsetY);
      doc.text(label, buyerX + 3, offsetY);
  
      // Değerler
      doc.setTextColor(55,65,81);
      doc.text(sText, marginX + 28, offsetY);
      doc.text(bText, buyerX + 28, offsetY);
  
      offsetY += rowHeights[i];
    });
  
    // Sonraki kutuya geçiş
    y = y + cardHeight + 10;
  
    // ---- AÇIKLAMA KUTUSU ----


const descBoxHeight = 34;
doc.setDrawColor(229, 231, 235); // border-gray-200
doc.setFillColor(252, 252, 253); // çok açık gri BG
doc.rect(marginX, y, pageWidth - 2 * marginX, descBoxHeight, "FD");

// Metin içeriği
const ilgili = formData.ilgiliKisi ? formData.ilgiliKisi : "";
const descX = marginX + 3;
let descY = y + 6;

doc.setFont("Roboto", "bold");
doc.setFontSize(9);
doc.setTextColor(31, 41, 55);
doc.text(`Sayın ${ilgili},`, descX, descY);

doc.setFont("Roboto", "normal");
doc.setFontSize(8);
doc.setTextColor(55, 65, 81);
doc.text(
  "Aşağıda özellikleri ve istenen şartları tanımlanmış ürünlerin/hizmetlerin sipariş teklif formudur.",
  descX,
  descY + 9
);

doc.text("İyi çalışmalar dileriz.", descX, descY + 14);

doc.setFont("Roboto", "bold");
doc.setFontSize(9);
doc.text("Saygılarımızla,", descX, descY + 21);
doc.text("Hayrettin DAYAN", descX, descY + 25);

// Tablo başlangıcı için yeni y
y = y + descBoxHeight + 8;


  // ---- ÜRÜN TABLOSU ----
  const tableStartY = y + 6;

  const tableHead = [
    [
      "No",
      "Ürün",
      "Hizmet",
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
      0: { halign: "center" }, // No
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

 // ==== TEKLİF ŞARTLARI & ÖDEME BİLGİLERİ (YAN YANA, ALTA YASLI) ====

const cardsGap = 6;
const cardsMarginBottom = 10;
const cardsAvailableWidth = pageWidth - 2 * marginX;
const cardsWidth = (cardsAvailableWidth - cardsGap) / 2;

const leftX = marginX;
const rightX = marginX + cardsWidth + cardsGap;

const padX = 4;
const padY = 3;
const lineH = 4;
const titleH = 7;

// Dinamik bilgiler
const termsLabeled: [string, string][] = [
  ["Notlar:", formData.notlar || "Belirtilmemiş"],
  ["Opsiyon:", formData.opsiyon || "Opsiyon belirtilmedi."],
  ["Öngörülen Teslim:", formData.teslimSuresi || "4 hafta"],
  ["Ödeme Şekli:", formData.odemeSekli || "%70 peşin %30 teslimde"],
  ["Teslim Yeri:", formData.teslimYeri || "İkitelli O.S.B."],
];

let termsEstimatedLines = 0;
termsLabeled.forEach(([_, val]) => {
  termsEstimatedLines += doc.splitTextToSize(val, cardsWidth - padX * 2 - 32).length;
});

const termsCardHeight = padY * 2 + titleH + termsEstimatedLines * lineH;

// Statik bilgiler
const paymentLines: [string, string][] = [
  ["Banka:", "İş Bankası"],
  ["Hesap:", "Ticari Hesap"],
  ["İsim:", "Hayrettin Dayan"],
  ["IBAN:", "TR07 0006 4000 0011 0760 6118 03 (₺)"],
];

const paymentCardHeight = padY * 2 + titleH + paymentLines.length * lineH;

const cardsHeight = Math.max(termsCardHeight, paymentCardHeight);
const cardsY = Math.max(finalTableY + 10, pageHeight - cardsMarginBottom - cardsHeight);

doc.setDrawColor(229, 231, 235);
doc.setFillColor(249, 250, 251);

// === Sol Kart ===
doc.roundedRect(leftX, cardsY, cardsWidth, cardsHeight, 2, 2, "FD");
doc.setFont("Roboto", "bold").setFontSize(9).setTextColor(31, 41, 55);
doc.text("Teklif Şartları", leftX + padX, cardsY + padY + 3);

let ty = cardsY + padY + titleH;
termsLabeled.forEach(([label, value]) => {
  doc.setFont("Roboto", "bold").setTextColor(107, 114, 128);
  doc.text(label, leftX + padX, ty);

  doc.setFont("Roboto", "normal").setTextColor(55, 65, 81);
  const wrapped = doc.splitTextToSize(value, cardsWidth - padX * 2 - 32);
  wrapped.forEach((line, i) =>
    doc.text(line, leftX + padX + 30, ty + i * lineH)
  );
  ty += wrapped.length * lineH;
});

// SAĞ KART --- DÜZELTİLMİŞ HALİ ---
doc.setDrawColor(229, 231, 235);  // border-gray-200
doc.setFillColor(249, 250, 251);  // bg-gray-50
doc.roundedRect(rightX, cardsY, cardsWidth, cardsHeight, 2, 2, "FD");

// Başlık
doc.setFont("Roboto", "bold");
doc.setFontSize(9);
doc.setTextColor(31, 41, 55); // text-gray-800
doc.text("Ödeme Bilgileri", rightX + padX, cardsY + padY + 3);

// İçerik
let py = cardsY + padY + titleH;
paymentLines.forEach(([label, value]) => {
  doc.setFont("Roboto", "bold").setTextColor(107,114,128); // label-gray-500
  doc.text(label, rightX + padX, py);

  doc.setFont("Roboto", "normal").setTextColor(55,65,81); // value-gray-700
  doc.text(value, rightX + padX + 18, py);

  py += lineH;
});


  // ---- HEADER & FOOTER TÜM SAYFALARA UYGULA ----
const totalPages = doc.getNumberOfPages();

for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
  doc.setPage(pageNumber);
  drawHeader(pageNumber, totalPages);
  drawFooter(pageNumber, totalPages);
}

return doc;
};

