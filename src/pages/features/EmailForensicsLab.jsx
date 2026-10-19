import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMail, FiShield, FiPrinter, FiRefreshCw, 
  FiLink, FiServer, FiFileText, 
  FiInfo, FiLock, FiCornerDownRight, FiSearch, 
  FiCode, FiAlertCircle, FiX 
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import EmailInputWorkspace from '../../components/security/email-forensics/EmailInputWorkspace';
import AuthenticationResultsCard from '../../components/security/email-forensics/AuthenticationResultsCard';
import SenderInconsistenciesCard from '../../components/security/email-forensics/SenderInconsistenciesCard';
import RoutingTimelineCard from '../../components/security/email-forensics/RoutingTimelineCard';
import ExtractedUrlsCard from '../../components/security/email-forensics/ExtractedUrlsCard';
import RawHeadersViewer from '../../components/security/email-forensics/RawHeadersViewer';
import EmailDiscoverySection from '../../components/security/email-discovery/EmailDiscoverySection';
import { parseRawEmail } from '../../services/emailForensicsParser';
import { analyzeParsedEmail } from '../../services/emailForensicsAnalyzer';
import { consumeTransferredEmail } from '../../services/imageHandoffService';
import { ROUTES } from '../../constants/routes';

export default function EmailForensicsLab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copilotHandoffReceived, setCopilotHandoffReceived] = useState(() => {
    return !!(location.state?.fromCopilot || location.state?.emailContent);
  });
  const [initialEmailText, setInitialEmailText] = useState(() => {
    return consumeTransferredEmail() || location.state?.emailContent || '';
  });
  const [parsedEmail, setParsedEmail] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'auth' | 'route' | 'sender' | 'links' | 'technical'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showInputSection, setShowInputSection] = useState(true);
  const [reportMetadata, setReportMetadata] = useState(() => ({ 
    id: 'CS-EMF-PREVIEW', 
    date: new Date().toISOString().split('T')[0] 
  }));

  // Consume any newly arriving transferred email
  useEffect(() => {
    const transferred = consumeTransferredEmail() || location.state?.emailContent;
    if (transferred && typeof transferred === 'string') {
      setInitialEmailText(transferred);
      setCopilotHandoffReceived(true);
      const shouldAuto = location.state?.autoScan;
      if (location.state?.emailContent) {
        navigate(location.pathname, { replace: true, state: {} });
      }
      if (shouldAuto) {
        setTimeout(() => handleAnalyze(transferred), 300);
      }
    }
  }, [location.pathname, location.state, navigate]);

  // Analyze given raw text
  const handleAnalyze = (rawText) => {
    // 1. Immediately clear stale analysis states to prevent previous scores from persisting
    setAnalysisError(null);
    setAnalysisResult(null);
    setParsedEmail(null);
    setIsAnalyzing(true);
    
    // Brief processing tick for responsive feedback
    setTimeout(() => {
      try {
        if (!rawText || !rawText.trim()) {
          setAnalysisError('Please enter or paste raw email headers before analyzing.');
          setIsAnalyzing(false);
          return;
        }

        const parsed = parseRawEmail(rawText);
        if (!parsed || !parsed.isValid) {
          setAnalysisError(parsed?.error || 'Unable to parse email headers. Please provide standard RFC 5322 email headers.');
          setIsAnalyzing(false);
          return;
        }

        const analysis = analyzeParsedEmail(parsed);
        if (!analysis) {
          setAnalysisError('Forensic evaluation could not be completed for the supplied header data.');
          setIsAnalyzing(false);
          return;
        }

        setParsedEmail(parsed);
        setAnalysisResult(analysis);
        setReportMetadata({
          id: `CS-EMF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          date: new Date().toISOString().split('T')[0]
        });
        setShowInputSection(false);
        setActiveTab('summary');
      } catch (err) {
        console.error('Email analysis error:', err);
        setAnalysisError('An unexpected error occurred during email forensic analysis: ' + (err.message || 'Unknown error'));
      } finally {
        setIsAnalyzing(false);
      }
    }, 250);
  };

  const handleReset = () => {
    setParsedEmail(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setShowInputSection(true);
    setActiveTab('summary');
    setDiscoveryResult(null);
  };

  const handlePrintSummary = () => {
    if (!analysisResult) return;
    window.print();
  };

  const risk = analysisResult?.risk || {
    level: 'low',
    label: 'Low Inconsistency',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    verdict: 'Authentic / Low Risk',
    summary: 'No critical inconsistencies observed.'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 pb-12 animate-fade-in text-text-primary">
      
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Email Forensics Lab"
        description="Investigate email headers, verify cryptographic authentication signals, reconstruct delivery routes, and inspect suspicious links."
        badge="EMAIL INVESTIGATION"
        icon={<FiMail />}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Link / Jump to Investigate Sender */}
          <Button
            variant="outline"
            onClick={() => {
              if (analysisResult) {
                setActiveTab('sender');
                setTimeout(() => {
                  const el = document.getElementById('stage-3-investigate-further');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              } else {
                navigate(ROUTES.EMAIL_DISCOVERY);
              }
            }}
            className="text-xs sm:text-sm flex items-center gap-1.5 py-2 px-3.5 border-border hover:bg-bg-elevated cursor-pointer"
            title="Investigate sender account signals & public footprint"
          >
            <FiSearch size={14} className="text-accent" />
            <span>Investigate Sender</span>
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 bg-bg-elevated/40 text-xs font-mono text-text-muted">
            <FiLock className="text-accent" size={13} />
            <span>100% In-Browser • Zero Telemetry</span>
          </div>

          {analysisResult && (
            <>
              <Button
                variant="outline"
                onClick={handlePrintSummary}
                className="text-xs sm:text-sm flex items-center gap-1.5 py-2 px-3.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                title="Print or export investigation report"
              >
                <FiPrinter size={14} />
                <span>Print Forensic Report</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowInputSection(!showInputSection)}
                className="text-xs sm:text-sm flex items-center gap-1.5 py-2 px-3.5 border-border hover:bg-bg-elevated cursor-pointer"
              >
                <FiRefreshCw size={14} />
                <span>{showInputSection ? 'Hide Input Area' : 'Modify Input'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleReset}
                className="text-xs sm:text-sm flex items-center gap-1.5 py-2 px-3.5 cursor-pointer"
              >
                <span>New Investigation</span>
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Copilot Handoff Banner */}
      {copilotHandoffReceived && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/40 text-text-primary text-sm shadow-sm animate-fade-in">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-accent/20 text-accent shrink-0 mt-0.5 sm:mt-0">
              <FiMail size={18} />
            </span>
            {(!initialEmailText || initialEmailText.includes('\n') || /(Received:|From:|To:|Subject:|Authentication-Results:|DKIM-Signature:|Return-Path:)/i.test(initialEmailText)) ? (
              <div>
                <p className="font-semibold text-text-primary">Email Content Received from Security Copilot</p>
                <p className="text-xs text-text-secondary mt-0.5">Raw headers and message populated in workspace. Review below and click "Analyze Email Headers" to begin triage.</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                  <span>Email Address Received:</span>
                  <span className="font-mono text-accent bg-bg-elevated px-2 py-0.5 rounded border border-border select-all">{initialEmailText}</span>
                </p>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Address populated in workspace. Full forensic analysis (SPF, DKIM, DMARC, and delivery routing) requires complete RFC 5322 headers from your email client (e.g., via <em>"Show original"</em> or <em>"View message details"</em>).
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.EMAIL_DISCOVERY, { state: { email: initialEmailText } })}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent/20 hover:bg-accent/30 text-accent text-xs font-semibold font-mono transition-colors cursor-pointer"
                  >
                    <FiSearch size={13} />
                    <span>Investigate Sender Footprint</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCopilotHandoffReceived(false)}
            className="text-text-muted hover:text-text-primary p-1.5 cursor-pointer rounded-lg hover:bg-surface transition-colors shrink-0 ml-2"
            title="Dismiss notification"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* 2. STAGE 1: ANALYZE EMAIL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
              STAGE 1
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Analyze Email
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">
            Paste raw RFC 5322 headers or load a demonstration scenario
          </span>
        </div>

        {/* Input Workspace */}
        {(showInputSection || !analysisResult) && (
          <EmailInputWorkspace 
            initialValue={initialEmailText}
            onAnalyze={handleAnalyze}
            onClear={handleReset}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Loading State during analysis */}
        {isAnalyzing && (
          <div className="p-8 rounded-xl border border-border bg-bg-elevated text-center space-y-3 animate-fade-in shadow-sm">
            <div className="w-9 h-9 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">
              Analyzing RFC 5322 Email Headers & Evaluating Cryptographic Signatures...
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Reconstructing MTA transit hops, verifying SPF/DKIM/DMARC alignment, and flagging domain inconsistencies.
            </p>
          </div>
        )}

        {/* Analysis Error Alert */}
        {analysisError && !isAnalyzing && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-xs sm:text-sm text-rose-300 animate-fade-in">
            <FiAlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-300">Analysis Error</span>
              <p className="text-rose-300/80 leading-relaxed">{analysisError}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. STAGE 2: UNDERSTAND RESULTS (Compact Executive Summary) */}
      {analysisResult && parsedEmail && !isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                STAGE 2
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                Understand Results
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">
              Executive summary, heuristic forensic score, key authentication evidence, and recommended next steps
            </span>
          </div>

          {/* Compact Executive Summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Card A: Overall Finding & Heuristic Forensic Score (5 cols on LG) */}
            <div className={`lg:col-span-5 p-5 sm:p-6 rounded-xl border shadow-sm flex flex-col justify-between ${risk.bg} ${risk.border}`}>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Threat & Inconsistency Assessment
                  </span>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded border uppercase font-semibold ${risk.bg} ${risk.border} ${risk.color}`}>
                    {risk.label}
                  </span>
                </div>

                {/* Score Meter or Score Unavailable State */}
                <div className="flex items-center gap-4">
                  {analysisResult.scoreAvailable ? (
                    <div className="w-[74px] h-[74px] rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center shrink-0 relative shadow-md">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-border opacity-30" />
                        <circle
                          cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(analysisResult.threatScore / 100) * 264} 264`}
                          className={`transition-all duration-1000 ${risk.color}`}
                        />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-display font-bold leading-none ${risk.color}`}>
                          {analysisResult.threatScore}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider mt-0.5">
                          / 100
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[74px] h-[74px] rounded-full bg-bg-elevated border-2 border-border/80 flex flex-col items-center justify-center shrink-0 text-text-muted">
                      <FiInfo size={22} className="text-accent mb-0.5" />
                      <span className="text-[9px] font-mono uppercase">N/A</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="text-sm sm:text-base font-semibold text-text-primary">
                      {risk.verdict}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {analysisResult.scoreAvailable 
                        ? `${analysisResult.findings.length} inconsistency findings identified across headers.`
                        : 'Insufficient header telemetry to establish score.'}
                    </p>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="pt-2.5 border-t border-border/50 text-sm text-text-secondary leading-relaxed">
                  {risk.summary}
                </div>
              </div>

              {/* Explanatory note distinguishing score from individual evidence */}
              <div className="mt-3.5 pt-2.5 border-t border-border/40 text-xs text-text-muted font-mono flex items-center justify-between">
                <span>{analysisResult.scoreAvailable ? 'Heuristic Indicator • Passive' : 'Telemetry Insufficient'}</span>
                <span>Not a definitive probability</span>
              </div>
            </div>

            {/* Card B: Key Supporting Evidence & Recommended Next Steps (7 cols on LG) */}
            <div className="lg:col-span-7 bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              
              {/* Evidence Strip: SPF, DKIM, DMARC, Route */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/70 mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Key Supporting Evidence
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {parsedEmail.receivedHopsCount} Transit Hops • {analysisResult.urls.length} URLs
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  {/* SPF */}
                  <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60 space-y-1">
                    <span className="text-text-muted uppercase text-[11px] block">SPF Status</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase inline-block ${
                      analysisResult.authentication.spf.status === 'PASS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : analysisResult.authentication.spf.status === 'FAIL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                    }`}>
                      {analysisResult.authentication.spf.status}
                    </span>
                    <span className="text-[11px] text-text-muted truncate block">
                      {analysisResult.authentication.spf.domain || 'No domain'}
                    </span>
                  </div>

                  {/* DKIM */}
                  <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60 space-y-1">
                    <span className="text-text-muted uppercase text-[11px] block">DKIM Status</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase inline-block ${
                      analysisResult.authentication.dkim.status === 'PASS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : analysisResult.authentication.dkim.status === 'FAIL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                    }`}>
                      {analysisResult.authentication.dkim.status}
                    </span>
                    <span className="text-[11px] text-text-muted truncate block">
                      {analysisResult.authentication.dkim.domain || (analysisResult.authentication.dkimSignaturePresent ? 'Signature Found' : 'No Signature')}
                    </span>
                  </div>

                  {/* DMARC */}
                  <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60 space-y-1">
                    <span className="text-text-muted uppercase text-[11px] block">DMARC Status</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase inline-block ${
                      analysisResult.authentication.dmarc.status === 'PASS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : analysisResult.authentication.dmarc.status === 'FAIL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                    }`}>
                      {analysisResult.authentication.dmarc.status}
                    </span>
                    <span className="text-[11px] text-text-muted truncate block">
                      p={analysisResult.authentication.dmarc.policy || 'none'}
                    </span>
                  </div>

                  {/* Route & Findings */}
                  <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60 space-y-1">
                    <span className="text-text-muted uppercase text-[11px] block">MTA Route</span>
                    <span className="font-bold text-text-primary text-xs block">
                      {analysisResult.routing.totalHops} {analysisResult.routing.totalHops === 1 ? 'Hop' : 'Hops'}
                    </span>
                    <span className="text-[11px] text-accent truncate block">
                      {analysisResult.findings.length} Findings
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Next Steps (Concise 2-3 action points) */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
                  Recommended Next Steps
                </span>
                <div className="space-y-1.5">
                  {analysisResult.recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                      <FiCornerDownRight className="text-accent shrink-0 mt-0.5" size={14} />
                      <span>
                        <strong className="text-text-primary font-semibold">{rec.directive}:</strong> {rec.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 4. STAGE 3: INVESTIGATE FURTHER (On-Demand Forensic Tools) */}
      {analysisResult && parsedEmail && !isAnalyzing && (
        <div id="stage-3-investigate-further" className="space-y-4 pt-2">
          
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                STAGE 3
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                Investigate Further
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">
              Deep-dive forensic tools: route hops, domain alignment, sender footprint, links, and RFC 5322 headers
            </span>
          </div>

          {/* Simple, Clearly Labeled Navigation Tabs */}
          <div className="border-b border-border flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-mono">
            {/* 1. Summary */}
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'summary'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiFileText size={15} />
              <span>Summary</span>
              {analysisResult.findings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {analysisResult.findings.length}
                </span>
              )}
            </button>

            {/* 2. Authentication */}
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'auth'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiShield size={15} />
              <span>Authentication</span>
            </button>

            {/* 3. Email Route (RoutingHop) */}
            <button
              type="button"
              onClick={() => setActiveTab('route')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'route'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiServer size={15} />
              <span>Email Route</span>
              <span className="text-xs text-text-muted font-mono">({analysisResult.routing.totalHops} hops)</span>
            </button>

            {/* 4. Investigate Sender */}
            <button
              type="button"
              onClick={() => setActiveTab('sender')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'sender'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiSearch size={15} />
              <span>Investigate Sender</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-accent/20 text-accent">OSINT</span>
            </button>

            {/* 5. Extracted Links */}
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'links'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiLink size={15} />
              <span>Extracted Links</span>
              <span className="text-xs text-text-muted font-mono">({analysisResult.urls.length})</span>
            </button>

            {/* 6. Technical Details */}
            <button
              type="button"
              onClick={() => setActiveTab('technical')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'technical'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FiCode size={15} />
              <span>Technical Details</span>
              <span className="text-xs text-text-muted font-mono">({parsedEmail.headersCount} fields)</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div>
            {/* TAB 1: Summary Panel (Envelope + Inconsistencies) */}
            {activeTab === 'summary' && (
              <div className="space-y-5">
                {/* Message Envelope Card */}
                <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <FiFileText size={18} className="text-accent" />
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                        Message Envelope & Sender Details
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-text-muted">
                      RFC 5322 Header Fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
                    {/* From Field */}
                    <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">Visible Sender (From:)</span>
                      <div className="text-sm sm:text-base font-mono font-medium text-text-primary break-all leading-normal">
                        {parsedEmail.from?.name ? `"${parsedEmail.from.name}" ` : ''}
                        &lt;{parsedEmail.from?.address || 'Not specified'}&gt;
                      </div>
                      <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                        <span className="text-xs font-mono text-accent">
                          Domain: {parsedEmail.from?.domain || 'N/A'}
                        </span>
                        {parsedEmail.from?.address && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('sender')}
                            className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:text-accent-hover cursor-pointer"
                            title="Investigate sender online services & public exposure"
                          >
                            <span>Investigate Sender</span>
                            <FiCornerDownRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* To Field */}
                    <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">Recipient (To:)</span>
                      <div className="text-sm sm:text-base font-mono font-medium text-text-primary break-all leading-normal">
                        {parsedEmail.to?.name ? `"${parsedEmail.to.name}" ` : ''}
                        &lt;{parsedEmail.to?.address || 'Not specified'}&gt;
                      </div>
                      <div className="text-xs font-mono text-text-muted">
                        Domain: {parsedEmail.to?.domain || 'N/A'}
                      </div>
                    </div>

                    {/* Reply-To Field */}
                    <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">Reply Destination (Reply-To:)</span>
                      <div className="text-sm sm:text-base font-mono font-medium text-text-primary break-all leading-normal">
                        {parsedEmail.replyTo?.address ? (
                          <span className={parsedEmail.replyTo.domain !== parsedEmail.from?.domain ? 'text-amber-400 font-semibold' : ''}>
                            {parsedEmail.replyTo.address}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-xs font-mono">Matches From: address</span>
                        )}
                      </div>
                      {parsedEmail.replyTo?.address && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setActiveTab('sender')}
                            className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:text-accent-hover cursor-pointer"
                            title="Investigate Reply-To address"
                          >
                            <span>Investigate Reply-To</span>
                            <FiCornerDownRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Return-Path Field */}
                    <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">Envelope Sender (Return-Path:)</span>
                      <div className="text-sm sm:text-base font-mono font-medium text-text-primary break-all leading-normal">
                        {parsedEmail.returnPath?.address ? (
                          <span className={parsedEmail.returnPath.domain !== parsedEmail.from?.domain ? 'text-amber-400 font-semibold' : ''}>
                            {parsedEmail.returnPath.address}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-xs font-mono">Not explicitly specified</span>
                        )}
                      </div>
                    </div>

                    {/* Subject Field */}
                    <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-1.5 md:col-span-2 font-sans">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">Subject Line</span>
                      <div className="text-sm font-medium text-text-primary break-words leading-relaxed">
                        {parsedEmail.subject || '<No Subject Provided>'}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Message-ID Footer */}
                  <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-muted">
                    <div className="truncate max-w-sm">
                      MsgID: {parsedEmail.messageId || 'Not specified'}
                    </div>
                    <div>
                      Date: {parsedEmail.dateRaw || 'Not specified'}
                    </div>
                  </div>
                </div>

                {/* Findings & Inconsistencies Card */}
                <SenderInconsistenciesCard 
                  findings={analysisResult.findings}
                  senderDiscrepancies={analysisResult.senderDiscrepancies}
                />
              </div>
            )}

            {/* TAB 2: Authentication */}
            {activeTab === 'auth' && (
              <AuthenticationResultsCard 
                authentication={analysisResult.authentication} 
                parsedEmail={parsedEmail}
              />
            )}

            {/* TAB 3: Email Route (RoutingHop) */}
            {activeTab === 'route' && (
              <RoutingTimelineCard 
                routing={analysisResult.routing}
              />
            )}

            {/* TAB 4: Investigate Sender (Integrated Email Account Discovery) */}
            {activeTab === 'sender' && (
              <div id="investigate-sender-tool">
                <EmailDiscoverySection
                  initialEmail={parsedEmail.from?.address || ''}
                  replyToEmail={parsedEmail.replyTo?.address || ''}
                  onDiscoveryUpdate={(res) => setDiscoveryResult(res)}
                />
              </div>
            )}

            {/* TAB 5: Extracted Links */}
            {activeTab === 'links' && (
              <ExtractedUrlsCard 
                urls={analysisResult.urls}
              />
            )}

            {/* TAB 6: Technical Details (Raw Headers) */}
            {activeTab === 'technical' && (
              <RawHeadersViewer 
                rawHeaders={parsedEmail.rawHeaders}
                parsedHeaders={parsedEmail.headers}
              />
            )}
          </div>

          {/* ETHICAL DISCLAIMER & LIMITATIONS */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-bg-surface text-xs sm:text-sm text-text-muted leading-relaxed space-y-2 mt-4">
            <div className="font-semibold text-text-secondary flex items-center gap-2">
              <FiInfo size={16} className="text-accent" />
              <span>Email Forensics Lab • Methodology & Limitations</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              This forensic assessment relies exclusively on passive parsing of RFC 5322 metadata provided by the user. No active network requests, external DNS queries, or outbound telemetry were initiated. Reported authentication verdicts represent recorded values stamped by intermediate and receiving mail transfer agents (MTAs). Forwarded emails and legitimate third-party marketing services may exhibit natural domain differences.
            </p>
          </div>

        </div>
      )}

      {/* 5. PRINT-ONLY FORENSIC REPORT */}
      {analysisResult && parsedEmail && (
        <div 
          id="email-forensics-print-report" 
          className="hidden font-sans text-slate-900 bg-white p-6 sm:p-8 w-full max-w-full text-xs"
          style={{
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}
        >
          {/* Print Stylesheet to hide application UI and ensure clean page margins and text wrapping */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #email-forensics-print-report, #email-forensics-print-report * {
                visibility: visible !important;
              }
              #email-forensics-print-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: #ffffff !important;
                color: #0f172a !important;
                display: block !important;
                z-index: 999999 !important;
                box-sizing: border-box !important;
                font-size: 11px !important;
                line-height: 1.5 !important;
              }
              #email-forensics-print-report table {
                width: 100% !important;
                max-width: 100% !important;
                table-layout: fixed !important;
              }
              #email-forensics-print-report th,
              #email-forensics-print-report td,
              #email-forensics-print-report div,
              #email-forensics-print-report p,
              #email-forensics-print-report span,
              #email-forensics-print-report li,
              #email-forensics-print-report pre {
                overflow-wrap: anywhere !important;
                word-break: break-word !important;
              }
              @page {
                size: auto;
                margin: 12mm;
              }
            }
          `}} />

          {/* Report Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 [overflow-wrap:anywhere] [word-break:break-word]">
                CyberShield — Email Forensics Investigation Report
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">
                RFC 5322 Header Analysis & Passive Authentication Verification
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-600 shrink-0">
              <div><strong>Date:</strong> {reportMetadata.date}</div>
              <div><strong>Report ID:</strong> {reportMetadata.id}</div>
              <div><strong>Engine:</strong> CyberShield Forensics v1.0</div>
            </div>
          </div>

          {/* Overview & Envelope Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 border border-slate-300 p-3.5 bg-slate-50 text-xs">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Subject</div>
              <div className="font-semibold text-slate-900 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] leading-snug">
                {parsedEmail.subject || '<No Subject>'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Verdict & Forensic Threat Score</div>
              <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{analysisResult.risk.verdict}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-slate-300 bg-white">
                  {analysisResult.scoreAvailable ? `${analysisResult.threatScore} / 100` : 'Score Unavailable'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 italic">
                {analysisResult.scoreAvailable ? 'Heuristic Threat & Inconsistency Score' : 'Insufficient Evidence for Score'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Visible From (Author)</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.from?.raw || 'N/A'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Recipient (To:)</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.to?.raw || parsedEmail.to?.address || 'N/A'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Reply Destination (Reply-To:)</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.replyTo?.address ? parsedEmail.replyTo.address : 'Matches visible From address'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Envelope Sender (Return-Path:)</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.returnPath?.raw || 'N/A'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Message-ID</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.messageId || 'Not specified'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Date Stamp</div>
              <div className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                {parsedEmail.dateRaw || reportMetadata.date}
              </div>
            </div>
          </div>

          {/* Authentication Summary */}
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
              Authentication Records & Domain Alignment
            </h2>
            <div className="grid grid-cols-3 gap-2.5 text-[11px] font-mono">
              <div className="p-2 border border-slate-300 bg-slate-50 min-w-0">
                <div className="font-bold text-slate-900">
                  SPF: <span className={analysisResult.authentication.spf.status === 'PASS' ? 'text-emerald-700' : analysisResult.authentication.spf.status === 'FAIL' ? 'text-red-700' : 'text-slate-700'}>{analysisResult.authentication.spf.status.toUpperCase()}</span>
                </div>
                <div className="text-slate-600 text-[10px] whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] mt-0.5">
                  Domain: {analysisResult.authentication.spf.domain || 'N/A'}
                </div>
              </div>
              <div className="p-2 border border-slate-300 bg-slate-50 min-w-0">
                <div className="font-bold text-slate-900">
                  DKIM: <span className={analysisResult.authentication.dkim.status === 'PASS' ? 'text-emerald-700' : analysisResult.authentication.dkim.status === 'FAIL' ? 'text-red-700' : 'text-slate-700'}>{analysisResult.authentication.dkim.status.toUpperCase()}</span>
                </div>
                <div className="text-slate-600 text-[10px] whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] mt-0.5">
                  Domain: {analysisResult.authentication.dkim.domain || (analysisResult.authentication.dkimSignaturePresent ? 'Signature Present' : 'N/A')}
                </div>
              </div>
              <div className="p-2 border border-slate-300 bg-slate-50 min-w-0">
                <div className="font-bold text-slate-900">
                  DMARC: <span className={analysisResult.authentication.dmarc.status === 'PASS' ? 'text-emerald-700' : analysisResult.authentication.dmarc.status === 'FAIL' ? 'text-red-700' : 'text-slate-700'}>{analysisResult.authentication.dmarc.status.toUpperCase()}</span>
                </div>
                <div className="text-slate-600 text-[10px] whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] mt-0.5">
                  Policy: {analysisResult.authentication.dmarc.action || analysisResult.authentication.dmarc.policy || 'none'}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Route Hops */}
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
              Relay Route Hops ({analysisResult.routing.totalHops})
            </h2>
            <div className="text-[11px] text-slate-700 mb-2 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
              <strong>Origin IP:</strong> {analysisResult.routing.originIp || 'Not recorded'} • 
              <strong> Destination MX:</strong> {analysisResult.routing.finalMxHost || 'Internal MTA'}
            </div>
            {analysisResult.routing.hops && analysisResult.routing.hops.length > 0 && (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[10px] table-fixed">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-1.5 border-r border-slate-300 w-12 text-center">Hop</th>
                      <th className="p-1.5 border-r border-slate-300 w-[38%]">From Host / IP</th>
                      <th className="p-1.5 border-r border-slate-300 w-[35%]">By Host (Receiver)</th>
                      <th className="p-1.5">Delay / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {analysisResult.routing.hops.map((hop, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-slate-300 text-center font-bold align-top">#{hop.hopNumber || i + 1}</td>
                        <td className="p-1.5 border-r border-slate-300 align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                          {hop.fromHost || hop.from || 'Unknown'} {hop.ips?.[0] ? `(${hop.ips[0]})` : ''}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                          {hop.byHost || hop.by || 'Unknown'}
                        </td>
                        <td className="p-1.5 align-top text-slate-600 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                          {hop.delayFromPreviousSec !== null && hop.delayFromPreviousSec !== undefined ? `+${hop.delayFromPreviousSec}s delay` : (hop.formattedDate || 'Initial hop')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Findings Table */}
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
              Forensic Observations & Inconsistencies ({analysisResult.findings.length})
            </h2>
            {analysisResult.findings.length === 0 ? (
              <div className="p-3 border border-slate-300 bg-slate-50 text-slate-600 text-xs italic rounded">
                No forensic anomalies or security inconsistencies identified in evaluated headers.
              </div>
            ) : (
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px] table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-20">Severity</th>
                    <th className="p-2 border-r border-slate-300 w-[24%]">Finding Title</th>
                    <th className="p-2 border-r border-slate-300 w-[24%]">Header Field</th>
                    <th className="p-2">Forensic Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.findings.map((f, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-bold uppercase text-[10px] align-top">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-mono ${
                          f.severity === 'High' ? 'bg-red-100 text-red-800 border border-red-300' :
                          f.severity === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-300 font-semibold align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                        {f.title}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-[10px] align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                        {f.field}
                      </td>
                      <td className="p-2 align-top text-slate-700 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed">
                        {f.explanation}
                        {f.whyItMatters && (
                          <div className="mt-1 text-[10px] text-slate-500 italic whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                            <strong>Why it matters:</strong> {f.whyItMatters}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Defensive Recommendations */}
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-1.5">
              Defensive Recommendations
            </h2>
            <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-1.5">
              {analysisResult.recommendations.map((rec, i) => (
                <li key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed">
                  {typeof rec === 'object' ? (
                    <>
                      <strong className="text-slate-900 font-semibold">{rec.directive}:</strong> {rec.detail}
                    </>
                  ) : (
                    rec
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Extracted URLs */}
          {analysisResult.urls && analysisResult.urls.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-1.5">
                Extracted URLs & Hyperlinks ({analysisResult.urls.length})
              </h2>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[10px] table-fixed">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-1.5 border-r border-slate-300 w-20">Type</th>
                      <th className="p-1.5 border-r border-slate-300 w-[28%]">Target Domain</th>
                      <th className="p-1.5">Full Extracted URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {analysisResult.urls.map((u, i) => (
                      <tr key={i}>
                        <td className="p-1.5 border-r border-slate-300 font-bold uppercase align-top">
                          <span className={`inline-block px-1 py-0.5 rounded text-[9px] ${
                            u.isIpAddress ? 'bg-red-100 text-red-800 border border-red-300' :
                            u.isHttpOnly ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {u.isIpAddress ? 'IP URL' : u.isHttpOnly ? 'HTTP' : 'HTTPS'}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-slate-300 align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                          {u.domain || 'N/A'}
                        </td>
                        <td className="p-1.5 align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] text-slate-700">
                          {u.url}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discovery Results in Print Report */}
          {discoveryResult && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                Sender Account Discovery & OSINT Footprint ({discoveryResult.email})
              </h2>
              <div className="text-[11px] mb-2 text-slate-700 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                <strong>Confirmed Services:</strong> {discoveryResult.counts?.confirmed || 0} Verified • 
                <strong> Exposure Status:</strong> {discoveryResult.exposure?.status === 'EXPOSURES_DETECTED' ? 'Exposures Detected' : 'No Exposures Detected / Unconfigured'}
              </div>
              <table className="w-full text-left border-collapse border border-slate-300 text-[10px] table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300 w-28">Service</th>
                    <th className="p-1.5 border-r border-slate-300 w-24">Status</th>
                    <th className="p-1.5 border-r border-slate-300 w-28">Source Type</th>
                    <th className="p-1.5">Finding</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveryResult.services?.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border-r border-slate-300 font-semibold align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">{s.name}</td>
                      <td className="p-1.5 border-r border-slate-300 font-mono uppercase align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">{s.status}</td>
                      <td className="p-1.5 border-r border-slate-300 font-mono align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">{s.sourceType}</td>
                      <td className="p-1.5 align-top whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed">{s.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Raw Headers Excerpt */}
          {parsedEmail.rawHeaders && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-1.5">
                Key Header Metadata Excerpt
              </h2>
              <div className="p-2.5 bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] max-h-48 overflow-hidden leading-relaxed">
                {parsedEmail.rawHeaders.slice(0, 1200)}
                {parsedEmail.rawHeaders.length > 1200 && '\n... [truncated for print]'}
              </div>
            </div>
          )}

          {/* Footer disclaimer */}
          <div className="pt-3 border-t border-slate-300 text-[10px] text-slate-500 font-mono whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
            Generated client-side via CyberShield Email Forensics Lab. Parsed locally on investigator device with zero external telemetry.
          </div>
        </div>
      )}

    </div>
  );
}
