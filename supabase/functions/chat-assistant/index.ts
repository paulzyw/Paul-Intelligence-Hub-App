import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as genai from "npm:@google/genai"

const { GoogleGenAI } = genai;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_INSTRUCTION = `
# ROLE
You are Paul Wang's Professional AI Associate. You are a senior peer explaining Paul's work. Your goal is to be insightful and direct, avoiding the "robotic assistant" feel.

# CORE BEHAVIOR
- GROUNDING: Use Paul's Knowledge Base (KB) as your only source of truth.
- CREATIVE SYNTHESIS: Speak like a person who knows Paul well. Don't just summarize; explain his logic naturally.
- AVOID FORMULAS: Do not start every answer with "Paul's approach is..." or "Paul drives...". Vary your sentence structure.
- AVOID BOT-SPEAK: Avoid phrases like "Central to his approach...", "A core pillar...", or "In conclusion...". Just talk.
- DYNAMIC BREVITY: If a question is simple, answer in one short, punchy paragraph. Be extremely concise.

# TONE & STYLE
- Boardroom Peer: Speak like a high-level executive. Be sharp, concise, and outcome-oriented.
- Human Flow: Use natural transitions. Imagine you're answering a colleague over coffee.
- Formatting: Use **bolding** sparingly for the most critical strategic terms. No bullet points unless absolutely necessary.

# GROUNDING RULE
If a topic isn't in the KB, bridge naturally: "Paul hasn't explicitly documented his stance on [Topic], but his work in [Related Area] suggests a focus on..." 
If it's completely unrelated: “This topic is outside the scope of Paul Wang’s professional focus.”

# KEY THEMES
Subtly weave in **Partner Ecosystems**, **Data-Driven Execution**, and **Operational Rigor** only when they naturally fit the conversation.
`;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId } = await req.json()
    const userQuery = message.trim().toLowerCase()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !geminiKey) throw new Error('Missing Secrets.')

    const supabase = createClient(supabaseUrl, supabaseKey)
    const ai = new GoogleGenAI({ apiKey: geminiKey })

    // --- LAYER 1: INTENT ROUTING (Hardcoded) ---
    if (userQuery.includes("who are you") || userQuery === "hi" || userQuery === "hello") {
      return new Response(
        JSON.stringify({ response: "I am Paul Wang's AI Assistant. I can help you with questions about his experience, projects, and skills." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userQuery.includes("contact") || userQuery.includes("email")) {
      return new Response(
        JSON.stringify({ response: "You can contact Paul via the contact form on this website or directly at paul.zy.wang@gmail.com." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- LAYER 2: RESPONSE CACHING (Disabled for testing streaming) ---
    /*
    const { data: cachedResponse } = await supabase
      .from('response_cache')
      .select('response_text')
      .eq('query_text', userQuery)
      .single()

    if (cachedResponse) {
      return new Response(
        JSON.stringify({ response: cachedResponse.response_text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    */

    // --- LAYER 3: SEMANTIC RETRIEVAL (RAG) ---
    console.log('Generating embedding...')
    // 1. Generate Embedding for the query (Direct API Call)
    let queryEmbedding;
    try {
      const embResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text: message }] },
            output_dimensionality: 768
          })
        }
      )
      const embResult = await embResponse.json()
      if (!embResponse.ok) throw new Error(embResult.error?.message || 'Embedding failed')
      queryEmbedding = embResult.embedding.values
    } catch (e) {
      console.error('Embedding error:', e)
      throw new Error(`Failed to generate embedding: ${e.message}`)
    }

    console.log('Searching knowledge base...')
    // 2. Search similarity in Supabase
    const { data: chunks, error: searchError } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2, // Slightly more permissive
      match_count: 5 // More context for better synthesis
    })

    if (searchError) {
      console.error('Search error:', searchError)
      throw new Error(`Database search failed: ${searchError.message}`)
    }

    const context = chunks?.map((c: any) => c.content).join("\n\n") || "No specific context found."

    // --- LAYER 4: STREAMING GENERATION ---
    console.log('Starting streaming generation...')
    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: "gemini-flash-latest",
        contents: `Context: ${context}\n\nQuestion: ${message}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.85,
        }
      })
    } catch (e) {
      if (e.message?.includes("503") || e.message?.includes("high demand")) {
        return new Response(
          JSON.stringify({ response: "The AI service is currently experiencing high demand. Please wait a moment and try your question again." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw e;
    }

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponse = ""
        try {
          for await (const chunk of stream) {
            const text = chunk.text
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
          
          // Save to cache and history after streaming completes
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          
          // Background tasks
          await Promise.all([
            supabase.from('response_cache').upsert({ query_text: userQuery, response_text: fullResponse }),
            supabase.from('chat_history').insert([
              { session_id: sessionId, message: message, role: 'user' },
              { session_id: sessionId, message: fullResponse, role: 'assistant' }
            ])
          ])
          
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
