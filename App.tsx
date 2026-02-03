
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyEntry, SessionStats } from './types';
import { analyzeKeystrokes } from './services/geminiService';
import { 
  Keyboard, 
  Download, 
  Trash2, 
  Activity, 
  Zap, 
  Cpu, 
  ShieldAlert,
  Clock,
  Terminal,
  BrainCircuit
} from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<KeyEntry[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastKeyTime = useRef<number>(Date.now());
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [entries]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    const now = Date.now();
    const interval = now - lastKeyTime.current;
    lastKeyTime.current = now;

    const newEntry: KeyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      key: e.key,
      code: e.code,
      timestamp: now,
      interval: interval,
      type: /^[a-zA-Z]$/.test(e.key) ? 'alpha' : 
            /^[0-9]$/.test(e.key) ? 'numeric' : 
            e.key.length > 1 ? 'command' : 'special'
    };

    setEntries(prev => [...prev, newEntry]);
  }, [isRecording]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const clearLogs = () => {
    setEntries([]);
    setAnalysis(null);
  };

  const downloadLogs = () => {
    const content = entries.map(e => 
      `[${new Date(e.timestamp).toISOString()}] KEY: ${e.key.padEnd(10)} CODE: ${e.code.padEnd(10)} DELTA: ${e.interval}ms`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KRONOS_LOG_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAnalysis = async () => {
    if (entries.length < 5) return;
    setIsAnalyzing(true);
    const result = await analyzeKeystrokes(entries);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const calculateWPM = () => {
    if (entries.length === 0) return 0;
    const timeInMinutes = (entries[entries.length - 1].timestamp - entries[0].timestamp) / 60000;
    if (timeInMinutes <= 0) return 0;
    const words = entries.length / 5; // Standard word count logic
    return Math.round(words / timeInMinutes);
  };

  const avgInterval = entries.length > 0 
    ? Math.round(entries.reduce((acc, curr) => acc + curr.interval, 0) / entries.length) 
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter flex items-center gap-2">
              KRONOS <span className="text-cyan-500 text-sm font-mono tracking-widest bg-cyan-950 px-2 py-0.5 rounded">v2.4.0</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">Neural Interface & Key Pattern Acquisition System</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              isRecording 
              ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
              : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isRecording ? 'PAUSE CAPTURE' : 'RESUME CAPTURE'}
          </button>
          <button 
            onClick={downloadLogs}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" />
            EXPORT .TXT
          </button>
          <button 
            onClick={clearLogs}
            className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-700 hover:text-red-400 hover:border-red-400 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Metrics & Analysis */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              label="TOTAL KEYS" 
              value={entries.length.toLocaleString()} 
              icon={<Keyboard className="w-5 h-5 text-cyan-400" />} 
            />
            <StatCard 
              label="WPM" 
              value={calculateWPM()} 
              icon={<Zap className="w-5 h-5 text-yellow-400" />} 
            />
            <StatCard 
              label="AVG DELTA" 
              value={`${avgInterval}ms`} 
              icon={<Clock className="w-5 h-5 text-purple-400" />} 
            />
            <StatCard 
              label="SESSIONS" 
              value="ACTIVE" 
              icon={<Activity className="w-5 h-5 text-green-400" />} 
            />
          </div>

          {/* AI Analysis Panel */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"></div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                NEURAL ANALYSIS
              </h2>
              <button 
                onClick={runAnalysis}
                disabled={entries.length < 5 || isAnalyzing}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white px-3 py-1 rounded-full font-bold transition-all"
              >
                {isAnalyzing ? 'PROCESS...' : 'RUN ANALYTICS'}
              </button>
            </div>

            <div className="flex-1 text-sm text-slate-300 leading-relaxed font-mono custom-scrollbar overflow-y-auto max-h-[300px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-cyan-500 font-bold animate-pulse">DECODING PATTERNS...</p>
                </div>
              ) : analysis ? (
                <div className="whitespace-pre-wrap">{analysis}</div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center h-32 text-center">
                  <BrainCircuit className="w-12 h-12 mb-2 opacity-20" />
                  Capture at least 5 keys to initialize pattern analysis.
                </div>
              )}
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex gap-4 items-start">
            <ShieldAlert className="w-6 h-6 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Web Environment Limitation</p>
              <p className="text-[11px] text-slate-400">
                Browsers restrict global keylogging for security. KRONOS captures activity <strong>only</strong> while this tab is focused. System-wide capture requires administrative OS-level access.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Stream */}
        <div className="lg:col-span-8 bg-black/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Live Activity Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="text-[10px] text-slate-500 font-bold">{entries.length} EVENTS LOADED</span>
            </div>
          </div>

          <div 
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
          >
            {entries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                <Keyboard className="w-16 h-16 mb-4" />
                <p className="text-xl font-bold italic">Awaiting Keyboard Input...</p>
                <p className="text-xs">Type anywhere in this window to begin capture.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 group hover:bg-slate-800/30 p-1 rounded transition-colors">
                    <span className="col-span-3 text-slate-500 text-[10px] self-center">
                      {/* FIX: Cast options object to any to allow fractionalSecondDigits without TS errors in environments with older Intl definitions */}
                      [{new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any)}]
                    </span>
                    <span className="col-span-2 text-cyan-500 font-bold">
                      {entry.key === ' ' ? 'SPACE' : entry.key}
                    </span>
                    <span className="col-span-3 text-slate-400 text-xs">
                      {entry.code}
                    </span>
                    <span className="col-span-2 text-purple-400 text-xs text-right">
                      +{entry.interval}ms
                    </span>
                    <span className={`col-span-2 text-[10px] text-center rounded px-1 self-center ${
                      entry.type === 'alpha' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      entry.type === 'numeric' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      entry.type === 'command' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {entry.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6 border-t border-slate-800 text-center flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">
        <span>Project KRONOS &copy; 2025 Codename: Codex</span>
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-3 h-3" />
          Authorized Research Protocol 44-X9
        </span>
      </footer>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition-all group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{label}</span>
      <div className="opacity-50 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
    </div>
    <div className="text-xl font-bold mono text-slate-100">{value}</div>
  </div>
);

export default App;
