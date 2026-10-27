import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
  FiCpu, FiShield, FiTarget, FiLayers, FiTerminal, FiActivity, FiLock, FiInfo, FiMap, FiGlobe, 
  FiAlertTriangle, FiList, FiServer, FiMaximize2, FiX, FiFilter, FiCamera, FiVideo, FiCheckCircle, 
  FiEye, FiEyeOff, FiAlertCircle, FiClock, FiSettings, FiPlay, FiRefreshCw, FiChevronRight, FiBarChart2, FiArrowRight,
  FiCopy, FiCheck, FiDatabase, FiExternalLink, FiSearch, FiWifi, FiWifiOff, FiAlertOctagon, FiZap
} from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import WindowControls from '../../components/common/WindowControls';
import { WORLD_MAP_PATH } from '../../components/common/WorldMapData';
import WebcamSecurityLabPreview from './WebcamSecurityLabPreview';
import AICopilotChat from '../../components/security/AICopilotChat';
import ThreatIntelligenceDashboard from '../../components/security/threat-intel/ThreatIntelligenceDashboard';
import { fetchThreatIntelligenceFeed } from '../../services/threatIntelService';
import { setTransferredThreat } from '../../services/imageHandoffService';

function AICopilotPreview() {
  return <AICopilotChat />;
}

import LiveThreatMap from '../../components/security/threat-map/LiveThreatMap';

// ============================================================================
// REVERSIBLE FEATURE CONFIGURATION
// To restore Real-Time Threat Intelligence or Live Cyber Threat Map on the
// live website, set the respective constant below to true.
// ============================================================================
export const ENABLE_THREAT_INTEL = false;
export const ENABLE_THREAT_MAP = false;

export function LiveThreatMapPreview({ isCompact = false }) {
  if (!ENABLE_THREAT_MAP) return null;
  return <LiveThreatMap isCompact={isCompact} />;
}


export default function ComingSoonFeature(props) {
  const location = useLocation();
  const isCopilot = location.pathname.includes('ai-copilot');
  const isThreatMap = location.pathname.includes('threat-map');
  const isWebcamLab = location.pathname.includes('webcam-security');
  const isThreatIntel = location.pathname.includes('threat-intel');

  if (isThreatIntel) {
    if (!ENABLE_THREAT_INTEL) {
      return <Navigate to={ROUTES.HOME} replace />;
    }
    return (
      <div className="w-full min-w-0 animate-fade-in pb-8">
        <ThreatIntelligenceDashboard />
      </div>
    );
  }

  if (isCopilot) {
    return (
      <div className="w-full h-full min-w-0 flex-1 flex flex-col animate-fade-in">
        <AICopilotChat />
      </div>
    );
  }

  if (isThreatMap) {
    if (!ENABLE_THREAT_MAP) {
      return <Navigate to={ROUTES.HOME} replace />;
    }
    return (
      <div className="w-full min-w-0 animate-fade-in pb-8">
        <LiveThreatMapPreview isCompact={false} />
      </div>
    );
  }

  const title = isWebcamLab ? "Webcam Security Lab" : (isThreatMap ? "Live Cyber Threat Map" : (isCopilot ? "AI Security Copilot" : (props.title || "Advanced Threat Intelligence")));
  const subtitle = isWebcamLab ? "Simulated environment to audit browser camera security and privacy risks." : (isThreatMap ? "Real-time global visualization of simulated security events and attack vectors." : (isCopilot ? "Intelligent security guidance for suspicious URLs, messages and threats." : (props.subtitle || "Next-generation security capability")));
  const description = isWebcamLab ? "Experience our frontend-only demonstration of the upcoming Webcam Security Lab. Test mock camera permissions and learn about browser privacy controls." : (isThreatMap ? "Monitor global security activity through our frontend demonstration of the upcoming live threat intelligence visualization." : (isCopilot ? "Interactive demonstration of CyberShield's AI Security Copilot. Evaluate suspicious messages, troubleshoot email authentication (SPF/DKIM/DMARC), review incident response playbooks, and generate executive forensic summaries in simulated Demo Mode." : (props.description || "A powerful upcoming module designed to proactively analyze, detect, and mitigate complex security threats using heuristic models and behavioral analysis.")));
  const Icon = isWebcamLab ? FiCamera : (isThreatMap ? FiMap : (isCopilot ? FiTerminal : (props.icon || FiCpu)));
  const category = isWebcamLab ? "Privacy Lab" : (isThreatMap ? "Global Intel" : (isCopilot ? "Security Copilot" : (props.category || "Security Module")));
  
  const features = isWebcamLab ? [
    { icon: FiEyeOff, title: "Privacy Controls", description: "Audit browser-level camera permissions and access states." },
    { icon: FiAlertCircle, title: "Threat Scenarios", description: "Learn how malicious websites can exploit camera access." },
    { icon: FiActivity, title: "Live Simulation", description: "Experience interactive simulated permission tests." }
  ] : (isThreatMap ? [
    { icon: FiGlobe, title: "Global Visibility", description: "Monitor simulated threat origins and targets across major global regions." },
    { icon: FiActivity, title: "Live Event Feed", description: "Track mock security events as they are generated by the local engine." },
    { icon: FiTarget, title: "Attack Vectors", description: "Visualize potential attack paths with dynamic animated routing." }
  ] : (isCopilot ? [
    { icon: FiTerminal, title: "Contextual Analysis", description: "Evaluates the surrounding context of suspicious messages." },
    { icon: FiShield, title: "Pattern Recognition", description: "Detects structural anomalies commonly found in phishing." },
    { icon: FiCpu, title: "Local Heuristics", description: "Provides instant feedback using deterministic local rules." }
  ] : (props.features || [
    { icon: FiShield, title: "Proactive Defense", description: "Identifies potential attack vectors before they can be exploited." },
    { icon: FiTarget, title: "Behavioral Analytics", description: "Monitors unusual patterns to detect zero-day vulnerabilities." },
    { icon: FiLayers, title: "Deep Integration", description: "Seamlessly connects with existing security information management." }
  ])));
  
  const previewContent = isWebcamLab ? <WebcamSecurityLabPreview /> : (isThreatMap ? <LiveThreatMapPreview /> : (isCopilot ? <AICopilotPreview /> : (props.previewContent || null)));

  return (
    <div className="space-y-12 animate-fade-in pb-12 max-w-5xl mx-auto relative w-full min-w-0">
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden flex justify-center">
         <div className="absolute top-[5%] w-[600px] h-[400px] bg-primary/5 blur-[140px] rounded-full" />
      </div>

      <div className="flex flex-col items-start gap-4 relative z-10 w-full min-w-0">
        <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="inline-flex items-center gap-2 border border-border bg-surface glass rounded-full pl-1.5 pr-3.5 py-1.5 mb-2 shadow-sm">
           <span className="bg-primary/20 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
             {category}
           </span>
        </motion.div>
        
        <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="w-full min-w-0">
          <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-5 flex flex-wrap sm:flex-nowrap items-center gap-4 tracking-tight break-words">
             <div className="p-2.5 rounded-xl bg-bg-elevated border border-border shadow-sm shrink-0">
               <Icon className="text-accent" size={28} />
             </div>
             <span className="min-w-0 flex-1 break-words">{title}</span>
          </h1>
          <h2 className="text-xl text-text-primary font-medium mb-3 tracking-tight break-words">
            {subtitle}
          </h2>
          <p className="text-text-secondary text-base max-w-3xl leading-relaxed break-words">
            {description}
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 w-full min-w-0"
      >
        <Card className="overflow-hidden border-border bg-surface glass p-0 shadow-2xl relative w-full min-w-0">
           <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-bg-elevated/50 relative z-20">
              <div className="flex items-center gap-3">
                 <WindowControls />
                 <div className="h-4 w-px bg-border mx-1" />
                 <span className="text-xs text-text-primary font-medium flex items-center gap-2">
                   {isCopilot ? <FiCpu size={14} className="text-accent" /> : <FiActivity size={14} className="text-accent" />}
                   {isCopilot ? "COPILOT SEC-OPS TERMINAL" : "SEC-OPS TERMINAL"}
                 </span>
              </div>
              {isCopilot && (
                 <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase font-semibold shadow-xs">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> SIMULATED DEMO
                 </span>
              )}
              {isThreatMap && (
                 <span className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded border border-border uppercase shadow-sm">
                   <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE MONITORING
                 </span>
              )}
           </div>
           
           {previewContent ? (
             previewContent
           ) : (
             <div className="p-8 sm:p-12 md:p-20 flex flex-col items-center justify-center text-center min-h-[350px] sm:min-h-[400px] bg-surface/50 w-full min-w-0">
               <motion.div 
                 className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-6 shadow-lg shrink-0"
                 animate={{ y: [0, -8, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               >
                  <Icon size={32} className="text-accent" />
               </motion.div>
               
               <h3 className="text-xl font-display font-semibold text-text-primary mb-3 tracking-tight break-words max-w-full">
                  Experience the future of {title.toLowerCase()}
               </h3>
               <p className="text-sm text-text-secondary max-w-md leading-relaxed break-words">
                  This capability is currently in development. The frontend operations shell is standing by for logic integration.
               </p>
             </div>
           )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10 w-full min-w-0">
         {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.3 }}
              className="min-w-0 w-full flex flex-col"
            >
              <Card className="p-5 sm:p-6 h-full border-border bg-surface glass hover:border-accent/40 transition-colors duration-300 shadow-lg min-w-0 flex flex-col justify-start">
                 <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center mb-4 shadow-sm shrink-0">
                    <feature.icon className="text-accent" size={20} />
                 </div>
                 <h4 className="text-base font-semibold text-text-primary mb-2 tracking-tight break-words">
                    {feature.title}
                 </h4>
                 <p className="text-sm text-text-secondary leading-relaxed break-words">
                    {feature.description}
                 </p>
              </Card>
            </motion.div>
         ))}
      </div>
    </div>
  );
}
