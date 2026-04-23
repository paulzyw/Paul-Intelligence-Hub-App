import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    // Filter: Alerts for unlocks OR specific high-value events
    // For this template, we alert on all UNLOCKS or visits from key regions if desired.
    // Let's stick to UNLOCKS and any visit as a baseline for this instruction.
    const isUnlock = record.is_unlock_event;
    
    // You can add more filters here, e.g., only specific countries
    if (!isUnlock && record.country !== 'United States' && record.country !== 'France') {
        // Optional: Skip standard non-focus traffic to reduce noise
        // return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Default sender for testing/self-notifications
        to: OWNER_EMAIL,
        subject: `[Portfolio Alert] ${isUnlock ? '🔓 UNLOCK' : 'Visit'} from ${record.city || 'Unknown'}, ${record.country || 'Unknown'}`,
        html: `
          <h3>Traffic Intelligence Alert</h3>
          <p><strong>Visitor Location:</strong> ${record.city}, ${record.region}, ${record.country}</p>
          <p><strong>Arrived via:</strong> ${record.referrer_url || 'Direct'}</p>
          <p><strong>Page:</strong> ${record.page_path}</p>
          <p><strong>Status:</strong> ${isUnlock ? '<span style="color: green; font-weight: bold;">Visitor successfully unlocked your Impact Dashboard!</span>' : 'Standard View'}</p>
          <hr />
          <p style="font-size: 10px; color: gray;">Sent via Supabase Edge Functions & Resend</p>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
