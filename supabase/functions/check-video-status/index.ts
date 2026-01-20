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

    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    
    if (!RUNWAY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Video generation service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Checking status for task:", taskId);

    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "X-Runway-Version": "2024-11-06"
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error("Status check failed:", statusResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check video status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json();
    const status = statusData.status;
    
    console.log(`Task ${taskId} status: ${status}`);

    if (status === "SUCCEEDED") {
      return new Response(
        JSON.stringify({ 
          success: true,
          status: "SUCCEEDED",
          videoUrl: statusData.output?.[0],
          message: "Video generated successfully!"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (status === "FAILED") {
      return new Response(
        JSON.stringify({ 
          success: false,
          status: "FAILED",
          error: statusData.failure || "Video generation failed"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status: status,
        progress: statusData.progress || 0,
        message: "Video generation in progress..."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-video-status error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred checking video status" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
