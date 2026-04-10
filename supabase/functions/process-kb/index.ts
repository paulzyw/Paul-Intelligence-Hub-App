import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !geminiKey) throw new Error('Missing Secrets.')

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting Direct-API KB processing...')

    // 1. Download the Knowledge Base file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('knowledge-base')
      .download('knowledge_base.txt')

    if (downloadError) throw new Error(`Failed to download KB: ${downloadError.message}`)
    const text = await fileData.text()

    // 2. Chunk the text
    const chunks = text.split(/---+\n?/).filter(c => c.trim().length > 10)
    if (chunks.length === 0) throw new Error('No chunks found. Ensure you use "---" as a separator.')

    console.log(`Syncing ${chunks.length} chunks...`)

    // 3. Clear existing chunks AND cached responses
    await Promise.all([
      supabase.from('knowledge_chunks').delete().neq('id', 0),
      supabase.from('response_cache').delete().neq('id', 0)
    ])

    // 4. Parallel Processing with Direct Fetch
    const concurrencyLimit = 5 // Lowered for safety
    const results = []

    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batch = chunks.slice(i, i + concurrencyLimit)
      
      const batchPromises = batch.map(async (chunk) => {
        try {
          // DIRECT REST API CALL using gemini-embedding-001 with explicit 768 dimensions
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: { parts: [{ text: chunk }] },
                output_dimensionality: 768
              })
            }
          )

          const result = await response.json()
          if (!response.ok) throw new Error(result.error?.message || 'Embedding failed')
          
          const embedding = result.embedding.values

          const { error: insertError } = await supabase
            .from('knowledge_chunks')
            .insert({ content: chunk, embedding: embedding })

          if (insertError) throw insertError
          return true
        } catch (e) {
          console.error('Chunk error:', e.message)
          return false
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(r => r === true))

      if (i + concurrencyLimit < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully synced ${results.length} of ${chunks.length} chunks.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Process KB Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
