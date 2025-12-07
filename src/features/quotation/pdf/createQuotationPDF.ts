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

const titleText = "SİPARİŞ TEKLİF FORMU";
const titleWidth = doc.getTextWidth(titleText);
const titleX = (pageWidth - titleWidth) / 2;
const titleY = 17;

doc.text(titleText, titleX, titleY);

// --- Sağ bilgi kutusu ---
const fontSize = 7;
const rightMargin = 5;
const paddingX = 3;
const paddingY = 2;
const lineGap = 5;

// Döküman No hesaplama → "D 001-1"
const teklifSuffix = teklifNo.slice(-3).trim();
const documentNo = `D ${teklifSuffix}-1`;

// Etiket / değer metinleri
const labelDate = "Tarih: ";
const valueDate = today;

const labelDoc  = "Döküman No: ";
const valueDoc  = documentNo;

const labelOffer = "Teklif No: ";
const valueOffer = teklifNo;

// Bir satırın gerçek genişliğini (bold + normal) ölçen yardımcı fonksiyon
const measureLineWidth = (label: string, value: string) => {
  doc.setFont("Roboto", "bold");
  doc.setFontSize(fontSize);
  const labelW = doc.getTextWidth(label);

  doc.setFont("Roboto", "normal");
  const valueW = doc.getTextWidth(value);

  return labelW + valueW;
};

const w1 = measureLineWidth(labelDate, valueDate);
const w2 = measureLineWidth(labelDoc, valueDoc);
const w3 = measureLineWidth(labelOffer, valueOffer);

const boxTextWidth = Math.max(w1, w2, w3);

// Kutu ölçüleri (3 satır + rahat boşluk)
const boxWidth = boxTextWidth + paddingX * 2;
const boxHeight = 20;

// Dikey ortalama: logo (6–26) ile çizgi (28) arası
const boxY = (6 + 22) / 2 - boxHeight / 2;
const boxX = pageWidth - rightMargin - boxWidth;

// Arka plan kutusu
doc.setFillColor(245, 245, 245);
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5, "FD");

// Metin yerleşimi (sola hizalı, etiket bold, değer normal)
let y = boxY + 6;
const x = boxX + paddingX;

// Satır 1: Tarih
doc.setFont("Roboto", "bold");
doc.setFontSize(fontSize);
doc.text(labelDate, x, y);
let offset = doc.getTextWidth(labelDate);

doc.setFont("Roboto", "normal");
doc.text(valueDate, x + offset, y);

// Satır 2: Döküman No
y += lineGap;
doc.setFont("Roboto", "bold");
doc.text(labelDoc, x, y);
offset = doc.getTextWidth(labelDoc);

doc.setFont("Roboto", "normal");
doc.text(valueDoc, x + offset, y);

// Satır 3: Teklif No
y += lineGap;
doc.setFont("Roboto", "bold");
doc.text(labelOffer, x, y);
offset = doc.getTextWidth(labelOffer);

doc.setFont("Roboto", "normal");
doc.text(valueOffer, x + offset, y);

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
