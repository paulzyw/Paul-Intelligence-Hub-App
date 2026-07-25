import React, { useState, useEffect } from 'react';
import { MQLConfigService } from '../services/mqlConfigLoader';
import { MQLDataService } from '../services/mqlDataService';
import { ChevronDown, ChevronUp, Layers, Check, Sparkles } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface CampaignFormProps {
  selectedCampaign: any;
  onCreated: (campaign: any) => void;
  onUpdated: (campaign: any) => void;
  onCreateLead: () => void;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ selectedCampaign, onCreated, onUpdated, onCreateLead }) => {
  const [industries, setIndustries] = useState<any[]>([]);
  const [gtmCampaigns, setGtmCampaigns] = useState<any[]>([]);
  const [importFromGTM, setImportFromGTM] = useState(false);
  const [selectedGTM, setSelectedGTM] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    target_market: '',
    revenue_motion: '',
    industry: '',
    icp_company_size: '',
    icp_industry: '',
    icp_geography: '',
    icp_buying_triggers: '',
    icp_budget_characteristics: '',
    icp_decision_structure: ''
  });
  const [loading, setLoading] = useState(false);
  const [icpExpanded, setIcpExpanded] = useState(false);

  useEffect(() => {
    const list = MQLConfigService.getIndustries();
    setIndustries(list);
    
    // Load GTM Campaigns
    MQLDataService.getGTMCampaigns().then(data => {
      setGtmCampaigns(data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      let icp = {};
      try {
        if (selectedCampaign.icp_definition) {
          icp = JSON.parse(selectedCampaign.icp_definition);
        }
      } catch (e) {
        // legacy string
      }
      
      setFormData({
        name: selectedCampaign.name || '',
        objective: selectedCampaign.objective || '',
        target_market: selectedCampaign.target_market || '',
        revenue_motion: selectedCampaign.revenue_motion || '',
        industry: selectedCampaign.industry || '',
        icp_company_size: (icp as any).company_size || '',
        icp_industry: (icp as any).industry || '',
        icp_geography: (icp as any).geography || '',
        icp_buying_triggers: (icp as any).buying_triggers || '',
        icp_budget_characteristics: (icp as any).budget_characteristics || '',
        icp_decision_structure: (icp as any).decision_structure || ''
      });
      setImportFromGTM(false);
      setSelectedGTM('');
    } else {
      setFormData({
        name: '',
        objective: '',
        target_market: '',
        revenue_motion: '',
        industry: '',
        icp_company_size: '',
        icp_industry: '',
        icp_geography: '',
        icp_buying_triggers: '',
        icp_budget_characteristics: '',
        icp_decision_structure: ''
      });
      setImportFromGTM(false);
      setSelectedGTM('');
    }
  }, [selectedCampaign]);

  const getIcpValue = (lines: any, keyword: string) => {
    if (!Array.isArray(lines)) return '';
    const line = lines.find((l: any) => typeof l === 'string' && l.toLowerCase().includes(keyword.toLowerCase()));
    if (line) {
      if (line.includes(': ')) {
        return line.split(': ').slice(1).join(': ').trim() || line;
      }
      if (line.startsWith('[')) {
        const endBracket = line.indexOf(']');
        if (endBracket !== -1) {
          return line.substring(endBracket + 1).trim();
        }
      }
      return line.trim();
    }
    return '';
  };

  const handleGTMSelect = (gtmId: string) => {
    setSelectedGTM(gtmId);
    if (!gtmId) return;

    const gtm = gtmCampaigns.find(c => c.id === gtmId);
    if (!gtm) return;

    // Defensively parse rawInput
    let rawInput = gtm.raw_input || {};
    if (typeof rawInput === 'string') {
      try { rawInput = JSON.parse(rawInput); } catch(e) {}
    }
    const onboarding = rawInput.onboarding || {};
    let gtmStrategyDraft = rawInput.gtmStrategyDraft || {};
    if (typeof gtmStrategyDraft === 'string') {
      try { gtmStrategyDraft = JSON.parse(gtmStrategyDraft); } catch(e) {}
    }

    let icpDraft: any[] = [];
    if (gtmStrategyDraft.pillar_2_icp) {
      icpDraft = gtmStrategyDraft.pillar_2_icp;
      if (typeof icpDraft === 'string') {
        try { icpDraft = JSON.parse(icpDraft); } catch(e) { icpDraft = [icpDraft]; }
      }
    }

    setFormData(prev => ({
      ...prev,
      name: gtm.title || prev.name,
      objective: onboarding.strategicPriorities || gtm.strategic_objective || prev.objective,
      target_market: onboarding.targetIndustries || gtm.market_segment || prev.target_market,
      icp_company_size: getIcpValue(icpDraft, 'Company Size') || onboarding.employeeCount || prev.icp_company_size,
      icp_industry: getIcpValue(icpDraft, 'Industry') || onboarding.customerIndustries || prev.icp_industry,
      icp_geography: getIcpValue(icpDraft, 'Geography') || onboarding.targetGeographies || prev.icp_geography,
      icp_buying_triggers: getIcpValue(icpDraft, 'Buying Triggers') || onboarding.buyingTriggers || prev.icp_buying_triggers,
      icp_budget_characteristics: getIcpValue(icpDraft, 'Budget') || onboarding.availableBudget || prev.icp_budget_characteristics,
      icp_decision_structure: getIcpValue(icpDraft, 'Decision') || onboarding.decisionMakingStructure || prev.icp_decision_structure,
    }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.industry) {
      alert("Please fill required fields (Name and Industry)");
      return;
    }
    
    setLoading(true);
    try {
      const selectedInd = industries.find(i => i.id === formData.industry);
      const icpDef = JSON.stringify({
        company_size: formData.icp_company_size,
        industry: formData.icp_industry,
        geography: formData.icp_geography,
        buying_triggers: formData.icp_buying_triggers,
        budget_characteristics: formData.icp_budget_characteristics,
        decision_structure: formData.icp_decision_structure
      });

      const payload = {
        name: formData.name,
        objective: formData.objective,
        target_market: formData.target_market,
        revenue_motion: formData.revenue_motion || selectedInd?.revenueMotion || '',
        industry: formData.industry,
        icp_definition: icpDef
      };
      
      if (selectedCampaign) {
        const updated = await MQLDataService.createCampaign({ ...payload, id: selectedCampaign.id } as any);
        onUpdated(updated);
        alert('Campaign settings saved successfully!');
      } else {
        const newCampaign = await MQLDataService.createCampaign(payload);
        onCreated(newCampaign);
        alert('Campaign created successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title / Description panel */}
      <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border">
        <span className="text-[10px] font-mono text-text-secondary uppercase">Campaign Design & Targeting Parameters</span>
        <h2 className="text-lg font-bold text-text-primary mt-0.5">
          {selectedCampaign ? 'Campaign Blueprint Parameters' : 'Initialize Qualification Campaign'}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          Specify core business metadata, target segment metrics, and align custom qualitative ICP models for automated lead analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Campaign Information Card */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-5 shadow-sm">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              Campaign Architecture
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-primary/40 border border-border">
                <input 
                  type="checkbox" 
                  id="importGTM"
                  checked={importFromGTM}
                  onChange={e => {
                    setImportFromGTM(e.target.checked);
                    if (!e.target.checked) setSelectedGTM('');
                  }}
                  className="rounded border-border bg-bg-primary text-accent focus:ring-accent focus:ring-offset-0 h-4 w-4"
                />
                <label htmlFor="importGTM" className="text-xs font-bold text-text-primary cursor-pointer select-none">
                  Import GTM Strategy Blueprints
                </label>
              </div>

              {importFromGTM && (
                <div className="animate-in fade-in-20 duration-200">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">GTM Campaign Source</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary focus:border-accent/40 focus:outline-none transition-all text-xs"
                    value={selectedGTM}
                    onChange={e => handleGTMSelect(e.target.value)}
                  >
                    <option value="">Select an active GTM Campaign...</option>
                    {gtmCampaigns.map(g => (
                      <option key={g.id} value={g.id}>{g.title || 'Untitled Campaign'}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Campaign Name *</label>
                <TextareaAutosize 
                  minRows={1} 
                  required
                  className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                  placeholder="e.g. Enterprise Simulation growth expansion program" 
                  value={formData.name} 
                  onChange={e => handleChange('name', e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Campaign Strategic Objective</label>
                <TextareaAutosize 
                  minRows={1} 
                  className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                  placeholder="e.g. Capture $1.2M pipeline within North American Refining sector" 
                  value={formData.objective} 
                  onChange={e => handleChange('objective', e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Target Market Segment</label>
                <TextareaAutosize 
                  minRows={1} 
                  className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                  placeholder="e.g. Downstream petrochemicals and oil & gas refining" 
                  value={formData.target_market} 
                  onChange={e => handleChange('target_market', e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Target Industry Model *</label>
                <select 
                  required 
                  className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary focus:border-accent/40 focus:outline-none transition-all text-xs" 
                  value={formData.industry} 
                  onChange={e => handleChange('industry', e.target.value)}
                >
                  <option value="">Select qualification model industry...</option>
                  {industries.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Revenue Motion</label>
                <select 
                  className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary focus:border-accent/40 focus:outline-none transition-all text-xs" 
                  value={formData.revenue_motion} 
                  onChange={e => handleChange('revenue_motion', e.target.value)}
                >
                  <option value="">Select custom revenue motion...</option>
                  <option value="Digital Solution Selling">Digital Solution Selling</option>
                  <option value="Professional & Solution Services">Professional & Solution Services</option>
                  <option value="Digital Transformation & OT">Digital Transformation & OT</option>
                  <option value="Engineering & Project Solutions">Engineering & Project Solutions</option>
                  <option value="Project & Procurement">Project & Procurement</option>
                  <option value="Generic Solution Selling">Generic Solution Selling</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Ideal Customer Profile Card */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border space-y-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Ideal Customer Profile (ICP) Criteria
              </h3>
              <button 
                type="button" 
                onClick={() => setIcpExpanded(!icpExpanded)} 
                className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors"
              >
                {icpExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {icpExpanded && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Target Company Size</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. > 5,000 employees, $1.0B+ annual revenue threshold" 
                    value={formData.icp_company_size} 
                    onChange={e => handleChange('icp_company_size', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">ICP Industry Alignment</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. Chemical Refineries, midstream distribution pipelines" 
                    value={formData.icp_industry} 
                    onChange={e => handleChange('icp_industry', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Target Geographies</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. United States, Gulf Coast, European economic zones" 
                    value={formData.icp_geography} 
                    onChange={e => handleChange('icp_geography', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Compelling Buying Triggers</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. Public commitment to reduce CO2 emissions or new refinery build-out" 
                    value={formData.icp_buying_triggers} 
                    onChange={e => handleChange('icp_buying_triggers', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Budget Characteristics</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. Capital expenditure budget allocated for software automation and plant optimization" 
                    value={formData.icp_budget_characteristics} 
                    onChange={e => handleChange('icp_budget_characteristics', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider mb-1.5">Decision Maker Committee Structure</label>
                  <TextareaAutosize 
                    minRows={1} 
                    className="w-full p-3 rounded-xl border border-border bg-bg-primary/50 text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all text-xs font-sans" 
                    placeholder="e.g. consensus of VP operations, lead process engineers, and CIO" 
                    value={formData.icp_decision_structure} 
                    onChange={e => handleChange('icp_decision_structure', e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Action Buttons Footer Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border flex flex-wrap justify-end gap-3 shadow-sm">
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-2.5 bg-accent text-black font-black text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Campaign Blueprint'}
          </button>
          
          {selectedCampaign && (
            <button 
              type="button" 
              onClick={onCreateLead} 
              className="px-6 py-2.5 bg-bg-primary hover:bg-bg-primary/80 border border-border text-text-primary font-black text-xs rounded-xl transition-all shadow-sm"
            >
              Add Lead to Campaign
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

