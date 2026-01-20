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
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { prompt, duration = 5, aspectRatio = "16:9" } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.length < 3) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid prompt (at least 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    
    if (!RUNWAY_API_KEY) {
      console.error("RUNWAY_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Video generation service is not configured. Please add your Runway API key." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting video generation for user:", userId, "prompt:", prompt.substring(0, 50));

    // Convert aspect ratio to Runway format
    const runwayRatio = aspectRatio === "16:9" ? "1280:768" 
      : aspectRatio === "9:16" ? "768:1280"
      : aspectRatio === "1:1" ? "768:768"
      : "1280:768";

    // Step 1: Create a video generation task with Runway Gen-3 Alpha Turbo
    const createResponse = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: prompt,
        duration: duration,
        ratio: runwayRatio,
        watermark: false
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Runway API error:", createResponse.status, errorText);
      
      if (createResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid Runway API key. Please check your API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (createResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (createResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient Runway credits. Please add more credits to your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to start video generation", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createData = await createResponse.json();
    const taskId = createData.id;
    
    if (!taskId) {
      console.error("No task ID returned:", createData);
      return new Response(
        JSON.stringify({ error: "Failed to start video generation task" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video generation task started:", taskId);

    // Step 2: Poll for completion (max 2 minutes)
    const maxAttempts = 24; // 24 * 5 seconds = 2 minutes
    let attempts = 0;
    let videoUrl = null;
    let status = "PENDING";

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06"
        },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      
      console.log(`Task ${taskId} status: ${status} (attempt ${attempts + 1})`);

      if (status === "SUCCEEDED") {
        videoUrl = statusData.output?.[0];
        break;
      } else if (status === "FAILED") {
        return new Response(
          JSON.stringify({ error: "Video generation failed", details: statusData.failure || "Unknown error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      // Return task ID for async polling on frontend
      return new Response(
        JSON.stringify({ 
          success: true,
          taskId: taskId,
          status: status,
          message: "Video generation in progress. Use the task ID to check status.",
          prompt: prompt,
          duration: duration,
          aspectRatio: aspectRatio
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video generated successfully:", videoUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        videoUrl: videoUrl,
        taskId: taskId,
        status: "SUCCEEDED",
        message: "Video generated successfully!",
        prompt: prompt,
        duration: duration,
        aspectRatio: aspectRatio
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
