import { useState } from 'react';
import { Linkedin, Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    honeypot: '' // Hidden field for bot prevention
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (formData.message.length < 20) {
      setErrorMessage('Please provide a more detailed message (minimum 20 characters).');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Honeypot check
    if (formData.honeypot) {
      // Silently reject bots
      setStatus('success');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');

    // Check if we are running in a demo/preview environment without keys
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_EMAILJS_SERVICE_ID;

    if (isDemoMode) {
      // Simulate network delay for UI testing in AI Studio
      setTimeout(() => {
        setStatus('success');
      }, 1500);
      return;
    }

    try {
      // 1. THE "LEAD ARCHIVE" LOGIC (Supabase)
      const { error: dbError } = await supabase
        .from('inquiries')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            company: formData.company,
            subject: formData.subject,
            message: formData.message,
          }
        ]);

      if (dbError) throw new Error('Database insert failed');

      // 2. THE "INSTANT ALERT" LOGIC (EmailJS)
      // REQUIREMENT: Input your SERVICE_ID, TEMPLATE_ID, and PUBLIC_KEY here
      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
      const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          full_name: formData.full_name,
          email: formData.email,
          company: formData.company,
          subject: formData.subject,
          message: formData.message,
        },
        PUBLIC_KEY
      );

      setStatus('success');
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-12 pb-24">
      
      {/* HEADER AREA */}
      <div className="w-full bg-bg-primary py-16 mb-12 border-b border-border transition-colors duration-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4"
          >
            Start a Strategic Conversation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-text-secondary max-w-3xl"
          >
            Welcome opportunities of exploring collaboration, partnerships and inquiries for digital transformation advisory.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* LEFT COLUMN: FORM (60%) */}
          <div className="w-full lg:w-3/5">
            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-bg-surface border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Message Received.</h2>
                <p className="text-xl text-text-secondary max-w-md mx-auto leading-relaxed">
                  Thank you, Paul has received your inquiry. Strategy takes time—expect a deliberate response within 48 business hours.
                </p>
                <button 
                  onClick={() => {
                    setStatus('idle');
                    setFormData({ full_name: '', email: '', company: '', subject: '', message: '', honeypot: '' });
                  }}
                  className="mt-8 text-accent hover:underline font-medium"
                >
                  Submit another inquiry
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-bg-surface border border-border rounded-xl p-8 md:p-10 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-text-primary mb-8">Executive Inquiry</h2>
                
                {status === 'error' && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-3 text-red-400">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm">System Busy. We encountered an issue transmitting your inquiry. Please try again or use the direct email link.</p>
                  </div>
                )}
                
                {errorMessage && status !== 'error' && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-3 text-amber-400">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* HONEYPOT FIELD */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="honeypot">Do not fill this out if you are human</label>
                    <input 
                      type="text" 
                      id="honeypot" 
                      name="honeypot" 
                      tabIndex={-1} 
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                      <input 
                        type="text" 
                        id="full_name" 
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Professional Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">Company / Organization</label>
                    <input 
                      type="text" 
                      id="company" 
                      required
                      value={formData.company}
                      onChange={handleChange}
                      disabled={status === 'submitting'}
                      className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">Subject of Inquiry</label>
                    <select 
                      id="subject" 
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={status === 'submitting'}
                      className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select an option</option>
                      <option value="partnership">Partnership</option>
                      <option value="advisory">Advisory</option>
                      <option value="speaking">Speaking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">Message</label>
                    <textarea 
                      id="message" 
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      disabled={status === 'submitting'}
                      className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none disabled:opacity-50"
                    ></textarea>
                  </div>

                  <div className="pt-4 text-center">
                    <button 
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full md:w-auto px-12 py-4 bg-accent text-white font-bold rounded-md hover:bg-accent/90 transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 mx-auto"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Transmitting Inquiry...
                        </>
                      ) : (
                        'EMAIL ME'
                      )}
                    </button>
                    <p className="mt-6 text-xs italic text-text-secondary">
                      "I personally review all strategic inquiries and typically respond within 48 business hours."
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: DIRECT ACCESS (40%) */}
          <div className="w-full lg:w-2/5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="sticky top-24 space-y-12"
            >
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-6">Direct Professional Links</h3>
                <div className="space-y-6">
                  <a 
                    href="https://www.linkedin.com/in/paulzyw" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-6 bg-bg-surface border border-border rounded-xl hover:border-accent group transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#0A66C2]/10 text-[#0A66C2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Linkedin size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1">LinkedIn</h4>
                      <p className="text-accent text-sm font-medium flex items-center gap-1">
                        View Professional Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </a>

                  <a 
                    href="mailto:paul.zy.wang@hotmail.com" 
                    className="flex items-center gap-4 p-6 bg-bg-surface border border-border rounded-xl hover:border-accent group transition-colors"
                  >
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1">Email</h4>
                      <p className="text-text-secondary text-sm">paul.zy.wang@hotmail.com</p>
                    </div>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-6">Trusted by leaders at...</h3>
                <div className="grid grid-cols-3 gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Partner logos */}
                  <div className="h-12 bg-border/50 rounded flex items-center justify-center text-xs font-bold text-text-secondary text-center px-2 leading-tight">SUEZ Environment</div>
                  <div className="h-12 bg-border/50 rounded flex items-center justify-center text-xs font-bold text-text-secondary text-center px-2 leading-tight">Veolia</div>
                  <div className="h-12 bg-border/50 rounded flex items-center justify-center text-xs font-bold text-text-secondary text-center px-2 leading-tight">Alstom</div>
                  <div className="h-12 bg-border/50 rounded flex items-center justify-center text-xs font-bold text-text-secondary text-center px-2 leading-tight">General Electric</div>
                  <div className="h-12 bg-border/50 rounded flex items-center justify-center text-xs font-bold text-text-secondary text-center px-2 leading-tight">Aspentech</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
