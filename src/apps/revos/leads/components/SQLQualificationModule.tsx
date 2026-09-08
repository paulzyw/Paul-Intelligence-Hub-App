import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SQLDataService } from '../services/sqlDataService';
import { SQLOpportunity, SQLAssessment, SQLEvidenceRecord, SQLDimensionResult, SQLRecommendation } from '../../types/sql';
import { 
  Bot, Sparkles, Check, AlertTriangle, AlertCircle, Play, 
  ChevronRight, ArrowLeft, Landmark, FileText, User, 
  Layers, ShieldAlert, BarChart3, HelpCircle, RefreshCw, 
  ChevronDown, Search, Plus, Calendar, BadgeCheck, CheckCircle
} from 'lucide-react';

// Frozen Knowledge Assets - imported dynamically or inline for safety
import sqlKbJson from '../../../../config/SQL_evidence_knowledge_base.json';
import sqlRulesJson from '../../../../config/SQL_qualification_rules.json';
import sqlConfigJson from '../../../../config/SQL_industry_configuration_JSON.json';

const SQL_KB = (sqlKbJson as any).UREKB_SQL;
const SQL_RULES = (sqlRulesJson as any).SQL_Qualification_Rules;
const SQL_CONFIG = sqlConfigJson as any;

const getOppDetails = (desc?: string) => {
  if (!desc) return { description: 'No business definition or opportunity background provided.', owner: 'Unassigned', opportunity_stage: 'Emerging Opportunity', estimated_revenue: '—', pipeline_stage: 'Qualification', expected_close_date: '—' };
  if (desc.trim().startsWith('{') && desc.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(desc);
      return {
        description: parsed.description || 'No business definition or opportunity background provided.',
        owner: parsed.opportunity_owner || 'Unassigned',
        opportunity_stage: parsed.opportunity_stage || 'Emerging Opportunity',
        estimated_revenue: parsed.estimated_revenue || '—',
        pipeline_stage: parsed.pipeline_stage || 'Qualification',
        expected_close_date: parsed.expected_close_date || '—'
      };
    } catch (e) {
      // fallback
    }
  }
  return { description: desc, owner: 'Unassigned', opportunity_stage: 'Emerging Opportunity', estimated_revenue: '—', pipeline_stage: 'Qualification', expected_close_date: '—' };
};

export const SQLQualificationModule: React.FC = () => {
  // Navigation states
  const [view, setView] = useState<'list' | 'intake' | 'result'>('list');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Core records
  const [opportunities, setOpportunities] = useState<SQLOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SQLOpportunity | null>(null);
  const [assessment, setAssessment] = useState<SQLAssessment | null>(null);
  const [evidenceRecords, setEvidenceRecords] = useState<SQLEvidenceRecord[]>([]);
  const [dimensionResults, setDimensionResults] = useState<SQLDimensionResult[]>([]);
  const [recommendations, setRecommendations] = useState<SQLRecommendation[]>([]);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Create Manual Opportunity State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOppData, setNewOppData] = useState({
    company_name: '',
    opportunity_name: '',
    industry: 'Enterprise Software',
    revenue_motion: 'Digital Solution Selling',
    description: ''
  });

  // Dimensions setup
  const DIMENSIONS = [
    { code: 'businessProblem', name: 'Business Problem', desc: 'Identify core pain points and business challenges.' },
    { code: 'metricsSuccessCriteria', name: 'Metrics & Success Criteria', desc: 'Define quantifiable targets and metrics.' },
    { code: 'businessValue', name: 'Business Value', desc: 'Analyze financial value and business impacts.' },
    { code: 'solutionAlignment', name: 'Solution Alignment', desc: 'Map client needs to proposed solutions.' },
    { code: 'stakeholderAlignment', name: 'Stakeholder Alignment', desc: 'Map champions, economic buyers, and decision makers.' },
    { code: 'decisionCriteria', name: 'Decision Criteria', desc: 'Understand technical, financial, and operational criteria.' },
    { code: 'buyingProcessGovernance', name: 'Buying Process & Governance', desc: 'Trace the legal, procurement, and authorization path.' },
    { code: 'commercialReadiness', name: 'Commercial Readiness', desc: 'Verify budget allocation, contracts, and proposal status.' },
    { code: 'opportunityMomentum', name: 'Opportunity Momentum', desc: 'Evaluate velocity, activity frequency, and engagement.' },
    { code: 'competitivePosition', name: 'Competitive Position', desc: 'Position value proposition against alternatives.' }
  ];

  const [activeDimension, setActiveDimension] = useState<string>('businessProblem');

  // Evidence Inputs State
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, { content: string, source: string, validation_status: string }>>({});

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await SQLDataService.getOpportunities();
      setOpportunities(data);
    } catch (e) {
      console.error("Failed to load opportunities:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppData.company_name || !newOppData.opportunity_name) {
      alert("Please fill in company name and opportunity name.");
      return;
    }
    setActionLoading(true);
    try {
      const created = await SQLDataService.createOpportunity({
        ...newOppData,
        source: 'Direct'
      });
      setShowCreateModal(false);
      setNewOppData({
        company_name: '',
        opportunity_name: '',
        industry: 'Enterprise Software',
        revenue_motion: 'Digital Solution Selling',
        description: ''
      });
      await loadOpportunities();
      // Auto open the assessment for the newly created opportunity
      startAssessment(created);
    } catch (err) {
      console.error("Failed to create opportunity:", err);
      alert("Error creating opportunity. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const startAssessment = async (opp: SQLOpportunity) => {
    setLoading(true);
    setSelectedOpportunity(opp);
    try {
      // Find or create assessment
      let assess = await SQLDataService.getAssessmentByOpportunity(opp.id);
      if (!assess) {
        const newAssess = await SQLDataService.createAssessment(opp.id);
        assess = {
          id: newAssess.assessment_id,
          opportunity_id: opp.id,
          assessment_status: 'created'
        };
      }
      setAssessment(assess);

      // Load existing evidence records
      const evs = await SQLDataService.getEvidenceRecords(assess.id);
      setEvidenceRecords(evs);

      // Map to inputs
      const inputs: any = {};
      DIMENSIONS.forEach(d => {
        const match = evs.find(e => e.dimension_code === d.code);
        inputs[d.code] = {
          content: match?.evidence_content || '',
          source: match?.evidence_source || 'Sales Rep',
          validation_status: match?.validation_status || 'unverified'
        };
      });
      setEvidenceInputs(inputs);

      if (assess.assessment_status === 'completed') {
        // Load results
        const res = await SQLDataService.retrieveAssessmentResult(assess.id);
        setDimensionResults(res.dimensions);
        setRecommendations(res.recommendations);
        setView('result');
      } else {
        setView('intake');
      }
    } catch (e) {
      console.error("Failed to load assessment:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveIntakeEvidence = async () => {
    if (!assessment) return;
    setActionLoading(true);
    try {
      const payload = Object.entries(evidenceInputs)
        .filter(([_, data]) => data.content.trim() !== '')
        .map(([code, data]) => ({
          dimension_code: code,
          evidence_object_id: `${assessment.id}_${code}`,
          evidence_content: data.content,
          evidence_source: data.source,
          validation_status: data.validation_status as any
        }));

      await SQLDataService.submitEvidence(assessment.id, payload);
      // Reload evidence records
      const evs = await SQLDataService.getEvidenceRecords(assessment.id);
      setEvidenceRecords(evs);
    } catch (e) {
      console.error("Failed to save evidence:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerGeminiEvaluation = async () => {
    if (!assessment || !selectedOpportunity) return;
    setActionLoading(true);
    try {
      // First save current evidence inputs
      await saveIntakeEvidence();

      // Filter knowledge assets for prompt context
      const industryMotion = selectedOpportunity.revenue_motion || 'Generic Solution Selling';
      const industryName = selectedOpportunity.industry || 'Enterprise Software';
      const idSearch = industryName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const contexts = {
        industry_context: SQL_CONFIG.industries?.find((ind: any) => ind.id === idSearch || ind.id?.replace(/_/g, ' ') === industryName.toLowerCase()) || {},
        evidence_context: SQL_KB.revenue_motion_library?.[industryMotion] || {},
        qualification_policy: SQL_RULES || {}
      };

      const result = await SQLDataService.executeReasoning(assessment.id, contexts);
      
      // Update local states
      setAssessment(result.assessment);
      const fullRes = await SQLDataService.retrieveAssessmentResult(assessment.id);
      setDimensionResults(fullRes.dimensions);
      setRecommendations(fullRes.recommendations);

      // Update opportunity status locally
      loadOpportunities();

      setView('result');
    } catch (e) {
      console.error("Evaluation failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const q = searchQuery.toLowerCase();
    const oppName = opp.opportunity_name || '';
    const compName = opp.company_name || '';
    return oppName.toLowerCase().includes(q) || compName.toLowerCase().includes(q);
  });

  // Get active guidance definitions from canonical knowledge base JSON
  const getActiveGuidance = () => {
    const motion = selectedOpportunity?.revenue_motion || 'Generic Solution Selling';
    const motionKb = SQL_KB.revenue_motion_library?.[motion];
    if (!motionKb) return null;

    // Find the definition mapping to our active dimension
    const mapping: Record<string, string> = {
      businessProblem: 'Business Problem',
      metricsSuccessCriteria: 'Metrics & Success Criteria',
      businessValue: 'Business Value',
      solutionAlignment: 'Solution Alignment',
      stakeholderAlignment: 'Stakeholder Alignment',
      decisionCriteria: 'Decision Criteria',
      buyingProcessGovernance: 'Buying Process & Governance',
      commercialReadiness: 'Commercial Readiness',
      opportunityMomentum: 'Opportunity Momentum',
      competitivePosition: 'Competitive Position'
    };

    const section = mapping[activeDimension];
    const list = motionKb[section];
    return list && list.length > 0 ? list[0] : null;
  };

  const guidance = getActiveGuidance();

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {/* VIEW 1: OPPORTUNITY REGISTER & KANBAN CONTROL */}
        {view === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
              <div>
                <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase flex items-center gap-2">
                  <Landmark className="h-6 w-6 text-accent" />
                  SQL Qualification Engine
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  Qualify MQL handovers and manage Sales Qualified opportunities utilizing evidence-based MEDDPICC structures and Gemini.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/40" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border focus:border-accent/50 rounded-xl text-xs focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-accent hover:scale-[1.02] active:scale-[0.98] text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-accent/10 h-9"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Opp</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <RefreshCw className="h-6 w-6 text-accent animate-spin mb-2" />
                <span className="text-xs text-text-secondary font-mono">CALIBRATING DISCOVERY GRAPH...</span>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-bg-surface/30">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-text-secondary" />
                <h3 className="text-xs font-black uppercase text-text-primary tracking-wider">No Sales Opportunities Found</h3>
                <p className="text-[11px] text-text-secondary mt-1.5 max-w-sm mx-auto mb-4">
                  Opportunities are generated when you promote a qualified lead from the MQL Canvas, or when created manually.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black text-accent text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Create Manual Opportunity
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpportunities.map(opp => (
                  <div 
                    key={opp.id} 
                    onClick={() => startAssessment(opp)}
                    className="p-5 rounded-2xl border border-border hover:border-accent/40 bg-bg-surface hover:shadow-lg hover:shadow-accent/5 transition-all group cursor-pointer relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                            {opp.revenue_motion || 'General Motion'}
                          </span>
                          <h3 className="text-sm font-black text-text-primary mt-2 group-hover:text-accent transition-colors line-clamp-1">{opp.opportunity_name}</h3>
                          <p className="text-xs font-bold text-text-secondary mt-1 line-clamp-1">{opp.company_name}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>

                      {(() => {
                        const { description, owner, opportunity_stage, estimated_revenue, pipeline_stage, expected_close_date } = getOppDetails(opp.description);
                        return (
                          <>
                            <p className="text-xs text-text-secondary/70 line-clamp-2 leading-relaxed mb-3">
                              {description}
                            </p>
                            
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {owner !== 'Unassigned' && (
                                <div className="flex items-center gap-1 bg-bg-primary/50 px-2 py-0.5 rounded-md border border-border/40">
                                  <User className="h-3 w-3 text-accent/80" />
                                  <span className="text-[9px] font-bold text-text-primary">
                                    Owner: <span className="font-medium text-text-secondary">{owner}</span>
                                  </span>
                                </div>
                              )}
                              {estimated_revenue && estimated_revenue !== '—' && (
                                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                                  <span className="text-[9px] font-black text-green-500">
                                    Rev: {estimated_revenue}
                                  </span>
                                </div>
                              )}
                              {opportunity_stage && (
                                <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                  <span className="text-[9px] font-bold text-blue-500 uppercase">
                                    {opportunity_stage}
                                  </span>
                                </div>
                              )}
                              {pipeline_stage && (
                                <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                  <span className="text-[9px] font-bold text-purple-500 uppercase">
                                    Pipe: {pipeline_stage}
                                  </span>
                                </div>
                              )}
                              {expected_close_date && expected_close_date !== '—' && (
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                                  <span className="text-[9px] font-bold text-yellow-500 uppercase">
                                    Close: {expected_close_date}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-t border-border/60 pt-3 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-secondary/40" />
                        <span className="text-[10px] text-text-secondary font-mono">
                          {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black tracking-wider text-text-secondary">Status:</span>
                        <span className="text-xs font-bold text-text-primary ml-1.5">
                          {opp.source === 'MQL' ? 'MQL Handover' : 'Direct SQL'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: EVIDENCE INTAKE & GUIDANCE PANEL */}
        {view === 'intake' && selectedOpportunity && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('list')}
                className="p-1.5 rounded-lg border border-border bg-bg-surface hover:border-accent hover:text-accent transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <span className="text-[9px] font-black font-mono uppercase tracking-widest text-text-secondary">ACTIVE INTAKE ASSESSMENT</span>
                <h1 className="text-lg font-black text-text-primary line-clamp-1 tracking-tight">
                  {selectedOpportunity.opportunity_name} <span className="text-text-secondary/50 font-medium">({selectedOpportunity.company_name})</span>
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dimensions Tab selector (Col 4) */}
              <div className="lg:col-span-4 p-4 rounded-2xl bg-bg-surface border border-border space-y-1.5">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block px-2 mb-3">MEDDPICC Dimensions</span>
                {DIMENSIONS.map(d => {
                  const hasValue = evidenceInputs[d.code]?.content.trim() !== '';
                  const isActive = activeDimension === d.code;
                  return (
                    <button
                      key={d.code}
                      onClick={() => setActiveDimension(d.code)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-accent/10 border-accent/40 text-text-primary font-black'
                          : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold truncate">{d.name}</div>
                        <div className="text-[10px] text-text-secondary/60 truncate mt-0.5 font-sans font-medium">{d.desc}</div>
                      </div>
                      {hasValue && (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active Input Area & Guidance System (Col 8) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-xs uppercase text-text-primary tracking-wider">
                      {DIMENSIONS.find(d => d.code === activeDimension)?.name} Evidence Intake
                    </h3>
                    <span className="text-[10px] text-text-secondary font-mono">
                      Dimension Code: {activeDimension}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Evidence and Business Discovery Context</label>
                    <textarea
                      value={evidenceInputs[activeDimension]?.content || ''}
                      onChange={e => {
                        setEvidenceInputs({
                          ...evidenceInputs,
                          [activeDimension]: {
                            ...evidenceInputs[activeDimension],
                            content: e.target.value,
                            source: evidenceInputs[activeDimension]?.source || 'Sales Rep',
                            validation_status: evidenceInputs[activeDimension]?.validation_status || 'unverified'
                          }
                        });
                      }}
                      placeholder={`Enter observed pain points, client discussions, or operational evidence supporting this dimension...`}
                      className="w-full h-32 bg-bg-primary/50 border border-border/80 focus:border-accent/50 focus:outline-none rounded-xl p-3 text-xs leading-relaxed transition-all placeholder-text-secondary/40 font-sans"
                    />
                    <div className="text-right text-[10px] text-text-secondary/50 font-mono">
                      {(evidenceInputs[activeDimension]?.content || '').length} characters
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Information Source</label>
                      <select
                        value={evidenceInputs[activeDimension]?.source || 'Sales Rep'}
                        onChange={e => {
                          setEvidenceInputs({
                            ...evidenceInputs,
                            [activeDimension]: {
                              ...evidenceInputs[activeDimension],
                              source: e.target.value,
                              content: evidenceInputs[activeDimension]?.content || '',
                              validation_status: evidenceInputs[activeDimension]?.validation_status || 'unverified'
                            }
                          });
                        }}
                        className="w-full bg-bg-primary border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                      >
                        <option value="Sales Rep">Sales Representative Input</option>
                        <option value="Customer Call Transcript">Customer Call Transcript</option>
                        <option value="Proposal Doc">Proposal/Contract Document</option>
                        <option value="Technical Assessment">Technical Discovery Sheet</option>
                        <option value="MQL Handover Form">MQL Handover Metadata</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Validation Level</label>
                      <select
                        value={evidenceInputs[activeDimension]?.validation_status || 'unverified'}
                        onChange={e => {
                          setEvidenceInputs({
                            ...evidenceInputs,
                            [activeDimension]: {
                              ...evidenceInputs[activeDimension],
                              validation_status: e.target.value,
                              content: evidenceInputs[activeDimension]?.content || '',
                              source: evidenceInputs[activeDimension]?.source || 'Sales Rep'
                            }
                          });
                        }}
                        className="w-full bg-bg-primary border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                      >
                        <option value="unverified">Unverified Observation</option>
                        <option value="customer_confirmed">Customer Confirmed Statement</option>
                        <option value="verified">Verified/Contractual Fact</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-text-secondary/60 italic">Changes are automatically saved upon running the evaluation</span>
                    <button
                      onClick={saveIntakeEvidence}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-bg-primary border border-border hover:border-accent hover:text-accent text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                    >
                      {actionLoading ? 'Saving...' : 'Save Draft'}
                    </button>
                  </div>
                </div>

                {/* Intelligent Guidance Overlay System using canonical JSON files */}
                {guidance && (
                  <div className="p-5 rounded-2xl bg-bg-surface/60 border border-border space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                      <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                      <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">Discovery Knowledge Base & Guidance</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-extrabold text-green-500/80 tracking-widest block">Positive Evidence Signals</span>
                        <ul className="space-y-1">
                          {guidance.positive_signals?.slice(0, 4).map((sig: string, i: number) => (
                            <li key={i} className="text-[11px] text-text-secondary leading-normal flex items-start gap-1.5">
                              <span className="text-green-500/80 font-black mt-0.5">•</span>
                              <span>{sig}</span>
                            </li>
                          ))}
                          {(!guidance.positive_signals || guidance.positive_signals.length === 0) && (
                            <li className="text-[11px] text-text-secondary/50 italic">No standard positive signals specified.</li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-extrabold text-red-500/80 tracking-widest block">Risk/Negative Signals</span>
                        <ul className="space-y-1">
                          {guidance.negative_signals?.slice(0, 4).map((sig: string, i: number) => (
                            <li key={i} className="text-[11px] text-text-secondary leading-normal flex items-start gap-1.5">
                              <span className="text-red-500/80 font-black mt-0.5">•</span>
                              <span>{sig}</span>
                            </li>
                          ))}
                          {(!guidance.negative_signals || guidance.negative_signals.length === 0) && (
                            <li className="text-[11px] text-text-secondary/50 italic">No standard risk/negative signals specified.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {guidance.gemini_interpretation?.confidence_guidance && (
                      <div className="p-3.5 rounded-xl bg-accent/[0.03] border border-accent/15">
                        <span className="text-[10px] uppercase font-black text-accent tracking-widest block mb-1">Interpretation Guidance</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-sans font-medium">
                          {guidance.gemini_interpretation?.confidence_guidance}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-gradient-to-br from-bg-surface to-accent/[0.03] border border-accent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl shadow-accent/5">
                  <div>
                    <h4 className="font-black text-xs uppercase text-text-primary tracking-tight">Run AI-Native SQL Decision Evaluation</h4>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Orchestrates Gemini reasoning through the 10-stage evaluation lifecycle to compile dimension scoring and recommendations.
                    </p>
                  </div>

                  <button
                    onClick={triggerGeminiEvaluation}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-5 py-3 bg-accent hover:scale-[1.02] active:scale-[0.98] text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-accent/10 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing Evidence...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        Evaluate SQL Decision
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: REASONING INSIGHTS & RESULTS DASHBOARD */}
        {view === 'result' && selectedOpportunity && assessment && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('intake')}
                  className="p-1.5 rounded-lg border border-border bg-bg-surface hover:border-accent hover:text-accent transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <span className="text-[9px] font-black font-mono uppercase tracking-widest text-text-secondary">EVALUATION INSIGHTS LAYER</span>
                  <h1 className="text-lg font-black text-text-primary line-clamp-1 tracking-tight">
                    {selectedOpportunity.opportunity_name} <span className="text-text-secondary/50 font-medium">({selectedOpportunity.company_name})</span>
                  </h1>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setView('intake')}
                  className="px-4 py-2 bg-bg-surface border border-border hover:border-accent hover:text-accent text-xs font-bold rounded-xl transition-all"
                >
                  Update Evidence
                </button>
                <button
                  onClick={triggerGeminiEvaluation}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-black text-xs font-black uppercase rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  Re-evaluate
                </button>
              </div>
            </div>

            {/* Overall Score Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-bg-surface border border-border relative overflow-hidden flex flex-col justify-between h-28 shadow-sm">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-text-secondary">Qualification Status</div>
                <div className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2 mt-2">
                  <BadgeCheck className={`h-5 w-5 ${
                    assessment.qualification_status === 'Qualified' ? 'text-green-500' : 'text-accent'
                  }`} />
                  {assessment.qualification_status || 'Needs More Evidence'}
                </div>
                <div className="text-[10px] text-text-secondary/70 italic mt-auto font-sans font-medium">Determined by Gemini-3.1 policy checks</div>
              </div>

              <div className="p-5 rounded-2xl bg-bg-surface border border-border relative overflow-hidden flex flex-col justify-between h-28 shadow-sm">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-text-secondary">Overall MEDDPICC Score</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-text-primary font-mono">{assessment.overall_score || 0}</span>
                  <span className="text-xs font-bold text-text-secondary">/100</span>
                </div>
                <div className="text-[10px] text-text-secondary/70 italic mt-auto font-sans font-medium">Mathematical weighted alignment score</div>
              </div>

              <div className="p-5 rounded-2xl bg-bg-surface border border-border relative overflow-hidden flex flex-col justify-between h-28 shadow-sm">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-text-secondary">AI Confidence Level</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-text-primary font-mono">{assessment.confidence_score || 0}</span>
                  <span className="text-xs font-bold text-text-secondary">%</span>
                </div>
                <div className="text-[10px] text-text-secondary/70 italic mt-auto font-sans font-medium">Grounded evidence credibility confidence</div>
              </div>
            </div>

            {/* Dimension Breakdown Bento Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-text-primary tracking-wider">Dimension Analysis Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dimensionResults.map(dr => (
                  <div key={dr.id} className="p-5 rounded-2xl bg-bg-surface border border-border/80 flex flex-col justify-between hover:border-accent/30 transition-all shadow-sm">
                    <div>
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                        <span className="text-xs font-black text-text-primary uppercase tracking-tight">{dr.dimension_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-text-secondary font-mono">Conf: {dr.confidence}%</span>
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-mono font-black rounded-lg bg-accent/10 text-accent border border-accent/20">
                            {dr.score}/100
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed font-sans font-medium mb-4">
                        {dr.assessment_summary}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/50">
                      {dr.strengths && dr.strengths.length > 0 && (
                        <div>
                          <span className="text-[9px] uppercase font-black text-green-500 tracking-widest block mb-1">Strengths / Positive Signals</span>
                          <div className="space-y-1">
                            {dr.strengths.map((str, i) => (
                              <div key={i} className="text-xs text-text-secondary/80 flex items-start gap-1.5 leading-relaxed font-sans">
                                <span className="text-green-500">•</span>
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dr.weaknesses && dr.weaknesses.length > 0 && (
                        <div>
                          <span className="text-[9px] uppercase font-black text-red-500 tracking-widest block mb-1">Identified Gaps</span>
                          <div className="space-y-1">
                            {dr.weaknesses.map((weak, i) => (
                              <div key={i} className="text-xs text-text-secondary/80 flex items-start gap-1.5 leading-relaxed font-sans">
                                <span className="text-red-500">•</span>
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Panel */}
            <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-black text-xs uppercase text-text-primary tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  Targeted Strategic Action Recommendations
                </h3>
              </div>

              {recommendations.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-secondary font-sans font-medium">
                  No priority recommendations produced during evaluation.
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl bg-bg-primary/50 border border-border flex items-start gap-3.5 hover:border-accent/25 transition-all">
                      <div className="shrink-0 mt-0.5">
                        <span className={`inline-flex items-center justify-center text-[9px] font-black font-mono px-2 py-0.5 rounded-lg border ${
                          rec.priority === 'High' 
                            ? 'bg-red-500/10 text-red-500 border-red-500/25' 
                            : rec.priority === 'Medium'
                            ? 'bg-accent/10 text-accent border-accent/25'
                            : 'bg-text-secondary/10 text-text-secondary border-text-secondary/25'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-primary leading-normal">{rec.recommendation}</p>
                        {rec.expected_impact && (
                          <p className="text-[10px] text-text-secondary mt-1.5 flex items-center gap-1 leading-normal font-sans">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-accent/80">Impact:</span>
                            <span>{rec.expected_impact}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE OPPORTUNITY MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-bg-surface">
                <h3 className="font-black text-sm uppercase text-text-primary tracking-tight">Create Sales Qualified Opportunity</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-text-secondary hover:text-text-primary text-xs font-mono font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOpportunity} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={newOppData.company_name}
                    onChange={e => setNewOppData({ ...newOppData, company_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Opportunity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Enterprise ERP Platform"
                    value={newOppData.opportunity_name}
                    onChange={e => setNewOppData({ ...newOppData, opportunity_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Target Industry</label>
                    <select
                      value={newOppData.industry}
                      onChange={e => setNewOppData({ ...newOppData, industry: e.target.value })}
                      className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                    >
                      <option value="SaaS / Software">SaaS / Software</option>
                      <option value="Enterprise Software">Enterprise Software</option>
                      <option value="AI Solutions">AI Solutions</option>
                      <option value="Cloud Transformation">Cloud Transformation</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Managed Services">Managed Services</option>
                      <option value="Digital Transformation">Digital Transformation</option>
                      <option value="Engineering Solutions">Engineering Solutions</option>
                      <option value="Solution-Selling Organizations">Generic Solution Selling</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Revenue Motion Family</label>
                    <select
                      value={newOppData.revenue_motion}
                      onChange={e => setNewOppData({ ...newOppData, revenue_motion: e.target.value })}
                      className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3 py-2 text-xs font-sans cursor-pointer"
                    >
                      <option value="Digital Solution Selling">Digital Solution Selling</option>
                      <option value="Professional & Solution Services">Professional & Solution Services</option>
                      <option value="Digital Transformation & OT">Digital Transformation & OT</option>
                      <option value="Engineering & Project Solutions">Engineering & Project Solutions</option>
                      <option value="Project & Procurement">Project & Procurement</option>
                      <option value="Generic Solution Selling">Generic Solution Selling</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">Opportunity Description & Context</label>
                  <textarea
                    placeholder="Enter customer objective, known requirements, budget indicators, or background context..."
                    value={newOppData.description}
                    onChange={e => setNewOppData({ ...newOppData, description: e.target.value })}
                    className="w-full h-24 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl p-3 text-xs leading-relaxed transition-all placeholder-text-secondary/40 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-transparent hover:bg-bg-primary text-text-secondary text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15"
                  >
                    {actionLoading ? 'Creating...' : 'Initialize Opportunity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
