import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLink, FiX } from 'react-icons/fi';
import PageHeader from './common/PageHeader';
import ScanInput from './ScanInput';
import ScanProgress from './ScanProgress';
import SecurityResult from './SecurityResult';
import ScanHistory from './ScanHistory';
import { tryParseUrl, buildUrlIntelligence } from '../security/urlAnalyzer';
import { evaluateRules } from '../security/securityRules';
import { calculateRisk } from '../security/riskEngine';
import { loadHistory, saveScanToHistory, clearHistory } from '../utils/scanHistory';
import { consumeTransferredUrl } from '../services/imageHandoffService';

const PHASES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  RESULT: 'result',
};

/**
 * URLScanner
 *
 * Self-contained, reusable Smart URL Security Scanner feature.
 * No dependency on any surrounding dashboard, sidebar, or layout —
 * safe to drop into any parent application.
 */
export default function URLScanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copilotHandoffReceived, setCopilotHandoffReceived] = useState(() => {
    return !!(location.state?.fromCopilot || location.state?.url);
  });
  const [transferredUrl, setTransferredUrl] = useState(() => {
    return consumeTransferredUrl() || location.state?.url || '';
  });
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [pendingUrl, setPendingUrl] = useState('');
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState('');
  const [history, setHistory] = useState([]);

  // Consume any transferred URL arriving via handoff
  useEffect(() => {
    const url = consumeTransferredUrl() || location.state?.url;
    if (url && typeof url === 'string') {
      setTransferredUrl(url);
      setCopilotHandoffReceived(true);
      const shouldAuto = location.state?.autoScan;
      if (location.state?.url) {
        navigate(location.pathname, { replace: true, state: {} });
      }
      if (shouldAuto) {
        setTimeout(() => handleAnalyze(url), 300);
      }
    }
  }, [location.pathname, location.state, navigate]);

  // Load past scans from localStorage once on mount. Refreshing the
  // page never breaks the app — if storage is empty/unavailable this
  // just resolves to an empty list.
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleAnalyze = useCallback((rawUrl) => {
    const parsed = tryParseUrl(rawUrl);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    setParseError('');
    setPendingUrl(rawUrl);
    setPhase(PHASES.SCANNING);

    // Run the actual analysis now; we reveal it once the scanning
    // animation finishes, so the UX always feels consistent even
    // though the computation itself is effectively instant.
    const intelligence = buildUrlIntelligence(parsed.url, rawUrl);
    const ruleResults = evaluateRules({ url: parsed.url, raw: rawUrl, intelligence });
    const risk = calculateRisk(ruleResults);
    const fullResult = { ...risk, intelligence };
    setResult(fullResult);

    // Save to Recent Scans (localStorage) once the analysis is ready.
    setHistory(saveScanToHistory({ url: rawUrl, result: fullResult }));
  }, []);

  const handleScanComplete = useCallback(() => {
    setPhase(PHASES.RESULT);
  }, []);

  const handleReset = useCallback(() => {
    setPhase(PHASES.IDLE);
    setResult(null);
    setPendingUrl('');
  }, []);

  const handleSelectHistoryEntry = useCallback((entry) => {
    setResult(entry.result);
    setPendingUrl(entry.url);
    setParseError('');
    setPhase(PHASES.RESULT);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory(clearHistory());
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <PageHeader 
        title="🔗 URL Scanner"
        description="Analyze URLs for suspicious patterns and potential threats."
        badge="Real-time analysis"
        icon={<FiLink />}
      />

      {/* Copilot Handoff Banner */}
      {copilotHandoffReceived && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/40 text-text-primary text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-accent/20 text-accent shrink-0">
              <FiLink size={18} />
            </span>
            <div>
              <p className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                <span>URL Received from Security Copilot:</span>
                {transferredUrl && <span className="font-mono text-accent bg-bg-elevated px-2 py-0.5 rounded border border-border select-all">{transferredUrl}</span>}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Destination link populated in input. Click "CHECK THIS LINK" below to run the heuristic safety scan.</p>
            </div>
          </div>
          <button
            onClick={() => setCopilotHandoffReceived(false)}
            className="text-text-muted hover:text-text-primary p-1.5 cursor-pointer rounded-lg hover:bg-surface transition-colors"
            title="Dismiss notification"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <div>
        {phase === PHASES.IDLE && (
          <>
            <ScanInput initialValue={transferredUrl} onAnalyze={handleAnalyze} isScanning={false} />
            {parseError && (
              <p className="mt-3 text-center text-sm text-danger">{parseError}</p>
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          {phase === PHASES.SCANNING && (
            <motion.div key="scanning">
              <ScanProgress onComplete={handleScanComplete} />
            </motion.div>
          )}

          {phase === PHASES.RESULT && result && (
            <motion.div key="result">
              <SecurityResult result={result} url={pendingUrl} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScanHistory
        entries={history}
        onSelect={handleSelectHistoryEntry}
        onClear={handleClearHistory}
      />
    </div>
  );
}
