import { Resend } from "npm:resend";

// TEST PURPOSE: Hardcoded API key
const resend = new Resend("re_4ZdUeyGM_PPv5RiYHZJ4h16UZqir4Trvj"); // <-- kendi key'in

Deno.serve(async (req) => {
  try {
    const { name, email, phone, company, message } = await req.json();

    // Internal email
    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: "bedizoymak1@gmail.com",
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
    });

    // Auto reply
    await resend.emails.send({
      from: "DAYAN Dişli <info@dayandisli.com>",
      to: email,
      subject: "Formunuz bize ulaştı - DAYAN Dişli",
      html: `
        <p>Merhaba ${name},</p>
        <p>dayandisli.com üzerinden göndermiş olduğunuz form tarafımıza ulaşmıştır.</p>
        <p>En kısa sürede sizinle iletişime geçeceğiz.</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
