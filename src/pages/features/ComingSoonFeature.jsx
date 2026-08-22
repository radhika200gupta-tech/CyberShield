import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
  FiCpu, FiShield, FiTarget, FiLayers, FiTerminal, FiActivity, FiLock, FiInfo, FiMap, FiGlobe, 
  FiAlertTriangle, FiList, FiServer, FiMaximize2, FiX, FiFilter, FiCamera, FiVideo, FiCheckCircle, 
  FiEye, FiEyeOff, FiAlertCircle, FiClock, FiSettings, FiPlay, FiRefreshCw, FiChevronRight, FiBarChart2
} from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import WindowControls from '../../components/common/WindowControls';
import { WORLD_MAP_PATH } from '../../components/common/WorldMapData';
import WebcamSecurityLabPreview from './WebcamSecurityLabPreview';

function AICopilotPreview() {
  const [input, setInput] = useState('');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);

  const analyze = () => {
    if (!input.trim()) return;
    setState('analyzing');
    setTimeout(() => {
      const lower = input.toLowerCase();
      const isSuspicious = ['verify', 'urgent', 'account', 'password', 'login', 'http', 'www'].some(k => lower.includes(k));
      if (isSuspicious) {
         setResult({
           level: 'HIGH RISK',
           score: 82,
           reasons: ['Urgency language detected', 'Credential-related request detected', 'Suspicious verification pattern detected'],
           recommendation: 'Do not interact with the message or provide credentials. Verify through an official channel.',
           color: 'text-danger'
         });
      } else {
         setResult({
           level: 'NEUTRAL',
           score: 12,
           reasons: ['No typical phishing keywords found', 'Message appears routine'],
           recommendation: 'Proceed with normal caution. Always remain vigilant.',
           color: 'text-success'
         });
      }
      setState('result');
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      analyze();
    }
  };

  const setExample = (text) => {
    setInput(text);
    setState('idle');
  };

  return (
    <div className="flex flex-col text-left w-full h-full bg-surface/50 rounded-card relative overflow-hidden">
       <div className="p-6 sm:p-8 flex-1 flex flex-col min-h-[350px]">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
               <motion.div 
                 key="idle"
                 initial={{opacity: 0, y: 12}} 
                 animate={{opacity: 1, y: 0}} 
                 exit={{opacity: 0, y: -12}}
                 className="flex-1 flex flex-col justify-center"
               >
                  <div className="mb-6 p-5 rounded-xl border border-border bg-bg-elevated/80 flex flex-col sm:flex-row gap-4 shadow-sm">
                     <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                       <FiCpu className="text-accent" size={20} />
                     </div>
                     <div>
                       <h3 className="text-base font-semibold text-text-primary mb-1 tracking-tight">Ask CyberShield about a security concern.</h3>
                       <p className="text-sm text-text-secondary leading-relaxed mb-4">
                         Paste a suspicious URL, email message, or describe a security scenario. The Demo Intelligence Engine will evaluate the context and provide guidance.
                       </p>
                       <div className="flex flex-wrap gap-2 mt-2">
                          {["Is this login message suspicious?", "Why should I verify a URL before opening it?", "Analyze this password reset message"].map(ex => (
                            <button key={ex} onClick={() => setExample(ex)} className="text-xs px-3 py-1.5 bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors text-left shadow-sm">
                              {ex}
                            </button>
                          ))}
                       </div>
                     </div>
                  </div>
               </motion.div>
            )}

            {state === 'analyzing' && (
               <motion.div 
                 key="analyzing"
                 initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} 
                 className="flex-1 flex flex-col items-center justify-center py-12 relative w-full"
               >
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-t-xl z-0">
                    <motion.div 
                      className="absolute w-full h-[2px] bg-accent/40 shadow-[0_0_12px_rgba(0,255,255,0.3)]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="absolute w-full h-32 bg-gradient-to-b from-transparent to-accent/5"
                      animate={{ top: ['-128px', '100%', '-128px'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-5 relative shadow-md z-10">
                    <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-accent/0 via-accent/5 to-accent/0 animate-scan rounded-2xl" />
                    <FiActivity size={28} className="text-accent animate-pulse relative z-10" />
                  </div>
                  <h3 className="text-lg font-display font-medium text-text-primary mb-2 tracking-tight relative z-10">Analyzing Threat Context...</h3>
                  <p className="text-sm text-text-muted font-mono relative z-10">Demo heuristic analysis in progress</p>
               </motion.div>
            )}

            {state === 'result' && result && (
               <motion.div 
                 key="result"
                 initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} 
                 className="flex-1 flex flex-col relative z-10"
               >
                  <div className="flex justify-between items-center mb-5 border-b border-border pb-3">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <FiTarget className="text-accent" /> Threat Assessment
                    </h3>
                    <span className="text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded border border-border uppercase shadow-sm">Analysis Complete</span>
                  </div>
                  
                  <div className="p-5 rounded-xl border border-border bg-bg-elevated/80 mb-5 flex items-center gap-6 shadow-sm">
                     <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 relative">
                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                         <motion.circle 
                           initial={{ strokeDasharray: "0 276" }}
                           animate={{ strokeDasharray: `${(result.score / 100) * 276} 276` }}
                           transition={{ duration: 1.2, ease: "easeOut" }}
                           cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" 
                           strokeLinecap="round" 
                           className={result.color} 
                         />
                       </svg>
                       <span className={`text-2xl font-display font-bold ${result.color}`}>{result.score}</span>
                     </div>
                     <div>
                       <h2 className={`text-2xl font-display font-bold mb-1 tracking-tight ${result.color}`}>{result.level}</h2>
                       <p className="text-xs text-text-secondary font-mono">Deterministic Demo Heuristics</p>
                     </div>
                  </div>

                  <div className="space-y-4 bg-bg-elevated/80 p-5 rounded-xl border border-border shadow-sm">
                     <div>
                       <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3">Why this was flagged:</h4>
                       <ul className="space-y-2">
                         {result.reasons.map((r, i) => (
                           <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-accent mt-1">•</span> <span>{r}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                     <div className="pt-4 border-t border-border">
                       <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">Recommended action:</h4>
                       <p className="text-sm text-text-secondary">{result.recommendation}</p>
                     </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                     <Button variant="outline" onClick={() => { setInput(''); setState('idle'); setResult(null); }}>
                       Initialize New Scan
                     </Button>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>

       <div className="p-4 sm:p-6 border-t border-border bg-bg-elevated/90 flex flex-col gap-3 relative z-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
          <div className="relative">
             <div className="absolute top-3 left-3 text-text-muted">
               <FiTerminal size={16} />
             </div>
             <textarea 
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Enter target parameters for analysis..."
               className="w-full h-24 bg-surface border border-border rounded-lg py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none custom-scrollbar transition-colors shadow-inner"
               disabled={state === 'analyzing'}
               aria-label="Security Copilot Input"
             />
          </div>
          <div className="flex justify-between items-center px-1">
             <span className="text-xs text-text-muted hidden sm:flex items-center gap-2">
               Press <span className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono shadow-sm">Ctrl + Enter</span> to execute
             </span>
             <Button variant="primary" onClick={analyze} disabled={!input.trim() || state === 'analyzing'} className="ml-auto">
               Analyze Target
             </Button>
          </div>
       </div>
    </div>
  );
}

function LiveThreatMapPreview() {
  const [threats, setThreats] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [investigationState, setInvestigationState] = useState('NONE'); // NONE, COMPACT, INVESTIGATING
  
  const [filters, setFilters] = useState({
     type: 'ALL',
     severity: 'ALL',
     time: '24H'
  });
  const [focusRegion, setFocusRegion] = useState(null);

  const regions = [
    { id: 'na', name: 'North America', cx: 160, cy: 120 },
    { id: 'sa', name: 'South America', cx: 230, cy: 260 },
    { id: 'eu', name: 'Europe', cx: 390, cy: 110 },
    { id: 'af', name: 'Africa', cx: 410, cy: 210 },
    { id: 'as', name: 'Asia', cx: 580, cy: 120 },
    { id: 'me', name: 'Middle East', cx: 460, cy: 150 },
    { id: 'oc', name: 'Oceania', cx: 660, cy: 280 },
  ];

  const paths = [
    { id: 'p1', source: 'as', target: 'na' },
    { id: 'p2', source: 'eu', target: 'na' },
    { id: 'p3', source: 'sa', target: 'na' },
    { id: 'p4', source: 'as', target: 'eu' },
    { id: 'p5', source: 'me', target: 'eu' },
    { id: 'p6', source: 'af', target: 'eu' },
    { id: 'p7', source: 'eu', target: 'me' },
  ];

  const eventTypes = [
     "Suspicious traffic detected", 
     "Credential attack pattern", 
     "Malicious URL activity", 
     "Phishing campaign indicator", 
     "Automated scan activity", 
     "DDoS mitigation active",
     "Malware payload delivery"
  ];
  const severities = ["Critical", "High", "Medium", "Low"];

  const generateMockThreat = (id, overrideTimestamp = null) => {
     const r = regions[Math.floor(Math.random() * regions.length)];
     const targets = regions.filter(x => x.id !== r.id);
     const target = targets[Math.floor(Math.random() * targets.length)];
     const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
     const severity = severities[Math.floor(Math.random() * severities.length)];
     
     const pathMatch = paths.find(p => (p.source === r.id && p.target === target.id) || (p.source === target.id && p.target === r.id));
     const timestamp = overrideTimestamp || Date.now();
     
     return {
        id,
        nodeId: r.id,
        pathId: pathMatch ? pathMatch.id : null,
        origin: r.name,
        target: target.name,
        type,
        severity,
        status: 'ACTIVE',
        timestamp,
        detectedAt: new Date(timestamp).toLocaleTimeString([], { hour12: false }),
        confidence: Math.floor(Math.random() * 15) + 85 + '%',
        indicators: [
            'Abnormal request frequency',
            type.toLowerCase().includes('credential') ? 'Multiple failed authentication attempts' : 'Suspicious payload signature',
            'Irregular geographic origin'
        ],
        recommendation: type.toLowerCase().includes('credential') ? 'Review authentication activity and monitor affected region.' : 'Monitor inbound traffic and prepare blocklist.',
        cx: r.cx,
        cy: r.cy
     };
  };

  useEffect(() => {
    const now = Date.now();
    const initialThreats = Array.from({length: 40}).map((_, i) => {
       const randomOffset = Math.random() * 604800000; // up to 7 days
       return generateMockThreat(`thr-init-${i}`, now - randomOffset);
    });
    initialThreats.sort((a,b) => b.timestamp - a.timestamp);
    setThreats(initialThreats);
    
    setTimelineEvents(initialThreats.slice(0, 30).map(t => ({
      id: `evt-${t.id}-init`,
      time: t.detectedAt,
      action: 'DETECTED',
      threatType: t.type,
      origin: t.origin,
      severity: t.severity,
      timestamp: t.timestamp
    })));

    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
         const newThreat = generateMockThreat(`thr-${Date.now()}`);
         setThreats(prev => [newThreat, ...prev].slice(0, 200));
         setTimelineEvents(prev => [{
            id: `evt-${newThreat.id}-det`,
            time: newThreat.detectedAt,
            action: 'DETECTED',
            threatType: newThreat.type,
            origin: newThreat.origin,
            severity: newThreat.severity,
            timestamp: newThreat.timestamp
         }, ...prev].slice(0, 100));
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleNodeClick = (r) => {
     let threat = threats.find(t => t.nodeId === r.id && (t.status === 'ACTIVE' || t.status === 'UNDER REVIEW'));
     if (!threat) {
        threat = generateMockThreat(`thr-${Date.now()}`);
        threat.origin = r.name;
        threat.nodeId = r.id;
        threat.cx = r.cx;
        threat.cy = r.cy;
        setThreats(prev => [threat, ...prev].slice(0, 200));
        setTimelineEvents(prev => [{
            id: `evt-${threat.id}-det`,
            time: threat.detectedAt,
            action: 'DETECTED',
            threatType: threat.type,
            origin: threat.origin,
            severity: threat.severity,
            timestamp: threat.timestamp
         }, ...prev].slice(0, 100));
     }
     setSelectedThreat(threat);
     setInvestigationState(threat.status === 'UNDER REVIEW' ? 'INVESTIGATING' : 'COMPACT');
  };

  const updateThreatStatus = (newStatus) => {
      if (!selectedThreat) return;
      
      const threatId = selectedThreat.id;
      setThreats(prev => prev.map(t => t.id === threatId ? { ...t, status: newStatus } : t));
      
      if (newStatus === 'REVIEWED' || newStatus === 'DISMISSED') {
         setTimelineEvents(prev => [{
            id: `evt-${threatId}-${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour12: false }),
            action: newStatus,
            threatType: selectedThreat.type,
            origin: selectedThreat.origin,
            severity: selectedThreat.severity,
            timestamp: Date.now()
         }, ...prev].slice(0, 100));
         
         setSelectedThreat(null);
         setInvestigationState('NONE');
      } else if (newStatus === 'UNDER REVIEW') {
         setInvestigationState('INVESTIGATING');
         setSelectedThreat(prev => ({...prev, status: 'UNDER REVIEW'}));
      }
  };

  const closeInvestigation = () => {
      setSelectedThreat(null);
      setInvestigationState('NONE');
  };

  const getSeverityColor = (sev) => {
    switch(sev?.toUpperCase()) {
      case 'HIGH': return 'text-danger bg-danger/10 border-danger/20';
      case 'MEDIUM': return 'text-warning bg-warning/10 border-warning/20';
      case 'LOW': return 'text-success bg-success/10 border-success/20';
      default: return 'text-text-secondary';
    }
  };
  
  const getActionColor = (action, severity) => {
    switch(action) {
       case 'DETECTED': return getSeverityColor(severity);
       case 'REVIEWED': return 'text-accent bg-accent/10 border-accent/20';
       case 'DISMISSED': return 'text-text-muted bg-surface border-border/50';
       default: return 'text-text-secondary';
    }
  };

  const visibleThreats = threats.filter(t => {
      if (filters.type !== 'ALL') {
         const typeLower = t.type.toLowerCase();
         if (filters.type === 'PHISHING' && !typeLower.includes('phish') && !typeLower.includes('malicious url')) return false;
         if (filters.type === 'CREDENTIAL' && !typeLower.includes('credential')) return false;
         if (filters.type === 'MALWARE' && !typeLower.includes('malware')) return false;
         if (filters.type === 'SCANNING' && !typeLower.includes('scan')) return false;
      }
      if (filters.severity !== 'ALL' && t.severity.toUpperCase() !== filters.severity) return false;
      if (filters.time !== '7D') {
         const ageMs = Date.now() - t.timestamp;
         if (filters.time === '1H' && ageMs > 3600000) return false;
         if (filters.time === '6H' && ageMs > 21600000) return false;
         if (filters.time === '24H' && ageMs > 86400000) return false;
      }
      return true;
  });

  useEffect(() => {
     if (selectedThreat && !visibleThreats.some(t => t.id === selectedThreat.id)) {
        setSelectedThreat(null);
        setInvestigationState('NONE');
     }
  }, [filters, selectedThreat, visibleThreats]);

  const activeThreatsList = visibleThreats.filter(t => t.status === 'ACTIVE' || t.status === 'UNDER REVIEW');
  
  const activePaths = paths.map(p => {
     const associatedThreat = activeThreatsList.find(t => t.pathId === p.id);
     return {
        ...p,
        isActive: !!associatedThreat,
        severity: associatedThreat ? associatedThreat.severity : 'Low',
        isHighlighted: selectedThreat?.pathId === p.id
     };
  });

  const computedRegions = regions.map(r => {
      const activeForRegion = activeThreatsList.filter(t => t.nodeId === r.id);
      const hasHigh = activeForRegion.some(t => t.severity === 'High');
      const hasMed = activeForRegion.some(t => t.severity === 'Medium');
      const displaySeverity = hasHigh ? 'High' : hasMed ? 'Medium' : activeForRegion.length > 0 ? 'Low' : 'None';
      
      return {
          ...r,
          activeCount: activeForRegion.length,
          severity: displaySeverity,
          isHighlighted: selectedThreat?.nodeId === r.id
      };
  });

  const filteredTimeline = timelineEvents.filter(e => {
      if (filters.type !== 'ALL') {
         const typeLower = e.threatType.toLowerCase();
         if (filters.type === 'PHISHING' && !typeLower.includes('phish') && !typeLower.includes('malicious url')) return false;
         if (filters.type === 'CREDENTIAL' && !typeLower.includes('credential')) return false;
         if (filters.type === 'MALWARE' && !typeLower.includes('malware')) return false;
         if (filters.type === 'SCANNING' && !typeLower.includes('scan')) return false;
      }
      if (filters.severity !== 'ALL' && e.severity.toUpperCase() !== filters.severity) return false;
      if (filters.time !== '7D') {
         const ageMs = Date.now() - e.timestamp;
         if (filters.time === '1H' && ageMs > 3600000) return false;
         if (filters.time === '6H' && ageMs > 21600000) return false;
         if (filters.time === '24H' && ageMs > 86400000) return false;
      }
      if (focusRegion && e.origin !== focusRegion) return false;
      return true;
  });

  const stats = {
      monitored: 1284 + threats.length * 3,
      active: activeThreatsList.length,
      regions: computedRegions.filter(r => r.activeCount > 0).length,
      highSev: activeThreatsList.filter(t => t.severity === 'High' || t.severity === 'Critical').length
  };

  const activeFilterCount = (filters.type !== 'ALL' ? 1 : 0) + (filters.severity !== 'ALL' ? 1 : 0) + (filters.time !== '24H' ? 1 : 0);
  const resetFilters = () => setFilters({ type: 'ALL', severity: 'ALL', time: '24H' });

  return (
    <div className="flex flex-col w-full bg-surface/50 rounded-card relative overflow-hidden">
      {/* MAP HERO SECTION */}
      <div className="relative w-full h-[400px] sm:h-[500px] border-b border-border bg-[#050B14] overflow-hidden">
        
        {/* Horizontal Scan Line Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            className="absolute w-full h-[1px] bg-accent/40 shadow-[0_0_15px_rgba(0,255,255,0.4)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute w-full h-64 bg-gradient-to-b from-transparent via-accent/5 to-transparent"
            animate={{ top: ['-256px', '100%', '-256px'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Filters Overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 items-center bg-[#050B14]/80 p-2 rounded-xl border border-border/50 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 border-r border-border/50 pr-2">
                   <FiFilter className="text-text-muted" size={12} />
                   <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Type</span>
                   <select 
                     value={filters.type} 
                     onChange={e => setFilters({...filters, type: e.target.value})}
                     className="bg-surface text-[10px] font-mono text-text-primary border border-border/50 rounded px-2 py-1 focus:outline-none focus:border-accent"
                   >
                      <option value="ALL">ALL</option>
                      <option value="PHISHING">PHISHING</option>
                      <option value="CREDENTIAL">CREDENTIAL</option>
                      <option value="MALWARE">MALWARE</option>
                      <option value="SCANNING">SCANNING</option>
                   </select>
                </div>
                
                <div className="flex items-center gap-2 border-r border-border/50 pr-2">
                   <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Sev</span>
                   <select 
                     value={filters.severity} 
                     onChange={e => setFilters({...filters, severity: e.target.value})}
                     className="bg-surface text-[10px] font-mono text-text-primary border border-border/50 rounded px-2 py-1 focus:outline-none focus:border-accent"
                   >
                      <option value="ALL">ALL</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                   </select>
                </div>

                <div className="flex items-center gap-2 pr-2">
                   <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Time</span>
                   <div className="flex bg-surface rounded border border-border/50 overflow-hidden">
                      {['1H', '6H', '24H', '7D'].map(t => (
                         <button 
                           key={t}
                           onClick={() => setFilters({...filters, time: t})}
                           className={`px-2 py-1 text-[10px] font-mono transition-colors ${filters.time === t ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                         >
                           {t}
                         </button>
                      ))}
                   </div>
                </div>

                {activeFilterCount > 0 && (
                   <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] font-semibold text-danger hover:text-danger/80 transition-colors pl-2 border-l border-border/50 uppercase tracking-wider">
                     <FiX size={10} /> Reset ({activeFilterCount})
                   </button>
                )}
            </div>
            
            <AnimatePresence>
              {focusRegion && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full w-max backdrop-blur-md shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                 >
                   <span className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                      <FiMap size={10} /> FOCUS: {focusRegion}
                   </span>
                   <button onClick={() => setFocusRegion(null)} className="hover:text-white transition-colors">
                      <FiX size={12} />
                   </button>
                 </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Technical HUD Overlay (Decorative) */}
        <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none">
           <div className="text-[10px] font-mono text-accent/30 uppercase tracking-widest">Global Sec-Ops Grid</div>
           <div className="text-[10px] font-mono text-accent/20">CS-SYS_ID: 849.20.1 // NET: ACTIVE</div>
        </div>

          {/* SVG Hero Map */}
        <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-90 z-10">
          <defs>
             {/* Fine Grid Texture */}
             <pattern id="dotGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                 <circle cx="1" cy="1" r="0.5" className="text-accent/10" fill="currentColor" />
             </pattern>
             <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
             </linearGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#dotGrid)" />

          {/* Latitude/Longitude Technical Lines */}
          <g className="text-accent/10" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4">
             {[50, 100, 150, 200, 250, 300, 350].map(y => <line key={`lat-${y}`} x1="0" y1={y} x2="800" y2={y} />)}
             {[100, 200, 300, 400, 500, 600, 700].map(x => <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="400" />)}
          </g>

          {/* Central Security Core */}
          <g className="text-accent/20" stroke="currentColor" strokeWidth="1" fill="none">
             <circle cx="400" cy="200" r="140" strokeDasharray="2 6" className="text-accent/10" />
             <circle cx="400" cy="200" r="100" strokeDasharray="4 8" className="text-accent/20" />
             <circle cx="400" cy="200" r="60" strokeDasharray="8 8" className="text-accent/30">
                <animateTransform attributeName="transform" type="rotate" from="0 400 200" to="360 400 200" dur="40s" repeatCount="indefinite" />
             </circle>
             <circle cx="400" cy="200" r="30" strokeWidth="0.5" className="text-accent/40" />
             <path d="M390 190 L410 190 L400 210 Z" className="text-accent/50" fill="currentColor" opacity="0.5" />
             <text x="400" y="260" fontSize="8" className="font-mono text-accent/40 tracking-widest" textAnchor="middle">CORE ACTIVE</text>
          </g>

          {/* High Fidelity World Map Path */}
          <path d={WORLD_MAP_PATH} fill="rgba(5, 11, 20, 0.4)" stroke="currentColor" className="text-accent/30" strokeWidth="0.5" />

          {/* Animated Paths */}
          {activePaths.map((p, i) => {
            const src = regions.find(r => r.id === p.source);
            const tgt = regions.find(r => r.id === p.target);
            if(!src || !tgt) return null;
            
            const isFocused = !focusRegion || src.name === focusRegion || tgt.name === focusRegion;
            const opacityClass = isFocused ? 'opacity-100' : 'opacity-10';

            const midX = (src.cx + tgt.cx) / 2;
            const midY = Math.min(src.cy, tgt.cy) - 60; 
            const d = `M ${src.cx} ${src.cy} Q ${midX} ${midY} ${tgt.cx} ${tgt.cy}`;
            const isHigh = p.severity === 'High' || p.severity === 'Critical';

            return (
              <g key={p.id} className={`${opacityClass} transition-opacity duration-500`}>
                {/* Subtle base path */}
                <path d={d} fill="none" stroke="currentColor" className={isHigh ? "text-danger/30" : "text-accent/20"} strokeWidth={p.isHighlighted ? "1.5" : "1"} strokeDasharray="2 4" />
                {/* Animated active path line */}
                {p.isActive && (
                  <>
                    <motion.path 
                      d={d} fill="none" stroke="currentColor" className={isHigh ? "text-danger" : "text-accent"} strokeWidth={p.isHighlighted ? "2" : "1.5"}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, p.isHighlighted ? 0.8 : 0.4, 0] }}
                      transition={{ duration: 2 + (i % 3), repeat: Infinity, ease: "linear", repeatDelay: (i % 2) }}
                    />
                    <circle r={isHigh ? "3.5" : "2"} fill="currentColor" className={isHigh ? "text-danger drop-shadow-[0_0_6px_rgba(239,68,68,1)]" : "text-accent drop-shadow-[0_0_4px_rgba(0,255,255,0.8)]"}>
                       <animateMotion dur={`${2 + (i % 3)}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Threat Nodes */}
          {computedRegions.map(r => {
             const isHigh = r.severity === 'High' || r.severity === 'Critical';
             const isMed = r.severity === 'Medium';
             const isActive = r.activeCount > 0;
             const nodeColorClass = isHigh ? "text-danger" : isMed ? "text-warning" : isActive ? "text-success" : "text-accent";
             
             const isFocused = !focusRegion || r.name === focusRegion;
             const regionOpacityClass = isFocused ? 'opacity-100' : 'opacity-20';

             return (
               <g key={r.id} onClick={() => handleNodeClick(r)} className={`cursor-pointer group ${regionOpacityClass} transition-opacity duration-500`}>
                 {/* Large interaction area and subtle glow base */}
                 <circle cx={r.cx} cy={r.cy} r="24" fill="none" stroke="currentColor" className={`${nodeColorClass} ${r.isHighlighted ? 'opacity-40' : 'opacity-10 group-hover:opacity-30'} transition-opacity`} strokeWidth="0.5" />
                 
                 {/* Core Node Marker */}
                 <circle cx={r.cx} cy={r.cy} r="5" fill="currentColor" className={`${nodeColorClass} ${!isActive && 'opacity-30'}`} />
                 <circle cx={r.cx} cy={r.cy} r="2.5" fill="currentColor" className="text-[#050B14]" />
                 
                 {/* Active Pulse Ring */}
                 {isActive && (
                   <motion.circle 
                     cx={r.cx} cy={r.cy} r="5" fill="none" stroke="currentColor" className={nodeColorClass} strokeWidth="1"
                     animate={{ scale: [1, 3], opacity: [0.8, 0] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: r.activeCount % 2 }}
                   />
                 )}
                 
                 {/* Minimal text label */}
                 <text x={r.cx} y={r.cy + 16} fill="currentColor" className={`text-[8px] font-mono tracking-wider ${isHigh ? 'text-danger/80 font-bold' : 'text-text-muted/80'}`} textAnchor="middle">
                   {r.name}
                 </text>
                 <text x={r.cx + 8} y={r.cy - 6} fill="currentColor" className="text-[7px] text-accent/40 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                   [{r.cx.toFixed(0)}, {r.cy.toFixed(0)}]
                 </text>
               </g>
             );
          })}
        </svg>

        {/* Interactive Detail Overlay */}
        <AnimatePresence>
          {investigationState === 'COMPACT' && selectedThreat && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-4 left-4 w-72 bg-bg-elevated/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden z-20 flex flex-col"
            >
              <div className="bg-surface/50 px-4 py-3 border-b border-border flex justify-between items-center">
                <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2 tracking-wide uppercase">
                  <FiAlertTriangle className="text-accent" /> THREAT DETECTED
                </h4>
                <button onClick={closeInvestigation} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
              </div>
              
              <div className="p-4 flex flex-col gap-3">
                 <div>
                    <div className="text-sm font-semibold text-text-primary">{selectedThreat.type}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{selectedThreat.origin} &rarr; {selectedThreat.target}</div>
                 </div>
                 <div className="flex gap-4 mt-1">
                    <div>
                       <span className="block text-[9px] text-text-muted mb-0.5 uppercase tracking-wider">Severity</span>
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getSeverityColor(selectedThreat.severity)}`}>
                         {selectedThreat.severity}
                       </span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-0.5 uppercase tracking-wider">Status</span>
                       <span className="text-[10px] font-mono font-bold text-accent">{selectedThreat.status}</span>
                    </div>
                 </div>
                 <div className="mt-2 pt-3 border-t border-border">
                    <Button onClick={() => updateThreatStatus('UNDER REVIEW')} variant="primary" className="w-full text-xs py-1.5 flex justify-center items-center gap-2">
                       <FiMaximize2 size={12} /> INVESTIGATE
                    </Button>
                 </div>
              </div>
            </motion.div>
          )}

          {investigationState === 'INVESTIGATING' && selectedThreat && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 bottom-4 right-4 w-80 sm:w-96 bg-bg-elevated/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl overflow-hidden z-30 flex flex-col"
            >
              <div className="bg-surface/50 px-4 py-3 border-b border-border flex justify-between items-center">
                <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2 tracking-wide uppercase">
                  <FiShield className="text-accent" /> THREAT INVESTIGATION
                </h4>
                <button onClick={closeInvestigation} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                 
                 <div>
                    <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Threat Type</span>
                    <div className="text-sm font-semibold text-text-primary">{selectedThreat.type}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Origin</span>
                       <span className="text-xs text-text-secondary">{selectedThreat.origin}</span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Target</span>
                       <span className="text-xs text-text-secondary">{selectedThreat.target}</span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Severity</span>
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider inline-block ${getSeverityColor(selectedThreat.severity)}`}>
                         {selectedThreat.severity}
                       </span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Confidence</span>
                       <span className="text-xs text-accent font-mono">{selectedThreat.confidence}</span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Detection Time</span>
                       <span className="text-xs text-text-secondary font-mono">{selectedThreat.detectedAt}</span>
                    </div>
                    <div>
                       <span className="block text-[9px] text-text-muted mb-1 uppercase tracking-wider">Status</span>
                       <span className="text-xs text-warning font-mono font-bold">{selectedThreat.status}</span>
                    </div>
                 </div>

                 <div className="pt-3 border-t border-border">
                    <span className="block text-[9px] text-text-muted mb-2 uppercase tracking-wider">Detection Indicators</span>
                    <ul className="flex flex-col gap-1.5">
                      {selectedThreat.indicators.map((ind, idx) => (
                         <li key={idx} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-danger mt-0.5">✓</span> {ind}
                         </li>
                      ))}
                    </ul>
                 </div>

                 <div className="pt-3 border-t border-border">
                    <span className="block text-[9px] text-text-muted mb-2 uppercase tracking-wider">Recommended Response</span>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface/50 p-3 rounded border border-border/50">
                      {selectedThreat.recommendation}
                    </p>
                 </div>

                 <div className="pt-3 border-t border-border">
                    <Button onClick={() => setFocusRegion(selectedThreat.origin)} variant="outline" className="w-full text-[10px] py-1.5 flex justify-center items-center gap-2">
                       <FiMap size={12} /> FOCUS REGION
                    </Button>
                 </div>
              </div>
              
              <div className="p-4 bg-surface/50 border-t border-border flex flex-col gap-2">
                 <div className="flex gap-2">
                    <Button onClick={() => updateThreatStatus('REVIEWED')} variant="primary" className="flex-1 text-[10px] py-2">
                       MARK REVIEWED
                    </Button>
                    <Button onClick={() => updateThreatStatus('DISMISSED')} variant="outline" className="flex-1 text-[10px] py-2">
                       DISMISS
                    </Button>
                 </div>
                 <button onClick={closeInvestigation} className="text-[10px] text-text-muted hover:text-text-primary font-semibold tracking-wider mt-2 transition-colors uppercase">
                    ← Back to Map
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM SECTION: Supporting Information */}
      <div className="flex flex-col lg:flex-row p-4 sm:p-6 gap-6 relative z-10 bg-surface/50">
        
        {/* Left Bottom Side: Stats & Region */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             {[
               { label: "Threats Monitored", value: stats.monitored.toLocaleString() },
               { label: "Active Events", value: stats.active },
               { label: "Regions", value: stats.regions },
               { label: "High Severity", value: stats.highSev, color: 'text-danger' },
             ].map((stat, i) => (
               <div key={i} className="bg-bg-elevated/80 border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-1 shadow-sm">
                 <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{stat.label}</span>
                 <span className={`text-xl font-display font-bold ${stat.color || 'text-text-primary'}`}>{stat.value}</span>
               </div>
             ))}
          </div>

          <div className="bg-bg-elevated/80 border border-border rounded-xl p-4 sm:p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiGlobe className="text-accent" /> Region Activity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {[...computedRegions].sort((a,b) => b.activeCount - a.activeCount).slice(0,6).map((r, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-secondary">{r.name}</span>
                    <span className="text-text-primary font-mono">{r.activeCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${r.severity === 'High' ? 'bg-danger' : r.severity === 'Medium' ? 'bg-warning' : 'bg-success'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${r.activeCount > 0 ? Math.min(100, r.activeCount * 20) : 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Bottom Side: Timeline */}
        <div className="w-full lg:w-96 flex flex-col">
          <div className="flex-1 flex flex-col bg-bg-elevated/80 border border-border rounded-xl overflow-hidden shadow-sm max-h-[400px]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface/50">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <FiList className="text-accent" /> Live Activity Timeline
              </h4>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </div>
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {filteredTimeline.length === 0 ? (
                   <div className="p-6 text-center text-xs text-text-muted font-mono">No events for selected filter.</div>
                ) : (
                  filteredTimeline.map((evt) => (
                    <motion.div 
                      key={evt.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3 py-2.5 border-b border-border/50 last:border-0 flex items-start gap-3 hover:bg-surface/50 transition-colors rounded-lg group"
                    >
                      <span className="text-[10px] font-mono text-text-muted whitespace-nowrap mt-0.5 group-hover:text-text-secondary transition-colors">{evt.time}</span>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${getActionColor(evt.action, evt.severity)}`}>
                              {evt.action === 'DETECTED' ? evt.severity : evt.action}
                            </span>
                            <span className={`text-[11px] font-semibold truncate ${evt.action === 'DISMISSED' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                               {evt.threatType}
                            </span>
                         </div>
                         <div className={`flex items-center gap-1.5 text-[10px] ${evt.action === 'DISMISSED' ? 'text-text-muted/50' : 'text-text-secondary'}`}>
                            <FiGlobe size={10} className="shrink-0" />
                            <span className="truncate">{evt.origin}</span>
                         </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonFeature(props) {
  const location = useLocation();
  const isCopilot = location.pathname.includes('ai-copilot');
  const isThreatMap = location.pathname.includes('threat-map');
  const isWebcamLab = location.pathname.includes('webcam-security');

  const title = isWebcamLab ? "Webcam Security Lab" : (isThreatMap ? "Live Cyber Threat Map" : (isCopilot ? "AI Security Copilot" : (props.title || "Advanced Threat Intelligence")));
  const subtitle = isWebcamLab ? "Simulated environment to audit browser camera security and privacy risks." : (isThreatMap ? "Real-time global visualization of simulated security events and attack vectors." : (isCopilot ? "Intelligent security guidance for suspicious URLs, messages and threats." : (props.subtitle || "Next-generation security capability")));
  const description = isWebcamLab ? "Experience our frontend-only demonstration of the upcoming Webcam Security Lab. Test mock camera permissions and learn about browser privacy controls." : (isThreatMap ? "Monitor global security activity through our frontend demonstration of the upcoming live threat intelligence visualization." : (isCopilot ? "Ask CyberShield about a security concern using our interactive demo intelligence engine." : (props.description || "A powerful upcoming module designed to proactively analyze, detect, and mitigate complex security threats using heuristic models and behavioral analysis.")));
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
    <div className="space-y-12 animate-fade-in pb-12 max-w-5xl mx-auto relative">
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden flex justify-center">
         <div className="absolute top-[5%] w-[600px] h-[400px] bg-primary/5 blur-[140px] rounded-full" />
      </div>

      <div className="flex flex-col items-start gap-4 relative z-10">
        <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="inline-flex items-center gap-2 border border-border bg-surface glass rounded-full pl-1.5 pr-3.5 py-1.5 mb-2 shadow-sm">
           <span className="bg-primary/20 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
             {category}
           </span>
        </motion.div>
        
        <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-5 flex items-center gap-4 tracking-tight">
             <div className="p-2.5 rounded-xl bg-bg-elevated border border-border shadow-sm">
               <Icon className="text-accent" size={28} />
             </div>
             {title}
          </h1>
          <h2 className="text-xl text-text-primary font-medium mb-3 tracking-tight">
            {subtitle}
          </h2>
          <p className="text-text-secondary text-base max-w-3xl leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10"
      >
        <Card className="overflow-hidden border-border bg-surface glass p-0 shadow-2xl relative">
           <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg-elevated/50 relative z-20">
              <div className="flex items-center gap-3">
                 <WindowControls />
                 <div className="h-4 w-px bg-border mx-1" />
                 <span className="text-xs text-text-primary font-medium flex items-center gap-2">
                   <FiActivity size={14} className="text-accent" /> SEC-OPS TERMINAL
                 </span>
              </div>
              {isThreatMap && (
                 <span className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded border border-border uppercase shadow-sm">
                   <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE MONITORING
                 </span>
              )}
           </div>
           
           {previewContent ? (
             previewContent
           ) : (
             <div className="p-12 sm:p-20 flex flex-col items-center justify-center text-center min-h-[400px] bg-surface/50">
               <motion.div 
                 className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-6 shadow-lg"
                 animate={{ y: [0, -8, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               >
                  <Icon size={32} className="text-accent" />
               </motion.div>
               
               <h3 className="text-xl font-display font-semibold text-text-primary mb-3 tracking-tight">
                  Experience the future of {title.toLowerCase()}
               </h3>
               <p className="text-sm text-text-secondary max-w-md leading-relaxed">
                  This capability is currently in development. The frontend operations shell is standing by for logic integration.
               </p>
             </div>
           )}
        </Card>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-5 relative z-10">
         {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.3 }}
            >
              <Card className="p-6 h-full border-border bg-surface glass hover:border-accent/40 transition-colors duration-300 shadow-lg">
                 <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center mb-4 shadow-sm">
                    <feature.icon className="text-accent" size={20} />
                 </div>
                 <h4 className="text-base font-semibold text-text-primary mb-2 tracking-tight">
                    {feature.title}
                 </h4>
                 <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                 </p>
              </Card>
            </motion.div>
         ))}
      </div>
    </div>
  );
}
