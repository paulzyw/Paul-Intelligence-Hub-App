import { useState, useRef } from 'react';
import { supabase, type ResearchReport, type ReportType } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, UploadCloud, FileText, BarChart3, Image as ImageIcon, ExternalLink } from 'lucide-react';

export const ResearchManager = ({ 
  reports, 
  reportTypes, 
  fetchReports 
}: { 
  reports: ResearchReport[], 
  reportTypes: ReportType[], 
  fetchReports: () => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<Partial<ResearchReport>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHtml, setUploadingHtml] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, bucket: string, folder: string, type: 'image' | 'html') => {
    try {
      if (type === 'image') setUploadingImage(true);
      else setUploadingHtml(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('research-reports')
        .upload(filePath, file, {
          contentType: type === 'html' ? 'text/html; charset=utf-8' : undefined,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('research-reports')
        .getPublicUrl(filePath);

      if (type === 'image') {
        setCurrentReport(prev => ({ ...prev, feature_image_url: data.publicUrl }));
      } else {
        setCurrentReport(prev => ({ ...prev, report_html_path: filePath }));
      }
    } catch (error: any) {
      alert(`Error uploading ${type}: ` + error.message);
    } finally {
      if (type === 'image') setUploadingImage(false);
      else setUploadingHtml(false);
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReport.report_html_path) {
      alert("Please upload a report HTML file.");
      return;
    }

    setLoading(true);
    const slug = currentReport.slug || currentReport.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const reportData = {
      ...currentReport,
      slug,
      status: currentReport.status || 'draft',
      published_at: currentReport.status === 'published' ? (currentReport.published_at || new Date().toISOString()) : null,
    };

    // Remove joined relations
    delete (reportData as any).report_types;

    if (currentReport.id) {
      const { error } = await supabase
        .from('research_reports')
        .update(reportData)
        .eq('id', currentReport.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('research_reports')
        .insert([reportData]);
      if (error) alert(error.message);
    }
    
    setLoading(false);
    setIsEditing(false);
    setCurrentReport({});
    fetchReports();
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this research report?')) return;
    const { error } = await supabase.from('research_reports').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchReports();
  };

  if (isEditing) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-6 md:p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{currentReport.id ? 'Edit Report' : 'New Research Report'}</h2>
          <button 
            onClick={() => { setIsEditing(false); setCurrentReport({}); }}
            className="text-text-secondary hover:text-text-primary"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSaveReport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={currentReport.title || ''}
                  onChange={(e) => setCurrentReport({...currentReport, title: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Slug (optional)</label>
                <input 
                  type="text" 
                  value={currentReport.slug || ''}
                  onChange={(e) => setCurrentReport({...currentReport, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Report Type</label>
                <select
                  required
                  value={currentReport.report_type_id || ''}
                  onChange={(e) => setCurrentReport({...currentReport, report_type_id: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>Select a type</option>
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Key Result / Metric</label>
                <input 
                  type="text" 
                  placeholder="e.g., 45% Efficiency Gain"
                  value={currentReport.highlight_metric || ''}
                  onChange={(e) => setCurrentReport({...currentReport, highlight_metric: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Feature Image</label>
                <div 
                  className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-accent transition-colors flex flex-col items-center justify-center min-h-[120px]"
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0], 'research-reports', 'feature_images', 'image');
                  }}
                >
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'research-reports', 'feature_images', 'image')}
                  />
                  {uploadingImage ? (
                    <span className="text-sm text-text-secondary">Uploading...</span>
                  ) : currentReport.feature_image_url ? (
                    <div className="flex flex-col items-center">
                      <img src={currentReport.feature_image_url} alt="Preview" className="h-20 w-auto object-cover rounded mb-2" />
                      <span className="text-xs text-text-secondary">Click or drag to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon size={24} className="text-text-secondary mb-2" />
                      <span className="text-xs text-text-secondary">Drag & drop image, or click to select</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Report HTML File (.html)</label>
                <div 
                  className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-accent transition-colors flex flex-col items-center justify-center min-h-[120px]"
                  onClick={() => htmlInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0], 'research-reports', 'html_reports', 'html');
                  }}
                >
                  <input 
                    type="file" 
                    ref={htmlInputRef} 
                    className="hidden" 
                    accept=".html"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'research-reports', 'html_reports', 'html')}
                  />
                  {uploadingHtml ? (
                    <span className="text-sm text-text-secondary">Uploading...</span>
                  ) : currentReport.report_html_path ? (
                    <div className="flex flex-col items-center">
                      <FileText size={24} className="text-accent mb-2" />
                      <span className="text-sm font-medium text-text-primary">HTML File Uploaded</span>
                      <span className="text-xs text-text-secondary truncate max-w-[200px]">{currentReport.report_html_path}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud size={24} className="text-text-secondary mb-2" />
                      <span className="text-xs text-text-secondary">Drag & drop your HTML report, or click to select</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Summary (~300 chars)</label>
            <textarea 
              rows={3}
              required
              maxLength={400}
              value={currentReport.summary || ''}
              onChange={(e) => setCurrentReport({...currentReport, summary: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent resize-none"
              placeholder="Provide a concise summary of the research findings..."
            ></textarea>
            <div className="text-right text-[10px] text-text-secondary mt-1">
              {(currentReport.summary || '').length}/400
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
              <select
                value={currentReport.status || 'draft'}
                onChange={(e) => setCurrentReport({...currentReport, status: e.target.value as 'draft' | 'published'})}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex gap-4 pt-6">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setCurrentReport({}); }}
                className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-bg-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || uploadingImage || uploadingHtml}
                className="px-6 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {loading ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border rounded-xl overflow-hidden mb-8">
      <div className="p-6 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" /> Research Reports
        </h2>
        <button 
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} /> New Report
        </button>
      </div>
      
      {reports.length === 0 ? (
        <div className="p-12 text-center text-text-secondary">
          No research reports found. Publish your first technical brief!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-primary border-b border-border text-text-secondary text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Metric</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border hover:bg-bg-primary/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{report.title}</div>
                    <div className="text-xs text-text-secondary">{report.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {report.report_types?.name || 'Uncategorized'}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded uppercase">
                      {report.highlight_metric || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      report.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setCurrentReport(report); setIsEditing(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report.id)}
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
  );
};
