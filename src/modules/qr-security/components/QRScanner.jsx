import { useCallback, useState } from 'react';
import { FiCamera, FiCameraOff, FiAlertCircle } from 'react-icons/fi';
import ScannerViewport from './ScannerViewport';
import QRUpload from './QRUpload';
import ScanProgress from './ScanProgress';
import QRResult from './QRResult';
import { classifyQrContent, QR_TYPES } from '../utils/qrClassifier';
import { analyzeUrl } from '../utils/urlAnalyzer';
import { calculateRisk, assessNonUrlContent } from '../utils/riskEngine';

const CAMERA_ERROR_COPY = {
  'permission-denied': 'Camera access was denied. You can still upload a QR image.',
  'no-camera': 'No camera was detected. You can still upload a QR image.',
  unknown: 'The camera could not be started. You can still upload a QR image.',
};

export default function QRScanner() {
  const [view, setView] = useState('scanning'); // scanning | analyzing | result | unsupported
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [pending, setPending] = useState(null); // raw decoded text awaiting analysis
  const [outcome, setOutcome] = useState(null); // { classified, riskScore, riskLevel, findings }

  const handleDetect = useCallback((rawText) => {
    setPaused(true);
    setPending(rawText);
    // Brief pause so the "QR detected" state is visible before transitioning
    setTimeout(() => {
      setCameraEnabled(false);
      setView('analyzing');
    }, 450);
  }, []);

  function handleAnalysisComplete() {
    const classified = classifyQrContent(pending);

    if (!classified.type) {
      setView('unsupported');
      return;
    }

    let riskScore;
    let riskLevel;
    let findings;

    if (classified.type === QR_TYPES.URL) {
      const analysis = analyzeUrl(classified.parsed.url);
      const risk = calculateRisk(analysis.signals);
      riskScore = risk.riskScore;
      riskLevel = risk.riskLevel;
      findings = risk.findings;
    } else {
      const risk = assessNonUrlContent(classified.type);
      riskScore = risk.riskScore;
      riskLevel = risk.riskLevel;
      findings = risk.findings;
    }

    const result = { classified, riskScore, riskLevel, findings };
    setOutcome(result);
    setView('result');
  }

  function handleScanAgain() {
    setPaused(false);
    setPending(null);
    setOutcome(null);
    setCameraError(null);
    setCameraEnabled(true);
    setView('scanning');
  }

  function toggleCamera() {
    if (cameraEnabled) {
      setCameraEnabled(false);
    } else {
      setCameraError(null);
      setCameraEnabled(true);
    }
  }

  return (
    <div>
      {view === 'scanning' && (
        <div className="rounded-card border border-border bg-surface p-4 sm:p-6">
          {cameraEnabled ? (
            <ScannerViewport
              enabled={cameraEnabled}
              paused={paused}
              onDetect={handleDetect}
              onError={(type) => {
                setCameraError(type);
                setCameraEnabled(false);
              }}
            />
          ) : (
            <div className="w-full aspect-square sm:aspect-[4/3] rounded-lg bg-bg-elevated flex flex-col items-center justify-center gap-3 px-6 text-center">
              {cameraError ? (
                <>
                  <FiAlertCircle className="text-warning" size={24} />
                  <p className="text-sm text-text-secondary max-w-xs">{CAMERA_ERROR_COPY[cameraError]}</p>
                </>
              ) : (
                <>
                  <FiCameraOff className="text-text-muted" size={24} />
                  <p className="text-sm text-text-muted">Camera stopped</p>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {cameraEnabled ? 'Position QR inside the frame' : 'Camera is off'}
            </p>
            <button
              type="button"
              onClick={toggleCamera}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent transition-colors px-2.5 py-1.5 rounded-md border border-border hover:border-accent/40 cursor-pointer"
            >
              {cameraEnabled ? <FiCameraOff size={13} /> : <FiCamera size={13} />}
              {cameraEnabled ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 hairline" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">or</span>
            <div className="flex-1 hairline" />
          </div>

          <div className="mt-6">
            <QRUpload onDecoded={handleDetect} />
          </div>
        </div>
      )}

      {view === 'analyzing' && (
        <ScanProgress onComplete={handleAnalysisComplete} />
      )}

      {view === 'result' && outcome && (
        <QRResult
          classified={outcome.classified}
          riskScore={outcome.riskScore}
          riskLevel={outcome.riskLevel}
          findings={outcome.findings}
          onScanAgain={handleScanAgain}
        />
      )}

      {view === 'unsupported' && (
        <div className="rounded-card border border-border bg-surface p-8 flex flex-col items-center text-center gap-3">
          <FiAlertCircle className="text-warning" size={22} />
          <p className="text-sm text-text-secondary max-w-xs">
            QR code detected, but this content type isn't currently supported.
          </p>
          <button
            type="button"
            onClick={handleScanAgain}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 transition-colors cursor-pointer"
          >
            Scan Another QR
          </button>
        </div>
      )}
    </div>
  );
}
