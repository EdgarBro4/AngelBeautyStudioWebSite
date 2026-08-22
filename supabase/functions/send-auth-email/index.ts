import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildEmailHtml(signInUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your sign-in link</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#000000;border:3px solid #D4AF37;border-radius:20px;padding:48px 40px 48px 40px;max-width:520px;">

          <!-- Logo badge -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="display:inline-block;border:2px solid #D4AF37;border-radius:20px;padding:6px 18px;font-size:13px;font-weight:bold;color:#D4AF37;font-family:Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;background-color:#000000;">ABS</span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:38px;font-weight:bold;color:#D4AF37;font-family:Georgia,serif;letter-spacing:-0.5px;">
                Your sign-in link
              </h1>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif;line-height:1.6;text-align:center;">
                Follow the link below to sign in.<br />
                This link expires shortly and can<br />
                only be used once.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center">
              <a href="${signInUrl}"
                style="display:inline-block;background-color:#D4AF37;color:#000000;font-size:26px;font-weight:bold;font-family:Arial,sans-serif;text-decoration:none;padding:18px 64px;border-radius:14px;letter-spacing:0.3px;">
                Sign in
              </a>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#666666;font-family:Arial,sans-serif;">
                If you did not request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
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

    // Supabase Auth Hook payload: { user: { email }, email_data: { token, token_hash, redirect_to, email_action_type, site_url } }
    const userEmail: string = payload?.user?.email ?? payload?.email ?? "";
    const emailData = payload?.email_data ?? {};
    const signInUrl: string =
      emailData?.token_hash
        ? `${emailData.site_url ?? ""}/auth/v1/verify?token=${emailData.token_hash}&type=magiclink&redirect_to=${encodeURIComponent(emailData.redirect_to ?? "")}`
        : emailData?.link ?? emailData?.confirmation_url ?? "";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      // No email key configured — fall through so Supabase sends default
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(signInUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Angel Beauty Studio <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Your sign-in link — Angel Beauty Studio",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
