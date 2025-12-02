import { Resend } from "npm:resend";

export const runtime = "edge";

export default async function handler(req: Request) {
  // MULTI-ORIGIN CORS
  const allowedOrigins = [
    "https://dayandisli.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080"
  ];

  const origin = req.headers.get("origin") || "";
  const corsOrigin = allowedOrigins.includes(origin)
    ? origin
    : "https://dayandisli.com";

  // -----------------------
  // 1) PRE-FLIGHT (OPTIONS)
  // -----------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  // -----------------------
  // 2) ANA LOGIC
  // -----------------------
  try {
    const resend = new Resend("re_4ZdUeyGM_PPv5RiYHZJ4h16UZqir4Trvj");

    const result = await resend.emails.send({
      from: "DAYAN Contact <info@dayandisli.com>",
      to: "info@dayandisli.com",
      subject: "TEST",
      text: "Working"
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Content-Type": "application/json"
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Content-Type": "application/json"
      }
    });
  }
}
