import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiCopy, FiCheck, FiExternalLink, FiShield, 
  FiAlertTriangle, FiAlertOctagon, FiServer, FiTag, 
  FiClock, FiUser, FiInfo, FiFileText, FiLock,
  FiCpu, FiMap, FiArrowRight
} from 'react-icons/fi';
import Button from '../../common/Button';
import { setTransferredThreat } from '../../../services/imageHandoffService';

export default function ThreatDetailsDrawer({ threat, onClose }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showMapNotice, setShowMapNotice] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!threat) return null;

  const handleCopy = () => {
    if (threat?.indicator) {
      navigator.clipboard.writeText(threat.indicator);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExplainWithCopilot = () => {
    // 1. Capture actual selected threat record
    // 2. Set in-memory handoff register
    setTransferredThreat(threat);
    // 3. Navigate with React Router state
    navigate('/app/coming-soon/ai-copilot', {
      state: {
        threatRecord: threat,
        fromThreatIntel: true
      }
    });
    if (onClose) onClose();
  };

  const handleExploreOnThreatMap = () => {
    navigate('/app/coming-soon/threat-map', {
      state: {
        threatRecord: threat,
        fromThreatIntel: true
      }
    });
    if (onClose) onClose();
  };

  const isOnline = (threat.evidence?.urlStatus || '').toLowerCase() === 'online';
  const isCritical = (threat.severity || '').toUpperCase() === 'CRITICAL';
  const isHigh = (threat.severity || '').toUpperCase() === 'HIGH';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl bg-bg-elevated/95 border-l border-border shadow-2xl backdrop-blur-xl h-full flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-surface/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-surface border border-border/80 text-accent shrink-0">
                <FiShield size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide truncate">
                    Threat Details
                  </h3>
                  <span className="font-mono text-xs text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                    ID: #{threat.id}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  abuse.ch URLhaus Community Report
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              title="Close details (Esc)"
              aria-label="Close details"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* Critical Security Warning */}
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-3.5 flex items-start gap-3">
              <FiAlertOctagon className="text-danger shrink-0 mt-0.5" size={18} />
              <div className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                <strong className="text-danger block font-semibold mb-0.5">
                  Potentially Malicious Indicator
                </strong>
                This URL was reported to distribute malicious payloads. Do not open, execute, or submit data to this link in an unisolated environment.
              </div>
            </div>

            {/* Investigation Actions Card */}
            <div className="bg-gradient-to-r from-accent/15 via-surface/90 to-surface/90 border border-accent/30 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-accent uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <FiCpu size={14} /> Connected Investigation Workflow
                </span>
                <span className="text-xs font-mono text-text-muted bg-surface/80 px-2.5 py-0.5 rounded border border-border">
                  SOC Copilot Bridge
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Seamlessly transfer this genuine threat record into the <strong>AI Security Copilot</strong> for automated technical breakdown, risk justification, and defensive containment steps.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  onClick={handleExplainWithCopilot}
                  variant="primary"
                  size="sm"
                  className="text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 shadow-md shadow-accent/20 cursor-pointer font-semibold"
                >
                  <FiCpu size={14} />
                  Explain with Copilot
                  <FiArrowRight size={13} />
                </Button>

                <Button
                  onClick={handleExploreOnThreatMap}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm py-2 px-3 flex items-center gap-2 border-border/80 hover:border-accent/50 cursor-pointer text-text-secondary hover:text-text-primary"
                  title="View this indicator in Live Threat Map synchronized feed"
                >
                  <FiMap size={14} className="text-accent" />
                  Explore on Threat Map
                </Button>
              </div>
            </div>

            {/* Indicator Card & Copy Action */}
            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                  Reported Indicator ({threat.indicatorType})
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  isOnline ? 'bg-success/15 text-success border border-success/30' : 'bg-surface text-text-muted border border-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-text-muted'}`} />
                  {isOnline ? 'Reported Online (Feed Status)' : 'Reported Offline'}
                </span>
              </div>

              <div className="p-3.5 bg-bg-elevated rounded-lg border border-border font-mono text-xs sm:text-sm text-text-primary break-all select-all leading-relaxed">
                {threat.indicator}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {copied ? <FiCheck size={14} className="text-success" /> : <FiCopy size={14} />}
                  {copied ? 'Copied to Clipboard' : 'Copy Indicator URL'}
                </Button>

                {threat.reportUrl && (
                  <a
                    href={threat.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-accent hover:underline rounded-lg border border-accent/30 hover:bg-accent/10 transition-colors ml-auto"
                  >
                    View on Abuse.ch <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Assessment Origin & Severity */}
            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <FiAlertTriangle size={14} className="text-accent" /> Internal Assessment
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider ${
                  isCritical ? 'bg-danger/20 text-danger border border-danger/40' :
                  isHigh ? 'bg-danger/10 text-danger border border-danger/20' :
                  'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  {threat.severity} Severity
                </span>
              </div>

              <div className="text-xs sm:text-sm text-text-secondary bg-bg-elevated/80 p-3 rounded-lg border border-border/70 leading-relaxed">
                <p className="font-semibold text-text-primary mb-1">Assessment Rationale:</p>
                <p>{threat.severityRationale}</p>
                <div className="mt-2.5 pt-2.5 border-t border-border/50 text-xs text-text-muted flex items-center gap-2">
                  <span className="font-semibold text-accent">Source:</span>
                  <span>{threat.severitySource === 'internally_assessed' ? 'Assessed by CyberShield heuristic rule engine (not provider-assigned)' : threat.severitySource}</span>
                </div>
              </div>
            </div>

            {/* Provider Facts Grid */}
            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block font-semibold">
                Provider-Reported Metadata
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Threat Category</span>
                  <span className="font-semibold text-text-primary">{threat.category}</span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Reporter</span>
                  <span className="font-mono text-text-primary font-medium">{threat.evidence?.reporter || 'Community'}</span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">First Seen (UTC)</span>
                  <span className="font-mono text-text-secondary">{threat.firstSeen || 'N/A'}</span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Last Online (UTC)</span>
                  <span className="font-mono text-text-secondary">{threat.lastSeen || 'N/A'}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="pt-2">
                <span className="text-xs text-text-muted block mb-2 font-medium">Associated Tags / Malware Families:</span>
                {threat.tags && threat.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {threat.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono px-2.5 py-1 rounded bg-bg-elevated border border-border text-accent font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm text-text-muted italic">No community tags recorded.</span>
                )}
              </div>
            </div>

            {/* Extracted Network & Payload Evidence */}
            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <FiServer size={14} className="text-accent" /> Technical Network Evidence
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Target Host / IP</span>
                  <span className="font-mono font-medium text-text-primary break-all">
                    {threat.evidence?.host || 'Unknown'}
                  </span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Target Port</span>
                  <span className="font-mono font-medium text-text-primary">
                    {threat.evidence?.port || 'Default'}
                  </span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Detected Payload Ext</span>
                  <span className="font-mono font-bold text-danger">
                    {threat.evidence?.fileExtension || 'None / Web Page'}
                  </span>
                </div>

                <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-text-muted block mb-1 font-medium">Host Type</span>
                  <span className="font-mono text-text-secondary">
                    {threat.evidence?.isIpAddress ? 'Direct IP Address' : 'Domain Name'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cautious Actionable Security Recommendations */}
            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono text-accent uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <FiLock size={14} /> Defensive Recommendations
              </span>

              <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-start gap-2.5 bg-bg-elevated/60 p-3 rounded-lg border border-border/40">
                  <span className="text-accent font-bold mt-0.5">&bull;</span>
                  <div>
                    <strong className="text-text-primary block font-medium">Perimeter Egress Block</strong>
                    Block outbound communication to <code className="text-text-primary font-mono text-xs sm:text-sm">{threat.evidence?.host}</code> on port <code className="text-text-primary font-mono text-xs sm:text-sm">{threat.evidence?.port}</code> in network firewalls.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 bg-bg-elevated/60 p-3 rounded-lg border border-border/40">
                  <span className="text-accent font-bold mt-0.5">&bull;</span>
                  <div>
                    <strong className="text-text-primary block font-medium">Endpoint Telemetry Sweep</strong>
                    Search endpoint detection (EDR/SIEM) logs for recent socket connections to this host or files dropped from this path.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 bg-bg-elevated/60 p-3 rounded-lg border border-border/40">
                  <span className="text-accent font-bold mt-0.5">&bull;</span>
                  <div>
                    <strong className="text-text-primary block font-medium">Isolated Investigation Only</strong>
                    Never open or trigger requests to this URL from corporate endpoints or standard personal browsers.
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-surface/60 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs text-text-muted font-mono truncate">
              Feed: abuse.ch URLhaus
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExplainWithCopilot}
                variant="primary"
                size="sm"
                className="text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5"
              >
                <FiCpu size={14} />
                Explain with Copilot
              </Button>
              <Button onClick={onClose} variant="outline" size="sm" className="text-xs sm:text-sm py-2 px-3">
                Close Details
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
