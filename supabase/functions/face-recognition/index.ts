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

    const systemPrompt = `You are a precise face recognition system. You will receive a camera photo (Photo 1) and several member photos. Your job is to find which member (if any) matches the person in Photo 1.

STRICT MATCHING RULES:
- You MUST be 95%+ confident to report a MATCH
- Compare ONLY the face in Photo 1 against each member photo ONE BY ONE
- Focus on: face shape, eye shape/spacing, nose structure, mouth shape, jawline, eyebrow shape
- IGNORE: lighting, angle, expression, clothing, background, hair style, glasses
- If TWO or more members look similar to the camera photo, respond NO_MATCH
- If the camera photo face is blurry or partially hidden, respond NO_MATCH
- NEVER guess - when in doubt, respond NO_MATCH
- FALSE MATCH is worse than NO_MATCH

RESPONSE FORMAT (exactly one line, no explanation):
MATCH:member_id_here
or
NO_MATCH`;

    const userContent = [
      {
        type: "text",
        text: `CAMERA PHOTO (Photo 1) - Identify this person:
The following are member photos to compare against. Each photo is labeled with its member ID.

${memberList}

Compare the face in Photo 1 carefully against EACH member photo. Only report MATCH if you are absolutely certain it is the same person.`
      },
      {
        type: "image_url",
        image_url: { url: capturedImage }
      },
      ...memberPhotos.map((m: { photo: string; id: string; name: string }, i: number) => ([
        {
          type: "text",
          text: `--- Member: ${m.name} (ID: ${m.id}) ---`
        },
        {
          type: "image_url",
          image_url: { url: m.photo }
        }
      ])).flat()
    ];

    // Use the more powerful model for better accuracy
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
