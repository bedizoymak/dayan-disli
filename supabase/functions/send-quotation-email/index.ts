import { Resend } from "npm:resend";

export const config = {
  runtime: "edge",
};

export default async (req: Request) => {
  // CORS: Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { to, cc, subject, body, pdfBase64, filename } = await req.json();

    if (!to || !subject || !pdfBase64) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // Get Resend API Key from Supabase Secrets
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY secret" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const resend = new Resend(apiKey);

    // Send email via Resend
    const result = await resend.emails.send({
      from: "Dayan Dişli <info@dayandisli.com>",
      to: [to],
      cc: cc ? [cc] : undefined,
      subject,
      html: `
        <p>${body.replace(/\n/g, "<br>")}</p>
        <p>Saygılarımla,<br><strong>Hayrettin Dayan</strong></p>
      `,
      attachments: [
        {
          filename,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    });

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.data?.id,
      }),
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.toString() }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
};
