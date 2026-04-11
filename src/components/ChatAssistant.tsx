import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Loader2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am Paul\'s Smart Assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(Math.random().toString(36).substring(7));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdminTrigger = () => {
    setAdminCount(prev => {
      if (prev + 1 >= 5) {
        setIsAdminMode(true);
        return 0;
      }
      return prev + 1;
    });
  };

  const processKB = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-kb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process Knowledge Base');
      }

      alert(data.message || 'Knowledge Base processed successfully!');
      setIsAdminMode(false);
    } catch (err: any) {
      console.error('Processing error:', err);
      alert(`Processing error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

// the previous HandleSend function before streaming effect optimization 20260411

  const handleSend = async () => {
    if (!input.trim() || isLoading || cooldown > 0) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setCooldown(5);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId.current
        })
      });

      if (!response.ok) throw new Error('Failed to connect to assistant');

      // Check if it's a stream or a direct JSON response (for intents/cache)
      const contentType = response.headers.get('Content-Type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        setIsLoading(false);
        return;
      }

      // Handle Streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        // Hide "Thinking..." as soon as we get the first chunk of data
        setIsLoading(false);

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                assistantMessage += data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing stream chunk', e, dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

/*
// HandleSend function with optimizaed Streaming Effect

const handleSend = async () => {
  if (!input.trim() || isLoading || cooldown > 0) return;

  const userMessage = input.trim();
  setInput('');
  setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
  setIsLoading(true);
  setCooldown(5);

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: sessionId.current
      })
    });

    if (!response.ok) throw new Error('Failed to connect to assistant');

    const contentType = response.headers.get('Content-Type');
    
    // Handle standard JSON (Intents/Cache)
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      setIsLoading(false);
      return;
    }

    // --- Optimized Streaming Logic ---
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    let buffer = ''; // Buffer to handle partial chunks

    // Add an empty message for the assistant that we will fill up
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      // The moment we get ANY data, stop the "Thinking..." loader
      setIsLoading(false);

      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (Standard SSE format)
      const lines = buffer.split('\n\n');
      
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const message = line.replace(/^data: /, '').trim();
        
        if (message === '[DONE]') continue;
        if (!message) continue;

        try {
          const parsed = JSON.parse(message);
          if (parsed.text) {
            assistantMessage += parsed.text;
            
            // Functional state update is crucial for streaming performance
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1].content = assistantMessage;
              return updated;
            });
          }
        } catch (e) {
          console.warn('Skipping malformed stream chunk:', message);
        }
      }
    }
  } catch (err) {
    console.error('Chat error:', err);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
  } finally {
    setIsLoading(false);
  }
};
*/
// below not in the optimization scope
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-bg-surface border-b border-border text-text-primary flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-sm">
                  <Bot size={18} />
                </div>
                <div 
                  className="cursor-pointer select-none"
                  onClick={handleAdminTrigger}
                >
                  <h3 className="font-bold text-sm">Paul's Assistant</h3>
                  <p className="text-[10px] text-text-secondary">Powered by Gemini AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent/10 rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-border bg-bg-surface/50 backdrop-blur-sm">
              {isAdminMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-accent/5 border border-accent/20 rounded-xl flex flex-col gap-2 mb-4"
                >
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest">System Sync</p>
                  <button
                    onClick={processKB}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Update Knowledge Base'
                    )}
                  </button>
                  <button 
                    onClick={() => setIsAdminMode(false)}
                    className="text-[10px] text-text-secondary hover:text-text-primary text-center transition-colors"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm",
                    msg.role === 'user' ? "bg-accent text-white" : "bg-bg-surface text-text-primary border border-border"
                  )}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none",
                    msg.role === 'user' 
                      ? "bg-accent text-white rounded-tr-none prose-invert" 
                      : "bg-bg-primary text-text-primary border border-border rounded-tl-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary"
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mr-auto max-w-[90%]"
                >
                  <div className="w-8 h-8 rounded-full bg-bg-surface text-text-primary border border-border flex items-center justify-center shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="bg-bg-primary border border-border p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-accent" />
                    <span className="text-xs text-text-secondary">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-bg-surface">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "Ask me anything about Paul..."}
                  disabled={isLoading || cooldown > 0}
                  className="w-full pl-4 pr-12 py-3 bg-bg-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || cooldown > 0}
                  className="absolute right-2 p-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              {cooldown > 0 && (
                <p className="text-[10px] text-center mt-2 text-text-secondary">
                  Rate limit protection active. Please wait {cooldown} seconds.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
