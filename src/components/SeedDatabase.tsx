import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

export const SeedDatabase = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const seedData = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      // 1. Categories
      const { data: existingCats } = await supabase.from('categories').select('id');
      if (!existingCats || existingCats.length === 0) {
        const categories = [
          { name: 'Strategy', slug: 'strategy' },
          { name: 'Transformation', slug: 'transformation' },
          { name: 'SaaS Growth', slug: 'saas-growth' },
          { name: 'Productivity', slug: 'productivity' }
        ];
        await supabase.from('categories').insert(categories);
      }

      // 2. Report Types
      const { data: existingTypes } = await supabase.from('report_types').select('id');
      if (!existingTypes || existingTypes.length === 0) {
        const types = [
          { name: 'Technical Brief', slug: 'technical-brief', icon_name: 'FlaskConical' },
          { name: 'Case Study', slug: 'case-study', icon_name: 'BarChart3' },
          { name: 'Whitepaper', slug: 'whitepaper', icon_name: 'FileText' },
          { name: 'Operations Guide', slug: 'ops-guide', icon_name: 'Gauge' }
        ];
        await supabase.from('report_types').insert(types);
      }

      // Fetch IDs for references
      const { data: cats } = await supabase.from('categories').select('id, name');
      const { data: rTypes } = await supabase.from('report_types').select('id, name');

      if (!cats || !rTypes) throw new Error('Failed to stabilize references');

      // 3. Posts
      const { data: existingPosts } = await supabase.from('posts').select('id');
      if (!existingPosts || existingPosts.length === 0) {
        const strategyId = cats.find(c => c.name === 'Strategy')?.id;
        const posts = [
          {
            title: 'The Future of Digital Transformation',
            slug: 'future-of-digital-transformation',
            summary: 'Exploring how AI and machine learning are reshaping the landscape of commercial enterprise solutions.',
            content: '<p>Digital transformation is no longer a choice—it is a survival mechanism. In this article, we explore the core pillars of a successful transformation journey...</p><h2>The Core Pillars</h2><p>1. Operational Excellence</p><p>2. Customer Centricity</p>',
            category: 'Strategy',
            category_id: strategyId,
            read_time: 5,
            thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
            featured: true,
            is_featured: true,
            created_at: new Date().toISOString()
          }
        ];
        await supabase.from('posts').insert(posts);
      }

      // 4. Research Reports
      const { data: existingReports } = await supabase.from('research_reports').select('id');
      if (!existingReports || existingReports.length === 0) {
        const techBriefId = rTypes.find(t => t.name === 'Technical Brief')?.id;
        const reports = [
          {
            title: 'SaaS Efficiency Benchmarks 2024',
            slug: 'saas-efficiency-benchmarks-2024',
            summary: 'An analytical review of operational efficiency across Series B and C SaaS companies, identifying key levers for sustainable growth.',
            feature_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            report_html_path: 'sample-report.html',
            highlight_metric: '32% Avg Increase',
            status: 'published',
            report_type_id: techBriefId,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ];
        await supabase.from('research_reports').insert(reports);
      }

      setStatus('success');
      setMessage('Sample data seeded successfully!');
      onComplete();
    } catch (err: any) {
      console.error('Seeding error:', err);
      setStatus('error');
      setMessage(err.message || 'Error occurred while seeding database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-accent/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-accent/10 rounded-full text-accent">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">New Project?</h3>
          <p className="text-sm text-text-secondary">It looks like your database might be empty. Populate it with professional sample data to see the site in action.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={seedData}
          disabled={loading}
          className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? 'Seeding...' : 'Seed Sample Content'}
        </button>
        
        {status === 'success' && (
          <div className="text-xs text-green-500 flex items-center gap-1">
            <Check size={12} /> {message}
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} /> {message}
          </div>
        )}
      </div>
    </div>
  );
};
