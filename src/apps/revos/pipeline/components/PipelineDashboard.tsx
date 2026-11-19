import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Award,
  ShieldAlert,
  Briefcase,
  ArrowRight,
  RefreshCw,
  PieChart as PieChartIcon,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  Info,
  X
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../hooks/useAuth';
import {
  PipelineCardItem,
  PIPELINE_STAGE_OPTIONS,
  OPPORTUNITY_STAGE_OPTIONS
} from './PipelineCard';
import {
  loadCanonicalPipelinePortfolio,
  resolveCanvasColumn,
  isPipelineItemClosed
} from '../services/pipelinePortfolioLoader';

type StageKey =
  | 'Initial Pipeline'
  | 'Proposal / Evaluation'
  | 'Negotiation / Commit'
  | 'Closed Won'
  | 'Closed Lost';

const STAGE_ORDER: Array<{ key: StageKey; shortLabel: string; colorClass: string }> = [
  { key: 'Initial Pipeline', shortLabel: 'Initial', colorClass: 'bg-accent' },
  { key: 'Proposal / Evaluation', shortLabel: 'Proposal', colorClass: 'bg-sky-400' },
  { key: 'Negotiation / Commit', shortLabel: 'Negotiation', colorClass: 'bg-amber-400' },
  { key: 'Closed Won', shortLabel: 'Won', colorClass: 'bg-emerald-400' },
  { key: 'Closed Lost', shortLabel: 'Lost', colorClass: 'bg-red-400' }
];

function isClosedWonItem(item: PipelineCardItem): boolean {
  return (
    item.pipeline_stage === 'Closed Won' || item.pipeline_opp?.lifecycle_status === 'CLOSED_WON'
  );
}

function isClosedLostItem(item: PipelineCardItem): boolean {
  return (
    item.pipeline_stage === 'Closed Lost' || item.pipeline_opp?.lifecycle_status === 'CLOSED_LOST'
  );
}

function resolveStage(item: PipelineCardItem): StageKey {
  if (isClosedWonItem(item)) return 'Closed Won';
  if (isClosedLostItem(item)) return 'Closed Lost';
  const col = resolveCanvasColumn(item);
  if (col === 'Proposal/Evaluation') return 'Proposal / Evaluation';
  if (col === 'Negotiation/Commit') return 'Negotiation / Commit';
  return 'Initial Pipeline';
}

function formatCompactCurrency(val: number): string {
  if (!val || val <= 0) return '$0';
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${val.toLocaleString('en-US')}`;
}

const StageTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: { stage: string; count: number; totalValue: number; weightedValue: number } }>;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-bg-surface px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-bold text-text-primary">{row.stage}</div>
      <div className="font-mono text-text-secondary">
        Deals: <strong className="text-text-primary">{row.count}</strong>
      </div>
      <div className="font-mono text-text-secondary">
        Total Value: <strong className="text-accent">${row.totalValue.toLocaleString('en-US')}</strong>
      </div>
      <div className="font-mono text-text-secondary">
        Risk-Adj Forecast: <strong className="text-emerald-400">${Math.round(row.weightedValue).toLocaleString('en-US')}</strong>
      </div>
    </div>
  );
};

function parseDateValue(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '—' || trimmed === '--') return null;

  const isoDateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, y, m, d] = isoDateOnly;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const usDateOnly = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDateOnly) {
    const [, m, d, y] = usDateOnly;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getItemAssessmentTimestamp(item: PipelineCardItem): string | undefined {
  const assess = item.pipeline_opp?.latest_assessment;
  if (!assess) return undefined;
  return assess.completed_at || assess.updated_at || assess.created_at;
}

function getItemOwner(item: PipelineCardItem): string {
  return (item.opportunity_owner || item.pipeline_opp?.opportunity_owner || '').trim();
}

function getItemCloseDateRaw(item: PipelineCardItem): string | undefined {
  return item.expected_close_date || item.pipeline_opp?.expected_close_date;
}

function toDayTimestamp(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(isoDate?: string): string {
  if (!isoDate) return '';
  const dt = parseDateValue(isoDate);
  if (!dt) return isoDate;
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${m}/${d}/${dt.getFullYear()}`;
}

function formatRangeSummary(startDate: string, endDate: string): string {
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
  }
  if (startDate) return `From ${formatDisplayDate(startDate)}`;
  if (endDate) return `Until ${formatDisplayDate(endDate)}`;
  return '';
}

function matchesDateRange(rawDate: string | undefined, startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return true;
  const dt = parseDateValue(rawDate);
  if (!dt) return false;

  const targetTs = toDayTimestamp(dt);
  if (startDate) {
    const startDt = parseDateValue(startDate);
    if (startDt && targetTs < toDayTimestamp(startDt)) return false;
  }
  if (endDate) {
    const endDt = parseDateValue(endDate);
    if (endDt && targetTs > toDayTimestamp(endDt)) return false;
  }
  return true;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

interface DateRangeCalendarPickerProps {
  label: string;
  placeholder: string;
  startDate: string;
  endDate: string;
  initialFocusDate?: Date;
  yearBounds?: { minYear: number; maxYear: number };
  onChange: (nextStart: string, nextEnd: string) => void;
}

const DateRangeCalendarPicker: React.FC<DateRangeCalendarPickerProps> = ({
  label,
  placeholder,
  startDate,
  endDate,
  initialFocusDate,
  yearBounds,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string>('');
  const [selectingPhase, setSelectingPhase] = useState<'start' | 'end'>('start');
  const containerRef = useRef<HTMLDivElement>(null);

  const initialAnchor = useMemo(() => {
    return (
      parseDateValue(startDate) ||
      parseDateValue(endDate) ||
      initialFocusDate ||
      new Date()
    );
  }, [startDate, endDate, initialFocusDate]);

  const [viewYear, setViewYear] = useState<number>(initialAnchor.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialAnchor.getMonth());

  useEffect(() => {
    if (!open) return;
    const anchor =
      parseDateValue(startDate) ||
      parseDateValue(endDate) ||
      initialFocusDate ||
      new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    setSelectingPhase(startDate && !endDate ? 'end' : 'start');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const isActive = Boolean(startDate || endDate);
  const summaryText = formatRangeSummary(startDate, endDate);

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(yearBounds?.minYear ?? currentYear - 3, viewYear, currentYear - 3);
  const maxYear = Math.max(yearBounds?.maxYear ?? currentYear + 5, viewYear, currentYear + 5);
  const yearsList = useMemo(() => {
    const arr: number[] = [];
    for (let y = minYear; y <= maxYear; y++) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        iso: toISODateString(new Date(viewYear, viewMonth, d)),
        day: d
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (iso: string) => {
    if (selectingPhase === 'start' || !startDate) {
      onChange(iso, '');
      setSelectingPhase('end');
    } else {
      if (iso < startDate) {
        onChange(iso, startDate);
      } else {
        onChange(startDate, iso);
      }
      setSelectingPhase('start');
    }
  };

  const effectiveEnd =
    selectingPhase === 'end' && startDate && !endDate && hoverDate ? hoverDate : endDate;
  const rangeMin =
    startDate && effectiveEnd ? (startDate <= effectiveEnd ? startDate : effectiveEnd) : startDate;
  const rangeMax =
    startDate && effectiveEnd ? (startDate <= effectiveEnd ? effectiveEnd : startDate) : endDate;

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
        <span>{label}</span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
      </label>

      <div
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl border text-xs transition-colors ${
          isActive
            ? 'bg-accent/10 border-accent/60 text-text-primary'
            : 'bg-bg-surface border-border text-text-primary hover:border-accent/40'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer focus:outline-none"
        >
          <Calendar className="h-3.5 w-3.5 text-accent shrink-0" />
          <span
            className={`truncate ${
              isActive ? 'font-mono font-semibold text-text-primary' : 'font-medium text-text-secondary'
            }`}
          >
            {summaryText || placeholder}
          </span>
        </button>

        {isActive ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('', '');
              setSelectingPhase('start');
            }}
            className="text-text-secondary hover:text-text-primary cursor-pointer shrink-0"
            title={`Clear ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="text-text-secondary hover:text-text-primary cursor-pointer shrink-0"
            aria-label={`Open ${label} calendar`}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[290px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-bg-surface p-3.5 shadow-xl space-y-3">
          {/* Selected Start / End display pills */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectingPhase('start')}
              className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                selectingPhase === 'start'
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-bg-primary/60'
              }`}
            >
              <div className="text-[9px] font-mono uppercase text-text-secondary">Start Date</div>
              <div className="text-[11px] font-mono font-bold text-text-primary mt-0.5">
                {startDate ? formatDisplayDate(startDate) : 'Pick date'}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectingPhase('end')}
              className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                selectingPhase === 'end'
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-bg-primary/60'
              }`}
            >
              <div className="text-[9px] font-mono uppercase text-text-secondary">End Date</div>
              <div className="text-[11px] font-mono font-bold text-text-primary mt-0.5">
                {endDate ? formatDisplayDate(endDate) : 'Pick date'}
              </div>
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-border bg-bg-primary/50 text-text-secondary hover:text-text-primary hover:border-accent/40 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-border bg-bg-primary text-[11px] font-bold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx} className="bg-bg-surface text-text-primary">
                    {mName.slice(0, 3)}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-border bg-bg-primary text-[11px] font-mono font-bold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {yearsList.map((yr) => (
                  <option key={yr} value={yr} className="bg-bg-surface text-text-primary">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-border bg-bg-primary/50 text-text-secondary hover:text-text-primary hover:border-accent/40 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((wd) => (
              <div
                key={wd}
                className="text-[10px] font-mono font-bold text-text-secondary py-1 select-none"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div
            className="grid grid-cols-7 gap-1 text-center"
            onMouseLeave={() => setHoverDate('')}
          >
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-7" />;
              }

              const isStart = Boolean(startDate && cell.iso === startDate);
              const isEnd = Boolean(endDate && cell.iso === endDate);
              const isEndpoint = isStart || isEnd;
              const isInRange = Boolean(
                rangeMin && rangeMax && cell.iso > rangeMin && cell.iso < rangeMax
              );
              const isPreviewEnd = Boolean(
                selectingPhase === 'end' && startDate && !endDate && hoverDate === cell.iso
              );

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleDayClick(cell.iso)}
                  onMouseEnter={() => {
                    if (selectingPhase === 'end' && startDate && !endDate) {
                      setHoverDate(cell.iso);
                    }
                  }}
                  className={`h-7 w-full rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center justify-center ${
                    isEndpoint
                      ? 'bg-accent text-black font-black shadow-sm'
                      : isInRange || isPreviewEnd
                        ? 'bg-accent/20 text-accent font-bold'
                        : 'text-text-primary hover:bg-bg-primary hover:text-accent'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => {
                onChange('', '');
                setSelectingPhase('start');
              }}
              disabled={!isActive}
              className="text-[11px] font-mono font-bold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Clear Dates
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded-lg bg-accent text-black text-[11px] font-bold hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface GlobalFilterState {
  assessmentStartDate: string;
  assessmentEndDate: string;
  industry: string;
  revenueMotion: string;
  opportunityOwner: string;
  pipelineStage: string;
  opportunityStage: string;
  closingStartDate: string;
  closingEndDate: string;
}

const DEFAULT_GLOBAL_FILTERS: GlobalFilterState = {
  assessmentStartDate: '',
  assessmentEndDate: '',
  industry: 'ALL',
  revenueMotion: 'ALL',
  opportunityOwner: 'ALL',
  pipelineStage: 'ALL',
  opportunityStage: 'ALL',
  closingStartDate: '',
  closingEndDate: ''
};

export const PipelineDashboard: React.FC = () => {
  const { profile, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<PipelineCardItem[]>([]);
  const [riskRows, setRiskRows] = useState<
    Array<{ risk_instance_id: string; pipeline_id: string; assessment_id: string; severity: string; risk_status: string }>
  >([]);
  const [actionRows, setActionRows] = useState<
    Array<{ action_id: string; pipeline_id: string; action_status: string }>
  >([]);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState(false);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>(DEFAULT_GLOBAL_FILTERS);
  const [activeKpiTooltip, setActiveKpiTooltip] = useState<{
    id: 'riskAdjForecast' | 'avgRiskAdjWin';
    top: number;
    left: number;
    placeBelow: boolean;
  } | null>(null);

  const openKpiTooltip = (
    id: 'riskAdjForecast' | 'avgRiskAdjWin',
    target: HTMLElement
  ) => {
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 360;
    const clampedLeft =
      typeof window !== 'undefined'
        ? Math.max(
            16,
            Math.min(
              rect.left + rect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - 16
            )
          )
        : rect.left;
    const placeBelow = rect.top < 240;
    setActiveKpiTooltip({
      id,
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placeBelow
    });
  };

  const closeKpiTooltip = () => setActiveKpiTooltip(null);

  const loadDashboardData = async () => {
    const isInitial = items.length === 0;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const [mergedItems, risksRes, actionsRes] = await Promise.all([
        loadCanonicalPipelinePortfolio(),
        supabase
          .from('pipeline_risks')
          .select('risk_instance_id, pipeline_id, assessment_id, severity, risk_status'),
        supabase.from('pipeline_actions').select('action_id, pipeline_id, action_status')
      ]);

      setItems(mergedItems);
      setRiskRows((risksRes.data || []) as any[]);
      setActionRows((actionsRes.data || []) as any[]);
    } catch (err) {
      console.error('Error loading Pipeline Dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Permission-aware and data-driven filter availability & options
  const canUsePortfolioFilters =
    Boolean(profile) &&
    hasRole([
      'free_user',
      'paid_user',
      'enterprise_user',
      'workspace_admin',
      'enterprise_executive',
      'revos_admin',
      'super_admin'
    ]);

  const canFilterByOwner = canUsePortfolioFilters;

  const filterDefinitions = useMemo(() => {
    // 1. Assessment Period support (only if at least one item has a valid assessment date)
    const assessedDates = items
      .map((i) => parseDateValue(getItemAssessmentTimestamp(i)))
      .filter((d): d is Date => d !== null);
    const hasAssessmentPeriodData = canUsePortfolioFilters && assessedDates.length > 0;
    const assessmentYearBounds =
      assessedDates.length > 0
        ? {
            minYear: Math.min(...assessedDates.map((d) => d.getFullYear())),
            maxYear: Math.max(...assessedDates.map((d) => d.getFullYear()))
          }
        : undefined;
    const latestAssessedDate =
      assessedDates.length > 0
        ? new Date(Math.max(...assessedDates.map((d) => d.getTime())))
        : undefined;

    // 2. Industry
    const industryOptions = canUsePortfolioFilters
      ? Array.from(
          new Set(items.map((i) => (i.industry || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))
      : [];

    // 3. Revenue Motion
    const revenueMotionOptions = canUsePortfolioFilters
      ? Array.from(
          new Set(items.map((i) => (i.revenue_motion || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))
      : [];

    // 4. Opportunity Owner (gated by owner visibility permission + available data)
    const ownerOptions = canFilterByOwner
      ? Array.from(new Set(items.map(getItemOwner).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b)
        )
      : [];

    // 5. Pipeline Stage (preserve canonical stage ordering)
    const presentPipeStages = new Set(
      items.map((i) => (i.pipeline_stage || '').trim()).filter(Boolean)
    );
    const orderedPipeStages: string[] = PIPELINE_STAGE_OPTIONS.filter((s) =>
      presentPipeStages.has(s)
    );
    presentPipeStages.forEach((s) => {
      if (!orderedPipeStages.includes(s)) orderedPipeStages.push(s);
    });
    const pipelineStageOptions = canUsePortfolioFilters ? orderedPipeStages : [];

    // 6. Opportunity Stage (preserve canonical opportunity stage ordering)
    const presentOppStages = new Set(
      items.map((i) => (i.opportunity_stage || '').trim()).filter(Boolean)
    );
    const orderedOppStages: string[] = OPPORTUNITY_STAGE_OPTIONS.filter((s) =>
      presentOppStages.has(s)
    );
    presentOppStages.forEach((s) => {
      if (!orderedOppStages.includes(s)) orderedOppStages.push(s);
    });
    const opportunityStageOptions = canUsePortfolioFilters ? orderedOppStages : [];

    // 7. Expected Closing Period support (only if at least one item has a valid close date)
    const closeDates = items
      .map((i) => parseDateValue(getItemCloseDateRaw(i)))
      .filter((d): d is Date => d !== null);
    const hasClosingPeriodData = canUsePortfolioFilters && closeDates.length > 0;
    const closingYearBounds =
      closeDates.length > 0
        ? {
            minYear: Math.min(...closeDates.map((d) => d.getFullYear())),
            maxYear: Math.max(...closeDates.map((d) => d.getFullYear()))
          }
        : undefined;
    const earliestCloseDate =
      closeDates.length > 0
        ? new Date(Math.min(...closeDates.map((d) => d.getTime())))
        : undefined;

    return {
      hasAssessmentPeriodData,
      assessmentYearBounds,
      latestAssessedDate,
      industryOptions,
      revenueMotionOptions,
      ownerOptions,
      pipelineStageOptions,
      opportunityStageOptions,
      hasClosingPeriodData,
      closingYearBounds,
      earliestCloseDate
    };
  }, [items, canUsePortfolioFilters, canFilterByOwner]);

  // Clear any stale selected value if data refresh or permissions remove that option
  useEffect(() => {
    if (loading) return;
    setGlobalFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (
        (prev.assessmentStartDate || prev.assessmentEndDate) &&
        !filterDefinitions.hasAssessmentPeriodData
      ) {
        next.assessmentStartDate = '';
        next.assessmentEndDate = '';
        changed = true;
      }
      if (prev.industry !== 'ALL' && !filterDefinitions.industryOptions.includes(prev.industry)) {
        next.industry = 'ALL';
        changed = true;
      }
      if (
        prev.revenueMotion !== 'ALL' &&
        !filterDefinitions.revenueMotionOptions.includes(prev.revenueMotion)
      ) {
        next.revenueMotion = 'ALL';
        changed = true;
      }
      if (
        prev.opportunityOwner !== 'ALL' &&
        !filterDefinitions.ownerOptions.includes(prev.opportunityOwner)
      ) {
        next.opportunityOwner = 'ALL';
        changed = true;
      }
      if (
        prev.pipelineStage !== 'ALL' &&
        !filterDefinitions.pipelineStageOptions.includes(prev.pipelineStage)
      ) {
        next.pipelineStage = 'ALL';
        changed = true;
      }
      if (
        prev.opportunityStage !== 'ALL' &&
        !filterDefinitions.opportunityStageOptions.includes(prev.opportunityStage)
      ) {
        next.opportunityStage = 'ALL';
        changed = true;
      }
      if (
        (prev.closingStartDate || prev.closingEndDate) &&
        !filterDefinitions.hasClosingPeriodData
      ) {
        next.closingStartDate = '';
        next.closingEndDate = '';
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [loading, filterDefinitions]);

  const activeFilterIndicators = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      valueLabel: string;
      onClear: () => void;
    }> = [];
    if (globalFilters.assessmentStartDate || globalFilters.assessmentEndDate) {
      list.push({
        id: 'assessmentPeriod',
        label: 'Assessment Period',
        valueLabel: formatRangeSummary(
          globalFilters.assessmentStartDate,
          globalFilters.assessmentEndDate
        ),
        onClear: () =>
          setGlobalFilters((prev) => ({
            ...prev,
            assessmentStartDate: '',
            assessmentEndDate: ''
          }))
      });
    }
    if (globalFilters.industry !== 'ALL') {
      list.push({
        id: 'industry',
        label: 'Industry',
        valueLabel: globalFilters.industry,
        onClear: () => setGlobalFilters((prev) => ({ ...prev, industry: 'ALL' }))
      });
    }
    if (globalFilters.revenueMotion !== 'ALL') {
      list.push({
        id: 'revenueMotion',
        label: 'Revenue Motion',
        valueLabel: globalFilters.revenueMotion,
        onClear: () => setGlobalFilters((prev) => ({ ...prev, revenueMotion: 'ALL' }))
      });
    }
    if (globalFilters.opportunityOwner !== 'ALL') {
      list.push({
        id: 'opportunityOwner',
        label: 'Owner',
        valueLabel: globalFilters.opportunityOwner,
        onClear: () => setGlobalFilters((prev) => ({ ...prev, opportunityOwner: 'ALL' }))
      });
    }
    if (globalFilters.pipelineStage !== 'ALL') {
      list.push({
        id: 'pipelineStage',
        label: 'Pipeline Stage',
        valueLabel: globalFilters.pipelineStage,
        onClear: () => setGlobalFilters((prev) => ({ ...prev, pipelineStage: 'ALL' }))
      });
    }
    if (globalFilters.opportunityStage !== 'ALL') {
      list.push({
        id: 'opportunityStage',
        label: 'Opportunity Stage',
        valueLabel: globalFilters.opportunityStage,
        onClear: () => setGlobalFilters((prev) => ({ ...prev, opportunityStage: 'ALL' }))
      });
    }
    if (globalFilters.closingStartDate || globalFilters.closingEndDate) {
      list.push({
        id: 'closingPeriod',
        label: 'Expected Closing',
        valueLabel: formatRangeSummary(
          globalFilters.closingStartDate,
          globalFilters.closingEndDate
        ),
        onClear: () =>
          setGlobalFilters((prev) => ({
            ...prev,
            closingStartDate: '',
            closingEndDate: ''
          }))
      });
    }
    return list;
  }, [globalFilters]);

  const hasAnyActiveFilter = activeFilterIndicators.length > 0 || scopeFilter !== 'ALL';

  const handleClearAllFilters = () => {
    setGlobalFilters(DEFAULT_GLOBAL_FILTERS);
    setScopeFilter('ALL');
  };

  // Step 1: Apply Global Filter Bar across entire portfolio
  const globallyFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        (globalFilters.assessmentStartDate || globalFilters.assessmentEndDate) &&
        !matchesDateRange(
          getItemAssessmentTimestamp(item),
          globalFilters.assessmentStartDate,
          globalFilters.assessmentEndDate
        )
      ) {
        return false;
      }
      if (
        globalFilters.industry !== 'ALL' &&
        (item.industry || '').trim() !== globalFilters.industry
      ) {
        return false;
      }
      if (
        globalFilters.revenueMotion !== 'ALL' &&
        (item.revenue_motion || '').trim() !== globalFilters.revenueMotion
      ) {
        return false;
      }
      if (
        globalFilters.opportunityOwner !== 'ALL' &&
        getItemOwner(item) !== globalFilters.opportunityOwner
      ) {
        return false;
      }
      if (
        globalFilters.pipelineStage !== 'ALL' &&
        (item.pipeline_stage || '').trim() !== globalFilters.pipelineStage
      ) {
        return false;
      }
      if (
        globalFilters.opportunityStage !== 'ALL' &&
        (item.opportunity_stage || '').trim() !== globalFilters.opportunityStage
      ) {
        return false;
      }
      if (
        (globalFilters.closingStartDate || globalFilters.closingEndDate) &&
        !matchesDateRange(
          getItemCloseDateRaw(item),
          globalFilters.closingStartDate,
          globalFilters.closingEndDate
        )
      ) {
        return false;
      }
      return true;
    });
  }, [items, globalFilters]);

  // Step 2: Apply Scope selector on top of globally filtered items
  const scopedItems = useMemo(() => {
    if (scopeFilter === 'ACTIVE') {
      return globallyFilteredItems.filter((i) => !isPipelineItemClosed(i));
    }
    if (scopeFilter === 'CLOSED') {
      return globallyFilteredItems.filter((i) => isPipelineItemClosed(i));
    }
    return globallyFilteredItems;
  }, [globallyFilteredItems, scopeFilter]);

  const {
    activeRisksCount,
    criticalRisksCount,
    openActionsCount,
    completedActionsCount,
    totalActionsCount
  } = useMemo(() => {
    const scopedPipeIds = new Set<string>();
    const latestAssessmentByPipe = new Map<string, string>();
    scopedItems.forEach((i) => {
      const pid = i.pipeline_opp?.pipeline_id;
      if (pid) {
        scopedPipeIds.add(pid);
        if (i.pipeline_opp?.latest_assessment?.assessment_id) {
          latestAssessmentByPipe.set(pid, i.pipeline_opp.latest_assessment.assessment_id);
        }
      }
    });

    const activeRisks = riskRows.filter((r) => {
      if (!scopedPipeIds.has(r.pipeline_id)) return false;
      const latestAssessId = latestAssessmentByPipe.get(r.pipeline_id);
      if (latestAssessId && r.assessment_id && r.assessment_id !== latestAssessId) return false;
      return r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING';
    });

    const scopedActions = actionRows.filter((a) => scopedPipeIds.has(a.pipeline_id));
    const openActions = scopedActions.filter(
      (a) => a.action_status !== 'COMPLETED' && a.action_status !== 'CANCELLED'
    );
    const completedActions = scopedActions.filter((a) => a.action_status === 'COMPLETED');

    return {
      activeRisksCount: activeRisks.length,
      criticalRisksCount: activeRisks.filter(
        (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
      ).length,
      openActionsCount: openActions.length,
      completedActionsCount: completedActions.length,
      totalActionsCount: scopedActions.length
    };
  }, [scopedItems, riskRows, actionRows]);

  const kpis = useMemo(() => {
    const activeDeals = globallyFilteredItems.filter((i) => !isPipelineItemClosed(i));
    const closedWon = globallyFilteredItems.filter((i) => isClosedWonItem(i));
    const closedLost = globallyFilteredItems.filter((i) => isClosedLostItem(i));

    const activeValue = activeDeals.reduce((sum, i) => sum + (i.estimated_value || 0), 0);
    const closedWonValue = closedWon.reduce((sum, i) => sum + (i.estimated_value || 0), 0);

    const assessedItems = scopedItems.filter((i) => Boolean(i.pipeline_opp?.latest_assessment));
    const avgBaseWin =
      assessedItems.length > 0
        ? Math.round(
            assessedItems.reduce(
              (sum, i) => sum + (i.pipeline_opp?.latest_assessment?.base_winability ?? 0),
              0
            ) / assessedItems.length
          )
        : 0;
    const avgRiskAdjWin =
      assessedItems.length > 0
        ? Math.round(
            assessedItems.reduce(
              (sum, i) => sum + (i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0),
              0
            ) / assessedItems.length
          )
        : 0;

    // Risk-adjusted expected revenue across active deals in global scope
    const riskAdjustedForecast = activeDeals.reduce((sum, i) => {
      const winPct = i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 50;
      return sum + (i.estimated_value || 0) * (winPct / 100);
    }, 0);

    const closedTotal = closedWon.length + closedLost.length;
    const winRate = closedTotal > 0 ? Math.round((closedWon.length / closedTotal) * 100) : null;

    return {
      totalDeals: globallyFilteredItems.length,
      activeCount: activeDeals.length,
      activeValue,
      riskAdjustedForecast: Math.round(riskAdjustedForecast),
      assessedCount: assessedItems.length,
      avgBaseWin,
      avgRiskAdjWin,
      closedWonCount: closedWon.length,
      closedWonValue,
      closedTotal,
      winRate
    };
  }, [globallyFilteredItems, scopedItems]);

  const stageChartData = useMemo(() => {
    return STAGE_ORDER.map((st) => {
      const matches = scopedItems.filter((i) => resolveStage(i) === st.key);
      const totalValue = matches.reduce((s, i) => s + (i.estimated_value || 0), 0);
      const weightedValue = matches.reduce((s, i) => {
        if (st.key === 'Closed Won') return s + (i.estimated_value || 0);
        if (st.key === 'Closed Lost') return s;
        const pct = i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 50;
        return s + (i.estimated_value || 0) * (pct / 100);
      }, 0);

      return {
        stage: st.key,
        shortLabel: st.shortLabel,
        count: matches.length,
        totalValue,
        weightedValue: Math.round(weightedValue)
      };
    });
  }, [scopedItems]);

  const healthBreakdown = useMemo(() => {
    const buckets: Array<{
      key: string;
      label: string;
      count: number;
      value: number;
      barClass: string;
      textClass: string;
    }> = [
      { key: 'STRONG', label: 'Strong', count: 0, value: 0, barClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
      { key: 'MODERATE', label: 'Moderate', count: 0, value: 0, barClass: 'bg-amber-500', textClass: 'text-amber-400' },
      { key: 'AT_RISK', label: 'Weak', count: 0, value: 0, barClass: 'bg-red-500', textClass: 'text-red-400' },
      { key: 'CRITICAL', label: 'Critical', count: 0, value: 0, barClass: 'bg-red-700', textClass: 'text-red-500' },
      { key: 'UNASSESSED', label: 'Pending PADF Assessment', count: 0, value: 0, barClass: 'bg-border', textClass: 'text-text-secondary' }
    ];

    scopedItems.forEach((item) => {
      const h = item.pipeline_opp?.latest_assessment?.pipeline_health;
      let targetKey = 'UNASSESSED';
      if (h === 'STRONG' || h === 'HEALTHY') targetKey = 'STRONG';
      else if (h === 'MODERATE') targetKey = 'MODERATE';
      else if (h === 'AT_RISK') targetKey = 'AT_RISK';
      else if (h === 'CRITICAL') targetKey = 'CRITICAL';

      const b = buckets.find((x) => x.key === targetKey);
      if (b) {
        b.count += 1;
        b.value += item.estimated_value || 0;
      }
    });

    return buckets;
  }, [scopedItems]);

  const motionBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>();
    scopedItems.forEach((item) => {
      const key = item.revenue_motion || 'Digital Solution Selling';
      const existing = map.get(key) || { name: key, count: 0, value: 0 };
      existing.count += 1;
      existing.value += item.estimated_value || 0;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.value - a.value);
    const maxVal = list.reduce((m, r) => Math.max(m, r.value), 0) || 1;
    return list.map((r) => ({ ...r, pct: Math.round((r.value / maxVal) * 100) }));
  }, [scopedItems]);

  const priorityOpportunities = useMemo(() => {
    return [...scopedItems]
      .sort((a, b) => {
        const valDiff = (b.estimated_value || 0) - (a.estimated_value || 0);
        if (valDiff !== 0) return valDiff;
        const winA = a.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0;
        const winB = b.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0;
        return winB - winA;
      })
      .slice(0, 6);
  }, [scopedItems]);

  const availableGlobalFilterCount =
    (filterDefinitions.hasAssessmentPeriodData ? 1 : 0) +
    (filterDefinitions.industryOptions.length > 0 ? 1 : 0) +
    (filterDefinitions.revenueMotionOptions.length > 0 ? 1 : 0) +
    (filterDefinitions.ownerOptions.length > 0 ? 1 : 0) +
    (filterDefinitions.pipelineStageOptions.length > 0 ? 1 : 0) +
    (filterDefinitions.opportunityStageOptions.length > 0 ? 1 : 0) +
    (filterDefinitions.hasClosingPeriodData ? 1 : 0);

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-secondary space-y-2">
        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        <span className="text-xs font-mono">Loading Pipeline Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header Card (matching LeadDashboard) + Foldable Global Filter Bar */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-bg-surface/50 border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-mono font-black text-text-secondary uppercase tracking-widest">
              Account-Wide Pipeline Diagnostics
            </span>
            <h2 className="text-lg font-black text-text-primary uppercase tracking-wide mt-0.5 truncate">
              Pipeline Portfolio Executive Summary
            </h2>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Real-time portfolio valuation, PADF health distribution, risk-adjusted winability, and active strategic risks across your pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-bg-surface border border-border rounded-xl px-3 py-2 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase whitespace-nowrap">
                Scope:
              </span>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as 'ALL' | 'ACTIVE' | 'CLOSED')}
                className="bg-transparent text-text-primary font-sans text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-bg-surface text-text-primary font-medium">
                  All Deals ({kpis.totalDeals})
                </option>
                <option value="ACTIVE" className="bg-bg-surface text-text-primary font-medium">
                  Active Pipeline ({kpis.activeCount})
                </option>
                <option value="CLOSED" className="bg-bg-surface text-text-primary font-medium">
                  Closed Outcomes ({kpis.closedTotal})
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadDashboardData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar (below title & description, folded by default) */}
        {availableGlobalFilterCount > 0 && (
          <div className="pt-3.5 border-t border-border/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsFilterBarExpanded((prev) => !prev)}
                  aria-expanded={isFilterBarExpanded}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    isFilterBarExpanded || activeFilterIndicators.length > 0
                      ? 'bg-accent/10 border-accent/40 text-text-primary hover:border-accent'
                      : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary hover:border-accent/40'
                  }`}
                  title={isFilterBarExpanded ? 'Fold Global Filters' : 'Unfold Global Filters'}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Global Filters</span>
                  {activeFilterIndicators.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-black font-mono text-[10px] font-black">
                      {activeFilterIndicators.length}
                    </span>
                  )}
                  {isFilterBarExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                  )}
                </button>

                {/* Visible selected-filter indicators (always visible whether folded or unfolded) */}
                {activeFilterIndicators.length > 0 || scopeFilter !== 'ALL' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scopeFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-surface border border-accent/30 text-[10px] font-mono text-text-primary">
                        <span className="text-text-secondary">Scope:</span>
                        <strong className="text-accent">
                          {scopeFilter === 'ACTIVE' ? 'Active Pipeline' : 'Closed Outcomes'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => setScopeFilter('ALL')}
                          className="text-text-secondary hover:text-text-primary cursor-pointer"
                          title="Reset Scope filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {activeFilterIndicators.map((ind) => (
                      <span
                        key={ind.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-[10px] font-mono text-text-primary"
                      >
                        <span className="text-text-secondary">{ind.label}:</span>
                        <strong className="text-accent">{ind.valueLabel}</strong>
                        <button
                          type="button"
                          onClick={ind.onClear}
                          className="text-text-secondary hover:text-text-primary cursor-pointer"
                          title={`Clear ${ind.label} filter`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-text-secondary font-mono">
                    All portfolio data ({items.length} deal{items.length === 1 ? '' : 's'}) · Click to unfold filters
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  disabled={!hasAnyActiveFilter}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-colors ${
                    hasAnyActiveFilter
                      ? 'bg-bg-surface border-accent/40 text-accent hover:bg-accent/10 cursor-pointer'
                      : 'bg-bg-surface/40 border-border/60 text-text-secondary/50 cursor-not-allowed'
                  }`}
                >
                  <X className="h-3 w-3" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            </div>

            {isFilterBarExpanded && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filterDefinitions.hasAssessmentPeriodData && (
                  <DateRangeCalendarPicker
                    label="Assessment Period"
                    placeholder="Select start & end date"
                    startDate={globalFilters.assessmentStartDate}
                    endDate={globalFilters.assessmentEndDate}
                    initialFocusDate={filterDefinitions.latestAssessedDate}
                    yearBounds={filterDefinitions.assessmentYearBounds}
                    onChange={(nextStart, nextEnd) =>
                      setGlobalFilters((prev) => ({
                        ...prev,
                        assessmentStartDate: nextStart,
                        assessmentEndDate: nextEnd
                      }))
                    }
                  />
                )}

                {filterDefinitions.industryOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      <span>Industry</span>
                      {globalFilters.industry !== 'ALL' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </label>
                    <select
                      value={globalFilters.industry}
                      onChange={(e) =>
                        setGlobalFilters((prev) => ({ ...prev, industry: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer ${
                        globalFilters.industry !== 'ALL'
                          ? 'bg-accent/10 border-accent/60'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <option value="ALL" className="bg-bg-surface text-text-primary">
                        All Industries
                      </option>
                      {filterDefinitions.industryOptions.map((ind) => (
                        <option key={ind} value={ind} className="bg-bg-surface text-text-primary">
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterDefinitions.revenueMotionOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      <span>Revenue Motion</span>
                      {globalFilters.revenueMotion !== 'ALL' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </label>
                    <select
                      value={globalFilters.revenueMotion}
                      onChange={(e) =>
                        setGlobalFilters((prev) => ({ ...prev, revenueMotion: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer ${
                        globalFilters.revenueMotion !== 'ALL'
                          ? 'bg-accent/10 border-accent/60'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <option value="ALL" className="bg-bg-surface text-text-primary">
                        All Revenue Motions
                      </option>
                      {filterDefinitions.revenueMotionOptions.map((rm) => (
                        <option key={rm} value={rm} className="bg-bg-surface text-text-primary">
                          {rm}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterDefinitions.ownerOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      <span>Opportunity Owner</span>
                      {globalFilters.opportunityOwner !== 'ALL' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </label>
                    <select
                      value={globalFilters.opportunityOwner}
                      onChange={(e) =>
                        setGlobalFilters((prev) => ({ ...prev, opportunityOwner: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer ${
                        globalFilters.opportunityOwner !== 'ALL'
                          ? 'bg-accent/10 border-accent/60'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <option value="ALL" className="bg-bg-surface text-text-primary">
                        All Owners
                      </option>
                      {filterDefinitions.ownerOptions.map((owner) => (
                        <option
                          key={owner}
                          value={owner}
                          className="bg-bg-surface text-text-primary"
                        >
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterDefinitions.pipelineStageOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      <span>Pipeline Stage</span>
                      {globalFilters.pipelineStage !== 'ALL' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </label>
                    <select
                      value={globalFilters.pipelineStage}
                      onChange={(e) =>
                        setGlobalFilters((prev) => ({ ...prev, pipelineStage: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer ${
                        globalFilters.pipelineStage !== 'ALL'
                          ? 'bg-accent/10 border-accent/60'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <option value="ALL" className="bg-bg-surface text-text-primary">
                        All Pipeline Stages
                      </option>
                      {filterDefinitions.pipelineStageOptions.map((st) => (
                        <option key={st} value={st} className="bg-bg-surface text-text-primary">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterDefinitions.opportunityStageOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      <span>Opportunity Stage</span>
                      {globalFilters.opportunityStage !== 'ALL' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </label>
                    <select
                      value={globalFilters.opportunityStage}
                      onChange={(e) =>
                        setGlobalFilters((prev) => ({ ...prev, opportunityStage: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer ${
                        globalFilters.opportunityStage !== 'ALL'
                          ? 'bg-accent/10 border-accent/60'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <option value="ALL" className="bg-bg-surface text-text-primary">
                        All Opportunity Stages
                      </option>
                      {filterDefinitions.opportunityStageOptions.map((st) => (
                        <option key={st} value={st} className="bg-bg-surface text-text-primary">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterDefinitions.hasClosingPeriodData && (
                  <DateRangeCalendarPicker
                    label="Expected Closing Period"
                    placeholder="Select start & end date"
                    startDate={globalFilters.closingStartDate}
                    endDate={globalFilters.closingEndDate}
                    initialFocusDate={filterDefinitions.earliestCloseDate}
                    yearBounds={filterDefinitions.closingYearBounds}
                    onChange={(nextStart, nextEnd) =>
                      setGlobalFilters((prev) => ({
                        ...prev,
                        closingStartDate: nextStart,
                        closingEndDate: nextEnd
                      }))
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.activeValue)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            Across {kpis.activeCount} active deal{kpis.activeCount === 1 ? '' : 's'}
          </div>
        </div>

        <div
          tabIndex={0}
          onMouseEnter={(e) => openKpiTooltip('riskAdjForecast', e.currentTarget)}
          onMouseLeave={closeKpiTooltip}
          onFocus={(e) => openKpiTooltip('riskAdjForecast', e.currentTarget)}
          onBlur={closeKpiTooltip}
          className="p-4 rounded-2xl border border-border bg-bg-surface hover:border-sky-400/50 focus:outline-none focus:border-sky-400/60 flex flex-col justify-between shadow-sm transition-colors cursor-help group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              <span>Risk-Adj Forecast</span>
              <Info className="h-3 w-3 text-text-secondary/60 group-hover:text-sky-400 transition-colors" />
            </span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.riskAdjustedForecast)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.activeValue > 0
              ? `${Math.round((kpis.riskAdjustedForecast / kpis.activeValue) * 100)}% of active gross value`
              : 'No active value recorded'}
          </div>
        </div>

        <div
          tabIndex={0}
          onMouseEnter={(e) => openKpiTooltip('avgRiskAdjWin', e.currentTarget)}
          onMouseLeave={closeKpiTooltip}
          onFocus={(e) => openKpiTooltip('avgRiskAdjWin', e.currentTarget)}
          onBlur={closeKpiTooltip}
          className="p-4 rounded-2xl border border-border bg-bg-surface hover:border-emerald-400/50 focus:outline-none focus:border-emerald-400/60 flex flex-col justify-between shadow-sm transition-colors cursor-help group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              <span>Avg Risk-Adj Winability</span>
              <Info className="h-3 w-3 text-text-secondary/60 group-hover:text-emerald-400 transition-colors" />
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
            {kpis.assessedCount > 0 ? `${kpis.avgRiskAdjWin}%` : '--'}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.assessedCount > 0
              ? `Base Avg: ${kpis.avgBaseWin}% (${kpis.assessedCount} assessed)`
              : 'Run PADF assessment to score'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Closed Won Revenue
            </span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.closedWonValue)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.winRate !== null
              ? `${kpis.winRate}% win rate (${kpis.closedWonCount}/${kpis.closedTotal} closed)`
              : `${kpis.closedWonCount} closed won deals`}
          </div>
        </div>
      </div>

      {/* Empty State if zero portfolio records or filtered to zero */}
      {items.length === 0 ? (
        <div className="p-10 text-center bg-bg-surface border border-border rounded-2xl space-y-3">
          <PieChartIcon className="h-9 w-9 mx-auto text-text-secondary/50" />
          <h3 className="text-sm font-bold text-text-primary">No Pipeline Opportunities Recorded</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Promote qualified SQL opportunities in Lead Canvas to unlock pipeline valuation analytics, PADF scoring breakdowns, and closeability forecasting.
          </p>
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Lead Canvas</span>
          </Link>
        </div>
      ) : scopedItems.length === 0 ? (
        <div className="p-10 text-center bg-bg-surface border border-border rounded-2xl space-y-3">
          <Filter className="h-9 w-9 mx-auto text-text-secondary/50" />
          <h3 className="text-sm font-bold text-text-primary">No Pipeline Opportunities Match Selected Filters</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            No deals in your portfolio match the active filter combination. Adjust your Global Filters or reset to view the full portfolio.
          </p>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row: Stage Valuation Bar Chart + PADF Health & Risk Posture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stage Distribution & Valuation */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
              <div className="border-b border-border/70 pb-3 mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-accent" />
                    Stage Valuation &amp; Risk-Adjusted Forecast
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Gross deal value vs. risk-adjusted expected revenue across pipeline stages
                  </p>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">
                  {scopedItems.length} deal{scopedItems.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompactCurrency(Number(v))}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                    />
                    <Tooltip content={<StageTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                    <Bar dataKey="totalValue" name="Gross Value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="weightedValue" name="Risk-Adj Forecast" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 mt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                    Gross Pipeline Value
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Risk-Adjusted Forecast
                  </span>
                </div>
                <span className="text-text-secondary">
                  Won: <strong className="text-emerald-400">{kpis.closedWonCount}</strong>
                </span>
              </div>
            </div>

            {/* PADF Health Breakdown & Risk Execution Posture */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="border-b border-border/70 pb-3 mb-4">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                    PADF Health &amp; Governance Posture
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Portfolio health classification based on latest deterministic PADF assessments
                  </p>
                </div>

                <div className="space-y-3">
                  {healthBreakdown.map((b) => {
                    const pct =
                      scopedItems.length > 0 ? Math.round((b.count / scopedItems.length) * 100) : 0;
                    return (
                      <div key={b.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`font-bold ${b.textClass}`}>{b.label}</span>
                          <span className="text-text-secondary tabular-nums">
                            <strong className="text-text-primary">{b.count}</strong> ({pct}%) ·{' '}
                            {formatCompactCurrency(b.value)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${b.barClass}`}
                            style={{ width: `${pct > 0 ? Math.max(4, pct) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <div className="p-3 rounded-xl bg-bg-primary/60 border border-border/70">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary uppercase">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Active Risks</span>
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-text-primary mt-1">
                    {activeRisksCount}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    {criticalRisksCount} high / critical
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-primary/60 border border-border/70">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Open Playbook Actions</span>
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-text-primary mt-1">
                    {openActionsCount}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 tabular-nums">
                    {completedActionsCount} / {totalActionsCount} completed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Revenue Motion Exposure & Top Priority Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Motion Valuation Exposure */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
              <div className="border-b border-border/70 pb-3 mb-4">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-accent" />
                  Revenue Motion Exposure
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Pipeline concentration by commercial selling motion
                </p>
              </div>

              <div className="space-y-3.5 flex-1">
                {motionBreakdown.map((m) => (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-text-primary truncate">{m.name}</span>
                      <span className="font-mono text-[11px] text-text-secondary shrink-0 tabular-nums">
                        {m.count} deal{m.count === 1 ? '' : 's'} ·{' '}
                        <strong className="text-text-primary">{formatCompactCurrency(m.value)}</strong>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, m.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Opportunities Leaderboard */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col">
              <div className="border-b border-border/70 pb-3 mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-accent" />
                    Top Pipeline Opportunities
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Highest-value opportunities in scope — select to open assessment workspace
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                {priorityOpportunities.map((item, idx) => {
                  const assess = item.pipeline_opp?.latest_assessment;
                  const stage = item.pipeline_stage || resolveStage(item);
                  const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                    item.id
                  )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_dashboard`;

                  return (
                    <Link
                      key={item.id}
                      to={targetUrl}
                      className="p-3 rounded-xl border border-border bg-bg-primary/40 hover:bg-bg-primary/80 hover:border-accent/50 transition-all flex items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-black shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                            {item.opportunity_name}
                          </div>
                          <div className="text-[10px] text-text-secondary truncate font-mono">
                            {item.company_name} · {stage} ·{' '}
                            <strong className="text-text-primary">
                              {item.estimated_value > 0
                                ? `$${item.estimated_value.toLocaleString('en-US')}`
                                : '—'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="text-xs font-black text-accent">
                            {assess ? `${assess.risk_adjusted_winability}%` : '--'}
                          </div>
                          <div className="text-[9px] text-text-secondary uppercase">
                            {assess?.pipeline_health || 'Unassessed'}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Hover Tooltips for Risk-Adj Forecast & Avg Risk-Adj Winability */}
      {typeof document !== 'undefined' &&
        activeKpiTooltip &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: activeKpiTooltip.top,
              left: activeKpiTooltip.left,
              transform: activeKpiTooltip.placeBelow ? 'translateY(0)' : 'translateY(-100%)',
              zIndex: 99999
            }}
            className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-bg-surface p-4 shadow-2xl pointer-events-none space-y-2.5 text-xs"
          >
            {activeKpiTooltip.id === 'riskAdjForecast' ? (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                  <span className="font-black text-text-primary uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-sky-400" />
                    Risk-Adjusted Forecast
                  </span>
                  <span className="font-mono font-black text-sky-400">
                    {formatCompactCurrency(kpis.riskAdjustedForecast)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    Definition
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Probability-weighted expected revenue from <strong className="text-text-primary">active (non-closed)</strong> opportunities in your current filtered portfolio, discounted by each deal&apos;s Risk-Adjusted Winability score.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl bg-bg-primary/70 border border-border/60 p-2.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                    How It Is Calculated
                  </div>
                  <p className="text-[11px] font-mono text-text-primary leading-relaxed">
                    &Sigma; (Deal Value &times; Risk-Adj Winability % / 100)
                  </p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Unassessed active deals default to a 50% baseline weight until a PADF assessment is completed.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary pt-0.5">
                  <span>Active Deals: <strong className="text-text-primary">{kpis.activeCount}</strong></span>
                  <span>Gross Value: <strong className="text-text-primary">{formatCompactCurrency(kpis.activeValue)}</strong></span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                  <span className="font-black text-text-primary uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Avg Risk-Adj Winability
                  </span>
                  <span className="font-mono font-black text-emerald-400">
                    {kpis.assessedCount > 0 ? `${kpis.avgRiskAdjWin}%` : '--'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    Definition
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Mean deal win likelihood across all <strong className="text-text-primary">PADF-assessed</strong> opportunities in scope, reflecting deterministic evidence strength after deducting active formal risk penalties.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl bg-bg-primary/70 border border-border/60 p-2.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                    How It Is Calculated
                  </div>
                  <p className="text-[11px] font-mono text-text-primary leading-relaxed">
                    Deal Score = Base Winability &minus; Risk Penalty (0–100%)
                  </p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Base Winability weights the 8 PADF dimensions (PA1–PA4 at 15% each, PA5–PA8 at 10% each). Portfolio score is the average across assessed deals in scope.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary pt-0.5">
                  <span>Assessed: <strong className="text-text-primary">{kpis.assessedCount}</strong></span>
                  <span>
                    Base Avg: <strong className="text-text-primary">{kpis.assessedCount > 0 ? `${kpis.avgBaseWin}%` : '--'}</strong>
                    {kpis.assessedCount > 0 && kpis.avgBaseWin > kpis.avgRiskAdjWin
                      ? ` (−${kpis.avgBaseWin - kpis.avgRiskAdjWin} pts risk)`
                      : ''}
                  </span>
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default PipelineDashboard;
