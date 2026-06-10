import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { page_name, is_helpful, session_id } = await req.json();

    // Validate required fields
    if (!page_name || typeof is_helpful !== "boolean" || !session_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: page_name, is_helpful, session_id"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if this session already voted on this page
    const { data: existingVote, error: checkError } = await supabaseClient
      .from("help_page_feedback")
      .select("id")
      .eq("session_id", session_id)
      .eq("page_name", page_name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing vote:", checkError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing vote" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (existingVote) {
      return new Response(
        JSON.stringify({
          error: "You have already voted on this page",
          already_voted: true
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user agent from request headers
    const user_agent = req.headers.get("user-agent") || null;

    // Insert feedback
    const { data, error: insertError } = await supabaseClient
      .from("help_page_feedback")
      .insert([
        {
          page_name,
          is_helpful,
          session_id,
          user_agent,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit feedback" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Feedback submitted successfully",
        data,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in submit-help-feedback function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
