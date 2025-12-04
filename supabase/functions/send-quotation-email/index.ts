// supabase/functions/send-quotation-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import nodemailer from "npm:nodemailer";

// 🌍 SMTP ENV Values
const smtpUser = Deno.env.get("SMTP_USER")!;
const smtpPass = Deno.env.get("SMTP_PASS")!;
const smtpHost = Deno.env.get("SMTP_HOST")!;
const smtpPort = Number(Deno.env.get("SMTP_PORT")!);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, fileBase64, fileName } = await req.json();

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"DAYAN Dişli" <${smtpUser}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: fileName,
          content: fileBase64,
          encoding: "base64",
        },
      ],
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("SMTP ERROR:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
