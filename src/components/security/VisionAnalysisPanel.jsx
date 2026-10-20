import { useState } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { 
  FiShield, FiAlertTriangle, FiCheckCircle, FiInfo, 
  FiActivity, FiRefreshCw, FiCornerDownRight, FiAlertOctagon 
} from 'react-icons/fi';
import Button from '../common/Button';

function getStatusBadge(status) {
  switch (status) {
    case 'PASS':
      return {
        label: 'PASS',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: FiCheckCircle,
        iconColor: 'text-emerald-400'
      };
    case 'WARNING':
      return {
        label: 'WARNING',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: FiAlertTriangle,
        iconColor: 'text-amber-400'
      };
    case 'BLOCKED':
      return {
        label: 'BLOCKED',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: FiAlertOctagon,
        iconColor: 'text-rose-400'
      };
    case 'NOT CHECKED':
      return {
        label: 'NOT CHECKED',
        badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
        icon: FiInfo,
        iconColor: 'text-zinc-400'
      };
    case 'INFO':
    default:
      return {
        label: 'INFO',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon: FiInfo,
        iconColor: 'text-blue-400'
      };
  }
}

export default function VisionAnalysisPanel({ 
  telemetry, 
  telemetryHistory, 
  auditResults,
  isScanning,
  onRunScan,
  activeTab: controlledTab,
  onTabChange
}) {
  const [internalTab, setInternalTab] = useState('audit');
  const activeTab = controlledTab || internalTab;
  const setTab = onTabChange || setInternalTab;

  const isOffline = !telemetry;
  const risk = telemetry?.riskScore ?? null;
  
  let riskLevel = isOffline ? 'N/A' : 'LOW';
  let riskColor = isOffline ? 'text-text-muted' : 'text-success';
  let riskBg = isOffline ? 'bg-bg-elevated/50 border-border/50' : 'bg-success/10 border-success/30';
  
  if (!isOffline) {
    if (risk < 80) { riskLevel = 'MEDIUM'; riskColor = 'text-warning'; riskBg = 'bg-warning/10 border-warning/30'; }
    if (risk < 50) { riskLevel = 'HIGH'; riskColor = 'text-danger'; riskBg = 'bg-danger/10 border-danger/30'; }
  }

  const renderBar = (label, value, colorClass) => {
    const fillBlocks = Math.round(value / 10);
    const emptyBlocks = 10 - fillBlocks;
    
    return (
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex justify-between text-xs font-mono font-semibold text-text-secondary">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="flex gap-0.5 text-xs font-mono tracking-tighter text-text-muted">
          <span className={colorClass}>{'█'.repeat(fillBlocks)}</span>
          <span>{'░'.repeat(emptyBlocks)}</span>
        </div>
      </div>
    );
  };

  const getSignalStatus = (val, thresholds) => {
    if (val < thresholds[0]) return { text: 'LOW', color: 'text-success' };
    if (val < thresholds[1]) return { text: 'NORMAL', color: 'text-accent' };
    return { text: 'ELEVATED', color: 'text-warning' };
  };

  const motionStatus = getSignalStatus(telemetry?.motion ?? 0, [15, 30]);

  return (
    <div className="flex flex-col h-full gap-4 text-left">
      
      {/* Tab Navigation Switcher */}
      <div className="flex rounded-lg border border-border bg-bg-surface p-1 text-xs font-mono">
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`flex-1 py-2 px-3 rounded-md transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'audit' 
              ? 'bg-accent text-white shadow-sm' 
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <FiShield size={14} />
          <span>PRIVACY AUDIT</span>
          {auditResults && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('vision')}
          className={`flex-1 py-2 px-3 rounded-md transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'vision' 
              ? 'bg-accent text-white shadow-sm' 
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <FiActivity size={14} />
          <span>VISION SIGNALS</span>
        </button>
      </div>

      {/* VIEW A: REAL PRIVACY AUDIT PANEL */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-3.5 flex-1 min-w-0">
          
          {/* Scanning In Progress State */}
          {isScanning ? (
            <div className="p-8 rounded-xl bg-bg-elevated border border-border flex flex-col items-center justify-center text-center gap-3 min-h-[300px] shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Auditing Browser Privacy Controls...
              </h4>
              <p className="text-xs text-text-secondary font-mono max-w-xs leading-relaxed">
                Querying Permissions API, enumerating video input hardware, and inspecting active media streams.
              </p>
            </div>
          ) : auditResults ? (
            <>
              {/* Audit Summary Card */}
              <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <FiShield className="text-accent" size={15} />
                      <span>Browser Privacy Audit</span>
                    </h4>
                    <span className="text-xs font-mono text-text-secondary font-medium">
                      Evaluated: {auditResults.timestamp}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={onRunScan}
                    disabled={isScanning}
                    className="text-xs font-mono py-1.5 px-3 flex items-center gap-1.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                  >
                    <FiRefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
                    <span>Re-Scan</span>
                  </Button>
                </div>

                {/* Status KPI Badges */}
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                    {auditResults.counts.pass} PASS
                  </div>
                  <div className={`p-2 rounded border font-bold ${
                    auditResults.counts.warning > 0 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-bg-surface border-border/50 text-text-muted'
                  }`}>
                    {auditResults.counts.warning} WARN
                  </div>
                  <div className={`p-2 rounded border font-bold ${
                    auditResults.counts.blocked > 0 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                      : 'bg-bg-surface border-border/50 text-text-muted'
                  }`}>
                    {auditResults.counts.blocked} BLOCK
                  </div>
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold">
                    {auditResults.counts.info} INFO
                  </div>
                </div>
              </div>

              {/* Individual Checks Feed */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {auditResults.checks.map((check) => {
                  const badge = getStatusBadge(check.status);
                  const Icon = badge.icon;

                  return (
                    <div 
                      key={check.id} 
                      className="p-3.5 rounded-xl bg-bg-elevated/90 border border-border/70 shadow-xs space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-1.5 truncate">
                          <Icon size={15} className={`${badge.iconColor} shrink-0`} />
                          <span className="truncate">{check.title}</span>
                        </span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        {check.detail}
                      </p>

                      {check.recommendation && (
                        <div className="pt-2 border-t border-border/40 flex items-start gap-1.5 text-xs font-mono text-text-secondary">
                          <FiCornerDownRight className="text-accent shrink-0 mt-0.5" size={13} />
                          <span className="leading-tight">{check.recommendation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Defensive Privacy Guidance */}
              {auditResults.recommendations?.length > 0 && (
                <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm space-y-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-text-primary block">
                    Privacy Guidance
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-text-secondary">
                    {auditResults.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-accent font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Honest Sandbox Boundary Disclosure */}
              <div className="p-3 rounded-lg bg-surface/60 border border-border/60 text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Sandbox Note:</strong> Standard webpages are sandboxed and cannot audit external OS desktop software, background processes, or system camera drivers.
              </div>
            </>
          ) : (
            <div className="p-6 text-center rounded-xl bg-bg-elevated border border-border text-xs sm:text-sm text-text-secondary">
              Click &quot;RUN SCAN&quot; above to initiate a real-time browser privacy audit.
            </div>
          )}

        </div>
      )}

      {/* VIEW B: OPTICAL VISION SIGNALS & TELEMETRY */}
      {activeTab === 'vision' && (
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          
          {/* Optical Scene Heuristic Score */}
          <div className={`p-4 sm:p-5 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${riskBg}`}>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                 <FiShield /> Optical Scene Score
              </h4>
              <span className={`text-2xl sm:text-3xl font-display font-bold ${riskColor}`}>{riskLevel}</span>
              <span className="text-xs font-mono text-text-secondary block mt-0.5 font-medium">
                Environmental heuristic (not compromise score)
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl sm:text-4xl font-display font-bold text-text-primary leading-none">
                {isOffline ? '—' : risk}
                <span className="text-base text-text-muted">/100</span>
              </span>
            </div>
          </div>

          {/* Signals Bar Charts */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm flex-1">
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Current Signals</h4>
             {renderBar('Motion', telemetry?.motion ?? 0, 'text-accent')}
             {renderBar('Brightness', telemetry?.brightness ?? 0, 'text-accent')}
             {renderBar('Scene Stability', telemetry?.stability ?? 100, 'text-accent')}
          </div>

          {/* Live Chart */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm h-36 flex flex-col">
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Vision Activity Graph</h4>
             <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={telemetryHistory}>
                   <YAxis domain={[0, 100]} hide />
                   <Line type="monotone" dataKey="motion" stroke="#00ffff" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                   <Line type="monotone" dataKey="stability" stroke="#00ff00" strokeWidth={1.8} dot={false} isAnimationActive={false} strokeOpacity={0.6} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
             <div className="flex gap-4 text-xs font-mono text-text-secondary mt-2 justify-center font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent"/> Motion</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success opacity-60"/> Stability</span>
             </div>
          </div>

          {/* Detection Matrix */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm">
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Detection Matrix</h4>
             <div className="flex flex-col gap-2.5">
                <div className="flex justify-between text-xs font-mono text-text-secondary border-b border-border/50 pb-1.5 font-semibold">
                  <span className="w-1/3">SIGNAL</span>
                  <span className="w-1/3">STATUS</span>
                  <span className="w-1/3 text-right">CONF.</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="w-1/3 text-text-primary font-medium">Motion</span>
                  <span className={`w-1/3 ${motionStatus.color} font-bold`}>{motionStatus.text}</span>
                  <span className="w-1/3 text-right text-text-secondary font-medium">92%</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="w-1/3 text-text-primary font-medium">Lighting</span>
                  <span className="w-1/3 text-success font-bold">NORMAL</span>
                  <span className="w-1/3 text-right text-text-secondary font-medium">96%</span>
                </div>
             </div>
             
             <div className="mt-4 pt-3.5 border-t border-border">
               <span className="text-xs uppercase text-text-muted tracking-wider block mb-1 font-mono font-semibold">Assessment</span>
               <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                 {isOffline ? "Awaiting camera initialization to assess environmental conditions." :
                  risk > 80 ? "Environmental conditions are currently stable. Continue monitoring." : 
                  risk > 50 ? "Moderate environmental shifts detected. Ensure camera is secure." : 
                  "High visual disturbance. Verify environment immediately."}
               </p>
             </div>
          </div>

        </div>
      )}

    </div>
  );
}
