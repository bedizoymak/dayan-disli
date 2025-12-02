import { Resend } from "npm:resend";


export const runtime = "edge";

export default async function handler(req: Request) {
  // PRE-FLIGHT (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "https://dayandisli.com",
        "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { name, email, message } = await req.json();
    const resend = new Resend("re_4ZdUeyGM_PPv5RiYHZJ4h16UZqir4Trvj");

    const result = await resend.emails.send({
      from: "DAYAN Contact <info@dayandisli.com>",
      to: "info@dayandisli.com",
      subject: "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    return new Response(JSON.stringify(result), {
      headers: {
        "Access-Control-Allow-Origin": "https://dayandisli.com",
        "Content-Type": "application/json",
      },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://dayandisli.com",
        "Content-Type": "application/json",
      },
    });
  }
}
