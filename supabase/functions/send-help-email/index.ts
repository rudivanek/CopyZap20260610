import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_NAME = 100
const MAX_EMAIL = 200
const MAX_MESSAGE = 5000

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

// The form text is shown inside an email, so it is treated as plain text.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Used in the subject line: no line breaks.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only a signed-in user can send a message.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    // Validate required fields
    if (!name || !email || !message) {
      return json({ error: 'Name, email, and message are required' }, 400)
    }
    if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
      return json({ error: 'Your message is too long. Please shorten it and try again.' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, 400)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Skipping email send.')
      return json({
        message: "Your message has been received. We'll respond via email soon.",
        note: 'Email delivery is being processed',
      }, 200)
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeAccount = escapeHtml(user.email ?? user.id)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'CopyZap Help <hi@copyzap.app>',
        to: ['hi@copyzap.app'],
        reply_to: email,
        subject: `[Help Center] ${oneLine(name)} — ${oneLine(email)}`,
        html: `
          <h2>New Help Center Contact Form Submission</h2>
          <p><strong>From:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Signed-in account:</strong> ${safeAccount}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2563eb; margin-top: 10px;">
            ${safeMessage}
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This message was sent via the CopyZap Help Center contact form.<br>
            Reply directly to this email to respond to ${safeName} at ${safeEmail}.
          </p>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json()
      console.error('Resend API error:', resendError)
      return json({ error: 'Failed to send email. Please try again later.' }, 500)
    }

    const resendData = await resendResponse.json()
    console.log('Email sent successfully:', resendData)

    return json({
      message: 'Your message has been sent successfully',
      email_id: resendData.id,
    }, 200)
  } catch (error) {
    console.error('Error in send-help-email function:', error)
    return json({ error: 'Internal server error' }, 500)
  }
})
