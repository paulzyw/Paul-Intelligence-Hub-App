import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Globe, Link as LinkIcon, Unlock, Clock, MapPin, ChevronDown, RefreshCw, BarChart3, Users, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const TIME_HORIZONS = [
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '12m', label: 'Last 12 Months' },
  { id: 'ytd', label: 'Year-to-Date' }
];

const COLORS = ['#00a3e0', '#ED8936', '#10B981', '#6366f1', '#f43f5e'];

export function TrafficMonitor() {
  const [horizon, setHorizon] = useState('30d');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_traffic_stats', { 
        time_horizon: horizon 
      });

      if (rpcError) throw rpcError;
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch traffic stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [horizon]);

  const formattedChartData = useMemo(() => {
    if (!stats?.time_series) return [];
    
    return stats.time_series.map((item: any) => {
      let dateLabel = '';
      const date = new Date(item.bucket);
      
      if (horizon === '24h') {
        dateLabel = format(date, 'HH:mm');
      } else if (horizon === '7d' || horizon === '30d') {
        dateLabel = format(date, 'MMM dd');
      } else {
        dateLabel = format(date, 'MMM yyyy');
      }

      return {
        ...item,
        dateLabel
      };
    });
  }, [stats, horizon]);

  if (loading && !stats) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-8 mb-8 animate-pulse">
        <div className="h-8 bg-border rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-bg-primary rounded-xl"></div>
          <div className="h-32 bg-bg-primary rounded-xl"></div>
          <div className="h-32 bg-bg-primary rounded-xl"></div>
        </div>
        <div className="h-64 bg-bg-primary rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8 transition-colors duration-400">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="text-accent" size={24} /> Traffic Intelligence
          </h2>
          <p className="text-sm text-text-secondary mt-1">Real-time visitor analytics and strategic engagement tracking.</p>
        </div>

        <div className="relative group">
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            className="appearance-none bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-accent cursor-pointer font-bold"
          >
            {TIME_HORIZONS.map(h => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center text-alert-red font-bold flex flex-col items-center gap-4">
          <AlertCircle size={48} />
          <p>Intelligence Sync Failed: {error}</p>
          <button onClick={fetchStats} className="px-6 py-2 bg-accent text-white rounded-lg">Retry Sync</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-bg-primary rounded-xl border border-border flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 rounded-lg bg-accent/10 text-accent">
                <Users size={24} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">Total Visits</div>
                <div className="text-2xl font-black text-text-primary">
                  {stats?.time_series?.reduce((sum: number, i: any) => sum + i.visits, 0) || 0}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Users size={48} />
              </div>
            </div>

            <div className="p-6 bg-bg-primary rounded-xl border border-border flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Unlock size={24} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">Dashboard Unlocks</div>
                <div className="text-2xl font-black text-text-primary">
                  {stats?.unlock_total || 0}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Unlock size={48} />
              </div>
            </div>

            <div className="p-6 bg-bg-primary rounded-xl border border-border flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                <Globe size={24} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">Top Source</div>
                <div className="text-2xl font-black text-text-primary">
                  {stats?.sources?.slice().sort((a: any, b: any) => b.count - a.count)[0]?.source || 'None'}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Globe size={48} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN CHART */}
            <div className="lg:col-span-2 bg-bg-primary rounded-xl border border-border p-6 shadow-inner">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Visitor Volume History
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a3e0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00a3e0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="dateLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-bg-surface border border-accent p-3 rounded-lg shadow-xl outline-none">
                              <p className="text-[10px] uppercase font-bold text-accent mb-1">{label}</p>
                              <p className="text-lg font-black text-text-primary">{payload[0].value} Visits</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="#00a3e0" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVisits)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SOURCES */}
            <div className="bg-bg-primary rounded-xl border border-border p-6 shadow-inner">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">Traffic Sources</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.sources || []}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="source"
                    >
                      {(stats?.sources || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* TOP CITIES TABLE */}
            <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
               <div className="p-4 bg-bg-surface border-b border-border font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                 <MapPin size={14} className="text-accent" /> Top Geographic Origins
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="border-b border-border text-text-secondary">
                        <th className="p-3">Location</th>
                        <th className="p-3">Inquiries</th>
                        <th className="p-3 text-right">Volume</th>
                     </tr>
                   </thead>
                   <tbody>
                     {(stats?.top_cities || []).map((city: any, i: number) => {
                       const maxVisits = stats?.top_cities?.[0]?.visit_count || 1;
                       return (
                         <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
                           <td className="p-3 font-medium text-text-primary">
                             {city.city || 'Private Location'}, {city.country}
                           </td>
                           <td className="p-3">
                              <div className="w-full bg-bg-surface h-1 rounded-full overflow-hidden max-w-[100px]">
                                 <div 
                                   className="bg-accent h-full" 
                                   style={{ width: `${(city.visit_count / maxVisits) * 100}%` }}
                                 ></div>
                              </div>
                           </td>
                           <td className="p-3 text-right font-mono text-xs">{city.visit_count}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* LIVE FEED */}
            <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
              <div className="p-4 bg-bg-surface border-b border-border font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-orange-500" /> Real-time Activity Feed
              </div>
              <div className="divide-y divide-border h-[300px] overflow-y-auto custom-scrollbar">
                {(stats?.recent_feed || []).map((visit: any, i: number) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        visit.unlocked ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-text-secondary/30"
                      )}></div>
                      <div>
                        <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                          {visit.city || 'Visitor'} from {visit.country}
                          {visit.unlocked && <Unlock size={12} className="text-emerald-500" />}
                        </div>
                        <div className="text-[10px] text-text-secondary uppercase tracking-tight flex items-center gap-2">
                          <LinkIcon size={10} /> {visit.source} | {format(new Date(visit.time), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                    {visit.unlocked && (
                      <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        VERIFIED
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
