import { Resend } from "npm:resend";

// Hardcoded API key (test)
const resend = new Resend("re_4ZdUeyGM_PPv5RiYHZJ4h16UZqir4Trvj");

Deno.serve(async (req) => {
  // ---------------- CORS ----------------
  const allowedOrigins = [
    "https://dayandisli.com",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173"
  ];

  const origin = req.headers.get("origin") || "";
  const corsOrigin = allowedOrigins.includes(origin)
    ? origin
    : "https://dayandisli.com";

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    const { name, email, phone, company, message } = await req.json();

    // -------- INTERNAL EMAIL --------
    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: "info@dayandisli.com",
      subject: "Yeni İletişim Formu - dayandisli.com",
      html: `
        <h2>Yeni İletişim Formu</h2>
        <p><strong>İsim:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Firma:</strong> ${company || "-"}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `
    });

    // -------- AUTO-REPLY EMAIL --------
    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: email,
      subject: "Formunuz bize ulaştı - DAYAN Dişli",
      html: `
        <p>Merhaba ${name},</p>
        <p>dayandisli.com üzerinden göndermiş olduğunuz mesaj tarafımıza ulaşmıştır.</p>
        <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
      `
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Content-Type": "application/json"
      }
    });
  }
});
