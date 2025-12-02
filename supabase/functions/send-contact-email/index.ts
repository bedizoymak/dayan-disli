const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // OPTIONS REQUEST
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { name, email, phone, company, message, token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA token missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GOOGLE RECAPTCHA VERIFY
    const secret = Deno.env.get("RECAPTCHA_SECRET_KEY");

    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: secret || "",
          response: token,
        }),
      }
    );

    const verifyData = await verifyRes.json();

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

    // SEND EMAIL VIA RESEND API
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Main email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DAYAN Dişli <info@dayandisli.com>",
        to: ["info@dayandisli.com"],
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
      }),
    });

    // Auto-reply
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DAYAN Dişli <info@dayandisli.com>",
        to: [email],
        subject: "Formunuz bize ulaştı - DAYAN Dişli",
        html: `
          <p>Merhaba ${name},</p>
          <p>Göndermiş olduğunuz form elimize ulaştı.</p>
          <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
