import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerificationRequest {
  email: string;
}

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const { email }: VerificationRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete any existing codes for this email first
    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", email);

    // Insert new code
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      throw new Error("Failed to create verification code");
    }

    // Send email with verification code
    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: "নামাজ ক্যাম্পেইন <noreply@fardin.bro.bd>",
      to: [email],
      subject: "আপনার ভেরিফিকেশন কোড - নামাজ ক্যাম্পেইন",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; text-align: center;">নামাজ ক্যাম্পেইন</h1>
          <h2 style="text-align: center; color: #333;">আপনার ভেরিফিকেশন কোড</h2>
          <div style="background: #f3f4f6; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a; margin: 0;">
              ${code}
            </p>
          </div>
          <p style="color: #666; text-align: center;">এই কোডটি ১০ মিনিটের মধ্যে মেয়াদ শেষ হবে।</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।
          </p>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-verification-code function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
