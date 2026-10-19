import { useState, useCallback } from 'react';
import { 
  FiSearch, FiMail, FiChevronDown, FiChevronUp, 
  FiAlertCircle, FiRefreshCw, FiShield, FiCornerDownRight, FiKey, FiUser
} from 'react-icons/fi';
import CompactSummary from './CompactSummary';
import ServiceCard from './ServiceCard';
import CompactExposureAndProfiles from './CompactExposureAndProfiles';
import { discoverEmailFootprint, validateEmailAddress } from '../../../services/emailDiscoveryService';
import { SAMPLE_DISCOVERY_SCENARIOS } from '../../../data/sampleEmailDiscoveryData';

export default function EmailDiscoverySection({
  initialEmail = '',
  replyToEmail = '',
  onDiscoveryUpdate = null
}) {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [prevInitialEmail, setPrevInitialEmail] = useState(initialEmail);
  const [discoveryData, setDiscoveryData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('ALL'); // 'ALL' | 'FOUND' | 'NOT_FOUND' | 'UNAVAILABLE'
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  // Synchronize state when initialEmail prop changes (e.g. user analyzes different headers)
  if (initialEmail !== prevInitialEmail) {
    setPrevInitialEmail(initialEmail);
    setEmailInput(initialEmail);
    setError(null);
    setDiscoveryData(null); // Reset results when a new email from headers is loaded
  }

  // Execute investigation
  const handleInvestigate = useCallback(async (emailToScan = emailInput, options = {}) => {
    const trimmed = (emailToScan || '').trim();
    if (!trimmed) {
      setError('Please enter a target sender email address to investigate.');
      return;
    }

    // Validate email syntax before querying
    const validation = validateEmailAddress(trimmed);
    if (!validation.valid && !options.isSample) {
      setError(validation.error || 'Please enter a valid RFC 5322 email address (e.g. sender@example.com).');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgressMsg('Initiating passive email footprint investigation...');

    try {
      const result = await discoverEmailFootprint(trimmed, {
        ...options,
        onProgress: (msg) => setProgressMsg(msg)
      });
      setDiscoveryData(result);
      setServiceFilter('ALL');
      if (onDiscoveryUpdate) {
        onDiscoveryUpdate(result);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during account discovery lookup.');
    } finally {
      setIsAnalyzing(false);
      setProgressMsg('');
    }
  }, [emailInput, onDiscoveryUpdate]);

  const handleReset = () => {
    setDiscoveryData(null);
    setError(null);
    setServiceFilter('ALL');
    if (onDiscoveryUpdate) {
      onDiscoveryUpdate(null);
    }
  };

  const handlePrint = () => {
    if (!discoveryData) return;
    window.print();
  };

  // Filter services by simple status (Requirement 4.B)
  const allServices = discoveryData?.services || [];
  const filteredServices = allServices.filter((s) => {
    const isFound = s.status === 'CONFIRMED' || s.status === 'POSSIBLE_MATCH';
    const isNotFound = s.status === 'NO_MATCH';
    const isUnavailable = s.status === 'UNAVAILABLE';

    if (serviceFilter === 'FOUND') return isFound;
    if (serviceFilter === 'NOT_FOUND') return isNotFound;
    if (serviceFilter === 'UNAVAILABLE') return isUnavailable;
    return true;
  });

  const foundCount = allServices.filter(s => s.status === 'CONFIRMED' || s.status === 'POSSIBLE_MATCH').length;
  const notFoundCount = allServices.filter(s => s.status === 'NO_MATCH').length;
  const unavailableCount = allServices.filter(s => s.status === 'UNAVAILABLE').length;

  // Group filtered results by meaning (Requirement 4.B):
  // 1. Public Profiles & Online Services
  const publicProfileServices = filteredServices.filter(s => s.id !== 'openpgp');
  // 2. Email Security & Cryptographic Registries
  const emailSecurityServices = filteredServices.filter(s => s.id === 'openpgp');

  return (
    <div 
      id="investigate-sender-stage" 
      className="bg-bg-elevated border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200"
    >
      {/* 1. COMPACT SECTION HEADER (Requirement 3) */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-surface/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <FiSearch size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                STAGE 3
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                Investigate Sender
              </h3>
              {discoveryData && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {foundCount} Signals Found
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
              Explore available public account and identity signals associated with this email address.
            </p>
          </div>
        </div>

        {/* Section Toggle Button */}
        <button
          type="button"
          onClick={() => setIsSectionOpen(!isSectionOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-elevated hover:bg-bg-surface text-xs font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isSectionOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          <span>{isSectionOpen ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>

      {/* 2. SECTION CONTENT */}
      {isSectionOpen && (
        <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
          
          {/* Quick Prefill Chips for From: and Reply-To: if available */}
          {(initialEmail || replyToEmail) && (
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
              <span className="text-text-muted text-xs font-mono">
                Prefill from Headers:
              </span>
              {initialEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput(initialEmail);
                    setError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    emailInput === initialEmail
                      ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                      : 'bg-bg-surface border border-border/80 text-text-secondary hover:text-text-primary'
                  }`}
                  title="Use parsed visible From: address"
                >
                  <FiMail size={12} />
                  <span>From: {initialEmail}</span>
                </button>
              )}
              {replyToEmail && replyToEmail !== initialEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput(replyToEmail);
                    setError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    emailInput === replyToEmail
                      ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                      : 'bg-bg-surface border border-border/80 text-text-secondary hover:text-text-primary'
                  }`}
                  title="Use parsed Reply-To: address"
                >
                  <FiCornerDownRight size={12} />
                  <span>Reply-To: {replyToEmail}</span>
                </button>
              )}
            </div>
          )}

          {/* Form Input + One Obvious Primary Button: Investigate Email (Requirement 3) */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!isAnalyzing) handleInvestigate();
            }} 
            className="space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <FiMail size={16} />
                </div>
                <input
                  id="forensic-sender-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setError(null);
                  }}
                  disabled={isAnalyzing}
                  placeholder="e.g. sender@company.com or username@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border rounded-lg text-sm sm:text-base font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Obvious Primary Button */}
              <button
                type="submit"
                disabled={isAnalyzing || !emailInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#05080D] font-semibold text-sm rounded-lg hover:bg-primary-dim shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <FiSearch size={16} />
                    <span>Investigate Email</span>
                  </>
                )}
              </button>

              {/* Reset Button */}
              {discoveryData && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isAnalyzing}
                  className="px-3.5 py-3 rounded-lg border border-border bg-bg-surface hover:bg-bg-elevated text-xs font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Clear results"
                >
                  <FiRefreshCw size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Validation or Error Alert */}
          {error && (
            <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs sm:text-sm text-rose-400 animate-fade-in">
              <FiAlertCircle className="shrink-0 mt-0.5" size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Missing From: notification if header didn't supply an address */}
          {!initialEmail && !discoveryData && !error && (
            <div className="p-3.5 rounded-lg border border-border/70 bg-bg-surface/50 text-xs sm:text-sm text-text-muted flex items-center gap-2">
              <FiAlertCircle size={15} className="text-amber-400 shrink-0" />
              <span>No sender email address could be parsed from the visible From: header. Please enter an address manually above.</span>
            </div>
          )}

          {/* Short Explanation of What This Check Can and Cannot Establish (Requirement 3) */}
          <div className="p-4 rounded-xl bg-bg-surface/50 border border-border/50 text-xs sm:text-sm text-text-secondary leading-relaxed space-y-1.5">
            <p>
              <strong className="text-text-primary font-medium">Scope Notice:</strong> Queries public cryptographic registries (keys.openpgp.org), universal avatar hashes (Gravatar), and open developer platforms (GitHub).
            </p>
            <p className="text-xs text-text-muted">
              This check <em>cannot</em> access private inboxes, verify account ownership, or automate login forms. A public reference to an email does not confirm the address is currently active or secure.
            </p>
          </div>

          {/* Active Loading Progress Bar */}
          {isAnalyzing && (
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-2 text-xs font-mono animate-fade-in">
              <div className="flex items-center justify-between text-accent">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>{progressMsg || 'Running passive footprint checks...'}</span>
                </span>
                <span className="text-xs text-text-muted font-mono">Live OSINT Evaluation</span>
              </div>
            </div>
          )}

          {/* 3. PROGRESSIVE RESULTS WORKSPACE (Requirement 4) */}
          {discoveryData && (
            <div className="space-y-6 pt-3 border-t border-border/60 animate-fade-in">
              
              {/* A. Quick Summary (Requirement 4.A) */}
              <CompactSummary
                discoveryData={discoveryData}
                onReset={handleReset}
                onPrint={handlePrint}
              />

              {/* Filter Pills Bar (Simple Statuses: All, Found, Not found, Unavailable) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/50">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Filter Findings by Status:
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setServiceFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      serviceFilter === 'ALL'
                        ? 'bg-accent text-white font-medium'
                        : 'bg-bg-surface border border-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    All ({allServices.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceFilter('FOUND')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      serviceFilter === 'FOUND'
                        ? 'bg-emerald-500 text-white font-medium'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    Found ({foundCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceFilter('NOT_FOUND')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      serviceFilter === 'NOT_FOUND'
                        ? 'bg-slate-600 text-white font-medium'
                        : 'bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20'
                    }`}
                  >
                    Not found ({notFoundCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceFilter('UNAVAILABLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      serviceFilter === 'UNAVAILABLE'
                        ? 'bg-zinc-600 text-white font-medium'
                        : 'bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/20'
                    }`}
                  >
                    Unavailable ({unavailableCount})
                  </button>
                </div>
              </div>

              {/* B. Group Results by Meaning (Requirement 4.B) */}
              <div className="space-y-6">
                
                {/* Category 1: Public Profiles & Online Services */}
                {publicProfileServices.length > 0 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <FiUser size={16} className="text-accent" />
                      <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                        Public Profiles & Online Services ({publicProfileServices.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {publicProfileServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Category 2: Email Security & Cryptographic Registries */}
                {emailSecurityServices.length > 0 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <FiKey size={16} className="text-amber-400" />
                      <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                        Email Security & Cryptographic Registries ({emailSecurityServices.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {emailSecurityServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Category 3: Exposure Checks & Verified Profiles (Requirement 4.B) */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <FiShield size={16} className="text-accent" />
                    <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                      Exposure Checks & Profile Telemetry
                    </h4>
                  </div>
                  <CompactExposureAndProfiles
                    publicProfiles={discoveryData.publicProfiles}
                    exposure={discoveryData.exposure}
                  />
                </div>

              </div>

            </div>
          )}

          {/* Quick Demo Scenario Selector if user wants to review sample data */}
          {!discoveryData && (
            <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-text-muted mr-1">
                  Try Demo Scenario:
                </span>
                {SAMPLE_DISCOVERY_SCENARIOS.slice(0, 4).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setEmailInput(sc.email);
                      handleInvestigate(sc.email, { isSample: true, sampleId: sc.id });
                    }}
                    disabled={isAnalyzing}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-bg-surface border border-border/70 text-text-secondary hover:text-text-primary hover:border-border transition-colors cursor-pointer"
                  >
                    {sc.title.split(' ')[0]}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-text-muted">
                Zero Telemetry • Ethical Client-Side Queries
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
