import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { page_path, referrer_url, is_unlock_event } = await req.json()
    
    // Get IP from request if possible (Supabase Edge headers)
    const clientIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip')

    let geoData = { city: null, region: null, country: null }
    
    if (clientIp && clientIp !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`)
        const geoJson = await geoRes.json()
        geoData = {
          city: geoJson.city,
          region: geoJson.region,
          country: geoJson.country_name
        }
      } catch (err) {
        console.error('Geo lookup failed:', err)
      }
    }

    const { data, error } = await supabase
      .from('traffic_logs')
      .insert([
        {
          page_path,
          referrer_url,
          country: geoData.country,
          region: geoData.region,
          city: geoData.city,
          is_unlock_event: !!is_unlock_event
        }
      ])

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
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
