import React, { useState, useEffect } from 'react';
import { CampaignForm } from './components/CampaignForm';
import { DynamicEvidenceForm } from './components/DynamicEvidenceForm';
import { LeadQualificationForm } from './components/LeadQualificationForm';
import { QualificationResult } from './components/QualificationResult';
import { LeadDashboard } from './components/LeadDashboard';
import { CsvImportModal } from './components/CsvImportModal';
import { MQLDataService } from './services/mqlDataService';
import { MQLConfigService } from './services/mqlConfigLoader';
import { MQLCampaign, MQLLead, MQLQualificationResult } from '../types/mql';
import { Plus, FolderOpen, Cpu, Users, Settings, PlusCircle, ArrowLeft, Bot, Sparkles, Activity, Check, ChevronDown, ChevronUp, Trash, Trash2, Download, RefreshCw, AlertTriangle } from 'lucide-react';

export const MQLModule: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MQLCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<MQLCampaign | null>(null);
  const [leads, setLeads] = useState<MQLLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<MQLLead | null>(null);
  const [campaignFilterId, setCampaignFilterId] = useState<string>('all');
  const [targetCampaignId, setTargetCampaignId] = useState<string>('');
  
  // Views: campaign_config (Campaign Details), lead_list, lead_create, lead_assess
  const [view, setView] = useState<'campaign_config' | 'lead_list' | 'lead_create' | 'lead_assess'>('campaign_config');
  const [loading, setLoading] = useState(true);

  // High-level horizontal navigation: 'campaign' | 'lead' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'campaign' | 'lead' | 'dashboard'>('campaign');

  // Campaign qualification results for the Lead Dashboard
  const [campaignQualResults, setCampaignQualResults] = useState<MQLQualificationResult[]>([]);

  // Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    company_name: '',
    job_title: '',
    website: '',
    lead_industry: '',
    employee_size: '',
    location: '',
    annual_revenue: '',
    phone: '',
    department: '',
    lead_date: ''
  });
  const [icpExpanded, setIcpExpanded] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [qualResult, setQualResult] = useState<MQLQualificationResult | null>(null);
  const [savingQual, setSavingQual] = useState(false);

  const [deletedLeadIds, setDeletedLeadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mql_deleted_lead_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showDeletedOnly, setShowDeletedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<boolean>(false);
  const [showCsvImport, setShowCsvImport] = useState<boolean>(false);
  const [showAddOptions, setShowAddOptions] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('mql_deleted_lead_ids', JSON.stringify(deletedLeadIds));
  }, [deletedLeadIds]);

  useEffect(() => {
    setSelectedLeadIds([]);
  }, [campaignFilterId, showDeletedOnly, searchQuery]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await MQLDataService.getCampaigns();
      setCampaigns(data);
      
      const allLeads = await MQLDataService.getLeads();
      setLeads(allLeads);
      
      const qualResults = await MQLDataService.getAllQualificationResults();
      setCampaignQualResults(qualResults);

      if (data.length > 0) {
        setTargetCampaignId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectCampaign = async (campaign: MQLCampaign) => {
    setSelectedCampaign(campaign);
    setCampaignFilterId(campaign.id);
    setActiveTab('campaign');
    setView('campaign_config');
    setLoading(true);
    try {
      const data = await MQLDataService.getLeads();
      setLeads(data);
      
      const qualResults = await MQLDataService.getAllQualificationResults();
      setCampaignQualResults(qualResults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'campaign' | 'lead' | 'dashboard') => {
    setActiveTab(tab);
    if (tab === 'campaign') {
      setView('campaign_config');
    } else if (tab === 'lead') {
      if (view === 'campaign_config') {
        setView('lead_list');
      }
    }
  };

  const openLeadAssessment = async (lead: MQLLead) => {
    setSelectedLead(lead);
    const leadCampaign = campaigns.find(c => c.id === lead.campaign_id);
    if (leadCampaign) {
      setSelectedCampaign(leadCampaign);
    }
    setLoading(true);
    try {
      const assessments = await MQLDataService.getAssessments(lead.id);
      setAssessmentData(assessments);
      
      const result = await MQLDataService.getQualificationResult(lead.id);
      setQualResult(result);
      
      setView('lead_assess');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLeadClick = async (lead: MQLLead) => {
    setSelectedLead(lead);
    setTargetCampaignId(lead.campaign_id);
    const leadCampaign = campaigns.find(c => c.id === lead.campaign_id);
    if (leadCampaign) {
      setSelectedCampaign(leadCampaign);
    }
    setLoading(true);
    try {
      const assessments = await MQLDataService.getAssessments(lead.id);
      setAssessmentData(assessments);
      
      const result = await MQLDataService.getQualificationResult(lead.id);
      setQualResult(result);
      
      const extraJson = localStorage.getItem(`mql_lead_extra_${lead.id}`);
      const extra = extraJson ? JSON.parse(extraJson) : {};
      
      setNewLead({
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        email: lead.email || '',
        company_name: lead.company_name || '',
        job_title: lead.job_title || '',
        website: lead.website || extra.website || '',
        lead_industry: lead.lead_industry || extra.lead_industry || '',
        employee_size: lead.employee_size || extra.employee_size || '',
        location: lead.location || extra.location || '',
        annual_revenue: lead.annual_revenue || extra.annual_revenue || '',
        phone: lead.phone || extra.phone || '',
        department: lead.department || extra.department || '',
        lead_date: lead.lead_date || extra.lead_date || ''
      });
      
      setView('lead_create');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeFormCampaign = campaigns.find(c => c.id === targetCampaignId);
    if (!activeFormCampaign) {
      alert('Please select or create a campaign first');
      return;
    }
    try {
      const nameParts = newLead.name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const extraData = {
        website: newLead.website,
        lead_industry: newLead.lead_industry,
        employee_size: newLead.employee_size,
        location: newLead.location,
        annual_revenue: newLead.annual_revenue,
        phone: newLead.phone,
        department: newLead.department,
        lead_date: newLead.lead_date,
      };

      if (selectedLead) {
        // We are updating an existing lead!
        const updated = await MQLDataService.updateLead(selectedLead.id, {
          first_name,
          last_name,
          email: newLead.email,
          company_name: newLead.company_name,
          job_title: newLead.job_title,
          campaign_id: targetCampaignId,
          website: newLead.website,
          lead_industry: newLead.lead_industry,
          employee_size: newLead.employee_size,
          location: newLead.location,
          annual_revenue: newLead.annual_revenue,
          phone: newLead.phone,
          department: newLead.department,
          lead_date: newLead.lead_date,
        });

        localStorage.setItem(`mql_lead_extra_${updated.id}`, JSON.stringify(extraData));

        setLeads(leads.map(l => l.id === updated.id ? updated : l));
        setSelectedLead(updated);
        alert('Lead details updated successfully!');
      } else {
        // We are creating a new lead!
        const created = await MQLDataService.createLead({
          first_name,
          last_name,
          email: newLead.email,
          company_name: newLead.company_name,
          job_title: newLead.job_title,
          campaign_id: activeFormCampaign.id,
          org_id: activeFormCampaign.org_id,
          status: 'New',
          website: newLead.website,
          lead_industry: newLead.lead_industry,
          employee_size: newLead.employee_size,
          location: newLead.location,
          annual_revenue: newLead.annual_revenue,
          phone: newLead.phone,
          department: newLead.department,
          lead_date: newLead.lead_date,
        });

        // Save the extra fields to localStorage
        localStorage.setItem(`mql_lead_extra_${created.id}`, JSON.stringify(extraData));

        setLeads([created, ...leads]);
        
        // Initialize the assessments empty list from JSON configs
        try {
          const combined = MQLConfigService.getCombinedEvidenceConfig(activeFormCampaign.industry!);
          const initialAssessments: any[] = [];
          ['fit', 'intent', 'engagement', 'timing'].forEach(dim => {
            const items = combined.evidence[dim] || [];
            items.forEach((item: any) => {
              initialAssessments.push({
                evidence_id: item.evidenceId,
                dimension: dim,
                is_present: false,
                evidence_value: '',
                notes: ''
              });
            });
          });
          setAssessmentData(initialAssessments);
        } catch (err) {
          console.error('Failed to pre-fill dynamic evidence list:', err);
          setAssessmentData([]);
        }

        setQualResult(null);
        setSelectedLead(created);
        setIcpExpanded(false);
        alert('Lead created successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save lead');
    }
  };

  const handleSaveAssessment = async () => {
    if (!selectedLead) return;
    try {
      await MQLDataService.saveAssessments(selectedLead.id, assessmentData);
      alert('Assessment saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save assessment');
    }
  };

  const handleEvaluateLead = async () => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      await MQLDataService.saveAssessments(selectedLead.id, assessmentData);
      
      const campaign = selectedCampaign || (selectedLead as any).mql_campaigns || campaigns.find(c => c.id === selectedLead.campaign_id);
      let combinedConfig = null;
      let ruleSet = null;
      
      if (campaign) {
        if (campaign.industry) {
          try {
            combinedConfig = MQLConfigService.getCombinedEvidenceConfig(campaign.industry);
          } catch (err) {
            console.error('Failed to get combined config:', err);
          }
        }
        if (campaign.revenue_motion) {
          try {
            ruleSet = MQLConfigService.getQualificationRuleSet(campaign.revenue_motion);
          } catch (err) {
            console.error('Failed to get qualification rule set:', err);
          }
        }
      }

      const result = await MQLDataService.evaluateLead(selectedLead.id, combinedConfig, ruleSet);
      
      setQualResult(result);
      
      const mappedStatus = 
        result.qualification_status === 'Highly Qualified MQL' || result.qualification_status === 'Qualified MQL'
          ? 'Qualified' as const
          : result.qualification_status === 'Marketing Nurture'
          ? 'Nurture' as const
          : result.qualification_status === 'Disqualified'
          ? 'Disqualified' as const
          : 'New' as const;

      // Update local state to reflect new status
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, status: mappedStatus } : l));
      setSelectedLead({...selectedLead, status: mappedStatus});
      
      // Update campaign qualifying results list for Lead Dashboard
      setCampaignQualResults(prev => {
        const existing = prev.findIndex(r => r.lead_id === selectedLead.id);
        if (existing >= 0) {
          return prev.map((r, idx) => idx === existing ? result : r);
        }
        return [...prev, result];
      });
      
    } catch (e) {
      console.error(e);
      alert('Failed to evaluate lead');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQualificationResult = async () => {
    if (!selectedLead || !qualResult) return;
    setSavingQual(true);
    try {
      const savedResult = await MQLDataService.saveQualificationResult(qualResult);
      setQualResult(savedResult);
      
      const mappedStatus = 
        savedResult.qualification_status === 'Highly Qualified MQL' || savedResult.qualification_status === 'Qualified MQL'
          ? 'Qualified' as const
          : savedResult.qualification_status === 'Marketing Nurture'
          ? 'Nurture' as const
          : savedResult.qualification_status === 'Disqualified'
          ? 'Disqualified' as const
          : 'New' as const;

      // Update local state to reflect new status
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, status: mappedStatus } : l));
      setSelectedLead({...selectedLead, status: mappedStatus});
      
      // Update campaign qualifying results list for Lead Dashboard
      setCampaignQualResults(prev => {
        const existing = prev.findIndex(r => r.lead_id === selectedLead.id);
        if (existing >= 0) {
          return prev.map((r, idx) => idx === existing ? savedResult : r);
        }
        return [...prev, savedResult];
      });
      
      alert('Qualification result saved successfully to database!');
    } catch (e) {
      console.error(e);
      alert('Failed to save qualification result to database');
    } finally {
      setSavingQual(false);
    }
  };

  const renderMainContent = () => {
    if (activeTab === 'campaign') {
      return (
        <div className="space-y-6">
          <CampaignForm 
            selectedCampaign={selectedCampaign}
            onCreated={(c) => { 
              setCampaigns([c, ...campaigns]); 
              setSelectedCampaign(c);
              setActiveTab('campaign');
              setView('campaign_config');
            }} 
            onUpdated={(c) => {
              setCampaigns(campaigns.map(camp => camp.id === c.id ? c : camp));
              setSelectedCampaign(c);
            }}
            onCreateLead={() => {
              setSelectedLead(null);
              setQualResult(null);
              setAssessmentData([]);
              setNewLead({
                name: '',
                email: '',
                company_name: '',
                job_title: '',
                website: '',
                lead_industry: '',
                employee_size: '',
                location: '',
                annual_revenue: '',
                phone: '',
                department: '',
                lead_date: ''
              });
              setActiveTab('lead');
              setView('lead_create');
            }}
          />
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      if (!selectedCampaign) {
        return (
          <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-bg-surface/30">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30 text-text-secondary" />
            <h3 className="text-xs font-black uppercase text-text-primary tracking-wider">No Active Campaign Selected</h3>
            <p className="text-[11px] text-text-secondary mt-1.5 max-w-sm mx-auto">
              Please select an existing campaign from the Campaign Register sidebar, or create a new blueprint to view campaign analytics.
            </p>
          </div>
        );
      }
      
      const dashboardLeads = leads.filter(l => l.campaign_id === selectedCampaign.id && !deletedLeadIds.includes(l.id));
      const dashboardQualResults = campaignQualResults.filter(r => {
        const lead = leads.find(l => l.id === r.lead_id);
        return lead && lead.campaign_id === selectedCampaign.id && !deletedLeadIds.includes(lead.id);
      });

      return (
        <div className="space-y-6 animate-in fade-in-30 duration-200">
          <LeadDashboard 
            campaign={selectedCampaign}
            leads={dashboardLeads}
            qualResults={dashboardQualResults}
          />
        </div>
      );
    }

    // Now activeTab === 'lead'
    if (campaigns.length === 0) {
      return (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-bg-surface/30">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30 text-text-secondary" />
          <h3 className="text-xs font-black uppercase text-text-primary tracking-wider">No Active Campaigns</h3>
          <p className="text-[11px] text-text-secondary mt-1.5 max-w-sm mx-auto">
            Please create a campaign in the Campaign Canvas tab first to start managing and qualifying leads.
          </p>
        </div>
      );
    }

    if (view === 'lead_list' || view === 'campaign_config') {
      const activeFilterCampaign = campaigns.find(c => c.id === campaignFilterId);
      const filteredLeads = leads.filter(lead => {
        const isDeleted = deletedLeadIds.includes(lead.id);
        if (showDeletedOnly) {
          if (!isDeleted) return false;
        } else {
          if (isDeleted) return false;
        }

        if (campaignFilterId !== 'all' && lead.campaign_id !== campaignFilterId) {
          return false;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          
          // 1. Contact Name
          const contactName = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
          
          // 2. Organization
          const org = (lead.company_name || '').toLowerCase();
          
          // 3. Title
          const title = (lead.job_title || '').toLowerCase();

          // 4. Email
          const email = (lead.email || '').toLowerCase();
          
          // 5. Industry from extra details
          let leadIndustry = '—';
          try {
            const extraJson = localStorage.getItem(`mql_lead_extra_${lead.id}`);
            if (extraJson) {
              const extra = JSON.parse(extraJson);
              if (extra.lead_industry) {
                leadIndustry = extra.lead_industry.toLowerCase();
              }
            }
          } catch {}

          // 6. Overall Score
          const leadQualResult = campaignQualResults.find(r => r.lead_id === lead.id);
          const overallScore = leadQualResult ? `${leadQualResult.qualification_score}/100` : '—';
          
          // 7. Confidence Score
          let confidenceText = '—';
          if (leadQualResult && leadQualResult.confidence_score !== undefined) {
            const score = leadQualResult.confidence_score;
            confidenceText = score <= 1 ? `${Math.round(score * 100)}%` : `${score}%`;
          }

          // 8. Sales Handover status
          let isHandedOver = "no";
          if (leadQualResult) {
            let ticketFromDb: any = null;
            if (leadQualResult.recommendations && typeof leadQualResult.recommendations === 'object' && !Array.isArray(leadQualResult.recommendations)) {
              const recObj = leadQualResult.recommendations as any;
              if (recObj.handover_ticket) {
                ticketFromDb = recObj.handover_ticket;
              }
            }
            const stored = localStorage.getItem(`mql_handover_${lead.id}`);
            let parsedStored: any = null;
            if (stored) {
              try {
                parsedStored = JSON.parse(stored);
              } catch {}
            }
            const parsed = ticketFromDb || parsedStored;
            if (parsed && parsed.is_handed_over) {
              isHandedOver = "yes";
            }
          }

          // 9. Qualification Status
          const statusVal = (lead.status || 'New').toLowerCase();

          const matches = contactName.includes(query) ||
                          org.includes(query) ||
                          title.includes(query) ||
                          email.includes(query) ||
                          leadIndustry.includes(query) ||
                          overallScore.toLowerCase().includes(query) ||
                          confidenceText.toLowerCase().includes(query) ||
                          isHandedOver.includes(query) ||
                          statusVal.includes(query);

          if (!matches) return false;
        }

        return true;
      });

      const handleExportCSV = () => {
        const leadsToExport = selectedLeadIds.length > 0 
          ? leads.filter(l => selectedLeadIds.includes(l.id))
          : filteredLeads;
          
        if (leadsToExport.length === 0) {
          alert("No leads to export.");
          return;
        }

        const headers = [
          "Contact Name",
          "Organization",
          "Title",
          "Email",
          "Industry",
          "Overall Score",
          "Confidence",
          "Sales Handover",
          "Qualification Status"
        ];

        const rows = leadsToExport.map(lead => {
          const leadQualResult = campaignQualResults.find(r => r.lead_id === lead.id);

          let leadIndustry = '';
          try {
            const extraJson = localStorage.getItem(`mql_lead_extra_${lead.id}`);
            if (extraJson) {
              const extra = JSON.parse(extraJson);
              if (extra.lead_industry) {
                leadIndustry = extra.lead_industry;
              }
            }
          } catch {}

          const overallScore = leadQualResult ? `${leadQualResult.qualification_score}` : '';

          let confidenceText = '';
          if (leadQualResult && leadQualResult.confidence_score !== undefined) {
            const score = leadQualResult.confidence_score;
            confidenceText = score <= 1 ? `${Math.round(score * 100)}%` : `${score}%`;
          }

          let isHandedOver = "No";
          if (leadQualResult) {
            let ticketFromDb: any = null;
            if (leadQualResult.recommendations && typeof leadQualResult.recommendations === 'object' && !Array.isArray(leadQualResult.recommendations)) {
              const recObj = leadQualResult.recommendations as any;
              if (recObj.handover_ticket) {
                ticketFromDb = recObj.handover_ticket;
              }
            }
            const stored = localStorage.getItem(`mql_handover_${lead.id}`);
            let parsedStored: any = null;
            if (stored) {
              try {
                parsedStored = JSON.parse(stored);
              } catch {}
            }
            const parsed = ticketFromDb || parsedStored;
            if (parsed && parsed.is_handed_over) {
              isHandedOver = "Yes";
            }
          }

          return [
            `"${(lead.first_name || '')} ${(lead.last_name || '')}"`,
            `"${(lead.company_name || '').replace(/"/g, '""')}"`,
            `"${(lead.job_title || '').replace(/"/g, '""')}"`,
            `"${lead.email || ''}"`,
            `"${leadIndustry.replace(/"/g, '""')}"`,
            overallScore,
            confidenceText,
            isHandedOver,
            lead.status || ''
          ];
        });

        const csvContent = [
          headers.join(","),
          ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mql_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const handleDeleteSelected = () => {
        if (selectedLeadIds.length === 0) return;
        setShowDeleteConfirm(true);
      };

      const confirmDeleteLeads = () => {
        setDeletedLeadIds(prev => {
          const next = [...new Set([...prev, ...selectedLeadIds])];
          return next;
        });
        setSelectedLeadIds([]);
        setShowDeleteConfirm(false);
      };

      const handlePermanentDeleteSelected = () => {
        if (selectedLeadIds.length === 0) return;
        setShowPermanentDeleteConfirm(true);
      };

      const confirmPermanentDeleteLeads = async () => {
        try {
          setLoading(true);
          await MQLDataService.deleteLeads(selectedLeadIds);
          
          // Remove from local leads state
          setLeads(prev => prev.filter(l => !selectedLeadIds.includes(l.id)));
          
          // Remove from deleted list
          setDeletedLeadIds(prev => prev.filter(id => !selectedLeadIds.includes(id)));
          
          setSelectedLeadIds([]);
          setShowPermanentDeleteConfirm(false);
        } catch (err) {
          console.error('Failed to permanently delete leads:', err);
          alert('Failed to permanently delete leads.');
        } finally {
          setLoading(false);
        }
      };

      const handleRestoreSelected = () => {
        if (selectedLeadIds.length === 0) return;
        setDeletedLeadIds(prev => prev.filter(id => !selectedLeadIds.includes(id)));
        setSelectedLeadIds([]);
      };

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-bg-surface/50 border border-border">
            <div>
              <span className="text-[10px] font-mono text-text-secondary uppercase">Active Leads Roster</span>
              <h2 className="text-lg font-bold text-text-primary mt-0.5">
                {campaignFilterId === 'all' ? 'All Campaigns Leads' : `${activeFilterCampaign?.name} Leads`}
              </h2>
              {campaignFilterId === 'all' ? (
                <p className="text-xs text-text-secondary mt-1">
                  Displaying all profiles qualified across all active pipeline qualification campaigns under your account.
                </p>
              ) : (
                <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-accent font-black font-mono text-[9px] uppercase">
                    {activeFilterCampaign?.industry || 'N/A'}
                  </span>
                  • {activeFilterCampaign?.revenue_motion?.replace(/_/g, ' ') || 'N/A'}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-text-secondary uppercase whitespace-nowrap">Campaign Filter:</span>
                <select
                  value={campaignFilterId}
                  onChange={(e) => setCampaignFilterId(e.target.value)}
                  className="bg-bg-surface border border-border text-text-primary font-sans text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-accent min-w-[160px] shadow-sm cursor-pointer"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowAddOptions(!showAddOptions)}
                  className="px-4 py-2 bg-accent text-black dark:text-black hover:opacity-90 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 select-none justify-center whitespace-nowrap"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add New Lead
                  <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                </button>
                
                {showAddOptions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowAddOptions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border rounded-xl shadow-lg z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => {
                          setShowAddOptions(false);
                          setSelectedLead(null);
                          setQualResult(null);
                          setAssessmentData([]);
                          setNewLead({
                            name: '', email: '', company_name: '', job_title: '',
                            website: '', lead_industry: '', employee_size: '', location: '',
                            annual_revenue: '', phone: '', department: '', lead_date: ''
                          });
                          if (campaignFilterId !== 'all') {
                            setTargetCampaignId(campaignFilterId);
                          } else if (campaigns.length > 0) {
                            setTargetCampaignId(campaigns[0].id);
                          } else {
                            setTargetCampaignId('');
                          }
                          setView('lead_create');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-primary hover:bg-bg-primary/50 transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Manual Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddOptions(false);
                          setShowCsvImport(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-primary hover:bg-bg-primary/50 transition-colors flex items-center gap-2"
                      >
                        <Download className="h-3.5 w-3.5 rotate-180" />
                        Import CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface/30 p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-4 w-full sm:w-auto text-xs font-mono font-bold text-text-secondary">
              {showDeletedOnly ? (
                <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Viewing Deleted Leads (Trash)
                </span>
              ) : (
                <span className="text-text-secondary whitespace-nowrap">
                  {selectedLeadIds.length > 0 ? (
                    <span className="text-accent">{selectedLeadIds.length} lead(s) selected</span>
                  ) : (
                    <span>{filteredLeads.length} active lead(s)</span>
                  )}
                </span>
              )}

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search leads across all columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-surface border border-border text-text-primary placeholder:text-text-secondary/45 font-sans text-xs font-normal rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:border-accent shadow-sm"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 hover:text-text-primary text-text-secondary transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {showDeletedOnly ? (
                <>
                  <button
                    onClick={handleRestoreSelected}
                    disabled={selectedLeadIds.length === 0}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Restore Selected
                  </button>
                  <button
                    onClick={handlePermanentDeleteSelected}
                    disabled={selectedLeadIds.length === 0}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Permanently delete selected leads"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Permanently Delete
                  </button>
                  <button
                    onClick={() => setShowDeletedOnly(false)}
                    className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back to Active Leads
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedLeadIds.length === 0}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Soft-delete selected leads"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Export listed leads to CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowDeletedOnly(true);
                      setSelectedLeadIds([]);
                    }}
                    className={`px-3 py-1.5 border font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      deletedLeadIds.length > 0
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-bg-surface text-text-secondary border-border hover:bg-bg-primary/50'
                    }`}
                    title="View soft-deleted leads"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Trash ({deletedLeadIds.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-primary/50 border-b border-border text-text-secondary font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-4 w-12 text-center select-none">
                      <input 
                        type="checkbox"
                        checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeadIds([]);
                          }
                        }}
                        className="rounded border-border text-accent focus:ring-accent cursor-pointer h-3.5 w-3.5"
                      />
                    </th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Organization</th>
                    <th className="px-6 py-4 font-bold">Title</th>
                    <th className="px-6 py-4 font-bold">Industry</th>
                    <th className="px-6 py-4 font-bold">Score</th>
                    <th className="px-6 py-4 font-bold">Confidence</th>
                    <th className="px-6 py-4 font-bold">Handover</th>
                    <th className="px-6 py-4 font-bold">MQL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text-primary">
                  {filteredLeads.map(lead => {
                    const leadQualResult = campaignQualResults.find(r => r.lead_id === lead.id);

                    // 1. Industry from lead details / extra JSON
                    let leadIndustry = lead.lead_industry || '—';
                    if (leadIndustry === '—') {
                      try {
                        const extraJson = localStorage.getItem(`mql_lead_extra_${lead.id}`);
                        if (extraJson) {
                          const extra = JSON.parse(extraJson);
                          if (extra.lead_industry) {
                            leadIndustry = extra.lead_industry;
                          }
                        }
                      } catch (e) {
                        console.error("Failed to parse extra json for lead:", lead.id, e);
                      }
                    }

                    // 2. Overall Score
                    const overallScore = leadQualResult ? `${leadQualResult.qualification_score}/100` : '—';

                    // 3. Confidence Score formatted elegantly
                    let confidenceText = '—';
                    if (leadQualResult && leadQualResult.confidence_score !== undefined) {
                      const score = leadQualResult.confidence_score;
                      confidenceText = score <= 1 ? `${Math.round(score * 100)}%` : `${score}%`;
                    }

                    // 4. Sales Handover status
                    let isHandedOver = false;
                    if (leadQualResult) {
                      let ticketFromDb: any = null;
                      if (leadQualResult.recommendations && typeof leadQualResult.recommendations === 'object' && !Array.isArray(leadQualResult.recommendations)) {
                        const recObj = leadQualResult.recommendations as any;
                        if (recObj.handover_ticket) {
                          ticketFromDb = recObj.handover_ticket;
                        }
                      }

                      const stored = localStorage.getItem(`mql_handover_${lead.id}`);
                      let parsedStored: any = null;
                      if (stored) {
                        try {
                          parsedStored = JSON.parse(stored);
                        } catch (e) {
                          console.error(e);
                        }
                      }

                      const parsed = ticketFromDb || parsedStored;
                      if (parsed && parsed.is_handed_over) {
                        isHandedOver = true;
                      }
                    }

                    let displayStatus = (lead.status as string) || 'New';
                    if (displayStatus === 'Qualified MQL' || displayStatus === 'Highly Qualified MQL') {
                      displayStatus = 'Qualified';
                    } else if (displayStatus === 'Disqualified MQL') {
                      displayStatus = 'Disqualified';
                    } else if (displayStatus === 'Marketing Nurture') {
                      displayStatus = 'Nurture';
                    }

                    const statusColor = displayStatus.toLowerCase().includes('highly') || displayStatus.toLowerCase() === 'qualified'
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                      : displayStatus.toLowerCase().includes('nurture')
                      ? 'text-accent bg-accent/10 border-accent/20'
                      : displayStatus.toLowerCase().includes('disqualified')
                      ? 'text-red-500 bg-red-500/10 border-red-500/20'
                      : 'text-text-secondary bg-bg-primary border-border';
                    
                    return (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleEditLeadClick(lead)}
                        className="hover:bg-bg-primary/30 transition-colors cursor-pointer group"
                        title="Click to view/edit lead details"
                      >
                        <td className="px-4 py-4 text-center w-12" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(prev => [...prev, lead.id]);
                              } else {
                                setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                              }
                            }}
                            className="rounded border-border text-accent focus:ring-accent cursor-pointer h-3.5 w-3.5"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold group-hover:text-accent transition-colors">{lead.first_name} {lead.last_name}</td>
                        <td className="px-6 py-4 text-text-secondary">{lead.company_name}</td>
                        <td className="px-6 py-4 text-text-secondary">{lead.job_title}</td>
                        <td className="px-6 py-4 text-text-secondary">{leadIndustry}</td>
                        <td className="px-6 py-4 font-mono font-bold text-text-secondary">{overallScore}</td>
                        <td className="px-6 py-4 font-mono font-bold text-text-secondary">{confidenceText}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg border font-black text-[10px] uppercase font-mono tracking-wider ${
                            isHandedOver 
                              ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                              : 'text-red-500 bg-red-500/10 border-red-500/20'
                          }`}>
                            {isHandedOver ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg border font-black text-[10px] uppercase font-mono tracking-wider ${statusColor}`}>
                            {displayStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-text-secondary">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30 text-text-secondary" />
                        No leads found matching current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Soft Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 text-red-500 mb-3.5">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-sans">Move to Trash</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                    Are you sure you want to move the <span className="font-bold text-text-primary">{selectedLeadIds.length}</span> selected lead(s) to the Trash? They will be hidden from your active list but can be restored later.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-bg-primary hover:bg-bg-primary/80 border border-border text-text-primary font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteLeads}
                      className="px-4 py-2 bg-red-500 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Move to Trash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permanent Delete Confirmation Modal */}
          {showPermanentDeleteConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 text-red-600 mb-3.5">
                    <div className="p-2 rounded-xl bg-red-600/10 border border-red-600/20">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-sans">Permanently Delete Leads</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
                    Warning: This action is irreversible. Are you sure you want to permanently delete the <span className="font-bold text-text-primary">{selectedLeadIds.length}</span> selected lead(s) and all their qualification results/assessments from the database?
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPermanentDeleteConfirm(false)}
                      className="px-4 py-2 bg-bg-primary hover:bg-bg-primary/80 border border-border text-text-primary font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmPermanentDeleteLeads}
                      className="px-4 py-2 bg-red-600 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (view === 'lead_create') {
      const isLeadSaved = selectedLead !== null;
      const isSaved = false; // Set to false to bypass disabled={isSaved} on all inputs
      const formValues = newLead;
      const activeFormCampaign = campaigns.find(c => c.id === targetCampaignId);

      return (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-border/40">
              <div>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-text-secondary/60 uppercase block">
                  {isLeadSaved ? 'SAVED LEAD PROFILE' : 'NEW LEAD'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-sans text-text-primary tracking-tight">Lead Details</h2>
              </div>
              <div className="flex items-center gap-3">
                {isLeadSaved && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLead(null);
                      setQualResult(null);
                      setAssessmentData([]);
                      setNewLead({
                        name: '',
                        email: '',
                        company_name: '',
                        job_title: '',
                        website: '',
                        lead_industry: '',
                        employee_size: '',
                        location: '',
                        annual_revenue: '',
                        phone: '',
                        department: '',
                        lead_date: ''
                      });
                    }}
                    className="px-5 py-2.5 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black hover:border-accent text-accent font-sans font-bold text-xs tracking-tight rounded-xl transition-all shadow-sm select-none"
                  >
                    + Create Another Lead
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => { setSelectedLead(null); setView('lead_list'); }} 
                  className="text-xs sm:text-sm font-mono text-text-secondary hover:text-accent transition-colors flex items-center gap-1 cursor-pointer select-none font-bold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Campaign Parameters Area (Auto-populated/Selectable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 py-1">
              <div className="space-y-1">
                <span className="text-xs font-bold text-text-primary font-sans block">Campaign Assignment:</span>
                {isLeadSaved ? (
                  <p className="text-xs text-text-secondary font-medium">
                    {campaigns.find(c => c.id === selectedLead.campaign_id)?.name || 'Unknown Campaign'}
                  </p>
                ) : (
                  <select
                    value={targetCampaignId}
                    onChange={(e) => setTargetCampaignId(e.target.value)}
                    className="bg-bg-surface border border-border text-text-primary font-sans text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-accent w-full max-w-xs shadow-sm cursor-pointer"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-text-primary font-sans block">Industry:</span>
                <p className="text-xs text-text-secondary font-medium">{activeFormCampaign?.industry || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-text-primary font-sans block">Revenue Motion:</span>
                <p className="text-xs text-text-secondary font-medium">
                  {activeFormCampaign?.revenue_motion ? activeFormCampaign.revenue_motion.replace(/_/g, ' ') : 'N/A'}
                </p>
              </div>
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary font-sans block">Ideal Customer Profile (ICP):</span>
                  <button 
                    type="button"
                    onClick={() => setIcpExpanded(!icpExpanded)}
                    className="p-1 rounded bg-bg-primary border border-border hover:border-accent text-accent transition-all cursor-pointer flex items-center justify-center text-xs font-black h-5 w-5 animate-in"
                  >
                    {icpExpanded ? '−' : '+'}
                  </button>
                </div>
                {icpExpanded ? (
                  <div className="p-4 rounded-xl bg-bg-primary/50 border border-border mt-2 space-y-3.5 animate-in fade-in duration-200 max-w-full">
                    {(() => {
                      if (!activeFormCampaign || !activeFormCampaign.icp_definition) {
                        return <p className="text-xs text-text-secondary">No ICP definition configured.</p>;
                      }
                      
                      let icpObj: Record<string, string> = {};
                      let isJson = false;
                      try {
                        icpObj = JSON.parse(activeFormCampaign.icp_definition);
                        isJson = typeof icpObj === 'object' && icpObj !== null;
                      } catch (e) {
                        isJson = false;
                      }

                      if (isJson) {
                        const fields = [
                          { key: 'company_size', label: 'Company Size:' },
                          { key: 'industry', label: 'Industry:' },
                          { key: 'geography', label: 'Geography:' },
                          { key: 'buying_triggers', label: 'Buying Triggers:' },
                          { key: 'budget_characteristics', label: 'Budget Characteristics:' },
                          { key: 'decision_structure', label: 'Decision Structure:' },
                        ];

                        const activeFields = fields.filter(f => icpObj[f.key]?.trim());
                        
                        if (activeFields.length === 0) {
                          return <p className="text-xs text-text-secondary">No ICP details configured.</p>;
                        }

                        return (
                          <div className="space-y-3.5 max-w-full">
                            {activeFields.map(f => (
                              <div key={f.key} className="block max-w-full">
                                <span className="text-xs font-bold text-text-primary font-sans block">
                                  {f.label}
                                </span>
                                <span className="text-[11px] text-text-secondary/90 font-medium mt-0.5 block whitespace-normal break-words leading-relaxed w-full">
                                  {icpObj[f.key]}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // Fallback for raw text: let's parse line-by-line for key-value labels
                      const lines = activeFormCampaign.icp_definition.split('\n').map(l => l.trim()).filter(Boolean);
                      return (
                        <div className="space-y-3.5 max-w-full">
                          {lines.map((line, idx) => {
                            const colonIndex = line.indexOf(':');
                            if (colonIndex > 0 && colonIndex < 40) { // avoid URLs with colons
                              const label = line.substring(0, colonIndex + 1).trim();
                              const content = line.substring(colonIndex + 1).trim();
                              if (content) {
                                return (
                                  <div key={idx} className="block max-w-full">
                                    <span className="text-xs font-bold text-text-primary font-sans block">
                                      {label}
                                    </span>
                                    <span className="text-[11px] text-text-secondary/90 font-medium mt-0.5 block whitespace-normal break-words leading-relaxed w-full">
                                      {content}
                                    </span>
                                  </div>
                                );
                              }
                            }
                            return (
                              <p key={idx} className="text-[11px] text-text-secondary/90 font-medium leading-relaxed break-words whitespace-normal block w-full">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Form Fields Grid */}
            <form onSubmit={handleCreateLead} className="space-y-6 pt-4 border-t border-border/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Company Name *</label>
                    <input 
                      required 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.company_name} 
                      onChange={e => setNewLead({...newLead, company_name: e.target.value})} 
                      placeholder="ABC Company"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Website</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.website} 
                      onChange={e => setNewLead({...newLead, website: e.target.value})} 
                      placeholder="https://abc.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Industry *</label>
                    <input
                      required
                      disabled={isSaved}
                      type="text"
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner"
                      value={formValues.lead_industry}
                      onChange={e => setNewLead({...newLead, lead_industry: e.target.value})}
                      placeholder="e.g. Infrastructure Projects, SaaS / Software"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Employee Size</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.employee_size} 
                      onChange={e => setNewLead({...newLead, employee_size: e.target.value})} 
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Location</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.location} 
                      onChange={e => setNewLead({...newLead, location: e.target.value})} 
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Annual Revenue</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.annual_revenue} 
                      onChange={e => setNewLead({...newLead, annual_revenue: e.target.value})} 
                      placeholder="$100,000,000"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Name *</label>
                    <input 
                      required 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.name} 
                      onChange={e => setNewLead({...newLead, name: e.target.value})} 
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Email *</label>
                    <input 
                      required 
                      disabled={isSaved}
                      type="email" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.email} 
                      onChange={e => setNewLead({...newLead, email: e.target.value})} 
                      placeholder="john.smith@abc.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Phone</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.phone} 
                      onChange={e => setNewLead({...newLead, phone: e.target.value})} 
                      placeholder="+00 0000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Title *</label>
                    <input 
                      required 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.job_title} 
                      onChange={e => setNewLead({...newLead, job_title: e.target.value})} 
                      placeholder="Vice President Operations"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Department</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.department} 
                      onChange={e => setNewLead({...newLead, department: e.target.value})} 
                      placeholder="Operations"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 font-sans">Date</label>
                    <input 
                      disabled={isSaved}
                      type="text" 
                      className="w-full bg-bg-primary/40 disabled:opacity-75 disabled:cursor-not-allowed border border-border focus:border-accent/40 rounded-xl px-3.5 py-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans shadow-inner" 
                      value={formValues.lead_date} 
                      onChange={e => setNewLead({...newLead, lead_date: e.target.value})} 
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`px-5 py-2.5 disabled:bg-[#1A1C20]/45 disabled:text-text-secondary disabled:cursor-not-allowed text-white font-bold text-xs tracking-tight rounded-xl transition-all shadow-sm cursor-pointer select-none font-sans ${
                    isLeadSaved 
                      ? 'bg-accent hover:bg-accent/90' 
                      : 'bg-[#0B0C0E] hover:bg-[#1A1C20]'
                  }`}
                >
                  {isLeadSaved ? 'Update Lead Details' : 'Save'}
                </button>
              </div>
            </form>
          </div>

          {/* Lead Qualification Form Unfolds Right Below */}
          {isLeadSaved && (
            <div className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border space-y-6 animate-in fade-in duration-300">
              <LeadQualificationForm
                campaign={selectedCampaign || campaigns.find(c => c.id === selectedLead?.campaign_id) || campaigns[0]}
                lead={selectedLead!}
                initialData={assessmentData}
                onChange={setAssessmentData}
                onSave={handleSaveAssessment}
                onRun={handleEvaluateLead}
                loading={loading}
              />
            </div>
          )}

          {/* AI Qualification Results displays right below after evaluation */}
          {isLeadSaved && qualResult && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300">
              <QualificationResult 
                result={qualResult} 
                onSave={handleSaveQualificationResult}
                saving={savingQual}
              />
            </div>
          )}
        </div>
      );
    }

    if (view === 'lead_assess' && selectedLead) {
      let extra: any = {};
      try {
        const extraJson = localStorage.getItem(`mql_lead_extra_${selectedLead.id}`);
        if (extraJson) {
          extra = JSON.parse(extraJson);
        }
      } catch (e) {
        console.error(e);
      }

      const website = selectedLead.website || extra.website;
      const lead_industry = selectedLead.lead_industry || extra.lead_industry;
      const employee_size = selectedLead.employee_size || extra.employee_size;
      const location = selectedLead.location || extra.location;
      const annual_revenue = selectedLead.annual_revenue || extra.annual_revenue;
      const phone = selectedLead.phone || extra.phone;
      const department = selectedLead.department || extra.department;
      const lead_date = selectedLead.lead_date || extra.lead_date;

      const hasMetadata = website || lead_industry || employee_size || location || annual_revenue || phone || department || lead_date;

      return (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-bg-surface border border-border">
            <button 
              onClick={() => { setSelectedLead(null); setView('lead_list'); }} 
              className="text-xs font-mono text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Leads Register
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase">Active Assessment Session</span>
                <h2 className="text-xl font-black text-text-primary mt-0.5">{selectedLead.first_name} {selectedLead.last_name}</h2>
                <p className="text-xs text-text-secondary">{selectedLead.job_title} at <span className="font-bold text-text-primary">{selectedLead.company_name}</span></p>
              </div>
            </div>

            {/* Redesigned Leads Profile Metadata */}
            {hasMetadata && (
              <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {website && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Website</span>
                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium truncate block mt-0.5">{website}</a>
                  </div>
                )}
                {lead_industry && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Industry</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{lead_industry}</span>
                  </div>
                )}
                {employee_size && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Employee Size</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{employee_size}</span>
                  </div>
                )}
                {location && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Location</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{location}</span>
                  </div>
                )}
                {annual_revenue && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Annual Revenue</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{annual_revenue}</span>
                  </div>
                )}
                {phone && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Phone</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{phone}</span>
                  </div>
                )}
                {department && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Department</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{department}</span>
                  </div>
                )}
                {lead_date && (
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary uppercase block">Date</span>
                    <span className="text-text-primary font-bold mt-0.5 block">{lead_date}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border">
            <LeadQualificationForm
              campaign={selectedCampaign || campaigns.find(c => c.id === selectedLead?.campaign_id) || campaigns[0]}
              lead={selectedLead}
              initialData={assessmentData}
              onChange={setAssessmentData}
              onSave={handleSaveAssessment}
              onRun={handleEvaluateLead}
              loading={loading}
            />
          </div>

          {qualResult && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300">
              <QualificationResult 
                result={qualResult} 
                onSave={handleSaveQualificationResult}
                saving={savingQual}
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Module Title Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-accent uppercase flex items-center gap-1.5 mb-1.5">
            <Cpu className="h-4 w-4 text-accent" />
            Layer 2 Commercial Reasoning Modules
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-sans text-text-primary tracking-tight">Lead Qualification Engine</h1>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00F090]" />
            <span className="text-[10px] font-mono font-black text-accent uppercase tracking-widest">CONNECTED WITH SUPABASE CLOUD</span>
          </div>
        </div>
      </div>

      {/* Horizontal rolling workflow timeline stepper (Campaign Canvas, Lead Canvas, Lead Dashboard) */}
      <div className="p-4 rounded-2xl bg-bg-surface/60 border border-border/80 shadow relative">
        <div className="flex items-center justify-between pointer-events-none mb-3 border-b border-border/40 pb-2">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Unified qualification lifecycle sequence</span>
          <span className="text-xs font-bold text-accent">
            Active qualification step: {
              activeTab === 'campaign' ? '1 / 3' : activeTab === 'lead' ? '2 / 3' : '3 / 3'
            }
          </span>
        </div>

        {/* Rolling wrapper */}
        <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar-horizontal py-1 pb-3 flex items-center gap-2">
          <button
            onClick={() => handleTabChange('campaign')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
              activeTab === 'campaign'
                ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
            }`}
          >
            <span className="font-mono">1.</span>
            <span>Campaign Canvas</span>
          </button>

          <button
            onClick={() => handleTabChange('lead')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
              activeTab === 'lead'
                ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
            }`}
          >
            <span className="font-mono">2.</span>
            <span>Lead List {selectedCampaign && `(${leads.length})`}</span>
          </button>

          <button
            onClick={() => handleTabChange('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
            }`}
          >
            <span className="font-mono">3.</span>
            <span>Lead Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Core Columns */}
      {activeTab === 'campaign' ? (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
          {/* Left Side: Campaigns Register List (Col 4) */}
          <div className="w-full lg:col-span-4 p-5 rounded-2xl bg-bg-surface border border-border flex flex-col shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h3 className="font-bold text-[11px] sm:text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-accent" />
                Campaign Register
              </h3>
              <button
                onClick={() => { setSelectedCampaign(null); setView('campaign_config'); }}
                className="p-1.5 sm:p-2 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black hover:border-accent text-accent transition-all shrink-0"
                title="Initialize fresh qualification campaign"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 max-h-[50vh] lg:max-h-[70vh]">
              {campaigns.map(c => (
                <div
                  key={c.id}
                  onClick={() => selectCampaign(c)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                    selectedCampaign?.id === c.id
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-bg-primary/60 border-border/80 text-text-secondary hover:border-text-secondary/25'
                  }`}
                >
                  <h4 className="text-xs sm:text-xs font-black leading-snug truncate">{c.name}</h4>
                  <span className="text-[9px] font-mono uppercase block mt-1 opacity-80 truncate">
                    {c.target_market || c.industry || 'No Market Specified'}
                  </span>
                </div>
              ))}
              {campaigns.length === 0 && !loading && (
                <div className="text-center p-6 text-xs text-text-secondary border border-dashed border-border rounded-xl">
                  No campaigns detected. Click the plus icon to start a new campaign.
                </div>
              )}
              {loading && campaigns.length === 0 && (
                <div className="text-center p-6 text-xs text-text-secondary">
                  Loading campaigns...
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Active Focus Sheet (Col 8) */}
          <div className="w-full lg:col-span-8 flex flex-col min-w-0">
            {/* View Content area */}
            <div className="animate-in fade-in-30 duration-200">
              {renderMainContent()}
            </div>
          </div>
        </div>
      ) : (
        /* Full-width Workspace Area (Col 12 equivalent) */
        <div className="w-full flex flex-col min-w-0">
          {/* View Content area */}
          <div className="animate-in fade-in-30 duration-200">
            {renderMainContent()}
          </div>
        </div>
      )}

      {showCsvImport && (
        <CsvImportModal
          campaigns={campaigns}
          onClose={() => setShowCsvImport(false)}
          onImportComplete={(importedLeads) => {
            setLeads(prev => [...importedLeads, ...prev]);
          }}
        />
      )}
    </div>
  );
};

