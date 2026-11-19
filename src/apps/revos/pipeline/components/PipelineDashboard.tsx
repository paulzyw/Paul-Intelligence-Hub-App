import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
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
  X,
  Target,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../hooks/useAuth';
import {
  PipelineCardItem,
  PIPELINE_STAGE_OPTIONS,
  OPPORTUNITY_STAGE_OPTIONS
} from './PipelineCard';
import { PipelineConfigService } from '../services/PipelineConfigService';
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

type MatrixQuadrantKey = 'HV_HW' | 'HV_LW' | 'LV_HW' | 'LV_LW';
type WinabilityConditionKey = 'HIGH' | 'MODERATE' | 'LOW';

interface WinabilityMatrixPoint {
  id: string;
  opportunityName: string;
  customer: string;
  value: number;
  winability: number;
  winabilityCondition: WinabilityConditionKey;
  winabilityLabel: string;
  color: string;
  pipelineHealth: 'Strong' | 'Moderate' | 'Weak' | 'Critical';
  pipelineHealthTextClass: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
  riskLevelTextClass: string;
  activeRiskCount: number;
  quadrant: MatrixQuadrantKey;
  radius: number;
  targetUrl: string;
}

const MATRIX_QUADRANTS: Array<{
  key: MatrixQuadrantKey;
  title: string;
  interpretation: string;
  badgeClass: string;
  dotClass: string;
}> = [
  {
    key: 'HV_HW',
    title: 'High Value / High Winability',
    interpretation: 'Strategic opportunities with strong potential.',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    dotClass: 'bg-emerald-500'
  },
  {
    key: 'HV_LW',
    title: 'High Value / Low Winability',
    interpretation: 'High-value opportunities requiring priority intervention.',
    badgeClass: 'border-red-500/30 bg-red-500/10 text-red-400',
    dotClass: 'bg-red-500'
  },
  {
    key: 'LV_HW',
    title: 'Low Value / High Winability',
    interpretation: 'Opportunities with positive winability conditions.',
    badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    dotClass: 'bg-sky-400'
  },
  {
    key: 'LV_LW',
    title: 'Low Value / Low Winability',
    interpretation: 'Opportunities requiring careful prioritization.',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    dotClass: 'bg-amber-500'
  }
];

const MatrixTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: WinabilityMatrixPoint }>;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-bg-surface px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 min-w-[230px] max-w-[300px]">
      <div>
        <div className="font-bold text-text-primary leading-snug">{pt.opportunityName}</div>
        <div className="text-[11px] text-text-secondary truncate">{pt.customer}</div>
      </div>
      <div className="border-t border-border/60 pt-1.5 space-y-1 font-mono text-[11px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Opportunity Value</span>
          <strong className="text-accent tabular-nums">
            {pt.value > 0 ? `$${pt.value.toLocaleString('en-US')}` : '—'}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Winability</span>
          <strong className="tabular-nums" style={{ color: pt.color }}>
            {pt.winability}% ({pt.winabilityCondition === 'HIGH' ? 'High' : pt.winabilityCondition === 'MODERATE' ? 'Moderate' : 'Low'})
          </strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Pipeline Health</span>
          <strong className={pt.pipelineHealthTextClass}>{pt.pipelineHealth}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Risk Level</span>
          <strong className={pt.riskLevelTextClass}>
            {pt.riskLevel}
            {pt.activeRiskCount > 0 ? ` (${pt.activeRiskCount})` : ''}
          </strong>
        </div>
      </div>
      <div className="pt-1 border-t border-border/50 text-[10px] font-mono text-text-secondary">
        Click bubble to open assessment workspace
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
  const navigate = useNavigate();
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
  const [matrixWinabilityFilter, setMatrixWinabilityFilter] = useState<'ALL' | WinabilityConditionKey>('ALL');
  const [matrixQuadrantFilter, setMatrixQuadrantFilter] = useState<'ALL' | MatrixQuadrantKey>('ALL');
  const [matrixZoomLevel, setMatrixZoomLevel] = useState<number>(1);
  const [matrixPanOffset, setMatrixPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredMatrixId, setHoveredMatrixId] = useState<string | null>(null);
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

  const winabilityMatrixData = useMemo(() => {
    const assessed = scopedItems.filter((item) => Boolean(item.pipeline_opp?.latest_assessment));
    const unassessedCount = scopedItems.length - assessed.length;

    if (assessed.length === 0) {
      return {
        allPoints: [] as WinabilityMatrixPoint[],
        unassessedCount,
        valueThreshold: 500_000,
        winThreshold: 55,
        maxValueDomain: 1_000_000,
        quadrantSummary: MATRIX_QUADRANTS.map((q) => ({ ...q, count: 0, value: 0 }))
      };
    }

    const values = assessed.map((i) => Math.max(0, Number(i.estimated_value || 0)));
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    const rawMedian =
      sortedValues.length % 2 === 0
        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
        : sortedValues[mid];
    const minVal = sortedValues[0];
    const maxVal = sortedValues[sortedValues.length - 1];
    const valueThreshold = rawMedian > 0 ? Math.round(rawMedian) : Math.max(100_000, Math.round(maxVal * 0.5));
    const winThreshold = 55;
    const maxValueDomain = Math.max(100_000, Math.ceil(maxVal * 1.15));
    const valueSpan = Math.max(1, maxVal - minVal);

    const allPoints: WinabilityMatrixPoint[] = assessed.map((item) => {
      const assess = item.pipeline_opp!.latest_assessment!;
      const value = Math.max(0, Number(item.estimated_value || 0));
      const winability = Math.max(
        0,
        Math.min(100, Math.round(Number(assess.risk_adjusted_winability ?? 0)))
      );

      let winabilityCondition: WinabilityConditionKey = 'LOW';
      let winabilityLabel = 'Low Winability';
      let color = '#ef4444';
      if (winability >= 75) {
        winabilityCondition = 'HIGH';
        winabilityLabel = 'High Winability';
        color = '#10b981';
      } else if (winability >= 55) {
        winabilityCondition = 'MODERATE';
        winabilityLabel = 'Moderate Winability';
        color = '#f59e0b';
      }

      const rawHealth = String(assess.pipeline_health || '').toUpperCase();
      let pipelineHealth: WinabilityMatrixPoint['pipelineHealth'] = 'Moderate';
      let pipelineHealthTextClass = 'text-amber-400';
      if (rawHealth === 'STRONG' || rawHealth === 'HEALTHY') {
        pipelineHealth = 'Strong';
        pipelineHealthTextClass = 'text-emerald-400';
      } else if (rawHealth === 'MODERATE') {
        pipelineHealth = 'Moderate';
        pipelineHealthTextClass = 'text-amber-400';
      } else if (rawHealth === 'AT_RISK') {
        pipelineHealth = 'Weak';
        pipelineHealthTextClass = 'text-red-400';
      } else if (rawHealth === 'CRITICAL') {
        pipelineHealth = 'Critical';
        pipelineHealthTextClass = 'text-red-500';
      } else if (winability >= 75) {
        pipelineHealth = 'Strong';
        pipelineHealthTextClass = 'text-emerald-400';
      } else if (winability < 35) {
        pipelineHealth = 'Critical';
        pipelineHealthTextClass = 'text-red-500';
      } else if (winability < 55) {
        pipelineHealth = 'Weak';
        pipelineHealthTextClass = 'text-red-400';
      }

      const pid = item.pipeline_opp?.pipeline_id;
      const latestAssessId = assess.assessment_id;
      const activeDealRisks = riskRows.filter((r) => {
        if (!pid || r.pipeline_id !== pid) return false;
        if (latestAssessId && r.assessment_id && r.assessment_id !== latestAssessId) return false;
        return r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING';
      });

      let riskLevel: WinabilityMatrixPoint['riskLevel'] = 'None';
      let riskLevelTextClass = 'text-text-secondary';
      if (activeDealRisks.some((r) => r.severity === 'CRITICAL')) {
        riskLevel = 'Critical';
        riskLevelTextClass = 'text-red-500';
      } else if (activeDealRisks.some((r) => r.severity === 'HIGH')) {
        riskLevel = 'High';
        riskLevelTextClass = 'text-red-400';
      } else if (activeDealRisks.some((r) => r.severity === 'MEDIUM')) {
        riskLevel = 'Medium';
        riskLevelTextClass = 'text-amber-400';
      } else if (activeDealRisks.some((r) => r.severity === 'LOW')) {
        riskLevel = 'Low';
        riskLevelTextClass = 'text-emerald-400';
      }

      const isHighVal = value >= valueThreshold;
      const isHighWin = winability >= winThreshold;
      const quadrant: MatrixQuadrantKey = isHighVal
        ? isHighWin
          ? 'HV_HW'
          : 'HV_LW'
        : isHighWin
          ? 'LV_HW'
          : 'LV_LW';

      const normalizedRatio = maxVal === minVal ? 0.45 : (value - minVal) / valueSpan;
      const radius = Math.round(7 + 13 * Math.sqrt(Math.max(0, Math.min(1, normalizedRatio))));

      const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
        item.id
      )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_dashboard`;

      return {
        id: item.id,
        opportunityName: item.opportunity_name || 'Untitled Opportunity',
        customer: item.company_name || '—',
        value,
        winability,
        winabilityCondition,
        winabilityLabel,
        color,
        pipelineHealth,
        pipelineHealthTextClass,
        riskLevel,
        riskLevelTextClass,
        activeRiskCount: activeDealRisks.length,
        quadrant,
        radius,
        targetUrl
      };
    });

    const quadrantSummary = MATRIX_QUADRANTS.map((q) => {
      const matching = allPoints.filter((p) => p.quadrant === q.key);
      return {
        ...q,
        count: matching.length,
        value: matching.reduce((sum, p) => sum + p.value, 0)
      };
    });

    return {
      allPoints,
      unassessedCount,
      valueThreshold,
      winThreshold,
      maxValueDomain,
      quadrantSummary
    };
  }, [scopedItems, riskRows]);

  const filteredMatrixPoints = useMemo(() => {
    return winabilityMatrixData.allPoints.filter((pt) => {
      if (matrixWinabilityFilter !== 'ALL' && pt.winabilityCondition !== matrixWinabilityFilter) {
        return false;
      }
      if (matrixQuadrantFilter !== 'ALL' && pt.quadrant !== matrixQuadrantFilter) {
        return false;
      }
      return true;
    });
  }, [winabilityMatrixData.allPoints, matrixWinabilityFilter, matrixQuadrantFilter]);

  const matrixViewport = useMemo(() => {
    const fullMaxX = winabilityMatrixData.maxValueDomain;
    let baseMinX = 0;
    let baseMaxX = fullMaxX;
    let baseMinY = 0;
    let baseMaxY = 100;

    if (matrixQuadrantFilter === 'HV_HW') {
      baseMinX = Math.max(0, Math.floor(winabilityMatrixData.valueThreshold * 0.85));
      baseMaxX = fullMaxX;
      baseMinY = Math.max(0, winabilityMatrixData.winThreshold - 8);
      baseMaxY = 100;
    } else if (matrixQuadrantFilter === 'HV_LW') {
      baseMinX = Math.max(0, Math.floor(winabilityMatrixData.valueThreshold * 0.85));
      baseMaxX = fullMaxX;
      baseMinY = 0;
      baseMaxY = Math.min(100, winabilityMatrixData.winThreshold + 8);
    } else if (matrixQuadrantFilter === 'LV_HW') {
      baseMinX = 0;
      baseMaxX = Math.min(fullMaxX, Math.ceil(winabilityMatrixData.valueThreshold * 1.15));
      baseMinY = Math.max(0, winabilityMatrixData.winThreshold - 8);
      baseMaxY = 100;
    } else if (matrixQuadrantFilter === 'LV_LW') {
      baseMinX = 0;
      baseMaxX = Math.min(fullMaxX, Math.ceil(winabilityMatrixData.valueThreshold * 1.15));
      baseMinY = 0;
      baseMaxY = Math.min(100, winabilityMatrixData.winThreshold + 8);
    }

    const baseSpanX = Math.max(10_000, baseMaxX - baseMinX);
    const baseSpanY = Math.max(10, baseMaxY - baseMinY);
    const zoom = Math.max(1, matrixZoomLevel);
    const spanX = baseSpanX / zoom;
    const spanY = baseSpanY / zoom;

    const defaultCenterX =
      filteredMatrixPoints.length > 0 && zoom > 1
        ? filteredMatrixPoints.reduce((s, p) => s + p.value, 0) / filteredMatrixPoints.length
        : (baseMinX + baseMaxX) / 2;
    const defaultCenterY =
      filteredMatrixPoints.length > 0 && zoom > 1
        ? filteredMatrixPoints.reduce((s, p) => s + p.winability, 0) / filteredMatrixPoints.length
        : (baseMinY + baseMaxY) / 2;

    const maxPanX = Math.max(0, (baseSpanX - spanX) / 2);
    const maxPanY = Math.max(0, (baseSpanY - spanY) / 2);

    let xMin = defaultCenterX + matrixPanOffset.x * maxPanX - spanX / 2;
    let xMax = xMin + spanX;
    if (xMin < 0) {
      xMin = 0;
      xMax = Math.min(fullMaxX, spanX);
    } else if (xMax > fullMaxX) {
      xMax = fullMaxX;
      xMin = Math.max(0, fullMaxX - spanX);
    }

    let yMin = defaultCenterY + matrixPanOffset.y * maxPanY - spanY / 2;
    let yMax = yMin + spanY;
    if (yMin < 0) {
      yMin = 0;
      yMax = Math.min(100, spanY);
    } else if (yMax > 100) {
      yMax = 100;
      yMin = Math.max(0, 100 - spanY);
    }

    return {
      xDomain: [Math.round(xMin), Math.round(xMax)] as [number, number],
      yDomain: [Math.round(yMin), Math.round(yMax)] as [number, number]
    };
  }, [
    winabilityMatrixData.maxValueDomain,
    winabilityMatrixData.valueThreshold,
    winabilityMatrixData.winThreshold,
    matrixQuadrantFilter,
    matrixZoomLevel,
    matrixPanOffset,
    filteredMatrixPoints
  ]);

  const handleResetMatrixView = () => {
    setMatrixWinabilityFilter('ALL');
    setMatrixQuadrantFilter('ALL');
    setMatrixZoomLevel(1);
    setMatrixPanOffset({ x: 0, y: 0 });
  };

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

          {/* Winability Intelligence: Opportunity Portfolio Matrix */}
          <div className="p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
            <div className="border-b border-border/70 pb-3 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  Winability Intelligence
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Opportunity Portfolio Matrix — opportunity value vs. authoritative risk-adjusted winability across four portfolio groups
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Winability Condition Filter */}
                <div className="inline-flex items-center rounded-xl border border-border bg-bg-primary/70 p-0.5 text-[10px] font-mono">
                  {(
                    [
                      { key: 'ALL', label: 'All' },
                      { key: 'HIGH', label: 'High (≥75%)' },
                      { key: 'MODERATE', label: 'Moderate (55–74%)' },
                      { key: 'LOW', label: 'Low (<55%)' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setMatrixWinabilityFilter(opt.key)}
                      className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        matrixWinabilityFilter === opt.key
                          ? 'bg-accent text-black'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Zoom Controls */}
                <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-bg-primary/70 px-1.5 py-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    title="Zoom out"
                    disabled={matrixZoomLevel <= 1}
                    onClick={() => {
                      setMatrixZoomLevel((z) => {
                        const next = Math.max(1, Number((z - 0.5).toFixed(1)));
                        if (next === 1) setMatrixPanOffset({ x: 0, y: 0 });
                        return next;
                      });
                    }}
                    className="p-1 rounded-md text-text-secondary hover:text-text-primary disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-1 font-bold text-text-primary tabular-nums">
                    {matrixZoomLevel.toFixed(1).replace(/\.0$/, '')}x
                  </span>
                  <button
                    type="button"
                    title="Zoom in"
                    disabled={matrixZoomLevel >= 4}
                    onClick={() => setMatrixZoomLevel((z) => Math.min(4, Number((z + 0.5).toFixed(1))))}
                    className="p-1 rounded-md text-text-secondary hover:text-text-primary disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>

                  {matrixZoomLevel > 1 && (
                    <div className="inline-flex items-center gap-0.5 pl-1 border-l border-border/70">
                      <button
                        type="button"
                        title="Pan left"
                        onClick={() => setMatrixPanOffset((p) => ({ ...p, x: Math.max(-1, p.x - 0.35) }))}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Pan right"
                        onClick={() => setMatrixPanOffset((p) => ({ ...p, x: Math.min(1, p.x + 0.35) }))}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Pan up"
                        onClick={() => setMatrixPanOffset((p) => ({ ...p, y: Math.min(1, p.y + 0.35) }))}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Pan down"
                        onClick={() => setMatrixPanOffset((p) => ({ ...p, y: Math.max(-1, p.y - 0.35) }))}
                        className="p-0.5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {(matrixZoomLevel > 1 ||
                    matrixWinabilityFilter !== 'ALL' ||
                    matrixQuadrantFilter !== 'ALL') && (
                    <button
                      type="button"
                      title="Reset matrix filters & zoom"
                      onClick={handleResetMatrixView}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-0.5 rounded-md text-accent hover:bg-accent/10 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-mono text-text-secondary tabular-nums">
                  {filteredMatrixPoints.length} assessed
                  {winabilityMatrixData.unassessedCount > 0
                    ? ` · ${winabilityMatrixData.unassessedCount} pending`
                    : ''}
                </span>
              </div>
            </div>

            {winabilityMatrixData.allPoints.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-xs text-text-secondary space-y-1.5">
                <Target className="h-7 w-7 text-text-secondary/40" />
                <p className="font-semibold text-text-primary">No Assessed Opportunities in Scope</p>
                <p className="text-[11px] max-w-md">
                  Complete a PADF Pipeline Assessment on deals in scope to plot authoritative Risk-Adjusted Winability against Opportunity Value.
                </p>
              </div>
            ) : filteredMatrixPoints.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-xs text-text-secondary space-y-2">
                <Filter className="h-6 w-6 text-text-secondary/40" />
                <p>No assessed deals match the active Winability Intelligence filter.</p>
                <button
                  type="button"
                  onClick={handleResetMatrixView}
                  className="px-3 py-1 rounded-lg bg-accent text-black text-[11px] font-bold cursor-pointer"
                >
                  Reset View
                </button>
              </div>
            ) : (
              <div className="relative h-[360px] w-full">
                {/* Subtle non-overlapping quadrant corner guides when viewing full matrix */}
                {matrixZoomLevel === 1 && matrixQuadrantFilter === 'ALL' && (
                  <>
                    <div className="pointer-events-none absolute top-2 left-[76px] z-10 text-[9px] font-mono font-bold uppercase tracking-wider text-sky-400/75">
                      Low Value / High Winability
                    </div>
                    <div className="pointer-events-none absolute top-2 right-4 z-10 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400/80 text-right">
                      High Value / High Winability
                    </div>
                    <div className="pointer-events-none absolute bottom-10 left-[76px] z-10 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400/75">
                      Low Value / Low Winability
                    </div>
                    <div className="pointer-events-none absolute bottom-10 right-4 z-10 text-[9px] font-mono font-bold uppercase tracking-wider text-red-400/80 text-right">
                      High Value / Low Winability
                    </div>
                  </>
                )}

                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 22, right: 20, left: 4, bottom: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis
                      type="number"
                      dataKey="value"
                      name="Opportunity Value"
                      domain={matrixViewport.xDomain}
                      allowDataOverflow
                      padding={matrixZoomLevel === 1 && matrixQuadrantFilter === 'ALL' ? { left: 14, right: 14 } : undefined}
                      tickFormatter={(v) => formatCompactCurrency(Number(v))}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: 'Opportunity Value ($)',
                        position: 'insideBottom',
                        offset: -10,
                        fill: '#94a3b8',
                        fontSize: 10,
                        fontFamily: 'monospace'
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="winability"
                      name="Winability"
                      domain={matrixViewport.yDomain}
                      allowDataOverflow
                      padding={matrixZoomLevel === 1 && matrixQuadrantFilter === 'ALL' ? { top: 10, bottom: 10 } : undefined}
                      tickFormatter={(v) => `${Math.round(Number(v))}%`}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                      label={{
                        value: 'Winability (%)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                        style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }
                      }}
                    />
                    <ZAxis type="number" dataKey="value" range={[140, 1100]} />

                    {winabilityMatrixData.valueThreshold >= matrixViewport.xDomain[0] &&
                      winabilityMatrixData.valueThreshold <= matrixViewport.xDomain[1] && (
                        <ReferenceLine
                          x={winabilityMatrixData.valueThreshold}
                          stroke="rgba(148,163,184,0.45)"
                          strokeDasharray="4 4"
                          label={{
                            value: `Value Split (${formatCompactCurrency(winabilityMatrixData.valueThreshold)})`,
                            position: 'insideTopRight',
                            fill: '#94a3b8',
                            fontSize: 9,
                            fontFamily: 'monospace'
                          }}
                        />
                      )}
                    {winabilityMatrixData.winThreshold >= matrixViewport.yDomain[0] &&
                      winabilityMatrixData.winThreshold <= matrixViewport.yDomain[1] && (
                        <ReferenceLine
                          y={winabilityMatrixData.winThreshold}
                          stroke="rgba(148,163,184,0.45)"
                          strokeDasharray="4 4"
                          label={{
                            value: `Winability Threshold (${winabilityMatrixData.winThreshold}%)`,
                            position: 'insideTopLeft',
                            fill: '#94a3b8',
                            fontSize: 9,
                            fontFamily: 'monospace'
                          }}
                        />
                      )}

                    <Tooltip
                      cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148,163,184,0.35)' }}
                      content={<MatrixTooltip />}
                    />

                    <Scatter
                      name="Opportunities"
                      data={filteredMatrixPoints}
                      isAnimationActive={false}
                      shape={(rawProps: any) => {
                        const { cx, cy, payload } = rawProps as {
                          cx?: number;
                          cy?: number;
                          payload?: WinabilityMatrixPoint;
                        };
                        if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
                          return <g />;
                        }
                        const isHovered = hoveredMatrixId === payload.id;
                        const r = payload.radius || 10;
                        return (
                          <g
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredMatrixId(payload.id)}
                            onMouseLeave={() => setHoveredMatrixId((prev) => (prev === payload.id ? null : prev))}
                            onClick={() => navigate(payload.targetUrl)}
                          >
                            {isHovered && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={r + 5}
                                fill="none"
                                stroke={payload.color}
                                strokeWidth={1.5}
                                strokeOpacity={0.55}
                              />
                            )}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHovered ? r + 2 : r}
                              fill={payload.color}
                              fillOpacity={isHovered ? 0.92 : 0.72}
                              stroke={isHovered ? '#ffffff' : payload.color}
                              strokeWidth={isHovered ? 2 : 1.5}
                            />
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend & Four Portfolio Group Cards */}
            <div className="pt-3 mt-3 border-t border-border/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    High Winability (&ge;75%)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Moderate Winability (55–74%)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Low Winability (&lt;55%)
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary">
                  Bubble size = Opportunity Value · Click any bubble to open workspace
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                {winabilityMatrixData.quadrantSummary.map((q) => {
                  const isSelected = matrixQuadrantFilter === q.key;
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => {
                        setMatrixQuadrantFilter((prev) => (prev === q.key ? 'ALL' : q.key));
                        setMatrixPanOffset({ x: 0, y: 0 });
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-sm'
                          : 'border-border/70 bg-bg-primary/50 hover:border-border hover:bg-bg-primary/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-text-primary uppercase truncate">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${q.dotClass}`} />
                          <span className="truncate">{q.title}</span>
                        </span>
                        <span className="text-[10px] font-mono font-black text-accent shrink-0 tabular-nums">
                          {q.count} · {formatCompactCurrency(q.value)}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1 leading-snug">
                        {q.interpretation}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pipeline Assessment Heatmap Section */}
          <PipelineAssessmentHeatmapSection
            scopedItems={scopedItems}
            riskRows={riskRows}
            actionRows={actionRows}
          />

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

const CANONICAL_PADF_DIMS = PipelineConfigService.getCanonicalPADFDimensions();

const PipelineAssessmentHeatmapSection: React.FC<{
  scopedItems: PipelineCardItem[];
  riskRows: Array<{ risk_instance_id: string; pipeline_id: string; assessment_id: string; severity: string; risk_status: string }>;
  actionRows: Array<{ action_id: string; pipeline_id: string; action_status: string }>;
}> = ({ scopedItems, riskRows }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dimFilter, setDimFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'VALUE' | 'WINABILITY' | 'HEALTH' | 'RISK'>('VALUE');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCell, setSelectedCell] = useState<{
    item: PipelineCardItem;
    dim: (typeof CANONICAL_PADF_DIMS)[0];
    score: number;
    classification: string;
    semantic: 'STRONG' | 'MODERATE' | 'WEAK' | 'CRITICAL' | 'UNASSESSED';
    narrative: any;
    dbRow: any;
  } | null>(null);

  const itemsPerPage = 10;

  const rows = useMemo(() => {
    return scopedItems.map((item) => {
      const assess: any = item.pipeline_opp?.latest_assessment;
      const rawOutput = assess?.raw_reasoning_output || {};
      const padfResults = assess?.padf_results || [];
      const aiNarratives = Array.isArray(rawOutput.padf_dimension_narratives) ? rawOutput.padf_dimension_narratives : [];

      const dimMap = new Map<string, any>();
      padfResults.forEach((r: any) => {
        dimMap.set(PipelineConfigService.normalizePADFDimensionId(r.dimension_id), r);
      });

      const cellData: Record<
        string,
        {
          score: number;
          semantic: 'STRONG' | 'MODERATE' | 'WEAK' | 'CRITICAL' | 'UNASSESSED';
          narrative: any;
          dbRow: any;
        }
      > = {};

      CANONICAL_PADF_DIMS.forEach((dim) => {
        const dbRow = dimMap.get(dim.id);
        const aiNarr = aiNarratives.find(
          (n: any) =>
            n.dimension_code === dim.id ||
            n.dimension_code === dim.shortCode ||
            String(n.dimension_code || '').startsWith(dim.shortCode)
        );
        const score = Number(dbRow?.dimension_score ?? aiNarr?.score ?? 0);
        let semantic: 'STRONG' | 'MODERATE' | 'WEAK' | 'CRITICAL' | 'UNASSESSED' = 'UNASSESSED';
        if (score >= 75) semantic = 'STRONG';
        else if (score >= 55) semantic = 'MODERATE';
        else if (score >= 35) semantic = 'WEAK';
        else if (score > 0) semantic = 'CRITICAL';

        cellData[dim.shortCode] = { score, semantic, narrative: aiNarr, dbRow };
      });

      const winability = assess?.risk_adjusted_winability ?? 0;
      const health = assess?.pipeline_health || 'Unassessed';
      const pid = item.pipeline_opp?.pipeline_id;
      const dealRisks = riskRows.filter((r) => r.pipeline_id === pid && (r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING'));
      const hasCriticalRisk = dealRisks.some((r) => r.severity === 'CRITICAL');
      const hasHighRisk = dealRisks.some((r) => r.severity === 'HIGH');
      const riskPriorityScore = hasCriticalRisk ? 4 : hasHighRisk ? 3 : dealRisks.length > 0 ? 2 : 1;

      return {
        item,
        assess,
        opportunityName: item.opportunity_name || 'Untitled Opportunity',
        customer: item.company_name || '—',
        value: Number(item.estimated_value || 0),
        winability,
        health,
        riskPriorityScore,
        cellData
      };
    });
  }, [scopedItems, riskRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = row.opportunityName.toLowerCase().includes(q) || row.customer.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      if (conditionFilter !== 'ALL') {
        const matchesCondition = Object.values(row.cellData).some((c: any) => c.semantic === conditionFilter);
        if (!matchesCondition) return false;
      }

      if (dimFilter !== 'ALL') {
        const cell = row.cellData[dimFilter];
        if (!cell || cell.semantic === 'UNASSESSED') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'VALUE') return b.value - a.value;
      if (sortBy === 'WINABILITY') return b.winability - a.winability;
      if (sortBy === 'HEALTH') return String(b.health).localeCompare(String(a.health));
      if (sortBy === 'RISK') return b.riskPriorityScore - a.riskPriorityScore;
      return 0;
    });
  }, [rows, searchQuery, conditionFilter, dimFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, conditionFilter, dimFilter, sortBy]);

  const renderCellBadge = (semantic: string, score: number) => {
    let bg = 'bg-bg-primary text-text-secondary border-border/60';
    let label = '—';
    if (semantic === 'STRONG') {
      bg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      label = String(score);
    } else if (semantic === 'MODERATE') {
      bg = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      label = String(score);
    } else if (semantic === 'WEAK') {
      bg = 'bg-red-500/20 text-red-400 border-red-500/40';
      label = String(score);
    } else if (semantic === 'CRITICAL') {
      bg = 'bg-red-700/30 text-red-300 border-red-700/60';
      label = String(score);
    }
    return (
      <div className={`h-8 w-full rounded border flex items-center justify-center font-mono text-[11px] font-bold ${bg}`}>
        {label}
      </div>
    );
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between space-y-4">
      <div className="border-b border-border/70 pb-3 space-y-3">
        <div>
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <PieChartIcon className="h-3.5 w-3.5 text-accent" />
            Pipeline Assessment Heatmap
          </h3>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Opportunity-by-dimension assessment matrix (PA1–PA8) — reveal individual deal strengths, vulnerabilities, and portfolio patterns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opportunity or customer..."
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs text-text-primary focus:outline-none focus:border-accent w-56"
          />

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">All Conditions</option>
            <option value="STRONG">Strong (≥75)</option>
            <option value="MODERATE">Moderate (55–74)</option>
            <option value="WEAK">Weak (35–54)</option>
            <option value="CRITICAL">Critical (&lt;35)</option>
            <option value="UNASSESSED">Not Assessed</option>
          </select>

          <select
            value={dimFilter}
            onChange={(e) => setDimFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">All 8 PADF Dims</option>
            {CANONICAL_PADF_DIMS.map((d) => (
              <option key={d.shortCode} value={d.shortCode}>
                {d.shortCode}: {d.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="VALUE">Sort: Deal Value</option>
            <option value="WINABILITY">Sort: Winability</option>
            <option value="HEALTH">Sort: Pipeline Health</option>
            <option value="RISK">Sort: Risk Priority</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar-horizontal rounded-xl border border-border/70 max-h-[460px] pb-2">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-20 bg-bg-surface border-b border-border font-mono text-[10px] text-text-secondary uppercase">
              <th className="sticky left-0 z-30 bg-bg-surface px-4 py-3 font-bold border-r border-border/60 max-w-[220px]">
                Opportunity ({filteredRows.length})
              </th>
              {CANONICAL_PADF_DIMS.map((dim) => (
                <th key={dim.shortCode} className="px-2 py-3 text-center border-r border-border/40 min-w-[90px]" title={dim.name}>
                  <div>{dim.shortCode}</div>
                  <div className="text-[9px] lowercase tracking-normal text-text-secondary truncate max-w-[85px]">
                    {dim.name}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center min-w-[100px]">Winability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-sans">
            {paginatedRows.map((row) => {
              const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                row.item.id
              )}${row.item.lead_id ? `&leadId=${encodeURIComponent(row.item.lead_id)}` : ''}&source=pipeline_dashboard_heatmap`;

              return (
                <tr key={row.item.id} className="hover:bg-bg-primary/40 transition-colors group">
                  <td className="sticky left-0 z-10 bg-bg-surface group-hover:bg-bg-primary/60 px-4 py-2.5 border-r border-border/60 max-w-[220px]"
                  title={`${row.opportunityName} — Click for Assessment Workspace`}
                  >
                    <Link to={targetUrl} className="block truncate">
                      <div className="font-bold text-text-primary hover:text-accent transition-colors truncate">
                        {row.opportunityName}
                      </div>
                      <div className="text-[10px] text-text-secondary truncate font-mono mt-0.5">
                        {row.customer} · <strong className="text-text-primary">{row.value > 0 ? formatCompactCurrency(row.value) : '—'}</strong>
                      </div>
                    </Link>
                  </td>

                  {CANONICAL_PADF_DIMS.map((dim) => {
                    const cell = row.cellData[dim.shortCode] || { score: 0, semantic: 'UNASSESSED', narrative: null, dbRow: null };
                    return (
                      <td
                        key={dim.shortCode}
                        onClick={() =>
                          setSelectedCell({
                            item: row.item,
                            dim,
                            score: cell.score,
                            classification: cell.semantic,
                            semantic: cell.semantic,
                            narrative: cell.narrative,
                            dbRow: cell.dbRow
                          })
                        }
                        className="px-2 py-2 text-center border-r border-border/40 cursor-pointer transition-all hover:opacity-90"
                        title={`${row.opportunityName} — ${dim.shortCode} ${dim.name}: ${cell.semantic} (${cell.score}/100) — Click for Assessment Insight Panel`}
                      >
                        {renderCellBadge(cell.semantic, cell.score)}
                      </td>
                    );
                  })}

                  <td className="px-3 py-2 text-center font-mono">
                    <span className="font-bold text-accent">{row.winability}%</span>
                  </td>
                </tr>
              );
            })}

            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-text-secondary">
                  No opportunities match the heatmap search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs font-mono">
          <span className="text-text-secondary">
            Showing page {currentPage} of {totalPages} ({filteredRows.length} opportunities)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border border-border bg-bg-primary text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg border border-border bg-bg-primary text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {typeof document !== 'undefined' &&
        selectedCell &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCell(null);
            }}
          >
          <div
            className="bg-bg-surface border border-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 sm:p-7 shadow-2xl relative flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                    {selectedCell.dim.shortCode}
                  </span>
                  <span className="text-xs font-mono text-text-secondary">
                    PADF Diagnostic Dimension Toolkit
                  </span>
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">
                  {selectedCell.dim.name}
                </h3>
                <p className="text-xs text-text-secondary font-mono">
                  {selectedCell.item.opportunity_name} ({selectedCell.item.company_name})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all cursor-pointer"
                title="Close Toolkit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Toolkit Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mt-4 text-xs">
              {/* CURRENT ASSESSMENT */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">
                  Current Assessment
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Status</span>
                    <span
                      className={`text-sm font-black uppercase mt-0.5 block ${
                        selectedCell.semantic === 'STRONG'
                          ? 'text-emerald-400'
                          : selectedCell.semantic === 'MODERATE'
                            ? 'text-amber-400'
                            : selectedCell.semantic === 'WEAK'
                              ? 'text-red-400'
                              : selectedCell.semantic === 'CRITICAL'
                                ? 'text-red-500'
                                : 'text-text-secondary'
                      }`}
                    >
                      {selectedCell.semantic}
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Score</span>
                    <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                      {selectedCell.score} <span className="text-[10px] text-text-secondary">/100</span>
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Confidence</span>
                    <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                      {selectedCell.narrative?.confidence || 75}%
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/40">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Weight</span>
                    <span className="text-xs font-bold text-accent mt-0.5 block truncate">
                      {selectedCell.dim.shortCode === 'PA1' || selectedCell.dim.shortCode === 'PA2' || selectedCell.dim.shortCode === 'PA3' || selectedCell.dim.shortCode === 'PA4' ? '15%' : '10%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI EXPLANATION */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">
                  AI Explanation & Findings
                </div>

                <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent block">
                    Short Assessment Interpretation:
                  </span>
                  <p className="text-text-primary font-medium leading-relaxed">
                    {selectedCell.narrative?.interpretation ||
                     selectedCell.narrative?.summary ||
                     selectedCell.dbRow?.assessment_summary ||
                     selectedCell.dim.description}
                  </p>
                  {selectedCell.narrative?.business_implication && (
                    <p className="text-[11px] text-text-secondary pt-1 border-t border-border/50">
                      <strong className="text-text-primary">Business Implication:</strong>{' '}
                      {selectedCell.narrative.business_implication}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Key Supporting Evidence & Strengths:
                  </span>
                  {Array.isArray(selectedCell.narrative?.strengths) && selectedCell.narrative.strengths.length > 0 ? (
                    <ul className="space-y-1 text-text-primary leading-relaxed">
                      {selectedCell.narrative.strengths.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  ) : Array.isArray(selectedCell.dbRow?.key_strengths) && selectedCell.dbRow.key_strengths.length > 0 ? (
                    <ul className="space-y-1 text-text-primary leading-relaxed">
                      {selectedCell.dbRow.key_strengths.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-secondary italic">Verified customer priority alignment and stakeholder engagement.</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/40">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Key Weaknesses or Gaps:
                  </span>
                  {Array.isArray(selectedCell.narrative?.weaknesses) && selectedCell.narrative.weaknesses.length > 0 ? (
                    <ul className="space-y-1 text-text-secondary leading-relaxed">
                      {selectedCell.narrative.weaknesses.map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  ) : Array.isArray(selectedCell.dbRow?.key_weaknesses) && selectedCell.dbRow.key_weaknesses.length > 0 ? (
                    <ul className="space-y-1 text-text-secondary leading-relaxed">
                      {selectedCell.dbRow.key_weaknesses.map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-secondary italic">Ensure complete supporting evidence and multi-threaded stakeholder sign-off.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between shrink-0">
              <Link
                to={`/product/revos/pipeline?opportunityId=${encodeURIComponent(selectedCell.item.id)}&source=heatmap_toolkit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                <span>Open Assessment Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
