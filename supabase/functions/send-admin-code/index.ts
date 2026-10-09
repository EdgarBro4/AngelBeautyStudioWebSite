import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your admin sign-in code</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#000000;border:3px solid #D4AF37;border-radius:20px;padding:48px 40px 48px 40px;max-width:520px;">

          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="display:inline-block;border:2px solid #D4AF37;border-radius:20px;padding:6px 18px;font-size:13px;font-weight:bold;color:#D4AF37;font-family:Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;background-color:#000000;">ABS</span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:38px;font-weight:bold;color:#D4AF37;font-family:Georgia,serif;letter-spacing:-0.5px;">
                Admin Sign-In Code
              </h1>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif;line-height:1.6;text-align:center;">
                Use the code below to sign in to the<br />
                Angel Beauty Studio admin panel.<br />
                This code expires in 10 minutes.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center">
              <span style="display:inline-block;background-color:#000000;border:2px solid #D4AF37;border-radius:14px;padding:18px 56px;font-size:42px;font-weight:bold;color:#D4AF37;font-family:Arial,sans-serif;letter-spacing:12px;">
                ${code}
              </span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#666666;font-family:Arial,sans-serif;">
                If you did not request this code, you can safely ignore this email.
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
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check the admin whitelist
    const { data: allowed } = await supabase
      .from("admin_whitelist")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!allowed) {
      // Return success to avoid leaking which emails are whitelisted
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete any prior codes for this email
    await supabase.from("admin_auth_codes").delete().eq("email", normalizedEmail);
    const { error: dbErr } = await supabase.from("admin_auth_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });
    if (dbErr) throw new Error(dbErr.message);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      // No Resend key — return the code in demo mode
      return new Response(JSON.stringify({ success: true, demo: true, code }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(code);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Angel Beauty Studio <onboarding@resend.dev>",
        to: [normalizedEmail],
        subject: "Your admin sign-in code — Angel Beauty Studio",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
