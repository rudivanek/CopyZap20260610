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

  try {
    const { email, name } = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Skipping welcome email.');
      // Return success anyway to not block signup
      return new Response(
        JSON.stringify({
          message: 'Account created successfully',
          note: 'Welcome email could not be sent',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // The name is shown inside the email, so it is treated as plain text (no HTML) and kept short.
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const displayName = escapeHtml(String(name || email.split('@')[0]).slice(0, 80));

    // Send welcome email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'CopyZap <hi@copyzap.app>',
        to: [email],
        subject: 'Your CopyZap account is ready',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CopyZap</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">Welcome to CopyZap</h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hi ${displayName},</p>

                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  Your <strong>CopyZap</strong> account is ready, and your free trial has started.
                </p>

                <!-- What it does -->
                <h2 style="margin: 30px 0 10px 0; font-size: 18px; color: #1f2937;">What CopyZap does</h2>
                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  Give it copy you already have: paste the text, or type the address of a page. It writes three improved versions, scores each one out of 100, and shows you which is best and why.
                </p>

                <!-- How it works -->
                <h2 style="margin: 30px 0 10px 0; font-size: 18px; color: #1f2937;">How it works</h2>
                <ol style="margin: 0 0 20px 0; padding: 0 0 0 22px; color: #374151; font-size: 16px; line-height: 1.6;">
                  <li style="padding: 4px 0;"><strong>Bring your copy.</strong></li>
                  <li style="padding: 4px 0;"><strong>Check what CopyZap understood,</strong> and choose for each part of the page: improve it, keep it as it is, or leave it out.</li>
                  <li style="padding: 4px 0;"><strong>Get three versions with a score.</strong> Then ask for a change, edit it yourself, or export a report.</li>
                </ol>

                <!-- Trial Details Box -->
                <div style="background-color: #f9fafb; border-left: 4px solid #4b5563; padding: 20px; margin: 30px 0;">
                  <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">Your trial</h2>
                  <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
                    <strong>1,000 credits</strong>, valid for <strong>30 days</strong>.<br>
                    That is enough for about 15 pages: a page of about 1,000 words uses roughly 60 credits.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://app.copyzap.app/" style="display: inline-block; background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                    Open CopyZap
                  </a>
                </div>

                <!-- Good to know -->
                <h2 style="margin: 30px 0 10px 0; font-size: 18px; color: #1f2937;">Good to know</h2>
                <ul style="margin: 0 0 20px 0; padding: 0 0 0 22px; color: #374151; font-size: 16px; line-height: 1.6;">
                  <li style="padding: 4px 0;">CopyZap improves copy you already have. It doesn't write a page from nothing.</li>
                  <li style="padding: 4px 0;">Testimonials on your page are kept word for word unless you choose otherwise.</li>
                  <li style="padding: 4px 0;">Every result is saved under History.</li>
                </ul>

                <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin: 25px 0 0 0;">
                  Questions? Just reply to this email.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                  The CopyZap Team
                </p>
                <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                  Powered by <a href="https://sharpen.studio" style="color: #6b7280; text-decoration: none;">Sharpen.Studio</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json();
      console.error('Resend API error:', resendError);
      // Don't fail signup if email fails
      return new Response(
        JSON.stringify({
          message: 'Account created successfully',
          note: 'Welcome email could not be sent'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const resendData = await resendResponse.json();
    console.log('Welcome email sent successfully:', resendData);

    return new Response(
      JSON.stringify({
        message: 'Welcome email sent successfully',
        email_id: resendData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    // Don't fail signup if email fails
    return new Response(
      JSON.stringify({
        message: 'Account created successfully',
        note: 'Welcome email could not be sent'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});