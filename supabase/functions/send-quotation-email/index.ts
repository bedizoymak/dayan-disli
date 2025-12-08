import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const {
      to,
      bcc,
      subject,
      html,
      pdfBase64,
      pdfFileName,
    } = body;

    const finalSubject = subject || "DAYAN Dişli - Fiyat Teklifi";
    const finalHtml =
      html || "<p>Merhaba, fiyat teklifimiz ekte PDF olarak iletilmiştir.</p>";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Prepare attachments for Resend
    const attachments = [];
    if (pdfBase64 && pdfFileName) {
      attachments.push({
        filename: pdfFileName,
        content: pdfBase64,
      });
    }

    // Build recipients list
    const toList = Array.isArray(to) ? to : [to];
    const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    const emailPayload: Record<string, unknown> = {
      from: "DAYAN Dişli <onboarding@resend.dev>",
      to: toList,
      subject: finalSubject,
      html: finalHtml,
    };

    if (bccList && bccList.length > 0) {
      emailPayload.bcc = bccList;
    }

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Email ERROR:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
