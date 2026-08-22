import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendSms(to: string, body: string, accountSid: string, authToken: string, fromNumber: string) {
  const cleaned = to.replace(/\D/g, "");
  const formatted = cleaned.startsWith("1") ? `+${cleaned}` : `+1${cleaned}`;
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: fromNumber, To: formatted, Body: body }).toString(),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { customerName, serviceName, workerName, date, time, workerPhone } = await req.json();

    if (!customerName || !serviceName || !workerName || !date || !time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch admin phone from studio_settings using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);
    const { data: settings } = await db.from("studio_settings").select("admin_phone").eq("id", 1).maybeSingle();
    const adminPhone: string | null = settings?.admin_phone ?? null;

    const dateFormatted = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });

    const errors: string[] = [];

    // SMS to the assigned worker
    if (workerPhone) {
      try {
        const body =
          `New booking at Angel Beauty Studio!\n` +
          `Client: ${customerName}\n` +
          `Service: ${serviceName}\n` +
          `Date: ${dateFormatted} at ${time}`;
        await sendSms(workerPhone, body, accountSid, authToken, fromNumber);
      } catch (e) {
        errors.push(`Worker SMS failed: ${String(e)}`);
      }
    }

    // SMS to admin (all appointments)
    if (adminPhone) {
      try {
        const body =
          `New appointment booked!\n` +
          `Client: ${customerName}\n` +
          `Service: ${serviceName}\n` +
          `Artist: ${workerName}\n` +
          `Date: ${dateFormatted} at ${time}`;
        await sendSms(adminPhone, body, accountSid, authToken, fromNumber);
      } catch (e) {
        errors.push(`Admin SMS failed: ${String(e)}`);
      }
    }

    return new Response(JSON.stringify({ success: true, errors: errors.length ? errors : undefined }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
