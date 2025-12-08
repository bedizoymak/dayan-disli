import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// SMTP configuration from environment
const smtpUser = Deno.env.get("SMTP_USER")!;
const smtpPass = Deno.env.get("GMAIL_APP_PASSWORD")!;
const smtpHost = Deno.env.get("SMTP_HOST")!;
const smtpPort = Number(Deno.env.get("SMTP_PORT")!);

// Simple SMTP email sending via fetch to SMTP2GO or similar API
// Alternative: Use Resend API which is already configured
const sendEmailViaResend = async (to: string, subject: string, html: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "DAYAN Dişli <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Email sending failed: ${error}`);
  }

  return res.json();
};

serve(async (req: Request) => {
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

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { name, email, phone, company, message, token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA token missing" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const secret = Deno.env.get("RECAPTCHA_SECRET_KEY")!;
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
    if (!verifyData.success) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA doğrulanamadı." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Send admin notification
    await sendEmailViaResend(
      smtpUser || "info@dayandisli.com",
      "Yeni İletişim Formu - dayandisli.com",
      `
        <h2>Yeni İletişim Formu</h2>
        <p><strong>İsim:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Firma:</strong> ${company || "-"}</p>
        <p><strong>Mesaj:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `
    );

    // Send auto-reply to user
    await sendEmailViaResend(
      email,
      "Formunuz bize ulaştı - DAYAN Dişli",
      `
        <p>Merhaba ${name},</p>
        <p>Mesajınız başarıyla elimize ulaştı.</p>
        <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
      `
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Email ERROR:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
