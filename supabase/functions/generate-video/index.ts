import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { prompt, duration = 5, aspectRatio = "16:9" } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid prompt (at least 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!RUNWAY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Video generation is not configured. Missing Runway API key." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI image generation is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const runwayRatio =
      aspectRatio === "9:16" ? "720:1280" :
      aspectRatio === "1:1"  ? "960:960"  :
                               "1280:720";

    console.log("[generate-video] user:", userId, "prompt:", prompt.substring(0, 80));

    // Step 1: Generate the first frame via Lovable AI Gateway (Gemini image model)
    const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Cinematic first frame for a video: ${prompt}. High detail, cinematic lighting, photorealistic, 16:9 framing.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imgRes.ok) {
      const txt = await imgRes.text();
      console.error("[generate-video] image gen failed:", imgRes.status, txt);
      if (imgRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (imgRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to generate first frame for the video." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imgData = await imgRes.json();
    const imageUrl: string | undefined =
      imgData?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      imgData?.choices?.[0]?.message?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("[generate-video] no image in response", JSON.stringify(imgData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Image model did not return a frame. Try a simpler prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Runway image_to_video (gen3a_turbo)
    const createResponse = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptImage: imageUrl,
        promptText: prompt,
        duration: duration === 10 ? 10 : 5,
        ratio: runwayRatio,
        watermark: false,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("[generate-video] Runway error:", createResponse.status, errorText);
      if (createResponse.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Runway API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (createResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Runway rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (createResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient Runway credits. Add credits to your Runway account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to start video generation", details: errorText.slice(0, 300) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    if (!taskId) {
      return new Response(JSON.stringify({ error: "Failed to start video task" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-video] task started:", taskId);

    // Return immediately; frontend will poll check-video-status
    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        status: "PENDING",
        firstFrame: imageUrl,
        message: "Video generation started. Polling for completion...",
        prompt,
        duration,
        aspectRatio,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-video error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
