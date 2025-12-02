import { Resend } from "npm:resend";

export const config = {
  runtime: "edge",
};

export default async (req: Request) => {
  try {
    const { to, cc, subject, body, pdfBase64, filename } = await req.json();

    if (!to || !subject || !pdfBase64) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY secret" }),
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

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
      });
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.data?.id }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.toString() }),
      { status: 500 }
    );
  }
};
