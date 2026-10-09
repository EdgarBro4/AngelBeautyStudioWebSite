import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailHtml(signInUrl: string): string {
  const safeSignInUrl = escapeAttribute(signInUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Angel Beauty Studio sign-in link</title>
</head>
<body style="margin:0;padding:0;background-color:#090909;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#090909;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#111111;border:1px solid #3b321a;">
          <tr>
            <td style="height:4px;background-color:#d4af37;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:46px 36px 18px;">
              <p style="margin:0;color:#d4af37;font-size:11px;line-height:1.4;letter-spacing:5px;text-transform:uppercase;">Angel Beauty Studio</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 36px 10px;">
              <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;line-height:1.2;">Your sign-in link</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 36px 34px;">
              <div style="width:56px;height:1px;background-color:#d4af37;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 36px 32px;">
              <p style="margin:0;color:#c4c4c4;font-size:15px;line-height:1.7;">Use the button below to access your studio account. This secure link expires shortly and can only be used once.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 36px 42px;">
              <a href="${safeSignInUrl}" style="display:inline-block;background-color:#d4af37;color:#090909;font-size:14px;font-weight:bold;line-height:1;text-decoration:none;text-transform:uppercase;letter-spacing:2px;padding:18px 34px;">Sign in securely</a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 30px;border-top:1px solid #292929;">
              <p style="margin:0;color:#6f6f6f;font-size:12px;line-height:1.6;text-align:center;">If you did not request this sign-in link, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#555555;font-size:11px;line-height:1.5;text-align:center;">Beauty, artistry, and care in every detail.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const userEmail: string = payload?.user?.email ?? payload?.email ?? "";
    const emailData = payload?.email_data ?? {};
    const signInUrl: string = emailData?.token_hash
      ? `${emailData.site_url ?? ""}/auth/v1/verify?token=${emailData.token_hash}&type=magiclink&redirect_to=${encodeURIComponent(emailData.redirect_to ?? "")}`
      : emailData?.link ?? emailData?.confirmation_url ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Angel Beauty Studio <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Your sign-in link — Angel Beauty Studio",
        html: buildEmailHtml(signInUrl),
      }),
    });

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: "Unable to send authentication email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
