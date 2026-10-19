import { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiCamera, FiCameraOff, FiAlertCircle, FiX, FiMaximize, 
  FiShield, FiCheckCircle, FiRefreshCw, FiFile, FiUploadCloud 
} from 'react-icons/fi';
import ScannerViewport from './ScannerViewport';
import QRUpload from './QRUpload';
import ScanProgress from './ScanProgress';
import QRResult from './QRResult';
import { classifyQrContent, QR_TYPES } from '../utils/qrClassifier';
import { analyzeUrl } from '../utils/urlAnalyzer';
import { calculateRisk, assessNonUrlContent } from '../utils/riskEngine';
import { decodeFromImageFile } from '../utils/qrDecoder';
import { consumeTransferredScreenshot, hasTransferredScreenshot } from '../../../services/imageHandoffService';
import { saveQrScan } from '../../../utils/incidentStorage';

const CAMERA_ERROR_COPY = {
  'permission-denied': 'Camera access was denied. You can still upload a QR image.',
  'no-camera': 'No camera was detected. You can still upload a QR image.',
  unknown: 'The camera could not be started. You can still upload a QR image.',
};

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileSignature(file) {
  if (!file) return '';
  return `${file.name || 'blob'}_${file.size || 0}_${file.lastModified || ''}_${file.type || ''}`;
}

export default function QRScanner() {
  const location = useLocation();
  const navigate = useNavigate();

  const hasInitialHandoff = hasTransferredScreenshot() || !!location.state?.transferredFile;

  const [copilotHandoffReceived, setCopilotHandoffReceived] = useState(false);
  const [view, setView] = useState('scanning'); // scanning | analyzing | result | unsupported
  const [cameraEnabled, setCameraEnabled] = useState(!hasInitialHandoff);
  const [cameraError, setCameraError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [pending, setPending] = useState(null); // raw decoded text awaiting analysis
  const [outcome, setOutcome] = useState(null); // { classified, riskScore, riskLevel, findings }

  // Image Handoff State
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [decodeState, setDecodeState] = useState('idle'); // idle | decoding | success | not_found | error
  const [decodedText, setDecodedText] = useState(null);

  // Stability & Lifecycle Refs
  const lastProcessedSignatureRef = useRef(null);
  const isProcessingRef = useRef(false);
  const detectTimeoutRef = useRef(null);
  const scanSessionIdRef = useRef(0);
  const decodeStateRef = useRef('idle');
  const reuploadInputRef = useRef(null);

  // Helper to safely update decodeState and keep decodeStateRef in sync
  const updateDecodeState = useCallback((state) => {
    decodeStateRef.current = state;
    setDecodeState(state);
  }, []);

  // Helper to resolve real File/Blob from raw or wrapped objects
  const unwrapImageFile = useCallback((raw) => {
    if (!raw) return null;
    if (typeof File !== 'undefined' && raw instanceof File) return raw;
    if (typeof Blob !== 'undefined' && raw instanceof Blob) return raw;
    if (raw.file && typeof File !== 'undefined' && raw.file instanceof File) return raw.file;
    if (raw.file && typeof Blob !== 'undefined' && raw.file instanceof Blob) return raw.file;
    if (raw.rawFile && typeof File !== 'undefined' && raw.rawFile instanceof File) return raw.rawFile;
    if (raw.rawFile && typeof Blob !== 'undefined' && raw.rawFile instanceof Blob) return raw.rawFile;
    if (raw.file?.file && typeof File !== 'undefined' && raw.file.file instanceof File) return raw.file.file;
    if (typeof raw === 'object' && (raw.previewUrl || raw.name)) return raw;
    if (typeof raw === 'string') return raw;
    return null;
  }, []);

  // Manage preview URL lifecycle tied strictly to selectedImageFile
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewError(false);

    if (!selectedImageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const realFile = unwrapImageFile(selectedImageFile);
    let objectUrl = null;

    if (realFile && ((typeof File !== 'undefined' && realFile instanceof File) || (typeof Blob !== 'undefined' && realFile instanceof Blob))) {
      try {
        objectUrl = URL.createObjectURL(realFile);
        setImagePreviewUrl(objectUrl);
      } catch (err) {
        console.warn('Failed to create object URL for preview:', err);
        setPreviewError(true);
      }
    } else if (realFile?.file && ((typeof File !== 'undefined' && realFile.file instanceof File) || (typeof Blob !== 'undefined' && realFile.file instanceof Blob))) {
      try {
        objectUrl = URL.createObjectURL(realFile.file);
        setImagePreviewUrl(objectUrl);
      } catch (err) {
        console.warn('Failed to create object URL for inner file preview:', err);
        setPreviewError(true);
      }
    } else if (realFile?.rawFile && ((typeof File !== 'undefined' && realFile.rawFile instanceof File) || (typeof Blob !== 'undefined' && realFile.rawFile instanceof Blob))) {
      try {
        objectUrl = URL.createObjectURL(realFile.rawFile);
        setImagePreviewUrl(objectUrl);
      } catch (err) {
        console.warn('Failed to create object URL for rawFile preview:', err);
        setPreviewError(true);
      }
    } else if (typeof realFile === 'string' && realFile) {
      setImagePreviewUrl(realFile);
    } else if (typeof realFile?.previewUrl === 'string' && realFile.previewUrl) {
      setImagePreviewUrl(realFile.previewUrl);
    } else {
      setPreviewError(true);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedImageFile, unwrapImageFile]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (detectTimeoutRef.current) {
        clearTimeout(detectTimeoutRef.current);
        detectTimeoutRef.current = null;
      }
    };
  }, []);

  // Process incoming image file safely and stably
  const handleProcessImage = useCallback((rawFile, fromCopilot = false, forceRescan = false) => {
    const file = unwrapImageFile(rawFile);
    if (!file) return;

    const signature = getFileSignature(file);

    // Prevent duplicate scanning of identical file unless explicitly requested (e.g. manual rescan)
    if (!forceRescan) {
      if (isProcessingRef.current && lastProcessedSignatureRef.current === signature) {
        return;
      }
      if (lastProcessedSignatureRef.current === signature && decodeStateRef.current === 'success') {
        return;
      }
    }

    lastProcessedSignatureRef.current = signature;
    isProcessingRef.current = true;
    const currentSessionId = ++scanSessionIdRef.current;

    setSelectedImageFile(file);
    setCameraEnabled(false);
    setCameraError(null);
    updateDecodeState('decoding');
    setDecodedText(null);
    setPaused(true);
    if (fromCopilot) {
      setCopilotHandoffReceived(true);
    }

    decodeFromImageFile(file)
      .then((text) => {
        // Discard stale session results if another scan began in the meantime
        if (currentSessionId !== scanSessionIdRef.current) return;
        isProcessingRef.current = false;

        if (text && typeof text === 'string') {
          setDecodedText(text);
          updateDecodeState('success');
        } else {
          updateDecodeState('not_found');
        }
      })
      .catch((err) => {
        if (currentSessionId !== scanSessionIdRef.current) return;
        isProcessingRef.current = false;
        console.warn('QR image decoding error:', err);
        updateDecodeState('error');
      });
  }, [unwrapImageFile, updateDecodeState]);

  // Detect transferred QR image from Copilot
  useEffect(() => {
    const handoffFile = consumeTransferredScreenshot() || location.state?.transferredFile;
    const unwrapped = unwrapImageFile(handoffFile);
    if (unwrapped) {
      const signature = getFileSignature(unwrapped);
      if (lastProcessedSignatureRef.current !== signature) {
        handleProcessImage(unwrapped, true, false);
      }
      if (location.state?.transferredFile || location.state?.fromCopilot) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.pathname, navigate, handleProcessImage, unwrapImageFile]);

  const handleClearImage = useCallback(() => {
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
      detectTimeoutRef.current = null;
    }
    scanSessionIdRef.current++;
    lastProcessedSignatureRef.current = null;
    isProcessingRef.current = false;
    decodeStateRef.current = 'idle';

    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setPreviewError(false);
    setDecodeState('idle');
    setDecodedText(null);
    setCameraEnabled(true);
    setCameraError(null);
  }, []);

  const handleDetect = useCallback((rawText) => {
    if (!rawText) return;
    setPaused(true);
    setPending(rawText);

    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    // Brief pause so the "QR detected" state is visible before transitioning
    detectTimeoutRef.current = setTimeout(() => {
      setCameraEnabled(false);
      setView('analyzing');
    }, 350);
  }, []);

  const handleAnalysisComplete = useCallback(() => {
    if (!pending) return;
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
    try {
      saveQrScan(result);
    } catch (e) {
      console.warn('Could not record QR scan to incident storage:', e);
    }
    setOutcome(result);
    setView('result');
  }, [pending]);

  const handleScanAgain = useCallback(() => {
    handleClearImage();
    setPending(null);
    setOutcome(null);
    setView('scanning');
  }, [handleClearImage]);

  function toggleCamera() {
    if (cameraEnabled) {
      setCameraEnabled(false);
    } else {
      if (selectedImageFile) {
        handleClearImage();
      }
      setCameraError(null);
      setCameraEnabled(true);
      setPaused(false);
    }
  }

  return (
    <div>
      {/* Copilot Handoff Banner */}
      {copilotHandoffReceived && (
        <div className="mb-4 flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/40 text-text-primary text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-accent/20 text-accent shrink-0">
              <FiMaximize size={18} />
            </span>
            <div>
              <p className="font-semibold text-text-primary">QR Image Received from Security Copilot</p>
              <p className="text-xs text-text-secondary mt-0.5">Image transferred and decoded for safe analysis without opening external links.</p>
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

      {view === 'scanning' && (
        <div className="rounded-card border border-border bg-surface p-4 sm:p-6 space-y-4">
          
          {/* 1. Transferred / Uploaded Image Viewport */}
          {selectedImageFile ? (
            <div className="space-y-4">
              <div className="relative rounded-xl border border-border/80 bg-bg-elevated/40 p-4 sm:p-6 flex flex-col items-center justify-center">
                {previewError || !imagePreviewUrl ? (
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center max-w-md">
                    <FiAlertCircle className="text-warning mb-2" size={28} />
                    <p className="font-semibold text-text-primary text-sm">Image Preview Unavailable</p>
                    <p className="text-xs text-text-muted mt-1 mb-4">
                      The transferred image source could not be displayed or has expired. You can upload the QR image directly below.
                    </p>
                    <button
                      type="button"
                      onClick={() => reuploadInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-bg-primary text-xs font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      <FiUploadCloud size={15} />
                      <span>Select QR Image File</span>
                    </button>
                  </div>
                ) : (
                  <img
                    src={imagePreviewUrl}
                    alt="Transferred QR Code"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                    className="max-h-64 max-w-full rounded-lg border border-border/70 object-contain shadow-sm bg-black/20"
                  />
                )}

                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-text-muted">
                  <FiFile size={13} className="text-accent" />
                  <span className="font-semibold text-text-secondary truncate max-w-xs">{selectedImageFile.name || 'transferred-qr.png'}</span>
                  <span>•</span>
                  <span>{formatFileSize(selectedImageFile.size)}</span>
                </div>

                <input
                  ref={reuploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) {
                      handleProcessImage(file, false, true);
                    }
                  }}
                />
              </div>

              {/* Decoding Status & Payload Details */}
              {decodeState === 'decoding' && (
                <div className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl bg-bg-elevated/60 border border-border text-xs sm:text-sm text-text-secondary animate-pulse">
                  <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <span>Decoding QR code matrix via local jsQR engine...</span>
                </div>
              )}

              {decodeState === 'success' && decodedText && (
                <div className="p-4 sm:p-5 rounded-xl bg-bg-elevated border border-accent/40 space-y-3 animate-fade-in shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <FiCheckCircle size={15} className="text-success" />
                      Decoded QR Payload
                    </span>
                    <span className="text-xs text-text-muted font-mono hidden sm:inline">Zero Auto-Redirects</span>
                  </div>

                  <div className="p-3.5 bg-surface rounded-lg border border-border/80 font-mono text-xs sm:text-sm text-text-primary break-all select-all leading-relaxed">
                    {decodedText}
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    To protect you from drive-by downloads or phishing redirects, this link has not been automatically opened. Click below to analyze security reputation and signals.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDetect(decodedText)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg-primary font-semibold text-xs sm:text-sm hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
                    >
                      <FiShield size={16} />
                      <span>Analyze Security & Risk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImageFile) {
                          handleProcessImage(selectedImageFile, false, true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border text-xs sm:text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                      title="Explicitly rescan this image"
                    >
                      <FiRefreshCw size={14} />
                      <span>Rescan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => reuploadInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border text-xs sm:text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <FiUploadCloud size={14} />
                      <span>Upload Different Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border text-xs sm:text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <FiCamera size={14} />
                      <span>Clear Image & Use Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {decodeState === 'not_found' && (
                <div className="p-4 sm:p-5 rounded-xl bg-danger/10 border border-danger/30 text-xs sm:text-sm space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-semibold text-danger">
                    <FiAlertCircle size={17} />
                    <span>No QR Code Detected in This Image</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    The decoding engine could not identify a valid QR matrix. Please ensure the QR code is centered, upright, and unblurred, or switch to the camera to scan live.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImageFile) {
                          handleProcessImage(selectedImageFile, false, true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <FiRefreshCw size={13} />
                      <span>Retry Decode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => reuploadInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <FiUploadCloud size={13} />
                      <span>Upload Different Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/40 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                    >
                      <FiCamera size={14} />
                      <span>Switch to Live Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {decodeState === 'error' && (
                <div className="p-4 sm:p-5 rounded-xl bg-danger/10 border border-danger/30 text-xs sm:text-sm space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-semibold text-danger">
                    <FiAlertCircle size={17} />
                    <span>Image Processing Failed</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    Could not load or parse the transferred image file. Please provide a standard PNG, JPG, or WEBP image.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImageFile) {
                          handleProcessImage(selectedImageFile, false, true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <FiRefreshCw size={13} />
                      <span>Retry Decode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => reuploadInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <FiUploadCloud size={13} />
                      <span>Upload Different Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/40 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                    >
                      <FiCamera size={14} />
                      <span>Switch to Live Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 2. Live Camera Viewport (Standard Scanner) */
            <>
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
                <QRUpload onDecoded={handleDetect} onFileSelected={(file) => handleProcessImage(file, false, true)} />
              </div>
            </>
          )}

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
