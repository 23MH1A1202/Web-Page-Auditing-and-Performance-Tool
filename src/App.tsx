import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Gauge, Activity, Smartphone, Search as SearchIcon, AlertTriangle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuditResult, HistoryItem } from './types';
import { ScoreRing } from './components/ScoreRing';
import { AuditList } from './components/AuditList';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'accessibility' | 'bestPractices' | 'seo'>('performance');
  
  const [activeView, setActiveView] = useState<'audit' | 'history'>('audit');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [refactorState, setRefactorState] = useState<'idle' | 'running' | 'done'>('idle');
  
  const urlInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'history') {
      fetchHistory();
    }
  }, [activeView]);

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setRefactorState('idle');
    setActiveView('audit');

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run audit');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefactor = () => {
    setRefactorState('running');
    setTimeout(() => {
      setRefactorState('done');
    }, 2000);
  };

  const tabs = [
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'accessibility', label: 'Accessibility', icon: Activity },
    { id: 'bestPractices', label: 'Best Practices', icon: Smartphone },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
  ] as const;

  const chartData = result ? [
    { subject: 'Performance', score: result.scores.performance, fullMark: 100 },
    { subject: 'Accessibility', score: result.scores.accessibility, fullMark: 100 },
    { subject: 'Best Practices', score: result.scores.bestPractices, fullMark: 100 },
    { subject: 'SEO', score: result.scores.seo, fullMark: 100 },
  ] : [];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation - Desktop is left, Mobile is bottom */}
      <div className="md:w-20 w-full bg-slate-900 flex md:flex-col items-center justify-between md:justify-start px-6 md:px-0 py-4 md:py-6 gap-8 shrink-0 z-20 order-last md:order-first border-t md:border-t-0 md:border-r border-slate-800">
        <div className="hidden md:flex w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center text-white font-bold text-xl">L</div>
        <div className="flex md:flex-col gap-6 w-full justify-center md:justify-start">
          <button 
            onClick={() => setActiveView('audit')} 
            className={`p-3 md:p-2 rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none ${activeView === 'audit' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="New Audit"
          >
            <Gauge className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveView('history')} 
            className={`p-3 md:p-2 rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none ${activeView === 'history' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="History"
          >
            <Clock className="w-6 h-6" />
          </button>
        </div>
        <div className="hidden md:flex mt-auto mb-6 flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-700"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative order-first md:order-last pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-10">
          <form onSubmit={handleAudit} className="flex items-center gap-2 sm:gap-4 flex-1">
            <div className="bg-slate-100 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-200 w-full max-w-xl transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="text-slate-400 text-sm font-mono flex items-center hidden sm:flex"><Search className="w-4 h-4 mr-2"/></span>
              <input
                ref={urlInputRef}
                type="text"
                className="bg-transparent outline-none flex-1 text-xs sm:text-sm text-slate-700 placeholder-slate-400 w-full"
                placeholder="Enter URL (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              {activeView === 'audit' && url && !isLoading && (
                <button 
                  type="button" 
                  onClick={() => urlInputRef.current?.focus()}
                  className="text-[10px] sm:text-xs font-bold text-indigo-600 cursor-pointer hover:text-indigo-800"
                >
                  EDIT
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Auditing...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Generate Report</span>
                  <span className="sm:hidden">Audit</span>
                </>
              )}
            </button>
          </form>
        </header>

        <main className="p-6 flex flex-col gap-6 flex-1 max-w-7xl mx-auto w-full">
          {activeView === 'history' ? (
            <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Audit History
              </h2>
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
                  No audits found in history. Try auditing a URL!
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {history.map((item) => (
                    <div key={item._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                        <div className="text-base font-semibold text-slate-800">{item.url}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400">PERF</span>
                            <span className={`text-sm font-bold ${item.result.scores.performance >= 90 ? 'text-emerald-500' : item.result.scores.performance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{item.result.scores.performance}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400">A11Y</span>
                            <span className={`text-sm font-bold ${item.result.scores.accessibility >= 90 ? 'text-emerald-500' : item.result.scores.accessibility >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{item.result.scores.accessibility}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUrl(item.url);
                            setResult(item.result);
                            setActiveView('audit');
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Audit Failed</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {!result && !isLoading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shadow-sm border border-indigo-100">
                    <Gauge className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Ready to Audit</h2>
                  <p className="text-slate-500 text-sm max-w-md text-center">
                    Enter a URL above to analyze its performance, accessibility, best practices, and SEO using Gemini intelligence.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-6" />
                  <h2 className="text-sm font-bold text-slate-700 mb-1">Analyzing Page</h2>
                  <p className="text-xs text-slate-500 font-mono">Running real-time Gemini evaluation...</p>
                </div>
              )}

              {result && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {/* Overview Grid: Screenshot and Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visual Screenshot */}
                    <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-64 relative group">
                      <div className="h-8 bg-slate-800 flex items-center px-4 gap-2 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        <div className="mx-auto bg-slate-700/50 rounded text-[10px] text-slate-300 px-3 py-1 font-mono flex items-center gap-1.5 truncate max-w-[200px]">
                          <SearchIcon className="w-3 h-3 text-slate-400" />
                          {url}
                        </div>
                      </div>
                      <div className="flex-1 relative bg-white">
                        <img 
                          src={`https://image.thum.io/get/width/1200/crop/800/noanimate/${url}`} 
                          alt="Webpage Screenshot"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=800&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Chart Overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-64">
                      <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Score Breakdown</h3>
                      <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis 
                              dataKey="subject" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                              width={90}
                            />
                            <RechartsTooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                              dataKey="score" 
                              radius={[0, 4, 4, 0]} 
                              barSize={16}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                  entry.score >= 90 ? '#10b981' : 
                                  entry.score >= 50 ? '#f59e0b' : '#ef4444'
                                } />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Metric Circles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                      <ScoreRing score={result.scores.performance} label="" />
                      <div className="text-sm font-bold tracking-tight text-slate-500">PERFORMANCE</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                      <ScoreRing score={result.scores.accessibility} label="" />
                      <div className="text-sm font-bold tracking-tight text-slate-500">ACCESSIBILITY</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                      <ScoreRing score={result.scores.bestPractices} label="" />
                      <div className="text-sm font-bold tracking-tight text-slate-500">BEST PRACTICES</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center gap-4 shadow-sm">
                      <ScoreRing score={result.scores.seo} label="" />
                      <div className="text-sm font-bold tracking-tight text-slate-500">SEO</div>
                    </div>
                  </div>

                  {/* Core Web Vitals / Metrics */}
                  {result.metrics && result.metrics.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        CORE WEB VITALS & METRICS
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {result.metrics.map((metric, idx) => {
                          let colorClass = "text-emerald-500";
                          let dotClass = "bg-emerald-500";
                          if (metric.status === 'average') {
                            colorClass = "text-amber-500";
                            dotClass = "bg-amber-500";
                          } else if (metric.status === 'fail') {
                            colorClass = "text-red-500";
                            dotClass = "bg-red-500";
                          }
                          
                          return (
                            <div key={idx} className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${dotClass}`} />
                                <span className="text-sm font-semibold text-slate-700">{metric.title}</span>
                              </div>
                              <div className={`text-2xl font-bold ${colorClass} mt-1`}>
                                {metric.value}
                              </div>
                              {metric.description && (
                                <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detailed Results & Gemini Intelligence */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Opportunities Table */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h2 className="text-sm font-bold text-slate-700">AUDIT OPPORTUNITIES</h2>
                        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200/50 self-start sm:self-auto">
                          {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                  isActive 
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-4 min-h-[300px]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <AuditList audits={result.audits} category={activeTab} />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Gemini AI Insights - Stubbed static area matching design theme */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col h-full">
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-indigo-600 p-1 rounded">
                            <Activity className="w-4 h-4 text-white" />
                          </div>
                          <h2 className="text-sm font-bold text-indigo-900 tracking-tight">GEMINI INTELLIGENCE</h2>
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm leading-relaxed text-indigo-900/80">
                            Our LLM analysis identified that the overall <span className="font-bold">{tabs.find(t => t.id === activeTab)?.label}</span> could be improved based on the HTML structure provided.
                          </p>
                          {result.audits.filter(a => a.category === activeTab && a.status !== 'pass').slice(0, 1).map((audit, i) => (
                            <div key={i} className="bg-white/60 border border-indigo-100 p-4 rounded-lg">
                              <p className="text-xs text-indigo-800 font-semibold mb-2 uppercase tracking-wider">Top Priority Fix:</p>
                              <p className="text-sm text-indigo-700 font-medium">{audit.title}</p>
                              <p className="text-xs text-indigo-600/80 mt-1 line-clamp-2">{audit.description}</p>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-100/50 self-start px-3 py-1.5 rounded-full mt-4 border border-indigo-100">
                            <SearchIcon className="w-3 h-3" />
                            Analysis Complete
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-t border-indigo-100 bg-white/40 rounded-b-xl mt-auto">
                        <button 
                          onClick={handleRefactor}
                          disabled={refactorState !== 'idle'}
                          className={`w-full py-2.5 text-xs font-bold rounded-md border transition-all flex items-center justify-center gap-2 ${
                            refactorState === 'done' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {refactorState === 'idle' && <><Activity className="w-3.5 h-3.5" /> Apply Automated Refactor</>}
                          {refactorState === 'running' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying Fixes...</>}
                          {refactorState === 'done' && <><CheckCircle2 className="w-3.5 h-3.5" /> Refactored Successfully</>}
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
        
        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 px-8 py-3 bg-white flex justify-between items-center text-[10px] text-slate-400 font-medium shrink-0">
          <div className="flex gap-6 uppercase tracking-widest">
            <span>Status: <span className="text-emerald-500">Connected</span></span>
            <span>Engine: Node.js</span>
            <span>Auditor: Gemini 2.5 Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Audit ID: <span className="font-mono text-slate-500">#DX-{Math.floor(Math.random() * 1000)}-21</span></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

