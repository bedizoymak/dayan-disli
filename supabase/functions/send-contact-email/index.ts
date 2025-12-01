// supabase/functions/send-contact-email/index.ts

import { serve } from "https://deno.land/std/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

serve(async (req) => {

  // 1) OPTIONS preflight yakala
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const resend = new Resend("re_4ZdUeyGM_PPv5RiYHZJ4h16UZqir4Trvj"); // <-- kendi key'in;
    const body = await req.json();

    const { name, email, message } = body;

    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: "info@dayandisli.com",
      subject: "Yeni İletişim Formu",
      html: `<p><b>İsim:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Mesaj:</b> ${message}</p>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",        // ⭐️ FIX
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",        // ⭐️ FIX
      },
    });
  }
});
