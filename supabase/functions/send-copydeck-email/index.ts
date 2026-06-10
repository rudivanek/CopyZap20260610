import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Sharpen.Studio <hi@copyzap.app>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      to,
      projectName,
      clientName,
      senderName,
      message,
      attachments,
    } = await req.json();

    if (!to || !projectName || !attachments || attachments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, projectName, attachments" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
        <h2 style="color: #E85D04;">Contenido del sitio web</h2>
        <p>Hola,</p>
        <p>Te enviamos los archivos del contenido para el proyecto <strong>"${projectName}"</strong>${clientName ? ` del cliente <strong>"${clientName}"</strong>` : ""}.</p>
        ${message ? `<p>${message}</p>` : ""}
        <p>Los archivos adjuntos incluyen:</p>
        <ul>
          ${attachments.map((a: { filename: string }) => `<li>${a.filename}</li>`).join("")}
        </ul>
        ${senderName ? `<p>Enviado por: ${senderName}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Este correo fue enviado automáticamente desde Copy Deck Generator — Sharpen.Studio</p>
      </div>
    `;

    const textBody = `Contenido del sitio web — ${projectName}

Hola,

Te enviamos los archivos del contenido para el proyecto "${projectName}"${clientName ? ` del cliente "${clientName}"` : ""}.

${message || ""}

Archivos adjuntos:
${attachments.map((a: { filename: string }) => `- ${a.filename}`).join("\n")}

${senderName ? `Enviado por: ${senderName}` : ""}

---
Este correo fue enviado automáticamente desde Copy Deck Generator — Sharpen.Studio`;

    const resendPayload = {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: `Contenido del sitio web — ${projectName}`,
      html: htmlBody,
      text: textBody,
      attachments: attachments.map((a: { filename: string; content: string; contentType?: string }) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType || "application/octet-stream",
      })),
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Edge function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
