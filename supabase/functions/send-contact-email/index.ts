import { Resend } from "npm:resend";

// ⭐ RESEND SECRET → Supabase Dashboard'dan okunuyor
const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
console.log(">>> RESEND SECRET:", Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  // -------------------- CORS --------------------
  const allowedOrigins = [
    "https://dayandisli.com",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  const origin = req.headers.get("origin") || "";
  const corsOrigin = allowedOrigins.includes(origin)
    ? origin
    : "https://dayandisli.com";

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // OPTIONS REQUEST
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // ------------------------------
    // 🟦 1) FORM VERİSİNİ AL
    // ------------------------------
    const { name, email, phone, company, message, token } = await req.json();

    // ------------------------------
    // 🟧 2) TOKEN GELMİŞ Mİ?
    // ------------------------------
    if (!token) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA token missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ------------------------------
    // 🟩 3) GOOGLE RECAPTCHA VERIFY
    // ------------------------------
    const secret = Deno.env.get("RECAPTCHA_SECRET_KEY");

    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    console.log(">>> reCAPTCHA RESULT:", verifyData);

    // ------------------------------
    // 🟥 4) DOĞRULAMA BAŞARISIZSA
    // ------------------------------
    if (!verifyData.success) {
      return new Response(
        JSON.stringify({
          error: "reCAPTCHA doğrulanamadı. İşlem iptal edildi.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ------------------------------
    // 🟦 5) MAIL GÖNDER (BAŞARILI)
    // ------------------------------
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
      `,
    });

    // ------------ AUTO-REPLY ------------
    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: email,
      subject: "Formunuz bize ulaştı - DAYAN Dişli",
      html: `
        <p>Merhaba ${name},</p>
        <p>Göndermiş olduğunuz form elimize ulaştı.</p>
        <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
