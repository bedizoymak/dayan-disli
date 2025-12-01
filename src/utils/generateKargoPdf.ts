import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";

async function loadFont(pdfDoc, file) {
  const url = `/fonts/${file}`;
  const fontBytes = await fetch(url).then(res => res.arrayBuffer());
  return await pdfDoc.embedFont(fontBytes);
}

export async function generateKargoPdf(data) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 50;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const regularFont = await loadFont(pdfDoc, "Roboto-Regular.ttf");
  const boldFont = await loadFont(pdfDoc, "Roboto-Bold.ttf");

  // --- MAIN TITLE ---
  const titleText = "KARGO GÖNDERİM FORMU";
  const titleFontSize = 28; // her zaman büyük

  const titleWidth = boldFont.widthOfTextAtSize(titleText, titleFontSize);
  const titleX = (pageWidth - titleWidth) / 2;
  let y = pageHeight - margin;

  // Centered + Bold
  page.drawText(titleText, {
    x: titleX,
    y,
    size: titleFontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Title ile içerik arasında boşluk
  y -= titleFontSize + 20;

  // --- KALAN TEXT SATIRLARI ---
  const lines = [
    { parts: [{ text: "GÖNDERİCİ ÜNVAN-ADRES:", bold: true }] },
    { parts: [{ text: "DAYAN DİŞLİ SANAYİ" }] },
    { parts: [{ text: "İkitelli O.S.B. Çevre Sanayi Sitesi" }] },
    { parts: [{ text: "8. Blok No: 45/47" }] },
    { parts: [{ text: "Başakşehir / İstanbul, 34490" }] },
    {
      parts: [
        { text: "Telefon: ", bold: true },
        { text: "0 536 583 74 20", bold: false },
      ],
    },

    { parts: [{ text: "" }] },

    { parts: [{ text: "ALICI ÜNVAN-ADRES:", bold: true }] },
    {
      parts: [
        { text: "Alıcı: ", bold: true },
        { text: data.name, bold: false },
      ],
    },
    {
      parts: [
        { text: "İsim: ", bold: true },
        { text: data.short_name, bold: false },
      ],
    },
    {
      parts: [
        { text: "Adres: ", bold: true },
        { text: data.address, bold: false },
      ],
    },
    {
      parts: [
        { text: "Telefon: ", bold: true },
        { text: data.phone ?? "-", bold: false },
      ],
    },
  ];

  // Dinamik font (title hariç)
  let fontSize = 18;
  const minFontSize = 8;

  while (fontSize > minFontSize) {
    const lineHeight = fontSize + 6;
    const totalHeight = lines.length * lineHeight;

    if (y - totalHeight >= margin) break;
    fontSize--;
  }

  const lineHeight = fontSize + 6;

  // Yazdırma
  for (const line of lines) {
    let x = margin;

    for (const p of line.parts) {
      const txt = p.text ?? "";
      const textWidth = (p.bold ? boldFont : regularFont).widthOfTextAtSize(txt, fontSize);

      page.drawText(txt, {
        x,
        y,
        size: fontSize,
        font: p.bold ? boldFont : regularFont,
        color: rgb(0, 0, 0),
      });

      x += textWidth;
    }

    y -= lineHeight;
  }

  return await pdfDoc.save();
}
