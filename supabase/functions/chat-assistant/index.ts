import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as genai from "npm:@google/genai"

const { GoogleGenAI } = genai;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// REFINED SYSTEM INSTRUCTIONS - HUMAN & PROFESSIONAL
const SYSTEM_INSTRUCTION = `
You are the personal Smart Assistant for Paul Wang's professional portfolio. 

TONE & STYLE:
- Professional, warm, and highly intelligent.
- Speak in natural, flowing paragraphs. 
- NEVER use robotic headers like "Step 1," "Direct Answer," or "Business Implication."
- Avoid being overly formal; think "High-end Executive Assistant" rather than "Technical Manual."
- Be concise. If a question can be answered in two sentences, do that.

STRICT RULES:
1. Use ONLY the provided Knowledge Base for facts about Paul.
2. If asked something not in the Knowledge Base, say: "I don't have that specific detail on hand, but Paul's expertise generally lies in [Topic]. Would you like to know more about that?"
3. Do not mention you are an AI unless explicitly asked.
4. Use simple bullet points only if listing more than 3 items.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId } = await req.json()

    // 1. Initialize Supabase & Gemini
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      throw new Error('Missing Secrets: Ensure GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set.')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const ai = new GoogleGenAI({ apiKey: geminiKey })

    // 2. Fetch Knowledge Base
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('knowledge-base')
      .download('knowledge_base.txt')

    if (fileError) {
      console.error('Storage Error:', fileError)
      throw new Error('Knowledge Base file not found in storage.')
    }
    
    const knowledgeBaseText = await fileData.text()

    // 3. Generate Response with Retry Logic
    const generateWithRetry = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          // Using gemini-3-flash-preview as the standard supported model
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
            KNOWLEDGE BASE:
            ${knowledgeBaseText}

            USER QUESTION:
            ${message}
            `,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
            }
          })
          return response.text
        } catch (err) {
          const is503 = err.message?.includes('503') || err.status === 503;
          if (is503 && i < retries - 1) {
            console.log(`Gemini 503 error, retrying in ${delay}ms... (Attempt ${i + 1})`)
            await new Promise(resolve => setTimeout(resolve, delay))
            delay *= 2 // Exponential backoff
            continue
          }
          throw err
        }
      }
    }
    
    const responseText = await generateWithRetry() || "I'm sorry, I couldn't process that request."

    // 4. Log to History (Async - don't wait for it to respond faster)
    supabase
      .from('chat_history')
      .insert([
        { session_id: sessionId, message: message, role: 'user' },
        { session_id: sessionId, message: responseText, role: 'assistant' }
      ]).then(({ error }) => { if (error) console.error('History Log Error:', error) })

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
