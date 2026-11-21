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
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { PipelineCardItem } from './PipelineCard';
import { isPipelineItemClosed, resolveCanvasColumn } from '../services/pipelinePortfolioLoader';

export type OutlookGranularity = 'YEAR' | 'QUARTER' | 'MONTH';

interface OutlookOpportunityEntry {
  item: PipelineCardItem;
  opportunityName: string;
  customerName: string;
  owner: string;
  stage: string;
  forecastValue: number;
  riskAdjustedValue: number;
  currency: string;
  expectedCloseDate: string;
  isClosed: boolean;
  targetUrl: string;
}

interface OutlookPeriodBucket {
  key: string;
  label: string;
  fullLabel: string;
  sortIndex: number;
  activeCount: number;
  closedCount: number;
  totalCount: number;
  forecastValue: number;
  riskAdjustedValue: number;
  revenueExposure: number | null;
  currencyLabel: string;
  hasMixedCurrency: boolean;
  opportunities: OutlookOpportunityEntry[];
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = [
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

function getCurrencySymbol(currency: string): string {
  const c = currency.toUpperCase();
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  if (c === 'USD') return '$';
  return `${c} `;
}

function formatCompactOutlookCurrency(val: number, currency = 'USD'): string {
  if (currency === 'MIXED') {
    if (!val || val <= 0) return '0';
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
    }
    if (val >= 1_000) {
      const k = val / 1_000;
      return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return val.toLocaleString('en-US');
  }
  const sym = getCurrencySymbol(currency);
  if (!val || val <= 0) return `${sym}0`;
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `${sym}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `${sym}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sym}${Math.round(val).toLocaleString('en-US')}`;
}

function formatFullOutlookCurrency(val: number, currency = 'USD'): string {
  if (currency === 'MIXED') return `${Math.round(val).toLocaleString('en-US')} (Mixed)`;
  const sym = getCurrencySymbol(currency);
  return `${sym}${Math.round(val).toLocaleString('en-US')}`;
}

function parseCloseCalendarDate(
  raw?: string | null
): { year: number; month: number; day: number; formatted: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match YYYY-MM-DD directly in calendar space to prevent UTC offset shifting Q1/Month boundaries
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        year,
        month,
        day,
        formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  return {
    year,
    month,
    day,
    formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  };
}

function buildPeriodMeta(
  year: number,
  month: number,
  granularity: OutlookGranularity
): { key: string; label: string; fullLabel: string; sortIndex: number } {
  if (granularity === 'YEAR') {
    return {
      key: `Y_${year}`,
      label: String(year),
      fullLabel: `Year ${year}`,
      sortIndex: year
    };
  }
  if (granularity === 'QUARTER') {
    const q = Math.floor((month - 1) / 3) + 1;
    const yy = String(year).slice(-2);
    return {
      key: `Q_${year}_${q}`,
      label: `${yy}-Q${q}`,
      fullLabel: `Q${q} ${year}`,
      sortIndex: year * 4 + (q - 1)
    };
  }
  const yy = String(year).slice(-2);
  const mShort = MONTH_SHORT[month - 1];
  const mLong = MONTH_LONG[month - 1];
  return {
    key: `M_${year}_${month}`,
    label: `${yy}-${mShort}`,
    fullLabel: `${mLong} ${year}`,
    sortIndex: year * 12 + (month - 1)
  };
}

function periodMetaFromSortIndex(
  sortIndex: number,
  granularity: OutlookGranularity
): { key: string; label: string; fullLabel: string; sortIndex: number } {
  if (granularity === 'YEAR') {
    return buildPeriodMeta(sortIndex, 1, 'YEAR');
  }
  if (granularity === 'QUARTER') {
    const year = Math.floor(sortIndex / 4);
    const q = (sortIndex % 4) + 1;
    return buildPeriodMeta(year, (q - 1) * 3 + 1, 'QUARTER');
  }
  const year = Math.floor(sortIndex / 12);
  const month = (sortIndex % 12) + 1;
  return buildPeriodMeta(year, month, 'MONTH');
}

function resolveStageOutcome(item: PipelineCardItem): 'CLOSED_WON' | 'CLOSED_LOST' | 'OPEN' {
  const lifecycle = item.pipeline_opp?.lifecycle_status;
  if (lifecycle === 'CLOSED_WON' || item.pipeline_stage === 'Closed Won') return 'CLOSED_WON';
  if (lifecycle === 'CLOSED_LOST' || item.pipeline_stage === 'Closed Lost') return 'CLOSED_LOST';
  const col = resolveCanvasColumn(item);
  if (col === 'Closed' && item.pipeline_stage === 'Closed Won') return 'CLOSED_WON';
  if (col === 'Closed' && item.pipeline_stage === 'Closed Lost') return 'CLOSED_LOST';
  return 'OPEN';
}

const OutlookTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: OutlookPeriodBucket }>;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const displayCur = row.hasMixedCurrency ? 'MIXED' : row.currencyLabel;

  return (
    <div className="relative z-50 rounded-xl border border-border bg-bg-surface px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 min-w-[220px]">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1">
        <span className="font-bold text-text-primary">
          {row.fullLabel} ({row.label})
        </span>
        <span className="text-[10px] font-mono text-text-secondary tabular-nums">
          {row.totalCount} deal{row.totalCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="inline-flex items-center gap-1.5 text-text-secondary">
          <span className="h-2 w-2 rounded-xs bg-sky-400 shrink-0" />
          Forecast Value:
        </span>
        <strong className="text-sky-400">
          {formatFullOutlookCurrency(row.forecastValue, displayCur)}{' '}
          {!row.hasMixedCurrency && (
            <span className="text-[10px] font-normal text-text-secondary">{row.currencyLabel}</span>
          )}
        </strong>
      </div>

      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="inline-flex items-center gap-1.5 text-text-secondary">
          <span className="h-2 w-2 rounded-xs bg-emerald-500 shrink-0" />
          Risk-Adjusted:
        </span>
        <strong className="text-emerald-400">
          {formatFullOutlookCurrency(row.riskAdjustedValue, displayCur)}{' '}
          {!row.hasMixedCurrency && (
            <span className="text-[10px] font-normal text-text-secondary">{row.currencyLabel}</span>
          )}
        </strong>
      </div>

      {row.totalCount > 0 && (
        <div className="text-[10px] font-mono text-accent pt-0.5 border-t border-border/40">
          Click period to view {row.totalCount} contributing deal{row.totalCount === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
};

interface PipelineRevenueOutlookChartProps {
  scopedItems: PipelineCardItem[];
  granularity: OutlookGranularity;
  closedWonCount: number;
}

export const PipelineRevenueOutlookChart: React.FC<PipelineRevenueOutlookChartProps> = ({
  scopedItems,
  granularity,
  closedWonCount
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);

  const { periods, portfolioCurrency, hasMixedPortfolioCurrency, missingCloseDateCount } = useMemo(() => {
    const map = new Map<
      string,
      {
        meta: { key: string; label: string; fullLabel: string; sortIndex: number };
        forecastRaw: number;
        weightedRaw: number;
        currencies: Set<string>;
        activeCount: number;
        closedCount: number;
        opportunities: OutlookOpportunityEntry[];
      }
    >();

    const allCurrencies = new Set<string>();
    let missingCount = 0;

    scopedItems.forEach((item) => {
      const rawClose = item.expected_close_date || item.pipeline_opp?.expected_close_date;
      const parsedDate = parseCloseCalendarDate(rawClose);
      if (!parsedDate) {
        missingCount += 1;
        return;
      }

      const meta = buildPeriodMeta(parsedDate.year, parsedDate.month, granularity);
      const forecastVal = Math.max(0, Number(item.estimated_value || 0));
      const outcome = resolveStageOutcome(item);
      const pct = item.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 50;
      const weightedRawVal =
        outcome === 'CLOSED_WON' ? forecastVal : outcome === 'CLOSED_LOST' ? 0 : forecastVal * (pct / 100);

      const currency = String(item.pipeline_opp?.currency || 'USD').trim().toUpperCase() || 'USD';
      allCurrencies.add(currency);

      const isClosed = isPipelineItemClosed(item);
      const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
        item.id
      )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_revenue_outlook`;

      const entry: OutlookOpportunityEntry = {
        item,
        opportunityName: item.opportunity_name || 'Untitled Opportunity',
        customerName: item.company_name || '—',
        owner: item.opportunity_owner || item.pipeline_opp?.opportunity_owner || '—',
        stage: item.pipeline_stage || 'Qualification',
        forecastValue: forecastVal,
        riskAdjustedValue: Math.round(weightedRawVal),
        currency,
        expectedCloseDate: parsedDate.formatted,
        isClosed,
        targetUrl
      };

      const existing = map.get(meta.key) || {
        meta,
        forecastRaw: 0,
        weightedRaw: 0,
        currencies: new Set<string>(),
        activeCount: 0,
        closedCount: 0,
        opportunities: []
      };

      existing.forecastRaw += forecastVal;
      existing.weightedRaw += weightedRawVal;
      existing.currencies.add(currency);
      if (isClosed) existing.closedCount += 1;
      else existing.activeCount += 1;
      existing.opportunities.push(entry);
      map.set(meta.key, existing);
    });

    const populated = Array.from(map.values()).sort((a, b) => a.meta.sortIndex - b.meta.sortIndex);
    const portfolioMixed = allCurrencies.size > 1;
    const defaultPortfolioCurrency = allCurrencies.size === 1 ? Array.from(allCurrencies)[0] : 'USD';

    if (populated.length === 0) {
      return {
        periods: [] as OutlookPeriodBucket[],
        portfolioCurrency: defaultPortfolioCurrency,
        hasMixedPortfolioCurrency: portfolioMixed,
        missingCloseDateCount: missingCount
      };
    }

    const minSortIdx = populated[0].meta.sortIndex;
    const maxSortIdx = populated[populated.length - 1].meta.sortIndex;
    const span = maxSortIdx - minSortIdx;

    const finalizeBucket = (
      meta: { key: string; label: string; fullLabel: string; sortIndex: number },
      raw?: {
        forecastRaw: number;
        weightedRaw: number;
        currencies: Set<string>;
        activeCount: number;
        closedCount: number;
        opportunities: OutlookOpportunityEntry[];
      }
    ): OutlookPeriodBucket => {
      if (!raw) {
        return {
          key: meta.key,
          label: meta.label,
          fullLabel: meta.fullLabel,
          sortIndex: meta.sortIndex,
          activeCount: 0,
          closedCount: 0,
          totalCount: 0,
          forecastValue: 0,
          riskAdjustedValue: 0,
          revenueExposure: 0,
          currencyLabel: defaultPortfolioCurrency,
          hasMixedCurrency: false,
          opportunities: []
        };
      }

      const mixed = raw.currencies.size > 1;
      const curLabel = mixed ? 'MIXED' : Array.from(raw.currencies)[0] || defaultPortfolioCurrency;
      const forecastRounded = Math.round(raw.forecastRaw);
      const weightedRounded = Math.round(raw.weightedRaw);

      return {
        key: meta.key,
        label: meta.label,
        fullLabel: meta.fullLabel,
        sortIndex: meta.sortIndex,
        activeCount: raw.activeCount,
        closedCount: raw.closedCount,
        totalCount: raw.opportunities.length,
        forecastValue: forecastRounded,
        riskAdjustedValue: weightedRounded,
        // Revenue Exposure only defined when all opportunities in period share a compatible currency & value basis
        revenueExposure: mixed ? null : forecastRounded - weightedRounded,
        currencyLabel: curLabel,
        hasMixedCurrency: mixed,
        opportunities: [...raw.opportunities].sort((a, b) => b.forecastValue - a.forecastValue)
      };
    };

    const buckets: OutlookPeriodBucket[] = [];
    if (span <= 48) {
      for (let idx = minSortIdx; idx <= maxSortIdx; idx++) {
        const meta = periodMetaFromSortIndex(idx, granularity);
        buckets.push(finalizeBucket(meta, map.get(meta.key)));
      }
    } else {
      populated.forEach((p) => buckets.push(finalizeBucket(p.meta, p)));
    }

    return {
      periods: buckets,
      portfolioCurrency: defaultPortfolioCurrency,
      hasMixedPortfolioCurrency: portfolioMixed,
      missingCloseDateCount: missingCount
    };
  }, [scopedItems, granularity]);

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.key === selectedPeriodKey) || null,
    [periods, selectedPeriodKey]
  );

  // Clear invalid period selection when scope or granularity changes
  useEffect(() => {
    if (selectedPeriodKey && !periods.some((p) => p.key === selectedPeriodKey)) {
      setSelectedPeriodKey(null);
    }
  }, [periods, selectedPeriodKey]);

  // Escape closes Period Detail Drawer cleanly without resetting granularity or filters
  useEffect(() => {
    if (!selectedPeriodKey) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPeriodKey(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPeriodKey]);

  const periodSlotWidth = granularity === 'MONTH' ? 76 : granularity === 'QUARTER' ? 88 : 112;
  const needsHorizontalScroll = periods.length > 6;
  const chartPixelWidth = Math.max(periods.length * periodSlotWidth + 72, 560);

  const handleScrollBy = (deltaPx: number) => {
    scrollContainerRef.current?.scrollBy({ left: deltaPx, behavior: 'smooth' });
  };

  const openPeriodByIndexOrLabel = (state: any) => {
    const rawIdx = state?.activeTooltipIndex;
    const numericIdx = typeof rawIdx === 'number' ? rawIdx : Number(rawIdx);
    if (
      rawIdx !== undefined &&
      rawIdx !== null &&
      !Number.isNaN(numericIdx) &&
      periods[numericIdx] &&
      periods[numericIdx].totalCount > 0
    ) {
      setSelectedPeriodKey(periods[numericIdx].key);
      return;
    }
    if (state?.activeLabel) {
      const matched = periods.find((p) => p.label === state.activeLabel);
      if (matched && matched.totalCount > 0) {
        setSelectedPeriodKey(matched.key);
      }
    }
  };

  if (periods.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-between">
        <div className="h-[260px] flex flex-col items-center justify-center text-center px-4 space-y-2 border border-dashed border-border/70 rounded-xl bg-bg-primary/30">
          <Calendar className="h-6 w-6 text-text-secondary/50" />
          <div className="text-xs font-bold text-text-primary">
            No Expected Close Dates in Current Scope
          </div>
          <p className="text-[11px] text-text-secondary max-w-md">
            Assign expected closing dates to opportunities in your portfolio to display chronological revenue projections by Year, Quarter, or Month.
          </p>
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
            Won: <strong className="text-emerald-400">{closedWonCount}</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Horizontally Scrollable Chart Viewport (neutral scrollbar matching Dashboard theme) */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto custom-scrollbar-horizontal-neutral touch-pan-x pb-1.5"
      >
        <div
          className="h-[260px]"
          style={
            needsHorizontalScroll
              ? { width: `${chartPixelWidth}px`, minWidth: '100%' }
              : { width: '100%' }
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={periods}
              barSize={26}
              barGap={6}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              onClick={openPeriodByIndexOrLabel}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  formatCompactOutlookCurrency(
                    Number(v),
                    hasMixedPortfolioCurrency ? 'MIXED' : portfolioCurrency
                  )
                }
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                content={<OutlookTooltip />}
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
              />
              <Bar
                dataKey="forecastValue"
                name="Gross Pipeline Value"
                fill="#38bdf8"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(barData: any) => {
                  const key = barData?.payload?.key || barData?.key;
                  const target = periods.find((p) => p.key === key);
                  if (target && target.totalCount > 0) setSelectedPeriodKey(target.key);
                }}
              />
              <Bar
                dataKey="riskAdjustedValue"
                name="Risk-Adjusted Forecast"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(barData: any) => {
                  const key = barData?.payload?.key || barData?.key;
                  const target = periods.find((p) => p.key === key);
                  if (target && target.totalCount > 0) setSelectedPeriodKey(target.key);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Persistent Legend + Scroll Arrows + Metadata Footer */}
      <div className="pt-3 mt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
            Gross Pipeline Value
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Risk-Adjusted Forecast
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {missingCloseDateCount > 0 && (
            <span
              className="text-[10px] text-amber-500 dark:text-amber-400"
              title="Deals without an expected close date are excluded from timeline period buckets"
            >
              {missingCloseDateCount} unscheduled
            </span>
          )}

          {needsHorizontalScroll && (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScrollBy(-240)}
                className="p-1 rounded-md border border-border bg-bg-primary text-text-secondary hover:text-text-primary hover:border-accent transition-colors cursor-pointer"
                title="Scroll timeline left"
                aria-label="Scroll timeline left"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollBy(240)}
                className="p-1 rounded-md border border-border bg-bg-primary text-text-secondary hover:text-text-primary hover:border-accent transition-colors cursor-pointer"
                title="Scroll timeline right"
                aria-label="Scroll timeline right"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <span className="text-text-secondary hidden sm:inline">
            Won: <strong className="text-emerald-400">{closedWonCount}</strong>
          </span>
        </div>
      </div>

      {/* Period Detail Drawer (Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop) */}
      {typeof document !== 'undefined' &&
        selectedPeriod &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPeriodKey(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Pipeline Revenue Outlook — ${selectedPeriod.fullLabel}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-surface border border-border/80 w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative flex flex-col my-0 sm:my-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3.5 shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-text-secondary">
                    <span className="px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold uppercase">
                      {granularity === 'YEAR'
                        ? 'Annual'
                        : granularity === 'QUARTER'
                          ? 'Quarterly'
                          : 'Monthly'}{' '}
                      Outlook
                    </span>
                    <span>Period Key: {selectedPeriod.label}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                    Pipeline Revenue Outlook — {selectedPeriod.fullLabel}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPeriodKey(null)}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer shrink-0"
                  title="Close Period Detail"
                  aria-label="Close Period Detail"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Content-Fit Body */}
              <div className="overflow-y-auto custom-scrollbar-vertical space-y-5 pr-1.5 mt-4 text-xs">
                {/* A. Period Overview */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    A. Period Overview
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Selected Period
                      </span>
                      <span className="text-xs font-bold text-text-primary mt-0.5 block">
                        {selectedPeriod.fullLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Active Deals
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                        {selectedPeriod.activeCount}
                        {selectedPeriod.closedCount > 0 && (
                          <span className="text-[10px] font-normal text-text-secondary ml-1">
                            (+{selectedPeriod.closedCount} closed)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Forecast Value
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-sky-400 mt-0.5 block">
                        {formatFullOutlookCurrency(
                          selectedPeriod.forecastValue,
                          selectedPeriod.currencyLabel
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Risk-Adjusted
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-emerald-400 mt-0.5 block">
                        {formatFullOutlookCurrency(
                          selectedPeriod.riskAdjustedValue,
                          selectedPeriod.currencyLabel
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60 col-span-2 sm:col-span-1">
                      <span
                        className="text-[10px] font-mono text-text-secondary inline-flex items-center gap-1"
                        title="Difference between Forecast Value and Risk-Adjusted Value under consistent single-currency aggregation"
                      >
                        <span>Revenue Exposure</span>
                        <Info className="h-2.5 w-2.5 opacity-70" />
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-amber-500 dark:text-amber-400 mt-0.5 block">
                        {selectedPeriod.revenueExposure !== null
                          ? formatFullOutlookCurrency(
                              selectedPeriod.revenueExposure,
                              selectedPeriod.currencyLabel
                            )
                          : 'N/A (mixed currencies)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* B. Contributing Opportunities */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      B. Contributing Opportunities ({selectedPeriod.opportunities.length})
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      Click any deal to open Pipeline Assessment
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar-horizontal-neutral rounded-xl border border-border/70">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-bg-primary/70 border-b border-border font-mono text-[10px] text-text-secondary uppercase">
                          <th className="px-3 py-2.5 min-w-[175px]">Opportunity</th>
                          <th className="px-3 py-2.5 min-w-[125px]">Owner</th>
                          <th className="px-3 py-2.5 min-w-[115px]">Stage</th>
                          <th className="px-3 py-2.5 text-right min-w-[100px]">Forecast Value</th>
                          <th className="px-3 py-2.5 text-right min-w-[100px]">Risk-Adj Value</th>
                          <th className="px-3 py-2.5 text-right min-w-[100px]">Close Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedPeriod.opportunities.map((opp) => (
                          <tr key={opp.item.id} className="hover:bg-bg-primary/40 transition-colors">
                            <td className="px-3 py-2.5 align-top">
                              <Link
                                to={opp.targetUrl}
                                className="font-bold text-text-primary hover:text-accent transition-colors inline-flex items-center gap-1"
                              >
                                <span className="line-clamp-1">{opp.opportunityName}</span>
                                <ArrowRight className="h-3 w-3 shrink-0" />
                              </Link>
                              <div className="text-[10px] text-text-secondary truncate">
                                {opp.customerName}
                              </div>
                            </td>

                            <td className="px-3 py-2.5 align-top text-text-primary truncate max-w-[130px]">
                              {opp.owner}
                            </td>

                            <td className="px-3 py-2.5 align-top font-mono text-[11px] text-text-secondary whitespace-nowrap">
                              {opp.stage}
                            </td>

                            <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums whitespace-nowrap font-bold text-sky-400">
                              {formatFullOutlookCurrency(opp.forecastValue, opp.currency)}
                            </td>

                            <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums whitespace-nowrap font-bold text-emerald-400">
                              {formatFullOutlookCurrency(opp.riskAdjustedValue, opp.currency)}
                            </td>

                            <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums whitespace-nowrap text-text-secondary">
                              {opp.expectedCloseDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] font-mono text-text-secondary">
                  {selectedPeriod.opportunities.length} contributing opportunit
                  {selectedPeriod.opportunities.length === 1 ? 'y' : 'ies'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodKey(null)}
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
