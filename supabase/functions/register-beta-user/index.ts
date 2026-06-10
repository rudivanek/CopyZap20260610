import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ========================================================================
  // BETA REGISTRATION DISABLED - FREE TRIAL AUTO-ASSIGNED ON SIGNUP
  // ========================================================================
  // This edge function is NO LONGER USED. All new signups automatically
  // receive a Free Trial plan (10,000 credits, 30 days) via database trigger.
  // Users can sign up directly via the standard signup flow at /login.
  // ========================================================================

  return new Response(
    JSON.stringify({
      error: 'Beta registration is no longer available. Please sign up directly at /login to receive your free 30-day trial with 10,000 credits automatically.'
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 410 // Gone - resource no longer available
    }
  );
});
