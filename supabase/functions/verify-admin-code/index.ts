import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email and code are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the most recent unused code for this email
    const { data: record, error: queryErr } = await supabase
      .from("admin_auth_codes")
      .select("id, code, expires_at, used")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryErr) throw new Error(queryErr.message);

    if (!record) {
      return new Response(JSON.stringify({ error: "No valid code found. Please request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This code has expired. Please request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check code match
    if (record.code !== code) {
      return new Response(JSON.stringify({ error: "Incorrect code. Please try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used
    await supabase.from("admin_auth_codes").update({ used: true }).eq("id", record.id);

    // Verify the email is still on the whitelist
    const { data: allowed } = await supabase
      .from("admin_whitelist")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!allowed) {
      return new Response(JSON.stringify({ error: "This email is no longer authorized." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use admin generateLink to create a magic link for this user, then extract the token
    // to return to the client for verifyOtp
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkErr || !linkData) {
      throw new Error(linkErr?.message ?? "Failed to generate auth link");
    }

    // The properties contain the verification token and hash
    const properties = linkData.properties;
    if (!properties || !properties.token_hash) {
      throw new Error("Failed to extract auth token");
    }

    return new Response(JSON.stringify({
      success: true,
      token_hash: properties.token_hash,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
