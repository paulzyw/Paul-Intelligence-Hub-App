import { useState, useEffect, useRef } from 'react';
import { supabase, type Post, type Category, type ResearchReport, type ReportType, type AccessCode, type ContentType, type ContentStatus } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, UploadCloud, Image as ImageIcon, FolderPlus, Sparkles, BarChart3, Key, Copy, Check, ShieldAlert, Orbit, Compass, Globe, FileText, Lightbulb, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AccessCodeGenerator = () => {
  const [hours, setHours] = useState<number>(24);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    setCopied(false);
    
    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expires_at
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    
    const { error } = await supabase
      .from('temp_access_codes')
      .insert([{ 
        code, 
        expires_at: expiresAt.toISOString() 
      }]);
      
    if (error) {
      alert('Error generating code: ' + error.message);
    } else {
      setGeneratedCode(code);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Key size={20} className="text-accent" /> Impact Page Access Control
      </h2>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-1">Validity Period (Hours)</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              min="1"
              max="720"
              className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={generateCode}
            disabled={loading}
            className="px-6 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 font-bold"
          >
            {loading ? 'Generating...' : 'Generate Access Code'}
          </button>
        </div>

        {generatedCode && (
          <div className="p-8 bg-bg-primary rounded-xl border border-accent/20 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="text-xs uppercase tracking-[0.3em] font-black text-text-secondary">Generated Code</div>
            <div className="text-6xl font-mono font-black tracking-widest text-accent">
              {generatedCode}
            </div>
            <div className="text-sm text-text-secondary">
              Expires in {hours} hours (at {new Date(Date.now() + hours * 3600000).toLocaleString()})
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border rounded-lg hover:border-accent transition-all text-sm"
            >
              {copied ? <><Check size={16} className="text-green-500" /> Copied!</> : <><Copy size={16} /> Copy to Clipboard</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
import { TiptapEditor } from '../components/TiptapEditor';
import { ReportTypeManager } from '../components/ReportTypeManager';
import { ResearchManager } from '../components/ResearchManager';
import { TrafficMonitor } from '../components/TrafficMonitor';
import { SeedDatabase } from '../components/SeedDatabase';
import { BusinessChallengeManager } from '../components/admin/BusinessChallengeManager';
import { BusinessChallengeSelector } from '../components/admin/BusinessChallengeSelector';
import { 
  fetchArticleBusinessChallenges, 
  saveArticleBusinessChallenges, 
  type SelectedBusinessChallenge 
} from '../lib/businessChallenges';

const CategoryManager = ({ categories, fetchCategories }: { categories: Category[], fetchCategories: () => void }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setLoading(true);
    
    const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName, slug }]);
    
    if (error) alert('Error adding category: ' + error.message);
    else {
      setNewCategoryName('');
      fetchCategories();
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if posts are using this category
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
      
    if (countError) {
      alert('Error checking category usage: ' + countError.message);
      return;
    }
    
    if (count && count > 0) {
      alert(`Cannot delete this category. It is currently linked to ${count} post(s). Please reassign them first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('Error deleting category: ' + error.message);
    else fetchCategories();
  };

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <FolderPlus size={20} className="text-accent" /> Category Manager
      </h2>
      
      <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={18} /> Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-text-secondary">No categories found.</p>
        ) : (
          categories.map(category => (
            <div key={category.id} className="flex justify-between items-center p-3 bg-bg-primary rounded-md border border-border">
              <div>
                <span className="font-medium text-text-primary">{category.name}</span>
                <span className="text-xs text-text-secondary ml-2">/{category.slug}</span>
              </div>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                title="Delete Category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export function Admin() {
  const navigate = useNavigate();
  const { 
    heroBackground, 
    setHeroBackground, 
    meteorDensity, 
    setMeteorDensity, 
    meteorSpeed, 
    setMeteorSpeed,
    galaxyStarSpeed,
    setGalaxyStarSpeed,
    galaxyDensity,
    setGalaxyDensity,
    galaxyGlowIntensity,
    setGalaxyGlowIntensity,
    galaxySaturation,
    setGalaxySaturation
  } = useTheme();
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<Post>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [autoSyncReadTime, setAutoSyncReadTime] = useState(true);
  const [contentFilter, setContentFilter] = useState<'all' | 'post' | 'insight'>('all');
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState<SelectedBusinessChallenge[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateReadingTime = (content: string) => {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return Math.ceil(words / 225) || 1;
  };

  // Initialization of data
  useEffect(() => {
    if (user && isSuperAdmin()) {
      fetchPosts();
      fetchCategories();
      fetchReports();
      fetchReportTypes();
    }
  }, [user, profile]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching posts:', error);
    else setPosts(data || []);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('research_reports')
      .select('*, report_types(*)')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching reports:', error);
    else setReports(data || []);
  };

  const fetchReportTypes = async () => {
    const { data, error } = await supabase
      .from('report_types')
      .select('*')
      .order('name');
      
    if (error) console.error('Error fetching report types:', error);
    else setReportTypes(data || []);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Admin logout API failure, clearing offline:', err);
    } finally {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.error('Failed to clear stale storage keys on admin signout:', e);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    
    if ('dataTransfer' in event) {
      event.preventDefault();
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        file = event.dataTransfer.files[0];
      }
    } else if (event.target.files && event.target.files.length > 0) {
      file = event.target.files[0];
    }

    if (!file) return;

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setCurrentPost({ ...currentPost, thumbnail_url: data.publicUrl });
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPost.category_id) {
      alert("Error: Category ID not found. Please re-select a category.");
      return;
    }

    setLoading(true);
    
    // Remove joined relations that shouldn't be saved to the posts table
    const { categories, ...postDataToSave } = currentPost as any;
    
    const postData = {
      ...postDataToSave,
      content_type: postDataToSave.content_type || 'post',
      status: postDataToSave.status || 'published',
      published_at: postDataToSave.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_id: postDataToSave.author_id || postDataToSave.author || 'Paul Wang',
      author: postDataToSave.author || postDataToSave.author_id || 'Paul Wang',
      // Ensure slug is generated if not provided
      slug: postDataToSave.slug || postDataToSave.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    };

    let saveError: any = null;
    let savedPostId: string | null = currentPost.id || null;

    if (currentPost.id) {
      // Update
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', currentPost.id);
      saveError = error;
    } else {
      // Insert
      const { data: inserted, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('id')
        .single();
      saveError = error;
      if (inserted?.id) {
        savedPostId = inserted.id;
      }
    }

    // Graceful fallback: If Supabase database hasn't had the additive columns applied yet via SQL Editor
    if (saveError && (saveError.message?.includes('does not exist') || saveError.code === '42703')) {
      console.warn('Database table missing additive fields. Saving core fields. Please execute migrations in Supabase SQL Editor.', saveError.message);
      const { 
        content_type, 
        status, 
        published_at, 
        updated_at, 
        seo_title, 
        seo_description, 
        canonical_url, 
        og_title, 
        og_description, 
        og_image, 
        target_keyword, 
        author_id,
        author,
        ...coreData 
      } = postData;
      
      const retry = currentPost.id
        ? await supabase.from('posts').update(coreData).eq('id', currentPost.id)
        : await supabase.from('posts').insert([coreData]).select('id').single();
        
      if (retry.error) {
        alert(retry.error.message);
        setLoading(false);
        return;
      } else {
        alert('Saved successfully! (Notice: Please run the SQL migration in supabase/migrations/20261102_unified_content_model.sql in your Supabase SQL Editor to enable persistent SEO/content-type database columns).');
        saveError = null;
        if ((retry as any).data?.id) {
          savedPostId = (retry as any).data.id;
        }
      }
    } else if (saveError) {
      alert(saveError.message);
      setLoading(false);
      return;
    }

    // Associate Business Challenges for Insight articles
    if (postData.content_type === 'insight' && savedPostId) {
      const { success, error: challengeSaveError } = await saveArticleBusinessChallenges(
        savedPostId,
        selectedChallenges
      );
      if (!success && challengeSaveError) {
        alert('Post content saved, but updating Business Challenges failed: ' + challengeSaveError.message);
      }
    }

    // Ensure only one featured post per content type (one featured Insight, one featured Blog Post = two featured in total)
    if (postData.is_featured && savedPostId) {
      const targetType = postData.content_type || 'post';
      try {
        const { data: allPosts } = await supabase
          .from('posts')
          .select('id, content_type, is_featured');

        if (allPosts) {
          const postsToUnfeature = allPosts.filter(p => {
            if (p.id === savedPostId) return false;
            const pType = p.content_type || 'post';
            return pType === targetType && p.is_featured;
          });

          for (const p of postsToUnfeature) {
            await supabase
              .from('posts')
              .update({ is_featured: false })
              .eq('id', p.id);
          }
        }
      } catch (err: any) {
        console.warn('Error managing exclusive featured per content type:', err.message);
      }
    }
    
    setLoading(false);
    setIsEditing(false);
    setCurrentPost({});
    setSelectedChallenges([]);
    fetchPosts();
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchPosts();
  };

  return (
    <div className="bg-bg-primary py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Traffic Monitoring</h1>
        </div>

        {!isEditing && (
          <>
            <TrafficMonitor />
            
            {/* HERO BACKGROUND SWITCHER */}
            <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8 transition-colors duration-400">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Orbit size={20} className="text-accent animate-spin" style={{ animationDuration: '8s' }} /> Hero Section Background Intelligence
              </h2>
              <p className="text-sm text-text-secondary mb-6 max-w-2xl">
                Dynamically switch the visual ambient mode of the portfolio landing page hero section. This controls the active WebGL rendering engine globally.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GALAXY BUTTON */}
                <button
                  type="button"
                  onClick={() => setHeroBackground('galaxy')}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-300 flex items-start gap-4 focus:outline-none ${
                    heroBackground === 'galaxy'
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-transparent hover:border-text-secondary/30 hover:bg-bg-primary/40'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    heroBackground === 'galaxy' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'
                  } transition-colors`}>
                    <Orbit size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary text-base flex items-center gap-2">
                      Interactive WebGL Galaxy
                      {heroBackground === 'galaxy' && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-accent/20 text-accent rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Next-gen interactive stardust simulation powered by native GPU shaders. Responds to mouse physics and auto-rotation.
                    </p>
                  </div>
                </button>

                {/* METEOR BUTTON */}
                <button
                  type="button"
                  onClick={() => setHeroBackground('meteor')}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-300 flex items-start gap-4 focus:outline-none ${
                    heroBackground === 'meteor'
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-transparent hover:border-text-secondary/30 hover:bg-bg-primary/40'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    heroBackground === 'meteor' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'
                  } transition-colors`}>
                    <Compass size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary text-base flex items-center gap-2">
                      Dynamic Meteor Shower
                      {heroBackground === 'meteor' && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-accent/20 text-accent rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Ambient canvas particle animation rendering falling shooting stars. Smooth and peaceful performance profile.
                    </p>
                  </div>
                </button>
              </div>

              {/* METEOR CUSTOMIZATION SLIDERS */}
              {heroBackground === 'meteor' && (
                <div className="mt-6 pt-6 border-t border-border/60">
                  <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" /> Meteor Shower Calibration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Density Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="meteor-density" className="font-medium text-text-secondary">Meteor Density</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {meteorDensity.toFixed(1)}x ({Math.max(1, Math.round(10 * meteorDensity))} meteors)
                        </span>
                      </div>
                      <input
                        id="meteor-density"
                        type="range"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                        value={meteorDensity}
                        onChange={(e) => setMeteorDensity(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Sparse (0.1x)</span>
                        <span>Standard (1.0x)</span>
                        <span>Extreme Shower (10.0x)</span>
                      </div>
                    </div>

                    {/* Speed Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="meteor-speed" className="font-medium text-text-secondary">Meteor Velocity / Speed</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {meteorSpeed.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        id="meteor-speed"
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={meteorSpeed}
                        onChange={(e) => setMeteorSpeed(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Slow</span>
                        <span>Standard (1.0x)</span>
                        <span>Hypersonic</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GALAXY CUSTOMIZATION SLIDERS */}
              {heroBackground === 'galaxy' && (
                <div className="mt-6 pt-6 border-t border-border/60">
                  <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" /> WebGL Galaxy Calibration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Star Speed Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="galaxy-star-speed" className="font-medium text-text-secondary">Star Travel Speed</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {galaxyStarSpeed.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        id="galaxy-star-speed"
                        type="range"
                        min="0.05"
                        max="3.00"
                        step="0.05"
                        value={galaxyStarSpeed}
                        onChange={(e) => setGalaxyStarSpeed(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Slow</span>
                        <span>Standard (0.60x)</span>
                        <span>Hyper</span>
                      </div>
                    </div>

                    {/* Galaxy Density Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="galaxy-density" className="font-medium text-text-secondary">Stardust Density</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {galaxyDensity.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        id="galaxy-density"
                        type="range"
                        min="0.10"
                        max="5.00"
                        step="0.10"
                        value={galaxyDensity}
                        onChange={(e) => setGalaxyDensity(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Sparse</span>
                        <span>Standard (0.80x)</span>
                        <span>Supercluster</span>
                      </div>
                    </div>

                    {/* Glow Intensity Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="galaxy-glow" className="font-medium text-text-secondary">Shimmer Glow Intensity</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {galaxyGlowIntensity.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        id="galaxy-glow"
                        type="range"
                        min="0.00"
                        max="2.00"
                        step="0.05"
                        value={galaxyGlowIntensity}
                        onChange={(e) => setGalaxyGlowIntensity(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Flat</span>
                        <span>Standard (0.20x)</span>
                        <span>Radiant</span>
                      </div>
                    </div>

                    {/* Saturation Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="galaxy-saturation" className="font-medium text-text-secondary">Color Saturation</label>
                        <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-semibold">
                          {galaxySaturation.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        id="galaxy-saturation"
                        type="range"
                        min="0.00"
                        max="1.00"
                        step="0.05"
                        value={galaxySaturation}
                        onChange={(e) => setGalaxySaturation(parseFloat(e.target.value))}
                        className="w-full accent-accent bg-bg-primary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-text-secondary/60">
                        <span>Monochrome</span>
                        <span>Standard (0.00x)</span>
                        <span>Full Spectrum</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SeedDatabase onComplete={() => {
              fetchPosts();
              fetchCategories();
              fetchReports();
              fetchReportTypes();
            }} />
            <AccessCodeGenerator />

            <div className="flex justify-between items-center mb-8 mt-12">
              <h1 className="text-3xl font-bold text-text-primary">Insights & Post CMS</h1>
            </div>

            <CategoryManager categories={categories} fetchCategories={fetchCategories} />
            <BusinessChallengeManager />
          </>
        )}

        {isEditing ? (
          <div className="bg-bg-surface border border-border rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{currentPost.id ? 'Edit Post' : 'New Post'}</h2>
              <button 
                onClick={() => { setIsEditing(false); setCurrentPost({}); setSelectedChallenges([]); }}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSavePost} className="space-y-6">
              {/* Content Type Selector */}
              <div className="bg-bg-primary/50 border border-border rounded-xl p-4">
                <label className="block text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Layers size={18} className="text-accent" /> Content Classification & Publishing Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPost({ ...currentPost, content_type: 'post' })}
                    className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      (currentPost.content_type || 'post') === 'post'
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border bg-bg-surface hover:border-text-secondary/40'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${ (currentPost.content_type || 'post') === 'post' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary' }`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-text-primary flex items-center gap-1.5">
                        Founder Blog Post
                        {(currentPost.content_type || 'post') === 'post' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Personal insights, stories, & updates. URL: <span className="font-mono text-accent">/post/:slug</span>
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPost({ ...currentPost, content_type: 'insight' })}
                    className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      currentPost.content_type === 'insight'
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border bg-bg-surface hover:border-text-secondary/40'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${ currentPost.content_type === 'insight' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary' }`}>
                      <Lightbulb size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-text-primary flex items-center gap-1.5">
                        Revenue Insight
                        {currentPost.content_type === 'insight' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Professional analytical SEO articles. URL: <span className="font-mono text-accent">/insights/:slug</span>
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={currentPost.title || ''}
                    onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Slug (optional)</label>
                  <input 
                    type="text" 
                    value={currentPost.slug || ''}
                    onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                  <select
                    required
                    value={currentPost.category || ''}
                    onChange={(e) => {
                      const match = categories.find(cat => cat.name === e.target.value);
                      if (match) {
                        setCurrentPost({
                          ...currentPost, 
                          category: match.name,
                          category_id: match.id
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Author</label>
                  <input 
                    type="text" 
                    placeholder="Paul Wang"
                    value={currentPost.author_id || currentPost.author || ''}
                    onChange={(e) => setCurrentPost({
                      ...currentPost, 
                      author_id: e.target.value,
                      author: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-text-secondary mt-0.5 block">
                    Author attribution (stored in database author_id). Default: Paul Wang
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 bg-bg-primary rounded-md border border-border">
                    <input 
                      type="checkbox" 
                      id="is_featured"
                      checked={currentPost.is_featured || false}
                      onChange={(e) => setCurrentPost({...currentPost, is_featured: e.target.checked})}
                      className="w-5 h-5 rounded border-border text-accent focus:ring-accent bg-transparent"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-text-primary cursor-pointer">
                      Pin as Featured Insight
                    </label>
                    <span className="text-[10px] text-text-secondary ml-auto italic">Prioritizes recent featured</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-text-primary">Read Time (mins)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="auto_sync"
                            checked={autoSyncReadTime}
                            onChange={(e) => setAutoSyncReadTime(e.target.checked)}
                            className="w-3 h-3 rounded border-border text-accent focus:ring-accent bg-transparent"
                          />
                          <label htmlFor="auto_sync" className="text-[10px] text-text-secondary cursor-pointer">
                            Auto-sync
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          required
                          value={currentPost.read_time || ''}
                          onChange={(e) => {
                            setCurrentPost({...currentPost, read_time: parseInt(e.target.value)});
                            setAutoSyncReadTime(false); // Disable auto-sync if manually changed
                          }}
                          className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const time = calculateReadingTime(currentPost.content || '');
                            setCurrentPost({...currentPost, read_time: time});
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
                          title="Auto-calculate reading time"
                        >
                          <Sparkles size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-primary mb-1">Thumbnail URL</label>
                      <input 
                        type="url" 
                        required
                        value={currentPost.thumbnail_url || ''}
                        onChange={(e) => setCurrentPost({...currentPost, thumbnail_url: e.target.value})}
                        className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent mb-2"
                      />
                      <div 
                        className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-accent transition-colors flex flex-col items-center justify-center"
                        onDrop={handleImageUpload}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {uploadingImage ? (
                          <span className="text-sm text-text-secondary">Uploading...</span>
                        ) : currentPost.thumbnail_url ? (
                          <div className="flex flex-col items-center">
                            <ImageIcon size={24} className="text-accent mb-2" />
                            <span className="text-xs text-text-secondary">Image uploaded. Click or drag to replace.</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UploadCloud size={24} className="text-text-secondary mb-2" />
                            <span className="text-xs text-text-secondary">Drag & drop image here, or click to select</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Summary</label>
                <textarea 
                  rows={2}
                  required
                  value={currentPost.summary || ''}
                  onChange={(e) => setCurrentPost({...currentPost, summary: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent resize-none"
                ></textarea>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-text-primary">Content</label>
                </div>
                <TiptapEditor 
                  content={currentPost.content || ''}
                  onChange={(content) => {
                    const updates: any = { content };
                    if (autoSyncReadTime) {
                      updates.read_time = calculateReadingTime(content);
                    }
                    setCurrentPost({ ...currentPost, ...updates });
                  }}
                />
              </div>

              {/* Business Challenges Addressed (Only for Insight articles) */}
              {(currentPost.content_type === 'insight') && (
                <BusinessChallengeSelector
                  selectedChallenges={selectedChallenges}
                  onChange={setSelectedChallenges}
                />
              )}

              {/* Publication Status & SEO Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-primary/40 border border-border rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Publication Status</label>
                  <select
                    value={currentPost.status || 'published'}
                    onChange={(e) => setCurrentPost({ ...currentPost, status: e.target.value as ContentStatus })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-md bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="published">Published (Publicly live on site & indexed)</option>
                    <option value="draft">Draft (Private, not visible in public listings)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Target Keyword (SEO)</label>
                  <input
                    type="text"
                    placeholder="e.g. revenue operations, pipeline governance"
                    value={currentPost.target_keyword || ''}
                    onChange={(e) => setCurrentPost({ ...currentPost, target_keyword: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-md bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Expandable SEO & Search Engine Configuration */}
              <div className="border border-border rounded-xl bg-bg-primary/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSeoFields(!showSeoFields)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-bg-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={18} className="text-accent" />
                    <div>
                      <span className="font-semibold text-sm text-text-primary">SEO & Search Engine Metadata</span>
                      <span className="text-xs text-text-secondary block">Configure custom Google Search title, meta description, and canonical URL</span>
                    </div>
                  </div>
                  {showSeoFields ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
                </button>

                {showSeoFields && (
                  <div className="p-5 border-t border-border space-y-4 bg-bg-surface/50">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-text-primary">Custom SEO Title</label>
                        <span className="text-[10px] text-text-secondary">Fallback: Title + " | RevOS"</span>
                      </div>
                      <input
                        type="text"
                        placeholder={currentPost.title ? `${currentPost.title} | RevOS` : 'e.g. 5 Shifts in B2B Revenue Intelligence | RevOS'}
                        value={currentPost.seo_title || ''}
                        onChange={(e) => setCurrentPost({ ...currentPost, seo_title: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-text-primary">Custom SEO Meta Description</label>
                        <span className="text-[10px] text-text-secondary">Fallback: Post Summary</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder={currentPost.summary || 'Summary description displayed on Google search results...'}
                        value={currentPost.seo_description || ''}
                        onChange={(e) => setCurrentPost({ ...currentPost, seo_description: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-text-primary">Canonical URL (Optional override)</label>
                        <span className="text-[10px] text-text-secondary">Auto-generated if left blank</span>
                      </div>
                      <input
                        type="url"
                        placeholder={currentPost.slug ? `https://www.apprevos.ai/${(currentPost.content_type || 'post') === 'insight' ? 'insights' : 'post'}/${currentPost.slug}/` : 'https://www.apprevos.ai/...'}
                        value={currentPost.canonical_url || ''}
                        onChange={(e) => setCurrentPost({ ...currentPost, canonical_url: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setCurrentPost({}); setSelectedChallenges([]); }}
                  className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-bg-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="bg-bg-surface border border-border rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Layers size={20} className="text-accent" /> Unified Content Management
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Manage both Founder Blog Posts (/post/:slug) and Revenue Insights (/insights/:slug)
                </p>
              </div>
              <button 
                onClick={() => {
                  setCurrentPost({
                    content_type: contentFilter === 'insight' ? 'insight' : 'post',
                    status: 'published',
                    author_id: 'Paul Wang',
                    author: 'Paul Wang'
                  });
                  setSelectedChallenges([]);
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <Plus size={18} /> New Content
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-border bg-bg-primary/50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setContentFilter('all')}
                className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  contentFilter === 'all'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                All Content ({posts.length})
              </button>
              <button
                type="button"
                onClick={() => setContentFilter('post')}
                className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  contentFilter === 'post'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText size={14} /> Blog Posts ({posts.filter(p => (p.content_type || 'post') === 'post').length})
              </button>
              <button
                type="button"
                onClick={() => setContentFilter('insight')}
                className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  contentFilter === 'insight'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Lightbulb size={14} /> Revenue Insights ({posts.filter(p => p.content_type === 'insight').length})
              </button>
            </div>
            
            {posts.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                No content found. Create your first post!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-primary border-b border-border text-text-secondary text-sm">
                      <th className="p-4 font-medium">Title & Slug</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Author</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts
                      .filter(post => contentFilter === 'all' ? true : (post.content_type || 'post') === contentFilter)
                      .map((post) => (
                        <tr key={post.id} className="border-b border-border hover:bg-bg-primary/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-text-primary flex items-center gap-2">
                              {post.title}
                              {post.is_featured && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber/20 text-amber rounded">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary font-mono mt-0.5">
                              {post.content_type === 'insight' ? `/insights/${post.slug}` : `/post/${post.slug}`}
                            </div>
                          </td>
                          <td className="p-4 text-xs">
                            {post.content_type === 'insight' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Lightbulb size={12} /> Insight
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
                                <FileText size={12} /> Blog Post
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-text-secondary">{post.category || 'Uncategorized'}</td>
                          <td className="p-4 text-xs font-semibold text-text-primary">
                            {post.author_id || post.author || 'Paul Wang'}
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              post.status === 'draft'
                                ? 'bg-amber/10 text-amber border border-amber/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {post.status || 'published'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-text-secondary">
                            {new Date(post.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={async () => { 
                                  setCurrentPost(post); 
                                  setIsEditing(true);
                                  if (post.content_type === 'insight') {
                                    const { data } = await fetchArticleBusinessChallenges(post.id);
                                    setSelectedChallenges(data || []);
                                  } else {
                                    setSelectedChallenges([]);
                                  }
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Research CMS Section */}
          <div className="flex justify-between items-center mb-8 mt-12">
            <h1 className="text-3xl font-bold text-text-primary">Research CMS</h1>
          </div>
          <ReportTypeManager reportTypes={reportTypes} fetchReportTypes={fetchReportTypes} />
          <ResearchManager reports={reports} reportTypes={reportTypes} fetchReports={fetchReports} />
        </>
      )}
      </div>
    </div>
  );
}
