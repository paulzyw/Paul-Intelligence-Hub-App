import { useState, useEffect, useRef } from 'react';
import { supabase, type Post, type Category, type ResearchReport, type ReportType } from '../lib/supabase';
import { LogOut, Plus, Edit, Trash2, Save, X, UploadCloud, Image as ImageIcon, FolderPlus, Sparkles, BarChart3 } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { ReportTypeManager } from '../components/ReportTypeManager';
import { ResearchManager } from '../components/ResearchManager';

const TinyMCEEditor = ({ content, onChange }: { content: string, onChange: (content: string) => void }) => {
  return (
    <div className="border border-border rounded-md bg-bg-surface focus-within:border-accent transition-colors overflow-hidden">
      <Editor
        apiKey="ab4oi3gjblnzqqb9x2511u1toic042wfi8s7g5ujvl36pl1p"
        value={content}
        onEditorChange={(newContent) => onChange(newContent)}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
            'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'tinymceai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown','importword', 'exportword', 'exportpdf'
          ],
          toolbar: 'undo redo | tinymceai-chat tinymceai-quickactions tinymceai-review | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
          tinycomments_mode: 'embedded',
          tinycomments_author: 'Author name',
          mergetags_list: [
            { value: 'First.Name', title: 'First Name' },
            { value: 'Email', title: 'Email' },
          ],
          tinymceai_token_provider: async () => {
            await fetch(`https://demo.api.tiny.cloud/1/ab4oi3gjblnzqqb9x2511u1toic042wfi8s7g5ujvl36pl1p/auth/random`, { method: "POST", credentials: "include" });
            return { token: await fetch(`https://demo.api.tiny.cloud/1/ab4oi3gjblnzqqb9x2511u1toic042wfi8s7g5ujvl36pl1p/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
          },
          uploadcare_public_key: '462ea3545c0d4698fb4d',
          content_style: 'body { font-family:Inter,sans-serif; font-size:16px; background-color: #1E2124; color: #F4F4F5; }',
          skin: 'oxide-dark',
          content_css: 'dark',
        }}
      />
    </div>
  );
};

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
  const [session, setSession] = useState<any>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateReadingTime = (content: string) => {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return Math.ceil(words / 225) || 1;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchPosts();
        fetchCategories();
        fetchReports();
        fetchReportTypes();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchPosts();
        fetchCategories();
        fetchReports();
        fetchReportTypes();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      // Ensure slug is generated if not provided
      slug: postDataToSave.slug || postDataToSave.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    };

    if (currentPost.id) {
      // Update
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', currentPost.id);
      if (error) alert(error.message);
    } else {
      // Insert
      const { error } = await supabase
        .from('posts')
        .insert([postData]);
      if (error) alert(error.message);
    }
    
    setLoading(false);
    setIsEditing(false);
    setCurrentPost({});
    fetchPosts();
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchPosts();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Admin Dashboard
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-transparent text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-transparent text-text-primary"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Content Management</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>

        {!isEditing && (
          <>
            <CategoryManager categories={categories} fetchCategories={fetchCategories} />
            <ReportTypeManager reportTypes={reportTypes} fetchReportTypes={fetchReportTypes} />
            <ResearchManager reports={reports} reportTypes={reportTypes} fetchReports={fetchReports} />
          </>
        )}

        {isEditing ? (
          <div className="bg-bg-surface border border-border rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{currentPost.id ? 'Edit Post' : 'New Post'}</h2>
              <button 
                onClick={() => { setIsEditing(false); setCurrentPost({}); }}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSavePost} className="space-y-6">
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
                <TinyMCEEditor 
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

              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setCurrentPost({}); }}
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
          <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">Blog Posts</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={18} /> New Post
              </button>
            </div>
            
            {posts.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                No posts found. Create your first post!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-primary border-b border-border text-text-secondary text-sm">
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-border hover:bg-bg-primary/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-text-primary">{post.title}</div>
                          <div className="text-xs text-text-secondary">{post.slug}</div>
                        </td>
                        <td className="p-4 text-sm text-text-secondary">{post.category || 'Uncategorized'}</td>
                        <td className="p-4 text-sm text-text-secondary">
                          {new Date(post.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
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
        )}
      </div>
    </div>
  );
}
