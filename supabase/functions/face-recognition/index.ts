import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { capturedImage, memberPhotos } = await req.json();
    
    if (!capturedImage) {
      return new Response(
        JSON.stringify({ error: "No captured image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!memberPhotos || memberPhotos.length === 0) {
      return new Response(
        JSON.stringify({ error: "No member photos to compare" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt for face comparison
    const memberDescriptions = memberPhotos.map((m: { id: string; name: string; photo: string }, i: number) => 
      `Member ${i + 1}: ID="${m.id}", Name="${m.name}"`
    ).join("\n");

    const imageContent = [
      {
        type: "text",
        text: `You are a face recognition assistant. Compare the first image (captured from camera) with the following member photos and identify which member matches the captured face.

Members:
${memberDescriptions}

IMPORTANT: 
- If you find a clear match, respond with ONLY the member ID in this exact format: MATCH:member_id_here
- If no match is found or you're not confident, respond with: NO_MATCH
- Do not include any other text or explanation.`
      },
      {
        type: "image_url",
        image_url: { url: capturedImage }
      },
      ...memberPhotos.map((m: { photo: string }) => ({
        type: "image_url",
        image_url: { url: m.photo }
      }))
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: imageContent
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse);

    // Parse the response
    if (aiResponse.startsWith("MATCH:")) {
      const matchedId = aiResponse.replace("MATCH:", "").trim();
      return new Response(
        JSON.stringify({ matched: true, memberId: matchedId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ matched: false, memberId: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Face recognition error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
