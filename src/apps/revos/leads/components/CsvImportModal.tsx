import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { MQLCampaign, MQLLead } from '../../types/mql';
import { MQLDataService } from '../services/mqlDataService';
import { X, Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, Save, LayoutGrid } from 'lucide-react';

interface CsvImportModalProps {
  campaigns: MQLCampaign[];
  onClose: () => void;
  onImportComplete: (importedLeads: MQLLead[]) => void;
}

const REQUIRED_FIELDS = ['company_name', 'name', 'email', 'industry', 'title'];
const OPTIONAL_FIELDS = ['website', 'employee_size', 'location', 'annual_revenue', 'phone', 'department', 'created_at'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const FIELD_LABELS: Record<string, string> = {
  company_name: 'Company Name *',
  name: 'Name *',
  email: 'Email *',
  industry: 'Industry *',
  title: 'Title *',
  website: 'Website',
  employee_size: 'Employee Size',
  location: 'Location',
  annual_revenue: 'Annual Revenue',
  phone: 'Phone',
  department: 'Department',
  created_at: 'Creation Date'
};

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ campaigns, onClose, onImportComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map Fields, 3: Summary
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  
  const [importStats, setImportStats] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-map headers based on similarity
  useEffect(() => {
    if (headers.length > 0) {
      const initialMapping: Record<string, string> = {};
      ALL_FIELDS.forEach(field => {
        const fieldLower = field.replace('_', ' ').toLowerCase();
        const match = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === fieldLower || 
                 hLower.includes(fieldLower) || 
                 (field === 'company_name' && hLower.includes('company')) ||
                 (field === 'created_at' && (hLower.includes('date') || hLower.includes('created')));
        });
        if (match) {
          initialMapping[field] = match;
        } else {
          initialMapping[field] = '';
        }
      });
      setFieldMapping(initialMapping);
    }
  }, [headers]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setCsvData(results.data);
          setStep(2);
        } else {
          alert('Failed to parse CSV headers. Please ensure the file is valid.');
        }
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        alert('Failed to parse CSV file.');
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        // Trigger the file handling by manually creating an event object, 
        // or refactor to reuse logic.
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          const event = new Event('change', { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
        }
      } else {
        alert("Please upload a valid CSV file.");
      }
    }
  };

  const handleMappingChange = (field: string, headerValue: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [field]: headerValue
    }));
  };

  const handleImport = async () => {
    if (!selectedCampaignId) {
      alert("Please select a campaign.");
      return;
    }
    
    // Check required fields
    const missingFields = REQUIRED_FIELDS.filter(f => !fieldMapping[f]);
    if (missingFields.length > 0) {
      alert(`Please map all required fields: ${missingFields.map(f => FIELD_LABELS[f]).join(', ')}`);
      return;
    }

    setIsImporting(true);
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const leadsToImport: Partial<MQLLead>[] = [];

    for (const row of csvData) {
      try {
        // Basic validation for required fields in the row data
        let skipRow = false;
        for (const reqField of REQUIRED_FIELDS) {
          const csvHeader = fieldMapping[reqField];
          if (!row[csvHeader] || String(row[csvHeader]).trim() === '') {
            skipRow = true;
            break;
          }
        }
        
        if (skipRow) {
          skipped++;
          continue;
        }

        const nameParts = (row[fieldMapping.name] || '').trim().split(/\s+/);
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        const lead: Partial<MQLLead> = {
          campaign_id: selectedCampaignId,
          company_name: row[fieldMapping.company_name] || '',
          first_name: first_name,
          last_name: last_name,
          email: row[fieldMapping.email] || '',
          lead_industry: row[fieldMapping.industry] || '',
          job_title: row[fieldMapping.title] || '',
          website: fieldMapping.website ? row[fieldMapping.website] : '',
          employee_size: fieldMapping.employee_size ? row[fieldMapping.employee_size] : '',
          location: fieldMapping.location ? row[fieldMapping.location] : '',
          annual_revenue: fieldMapping.annual_revenue ? row[fieldMapping.annual_revenue] : '',
          phone: fieldMapping.phone ? row[fieldMapping.phone] : '',
          department: fieldMapping.department ? row[fieldMapping.department] : '',
          lead_date: fieldMapping.created_at && row[fieldMapping.created_at] 
                      ? row[fieldMapping.created_at] 
                      : new Date().toLocaleDateString(),
          status: 'New',
          org_id: selectedCampaign?.org_id || null
        };

        leadsToImport.push(lead);
      } catch (e) {
        errors++;
      }
    }

    try {
      if (leadsToImport.length > 0) {
        const created = await MQLDataService.bulkCreateLeads(leadsToImport);
        imported = created.length;
        setImportStats({ imported, skipped, errors });
        setStep(3);
        onImportComplete(created);
      } else {
        alert("No valid leads found to import. All rows were skipped because they are missing required fields or have empty values for required mapped columns.");
        setIsImporting(false);
      }
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert("An error occurred during import.");
      setIsImporting(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="fixed inset-0 z-50 bg-bg-surface flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex-none p-6 border-b border-border flex items-center justify-between sticky top-0 bg-bg-surface/95 backdrop-blur z-10">
        <div>
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest font-sans">
            Lead Management
          </span>
          <h2 className="text-xl font-bold text-text-primary mt-1 font-sans">
            {step === 1 ? 'Import CSV' : step === 2 ? 'Upload CSV & Map Fields' : 'CSV Import Summary'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-primary/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {step === 1 && (
            <div 
              className="mt-12 p-12 border-2 border-dashed border-border rounded-2xl bg-bg-primary/20 flex flex-col items-center justify-center text-center transition-colors hover:bg-bg-primary/30 hover:border-accent/50 cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border flex items-center justify-center text-accent mb-6 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2 font-sans">Drag & drop your CSV file</h3>
              <p className="text-sm text-text-secondary font-sans max-w-md">
                Upload a standard CSV file containing your lead data. Make sure it includes a header row for accurate mapping.
              </p>
              <button className="mt-8 px-6 py-2.5 bg-bg-surface border border-border text-text-primary font-black text-xs rounded-xl uppercase tracking-wider hover:bg-bg-primary/50 transition-all shadow-sm">
                Browse Files
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Campaign Selection */}
              <div className="p-6 rounded-2xl bg-bg-primary/20 border border-border space-y-5">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-accent" />
                  Target Campaign Assignment
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-2">Assign to Campaign *</label>
                      <select
                        className="w-full p-3.5 rounded-xl border border-border bg-bg-surface text-text-primary focus:border-accent/40 focus:outline-none transition-all text-sm font-medium shadow-sm"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                      >
                        <option value="">Select a campaign...</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedCampaign && (
                    <div className="space-y-3 p-4 rounded-xl bg-bg-surface border border-border shadow-sm">
                      <div className="text-xs font-bold text-text-primary">{selectedCampaign.name}</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider text-[9px] font-black block mb-1">Revenue Motion</span>
                          <span className="text-text-primary font-medium">{selectedCampaign.revenue_motion || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider text-[9px] font-black block mb-1">Target Market</span>
                          <span className="text-text-primary font-medium line-clamp-1">{selectedCampaign.target_market || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-surface border border-border shadow-sm">
                <FileText className="w-5 h-5 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{file?.name}</p>
                  <p className="text-xs text-text-secondary">{csvData.length} records found</p>
                </div>
                <button 
                  onClick={() => { setStep(1); setFile(null); }}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:text-text-primary bg-bg-primary/50 hover:bg-bg-primary rounded-lg border border-transparent hover:border-border transition-all"
                >
                  Change File
                </button>
              </div>

              {/* Field Mapping */}
              <div className="p-6 rounded-2xl bg-bg-primary/20 border border-border space-y-6">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3">
                  Lead Information Item Mapping
                </h3>
                <p className="text-xs text-text-secondary">
                  Map the columns from your CSV file to the corresponding lead data fields. Required fields are marked with an asterisk (*).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {ALL_FIELDS.map(field => {
                    const isRequired = REQUIRED_FIELDS.includes(field);
                    return (
                      <div key={field} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
                          {FIELD_LABELS[field]}
                        </label>
                        <select
                          className={`w-full p-3 rounded-xl border bg-bg-surface text-text-primary focus:border-accent/40 focus:outline-none transition-all text-sm shadow-sm ${isRequired && !fieldMapping[field] ? 'border-amber-500/50' : 'border-border'}`}
                          value={fieldMapping[field] || ''}
                          onChange={(e) => handleMappingChange(field, e.target.value)}
                        >
                          <option value="">-- Ignore this field --</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pb-8">
                <button
                  onClick={() => { setStep(1); setFile(null); }}
                  className="px-6 py-3 bg-bg-surface border border-border text-text-primary font-black text-xs rounded-xl uppercase tracking-wider hover:bg-bg-primary transition-all shadow-sm"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || !selectedCampaignId}
                  className="px-6 py-3 bg-accent text-black font-black text-xs rounded-xl hover:opacity-90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    'Importing...'
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Import Leads
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-12 p-8 max-w-lg mx-auto bg-bg-surface border border-border rounded-2xl shadow-xl text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2 font-sans">Import Complete</h2>
              <p className="text-text-secondary mb-8 font-sans">Your CSV file has been successfully processed.</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border">
                  <div className="text-3xl font-black text-text-primary mb-1">{importStats.imported}</div>
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Imported</div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border">
                  <div className="text-3xl font-black text-amber-500 mb-1">{importStats.skipped}</div>
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Skipped</div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border">
                  <div className="text-3xl font-black text-red-500 mb-1">{importStats.errors}</div>
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Errors</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-3.5 bg-accent text-black font-black text-xs rounded-xl hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                Close & View Leads <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
