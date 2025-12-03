// supabase/functions/send-quotation-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // JSON al
    const { to, from, subject, html, fileBase64, fileName } = await req.json();

    // Resend instance
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    // Mail gönder
    const response = await resend.emails.send({
      to,
      from,
      subject,
      html, // HTML içerik
      attachments: [
        {
          filename: fileName,
          content: fileBase64,
          encoding: "base64",
        },
      ],
    });

    return new Response(
      JSON.stringify({ success: true, response }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
