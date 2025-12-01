import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";

async function loadFont(pdfDoc) {
  const url = "/fonts/Roboto-Regular.ttf";
  const fontBytes = await fetch(url).then((res) => res.arrayBuffer());
  return await pdfDoc.embedFont(fontBytes);
}

export async function generateKargoPdf(data) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 50;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const font = await loadFont(pdfDoc);

  // Yazılacak satırları tek listede topluyoruz
  let lines = [
    "KARGO GÖNDERİM FORMU",
    "",
    "GÖNDERİCİ ÜNVAN-ADRES:",
    "DAYAN DİŞLİ SANAYİ",
    "İkitelli O.S.B. Çevre Sanayi Sitesi",
    "8. Blok No: 45/47",
    "Başakşehir / İstanbul, 34490",
    "Telefon: 0 536 583 74 20",
    "",
    "ALICI ÜNVAN-ADRES:",
    `Alıcı: ${data.name}`,
    `İsim: ${data.short_name}`,
    `Adres: ${data.address}`,
    `Telefon: ${data.phone ?? "-"}`,
  ];

  // ---------------------------------------------------
  // 🔥 DİNAMİK FONT BOYUTU HESAPLAMA
  // ---------------------------------------------------
  let fontSize = 20;      // Başlangıç (büyüğünden başla)
  const minFontSize = 8;  // Çok küçülmesin

  while (fontSize > minFontSize) {
    const lineHeight = fontSize + 6;
    const totalHeight = lines.length * lineHeight;

    if (totalHeight + margin * 2 <= pageHeight) break; // Sığdı → kabul

    fontSize -= 1; // Sığmadı → küçült
  }

  // Artık ideal fontSize bulundu
  const lineHeight = fontSize + 6;

  // ---------------------------------------------------
  // 🔥 PDF'E YAZDIRMA
  // ---------------------------------------------------
  let x = margin;
  let y = pageHeight - margin;

  for (let text of lines) {
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }

  return await pdfDoc.save();
}
