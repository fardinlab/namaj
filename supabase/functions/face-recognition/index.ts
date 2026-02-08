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

    // Build detailed prompt for accurate face comparison
    const memberList = memberPhotos.map((m: { id: string; name: string }, i: number) => 
      `Photo ${i + 2}: Member ID="${m.id}", Name="${m.name}"`
    ).join("\n");

    const systemPrompt = `You are an expert face recognition system. Your task is to compare the FIRST image (Photo 1 - captured from camera) with the subsequent member photos and determine if any member matches.

CRITICAL MATCHING CRITERIA - Only match if ALL of these are similar:
1. Face shape and structure (oval, round, square, etc.)
2. Eye shape, size, and spacing
3. Nose shape and size
4. Mouth shape and lip thickness
5. Eyebrow shape and thickness
6. Jawline and chin structure
7. Forehead size and shape
8. Overall facial proportions

STRICT RULES:
- Only report a match if you are 90%+ confident
- Different lighting or angles are acceptable, but core facial features must match
- Do NOT match based on similar clothing, background, or accessories
- Do NOT match based on similar hair style or color alone
- If the face in Photo 1 is unclear, blurry, or partially hidden, respond with NO_MATCH
- If multiple members look similar, respond with NO_MATCH (avoid false positives)
- When in doubt, always respond with NO_MATCH

RESPONSE FORMAT:
- If confident match found: MATCH:member_id_here
- If no confident match: NO_MATCH

Do not include any explanation, just the response format above.`;

    const userContent = [
      {
        type: "text",
        text: `Photo 1 (Camera capture - the person to identify):
Compare this person's face with the following member photos:

${memberList}

Analyze facial features carefully and respond with the matching member ID or NO_MATCH.`
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

    // Use the more powerful model for better accuracy
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Using Pro for better accuracy
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
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
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || "";
    
    console.log("AI Response:", aiResponse);

    // Parse the response - be strict about format
    const matchPattern = /^MATCH:([a-f0-9-]+)$/i;
    const match = aiResponse.match(matchPattern);
    
    if (match && match[1]) {
      const matchedId = match[1].trim();
      // Verify the ID exists in our member list
      const validMember = memberPhotos.find((m: { id: string }) => m.id === matchedId);
      if (validMember) {
        return new Response(
          JSON.stringify({ matched: true, memberId: matchedId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // No match or invalid response
    return new Response(
      JSON.stringify({ matched: false, memberId: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Face recognition error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
