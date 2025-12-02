import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // FIX: 'from' alanını da alıyoruz
    const { to, from, subject, text, fileName, fileBase64 } = await req.json();

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    const response = await resend.emails.send({
      to,
      from,             // ❗ artık undefined değil → 401 gider
      subject,
      text,
      attachments: [
        {
          filename: fileName,
          content: fileBase64,
          encoding: "base64",
        },
      ],
    });

    return new Response(JSON.stringify({ success: true, response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
