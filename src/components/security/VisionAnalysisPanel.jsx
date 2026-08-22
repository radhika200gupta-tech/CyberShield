import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { FiShield, FiAlertTriangle } from 'react-icons/fi';

export default function VisionAnalysisPanel({ telemetry, telemetryHistory }) {
  const risk = telemetry?.riskScore ?? 100;
  
  let riskLevel = 'LOW';
  let riskColor = 'text-success';
  let riskBg = 'bg-success/10 border-success/30';
  
  if (risk < 80) { riskLevel = 'MEDIUM'; riskColor = 'text-warning'; riskBg = 'bg-warning/10 border-warning/30'; }
  if (risk < 50) { riskLevel = 'HIGH'; riskColor = 'text-danger'; riskBg = 'bg-danger/10 border-danger/30'; }

  const renderBar = (label, value, colorClass) => {
    const fillBlocks = Math.round(value / 10);
    const emptyBlocks = 10 - fillBlocks;
    
    return (
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex justify-between text-[10px] font-mono font-semibold text-text-secondary">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="flex gap-0.5 text-[8px] font-mono tracking-tighter text-text-muted">
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
    <div className="flex flex-col h-full gap-4">
      
      {/* Risk Score */}
      <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${riskBg}`}>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
             <FiShield /> Security Risk
          </h4>
          <span className={`text-2xl font-display font-bold ${riskColor}`}>{riskLevel}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-display font-bold text-text-primary leading-none">{risk}<span className="text-sm text-text-muted">/100</span></span>
        </div>
      </div>

      {/* Signals Bar Charts */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm flex-1">
         <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-4">Current Signals</h4>
         {renderBar('Motion', telemetry?.motion ?? 0, 'text-accent')}
         {renderBar('Brightness', telemetry?.brightness ?? 0, 'text-accent')}
         {renderBar('Scene Stability', telemetry?.stability ?? 100, 'text-accent')}
      </div>

      {/* Live Chart */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm h-32 flex flex-col">
         <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Vision Activity Graph</h4>
         <div className="flex-1 w-full relative">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={telemetryHistory}>
               <YAxis domain={[0, 100]} hide />
               <Line type="monotone" dataKey="motion" stroke="#00ffff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
               <Line type="monotone" dataKey="stability" stroke="#00ff00" strokeWidth={1.5} dot={false} isAnimationActive={false} strokeOpacity={0.5} />
             </LineChart>
           </ResponsiveContainer>
         </div>
         <div className="flex gap-3 text-[8px] font-mono text-text-muted mt-2 justify-center">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent"/> Motion</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success opacity-50"/> Stability</span>
         </div>
      </div>

      {/* Detection Matrix */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm">
         <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">Detection Matrix</h4>
         <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-mono text-text-secondary border-b border-border/50 pb-1">
              <span className="w-1/3">SIGNAL</span>
              <span className="w-1/3">STATUS</span>
              <span className="w-1/3 text-right">CONF.</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="w-1/3 text-text-primary">Motion</span>
              <span className={`w-1/3 ${motionStatus.color} font-bold`}>{motionStatus.text}</span>
              <span className="w-1/3 text-right text-text-secondary">92%</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="w-1/3 text-text-primary">Lighting</span>
              <span className="w-1/3 text-success font-bold">NORMAL</span>
              <span className="w-1/3 text-right text-text-secondary">96%</span>
            </div>
         </div>
         
         <div className="mt-4 pt-4 border-t border-border">
           <span className="text-[9px] uppercase text-text-muted tracking-wider block mb-1">Assessment</span>
           <p className="text-[11px] text-text-secondary leading-relaxed">
             {risk > 80 ? "Environmental conditions are currently stable. Continue monitoring." : 
              risk > 50 ? "Moderate environmental shifts detected. Ensure camera is secure." : 
              "High visual disturbance. Verify environment immediately."}
           </p>
         </div>
      </div>

    </div>
  );
}
