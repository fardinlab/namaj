import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  email: string;
  code: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const { email, code, password }: VerifyRequest = await req.json();

    if (!email || !code || !password) {
      throw new Error("Email, code, and password are required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if verification code is valid
    const { data: verificationData, error: verificationError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (verificationError) {
      console.error("Error checking verification code:", verificationError);
      throw new Error("Failed to verify code");
    }

    if (!verificationData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired verification code" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user already exists first
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      // User exists - check if email is confirmed
      if (!existingUser.email_confirmed_at) {
        // Email not confirmed - confirm it now and update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            email_confirm: true,
            password: password,
          }
        );

        if (updateError) {
          console.error("Error updating user:", updateError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "অ্যাকাউন্ট আপডেট করতে সমস্যা হয়েছে।" 
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        // Clean up verification code
        await supabase
          .from("email_verification_codes")
          .delete()
          .eq("id", verificationData.id);

        console.log("User email confirmed and password updated:", existingUser.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Account verified successfully" 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Email already confirmed - tell user to login
      await supabase
        .from("email_verification_codes")
        .delete()
        .eq("id", verificationData.id);
        
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি এবং ভেরিফাই করা হয়েছে। লগইন করুন।" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("id", verificationData.id);

    // Create user account with email already confirmed
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      console.error("Error creating user:", signUpError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User created successfully:", userData.user?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in verify-code function:", error);
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
