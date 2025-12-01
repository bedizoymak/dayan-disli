import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateKargoPdf(data: {
  name: string;
  short_name: string;
  address: string;
  phone: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const line = (text: string, size = 12, offset = 20) => {
    page.drawText(text, { x: 50, y, size, font });
    y -= offset;
  };

  // Başlık
  line("Kargo Gönderim Formu", 20, 35);

  // -------------------------
  // GÖNDERİCİ SABİT BİLGİLER
  // -------------------------
  line("GÖNDERİCİ ÜNVAN-ADRES:", 14, 25);
  line("DAYAN DİŞLİ SANAYİ");
  line("İkitelli O.S.B. Çevre Sanayi Sitesi");
  line("8. Blok No: 45/47");
  line("Başakşehir / İstanbul, 34490");
  line("Telefon: 0 536 583 74 20", 12, 40);

  // -------------------------
  // ALICI DİNAMİK BİLGİLER
  // -------------------------
  line("ALICI ÜNVAN-ADRES:", 14, 25);

  line(`Alıcı: ${data.name}`);
  line(`İsim: ${data.short_name}`);
  line(`Adres: ${data.address}`);
  line(`Telefon: ${data.phone}`);

  return await pdfDoc.save();
}
