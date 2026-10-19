import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiEye, FiRefreshCw, FiAlertTriangle, 
  FiFileText, FiCopy, FiCheck, FiTrash2, FiClock, 
  FiCrosshair, FiPrinter, FiShield,
  FiSliders, FiX
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import ImageDropzone from '../../components/security/visual-phishing/ImageDropzone';
import ImageInspectionViewer from '../../components/security/visual-phishing/ImageInspectionViewer';
import ThreatAssessment, { 
  ScoringBreakdownPanel, 
  RecommendationsPanel 
} from '../../components/security/visual-phishing/ThreatAssessment';
import EvidenceMatrix from '../../components/security/visual-phishing/EvidenceMatrix';
import AnalysisTimeline from '../../components/security/visual-phishing/AnalysisTimeline';
import AnalysisHistory from '../../components/security/visual-phishing/AnalysisHistory';
import { visualPhishingService } from '../../services/visualPhishingService';
import { consumeTransferredScreenshot } from '../../services/imageHandoffService';

export default function VisualPhishingLab() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copilotHandoffReceived, setCopilotHandoffReceived] = useState(() => {
    return !!(location.state?.fromCopilot || location.state?.transferredFile);
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [activeSecondaryTab, setActiveSecondaryTab] = useState('evidence'); // 'evidence' | 'details' | 'recommendations' | 'history'
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => visualPhishingService.getHistory());
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const addTimelineEvent = (evt) => {
    setTimelineEvents(prev => [evt, ...prev].slice(0, 30));
  };

  const handleFileSelected = (file) => {
    if (!file) return;

    // Validate file
    const validation = visualPhishingService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setAnalysisResult(null);
    setTimelineEvents([]);
    setActiveSecondaryTab('evidence');

    // Run analysis immediately
    runAnalysis(file);
  };

  const runAnalysis = async (fileToAnalyze) => {
    const file = fileToAnalyze || selectedFile;
    if (!file || isAnalyzing) return;

    setIsAnalyzing(true);
    setOcrProgress('Initializing OCR engine...');
    setError(null);

    try {
      const result = await visualPhishingService.analyzeImage(
        file,
        (status) => {
          setOcrProgress(status);
        },
        (evt) => {
          addTimelineEvent(evt);
        }
      );

      setAnalysisResult(result);
      setHistory(visualPhishingService.getHistory());
      setOcrProgress('Analysis Complete');
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze screenshot. OCR engine encountered an error.");
      addTimelineEvent({
        id: `err-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        msg: `Error: ${err.message || 'Analysis failed'}`,
        type: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setOcrProgress('');
    setError(null);
    setTimelineEvents([]);
    setActiveSecondaryTab('evidence');
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleHiddenFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    e.target.value = '';
  };

  // Automatically receive and analyze screenshot transferred from ScreenshotAnalyzer or other features
  useEffect(() => {
    const handoffFile = consumeTransferredScreenshot() || location.state?.transferredFile;
    if (handoffFile && (handoffFile instanceof File || handoffFile instanceof Blob)) {
      setCopilotHandoffReceived(true);
      const timer = setTimeout(() => {
        handleFileSelected(handoffFile);
        if (location.state?.transferredFile) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyText = () => {
    if (!analysisResult?.text) return;
    navigator.clipboard.writeText(analysisResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = () => {
    visualPhishingService.clearHistory();
    setHistory([]);
  };

  const handlePrintSummary = () => {
    if (!analysisResult) return;
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 pb-12 animate-fade-in text-text-primary">
      
      {/* Hidden file input for Replace screenshot action */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp"
        onChange={handleHiddenFileInputChange}
        className="hidden"
      />

      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Visual Phishing Detection"
        description="Analyze screenshots for suspicious text, brand impersonation, and phishing indicators."
        badge="Threat Detection"
        icon={<FiEye />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-bg-elevated/40 text-xs font-mono text-text-muted">
            <FiShield className="text-accent" size={13} />
            <span>Client-Side OCR • On-Device</span>
          </div>

          {analysisResult && (
            <Button
              variant="outline"
              onClick={handlePrintSummary}
              disabled={isAnalyzing}
              className="text-xs flex items-center gap-1.5 py-1.5 px-3 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
              title="Print or export forensic investigation summary"
            >
              <FiPrinter size={13} />
              <span>Print Summary</span>
            </Button>
          )}

          {previewUrl && (
            <>
              <Button
                variant="outline"
                onClick={() => runAnalysis()}
                disabled={isAnalyzing}
                className="text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
              >
                <FiRefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                <span>Re-Analyze</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isAnalyzing}
                className="text-xs flex items-center gap-1.5 py-1.5 px-3 border-danger/40 text-danger hover:bg-danger/10 cursor-pointer"
              >
                <FiTrash2 size={12} />
                <span>Clear / New</span>
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* 2. ERROR BANNER */}
      {error && (
        <div className="bg-danger/15 border border-danger/30 rounded-xl p-3.5 sm:p-4 flex items-center justify-between text-danger text-xs w-full min-w-0 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <FiAlertTriangle size={18} className="shrink-0" />
            <span className="break-words font-medium">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-danger hover:underline font-semibold uppercase text-xs shrink-0 ml-3 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Copilot Handoff Banner */}
      {copilotHandoffReceived && (
        <div className="mb-6 flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/40 text-text-primary text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-accent/20 text-accent shrink-0">
              <FiEye size={18} />
            </span>
            <div>
              <p className="font-semibold text-text-primary">Screenshot Received from Security Copilot</p>
              <p className="text-xs text-text-secondary">Image loaded and processed for visual brand impersonation and logo forgery detection.</p>
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

      {/* 3. MAIN WORKSPACE AREA */}
      <div className="w-full min-w-0">
        
        {/* EMPTY STATE: CLEAN CENTERED DROPZONE */}
        {!previewUrl ? (
          <div className="w-full min-w-0 py-2">
            <ImageDropzone 
              onFileSelected={handleFileSelected} 
              isAnalyzing={isAnalyzing}
              error={error}
              onErrorClear={setError}
            />
          </div>
        ) : (
          /* ACTIVE / RESULTS WORKSPACE */
          <div className="flex flex-col gap-6 w-full min-w-0">
            
            {/* FILE METADATA STRIP */}
            {selectedFile && (
              <div className="bg-bg-elevated/70 border border-border/70 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs w-full min-w-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 rounded bg-surface border border-border text-accent shrink-0">
                    <FiFileText size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text-primary truncate text-xs" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <span className="text-xs text-text-muted font-mono">
                        • {analysisResult?.fileSize || `${(selectedFile.size / 1024).toFixed(1)} KB`} • {selectedFile.type || 'image'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isAnalyzing ? 'bg-warning animate-ping' : analysisResult ? (analysisResult.isInsufficientEvidence ? 'bg-warning' : 'bg-success') : 'bg-accent animate-pulse'
                      }`} />
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                        {isAnalyzing 
                          ? (ocrProgress || 'Analyzing Screenshot...') 
                          : analysisResult 
                            ? (analysisResult.isInsufficientEvidence ? 'Assessment Inconclusive (Insufficient Text)' : 'Heuristic Analysis Complete') 
                            : 'Image Loaded'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {analysisResult && (
                    <>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-text-secondary">
                        Words: <strong className="text-text-primary">{analysisResult.wordsCount}</strong>
                      </span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-text-secondary">
                        Confidence: <strong className="text-text-primary">{analysisResult.confidence}%</strong>
                      </span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-text-secondary">
                        Time: <strong className="text-accent">{analysisResult.processingTime}s</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PRIMARY TWO-COLUMN WORKSPACE (Desktop Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0 items-start">
              
              {/* LEFT COLUMN: SCREENSHOT INSPECTION (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col gap-3 w-full min-w-0">
                <ImageInspectionViewer
                  imageUrl={previewUrl}
                  matchingWords={analysisResult?.matchingWords || []}
                  showOverlay={showOverlay}
                  onToggleOverlay={() => setShowOverlay(!showOverlay)}
                  isAnalyzing={isAnalyzing}
                  ocrProgress={ocrProgress}
                  onClear={handleReset}
                  onReplace={handleReplaceClick}
                />
              </div>

              {/* RIGHT COLUMN: RISK ASSESSMENT (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col gap-4 w-full min-w-0">
                {analysisResult ? (
                  <ThreatAssessment 
                    result={analysisResult} 
                    onTabSelect={(tab) => {
                      setActiveSecondaryTab(tab);
                      const el = document.getElementById('secondary-investigation-tabs');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }} 
                  />
                ) : isAnalyzing ? (
                  <div className="p-8 rounded-xl bg-bg-elevated/70 border border-border flex flex-col items-center justify-center text-center gap-3 min-h-[380px]">
                    <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Analyzing Visual Indicators
                    </h3>
                    <p className="text-xs text-text-muted font-mono max-w-xs">
                      {ocrProgress || 'Initializing optical character engine...'}
                    </p>
                  </div>
                ) : null}
              </div>

            </div>

            {/* SECONDARY INVESTIGATION DETAILS SECTION */}
            <div id="secondary-investigation-tabs" className="mt-4 pt-6 border-t border-border/70 flex flex-col gap-4 w-full min-w-0">
              
              {/* Segmented Tab Navigation Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border/60">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  
                  {/* TAB 1: EVIDENCE */}
                  <button
                    onClick={() => setActiveSecondaryTab('evidence')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors shrink-0 cursor-pointer ${
                      activeSecondaryTab === 'evidence'
                        ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/60'
                    }`}
                  >
                    <FiCrosshair size={13} />
                    <span>EVIDENCE MATRIX</span>
                    {analysisResult?.indicators?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-danger text-white text-xs font-mono font-semibold">
                        {analysisResult.indicators.length}
                      </span>
                    )}
                  </button>

                  {/* TAB 2: ANALYSIS DETAILS */}
                  <button
                    onClick={() => setActiveSecondaryTab('details')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors shrink-0 cursor-pointer ${
                      activeSecondaryTab === 'details'
                        ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/60'
                    }`}
                  >
                    <FiSliders size={13} />
                    <span>ANALYSIS DETAILS</span>
                    {analysisResult && (
                      <span className="text-xs font-mono text-text-muted">
                        ({analysisResult.wordsCount}w)
                      </span>
                    )}
                  </button>

                  {/* TAB 3: DEFENSIVE GUIDANCE */}
                  <button
                    onClick={() => setActiveSecondaryTab('recommendations')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors shrink-0 cursor-pointer ${
                      activeSecondaryTab === 'recommendations'
                        ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/60'
                    }`}
                  >
                    <FiShield size={13} />
                    <span>DEFENSIVE GUIDANCE</span>
                  </button>

                  {/* TAB 4: HISTORY */}
                  <button
                    onClick={() => setActiveSecondaryTab('history')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors shrink-0 cursor-pointer ${
                      activeSecondaryTab === 'history'
                        ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/60'
                    }`}
                  >
                    <FiClock size={13} />
                    <span>HISTORY</span>
                    {history?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-text-secondary text-xs font-mono font-medium">
                        {history.length}
                      </span>
                    )}
                  </button>

                </div>

                {analysisResult && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="hidden sm:inline font-mono text-xs">
                      Ref: <strong className="text-text-primary">CS-VPD-{analysisResult.id}</strong>
                    </span>
                    <button
                      onClick={handlePrintSummary}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-bg-elevated hover:bg-accent/10 border border-border hover:border-accent/40 text-text-secondary hover:text-accent font-mono text-xs transition-colors cursor-pointer"
                    >
                      <FiPrinter size={13} />
                      <span>Print Report</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Contents Area */}
              <div className="w-full min-w-0 mt-1">
                
                {/* 1. EVIDENCE TAB */}
                {activeSecondaryTab === 'evidence' && (
                  <div className="w-full min-w-0 animate-fade-in">
                    {analysisResult ? (
                      <EvidenceMatrix result={analysisResult} />
                    ) : (
                      <div className="p-8 text-center text-xs text-text-muted bg-bg-elevated/50 rounded-xl border border-border">
                        Evidence matrix will populate once screenshot analysis is complete.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ANALYSIS DETAILS TAB */}
                {activeSecondaryTab === 'details' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full min-w-0 animate-fade-in items-start">
                    
                    {/* Left: OCR Transcript & URLs (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      
                      <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                          <div>
                            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                              Extracted OCR Transcript
                            </h4>
                            <span className="text-xs text-text-muted font-mono">
                              Client-side optical character recognition via Tesseract.js WASM
                            </span>
                          </div>
                          {analysisResult?.text && (
                            <button
                              onClick={handleCopyText}
                              className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border hover:border-accent/40 rounded-lg text-xs font-mono text-text-secondary hover:text-accent transition-colors cursor-pointer"
                            >
                              {copied ? <FiCheck className="text-success" /> : <FiCopy />}
                              <span>{copied ? 'Copied' : 'Copy Text'}</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-surface border border-border/50 rounded-lg p-4 font-mono text-xs text-text-secondary overflow-y-auto max-h-[260px] custom-scrollbar whitespace-pre-wrap break-words leading-relaxed">
                          {analysisResult?.text ? (
                            analysisResult.text
                          ) : isAnalyzing ? (
                            <div className="py-8 text-center text-text-muted font-mono animate-pulse">
                              Extracting text tokens from screenshot...
                            </div>
                          ) : (
                            <div className="py-8 text-center text-text-muted font-mono">
                              No text recognized in this screenshot.
                            </div>
                          )}
                        </div>

                        {analysisResult?.detectedUrls?.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <span className="text-xs font-mono text-text-muted uppercase font-semibold block mb-1.5">
                              Extracted Hyperlinks & Domains ({analysisResult.detectedUrls.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.detectedUrls.map((u, i) => (
                                <span key={i} className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-accent break-all">
                                  🔗 {u}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Telemetry Timeline Feed */}
                      <div className="w-full min-w-0">
                        <AnalysisTimeline events={timelineEvents} />
                      </div>
                    </div>

                    {/* Right: Deterministic Scoring Breakdown (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                      <ScoringBreakdownPanel result={analysisResult} />
                    </div>

                  </div>
                )}

                {/* 3. DEFENSIVE GUIDANCE TAB */}
                {activeSecondaryTab === 'recommendations' && (
                  <div className="w-full min-w-0 animate-fade-in">
                    <RecommendationsPanel result={analysisResult} />
                  </div>
                )}

                {/* 4. HISTORY TAB */}
                {activeSecondaryTab === 'history' && (
                  <div className="w-full min-w-0 animate-fade-in">
                    <AnalysisHistory 
                      history={history} 
                      onClear={handleClearHistory} 
                    />
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>

      {/* 4. PRINT-ONLY INVESTIGATION SUMMARY REPORT */}
      {analysisResult && (
        <div id="visual-phishing-print-report" className="hidden font-sans text-slate-900 bg-white p-8">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #visual-phishing-print-report, #visual-phishing-print-report * {
                visibility: visible !important;
              }
              #visual-phishing-print-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: #ffffff !important;
                color: #0f172a !important;
                display: block !important;
                z-index: 999999 !important;
              }
              @page {
                size: auto;
                margin: 12mm;
              }
            }
          `}} />

          {/* Printable Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                CyberShield Sec-Ops: Visual Phishing Investigation Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Client-Side Heuristic Optical Assessment & Text Analysis
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-700">
              <div><strong>Date:</strong> {analysisResult.date}</div>
              <div><strong>Ref ID:</strong> CS-VPD-{analysisResult.id}</div>
              <div><strong>Engine:</strong> Tesseract OCR WASM</div>
            </div>
          </div>

          {/* Assessment & Metadata Summary Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded border border-slate-300 bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Heuristic Threat Assessment
              </span>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {analysisResult.isInsufficientEvidence ? 'INCONCLUSIVE' : `${analysisResult.score} / 100`}
              </div>
              <div className="inline-block px-2 py-0.5 text-xs font-bold uppercase rounded border mb-2 font-mono" style={{ borderColor: '#64748b' }}>
                {analysisResult.risk.label}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {analysisResult.risk.summary}
              </p>
            </div>

            <div className="p-4 rounded border border-slate-300 bg-slate-50 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Artifact & Optical Metadata
              </span>
              <div><strong>File Name:</strong> {analysisResult.fileName}</div>
              <div><strong>File Size:</strong> {analysisResult.fileSize}</div>
              <div><strong>OCR Words Count:</strong> {analysisResult.wordsCount} words</div>
              <div><strong>OCR Average Confidence:</strong> {analysisResult.confidence}%</div>
              <div><strong>Processing Latency:</strong> {analysisResult.processingTime} seconds</div>
            </div>
          </div>

          {/* Insufficient Evidence Warning Banner (if applicable) */}
          {analysisResult.isInsufficientEvidence && (
            <div className="p-3 mb-5 border-2 border-amber-600 bg-amber-50 text-amber-900 rounded text-xs">
              <strong className="block font-bold mb-0.5 uppercase">Forensic Caution: Insufficient Text Evidence</strong>
              Fewer than 3 readable words were identified in this screenshot. The evaluation is inconclusive and must not be interpreted as evidence that the communication is genuine or safe.
            </div>
          )}

          {/* Evaluated Evidence Table */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
              Evaluated Heuristic Indicators
            </h2>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border-r border-slate-300">Category</th>
                  <th className="p-2 border-r border-slate-300">Verdict</th>
                  <th className="p-2 border-r border-slate-300">Severity</th>
                  <th className="p-2">Matched Text / Forensic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analysisResult.allRulesEvaluated?.map((rule) => (
                  <tr key={rule.id}>
                    <td className="p-2 font-semibold border-r border-slate-200">{rule.category}</td>
                    <td className="p-2 border-r border-slate-200">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded font-mono ${
                        rule.detected ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rule.detected ? 'FLAGGED' : 'CLEAN'}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-200">{rule.severity}</td>
                    <td className="p-2 text-slate-700">
                      {rule.detected && rule.matchedText ? (
                        <div>
                          <span className="font-mono font-bold text-slate-900">"{rule.matchedText}"</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{rule.whySuspicious}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No suspicious indicator detected.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scoring Arithmetic Explanation */}
          <div className="mb-5 p-3 rounded border border-slate-300 bg-slate-50 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Deterministic Scoring Calculation Breakdown
            </h3>
            <div className="space-y-1 font-mono text-[11px] text-slate-700">
              <div>• Base Detected Weights Subtotal: <strong>+{analysisResult.scoringBreakdown?.baseScore || 0}</strong></div>
              <div>• Multi-Signal Escalation Adjustment: <strong>+{analysisResult.scoringBreakdown?.compoundingBonus || 0}</strong></div>
              <div>• Calculated Heuristic Risk Score: <strong>{analysisResult.isInsufficientEvidence ? 'N/A' : `${analysisResult.score} / 100`}</strong></div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
              Actionable Defensive Recommendations
            </h2>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              {analysisResult.isInsufficientEvidence ? (
                <>
                  <li>Do not assume this screenshot is harmless merely because no text was flagged.</li>
                  <li>Verify any urgent requests directly through the organization's verified web application or phone directory.</li>
                  <li>Provide an uncropped, high-resolution screenshot if embedded text needs to be re-analyzed.</li>
                </>
              ) : analysisResult.indicators?.length > 0 ? (
                analysisResult.indicators.map((ind, i) => (
                  <li key={i}>
                    <strong>{ind.category}:</strong> {ind.recommendation}
                  </li>
                ))
              ) : (
                <li>No phishing indicators identified in readable text. Continue adhering to standard cyber hygiene.</li>
              )}
              <li>Never input passwords, credentials, or OTP codes into forms reached via unverified links.</li>
            </ul>
          </div>

          {/* Extracted Text Snippet */}
          {analysisResult.text && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 border-b border-slate-300 pb-1">
                Extracted OCR Text Transcript
              </h2>
              <div className="p-3 bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-40 overflow-hidden">
                {analysisResult.text.slice(0, 1000)}
                {analysisResult.text.length > 1000 && '... [truncated for print]'}
              </div>
            </div>
          )}

          {/* Heuristic Disclaimer */}
          <div className="pt-3 border-t border-slate-300 text-[10px] text-slate-500 leading-relaxed font-sans">
            <strong>Heuristic Disclaimer:</strong> This forensic report was generated on-device using client-side optical character recognition and transparent rule heuristics. It does not communicate with external intelligence servers or provide a guaranteed safety warranty. Always independently verify suspicious communications.
          </div>
        </div>
      )}

    </div>
  );
}
