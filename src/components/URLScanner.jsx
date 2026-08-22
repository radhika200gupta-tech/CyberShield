import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ScanInput from './ScanInput';
import ScanProgress from './ScanProgress';
import SecurityResult from './SecurityResult';
import ScanHistory from './ScanHistory';
import { tryParseUrl, buildUrlIntelligence } from '../security/urlAnalyzer';
import { evaluateRules } from '../security/securityRules';
import { calculateRisk } from '../security/riskEngine';
import { loadHistory, saveScanToHistory, clearHistory } from '../utils/scanHistory';

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
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [pendingUrl, setPendingUrl] = useState('');
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState('');
  const [history, setHistory] = useState([]);

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
    <div className="w-full space-y-6">
      <div>
        {phase === PHASES.IDLE && (
          <>
            <ScanInput onAnalyze={handleAnalyze} isScanning={false} />
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
