import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiMail, FiShield 
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import SearchArea from '../../components/security/email-discovery/SearchArea';
import CompactSummary from '../../components/security/email-discovery/CompactSummary';
import ServiceCard from '../../components/security/email-discovery/ServiceCard';
import CompactExposureAndProfiles from '../../components/security/email-discovery/CompactExposureAndProfiles';
import { discoverEmailFootprint } from '../../services/emailDiscoveryService';
import { ROUTES } from '../../constants/routes';

export default function EmailAccountDiscovery() {
  const location = useLocation();
  const navigate = useNavigate();

  const [discoveryData, setDiscoveryData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('ALL');

  const handleAnalyze = useCallback(async (emailToScan, options = {}) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await discoverEmailFootprint(emailToScan, options);
      setDiscoveryData(result);
      setServiceFilter('ALL');
    } catch (err) {
      setError(err.message || 'An error occurred during discovery lookup.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Auto-analyze if navigated from Email Forensics with ?email= or state.email
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const targetEmail = searchParams.get('email') || location.state?.email;

    if (targetEmail && !discoveryData && !isAnalyzing) {
      const timer = setTimeout(() => {
        handleAnalyze(targetEmail, { isSample: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location, discoveryData, isAnalyzing, handleAnalyze]);

  const handleReset = () => {
    setDiscoveryData(null);
    setError(null);
    setServiceFilter('ALL');
  };

  const handlePrint = () => {
    if (!discoveryData) return;
    window.print();
  };

  // Filter services based on active filter pill
  const allServices = discoveryData?.services || [];
  const filteredServices = allServices.filter((s) => {
    if (serviceFilter === 'CONFIRMED') return s.status === 'CONFIRMED';
    if (serviceFilter === 'POSSIBLE') return s.status === 'POSSIBLE_MATCH';
    if (serviceFilter === 'UNAVAILABLE') return s.status === 'UNAVAILABLE';
    if (serviceFilter === 'NO_MATCH') return s.status === 'NO_MATCH';
    return true;
  });

  const confirmedCount = allServices.filter(s => s.status === 'CONFIRMED').length;
  const possibleCount = allServices.filter(s => s.status === 'POSSIBLE_MATCH').length;
  const noMatchCount = allServices.filter(s => s.status === 'NO_MATCH').length;
  const unavailableCount = allServices.filter(s => s.status === 'UNAVAILABLE').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0 pb-12 animate-fade-in text-text-primary">
      
      {/* 1. COMPACT PAGE HEADER */}
      <PageHeader
        title="Email Account Discovery"
        description="Explore account-related signals and public exposure associated with an email address."
        badge="EMAIL INTELLIGENCE"
        icon={<FiSearch />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.EMAIL_FORENSICS)}
            className="text-xs sm:text-sm flex items-center gap-1.5 py-2 px-3.5 border-border hover:bg-bg-elevated cursor-pointer"
            title="Switch to RFC 5322 Email Forensics Lab"
          >
            <FiMail size={14} className="text-accent" />
            <span>Email Forensics Lab</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. PROMINENT SEARCH AREA */}
      <SearchArea
        onAnalyze={handleAnalyze}
        onReset={handleReset}
        isAnalyzing={isAnalyzing}
        error={error}
        initialEmail={discoveryData?.email || ''}
      />

      {/* 3. INVESTIGATION RESULTS WORKSPACE */}
      {discoveryData ? (
        <div className="space-y-6">
          
          {/* A. Compact Summary Row */}
          <CompactSummary
            discoveryData={discoveryData}
            onReset={handleReset}
            onPrint={handlePrint}
          />

          {/* B. Service Discovery Section (Main Focus) */}
          <div className="space-y-4">
            {/* Section Bar: Title & Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                  Discovered Online Services
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Recognizable services evaluated using cryptographic hashes and public directories
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setServiceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                    serviceFilter === 'ALL'
                      ? 'bg-accent text-white font-semibold'
                      : 'bg-bg-surface border border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  All ({allServices.length})
                </button>
                {confirmedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setServiceFilter('CONFIRMED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      serviceFilter === 'CONFIRMED'
                        ? 'bg-emerald-500 text-white font-semibold'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    Confirmed ({confirmedCount})
                  </button>
                )}
                {possibleCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setServiceFilter('POSSIBLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      serviceFilter === 'POSSIBLE'
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    Possible ({possibleCount})
                  </button>
                )}
                {noMatchCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setServiceFilter('NO_MATCH')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      serviceFilter === 'NO_MATCH'
                        ? 'bg-slate-600 text-white font-semibold'
                        : 'bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20'
                    }`}
                  >
                    No Match ({noMatchCount})
                  </button>
                )}
                {unavailableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setServiceFilter('UNAVAILABLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      serviceFilter === 'UNAVAILABLE'
                        ? 'bg-zinc-600 text-white font-semibold'
                        : 'bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/20'
                    }`}
                  >
                    Unavailable ({unavailableCount})
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Clean Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>

          {/* C. Compact Public Profiles & Exposure Telemetry */}
          <CompactExposureAndProfiles
            publicProfiles={discoveryData.publicProfiles}
            exposure={discoveryData.exposure}
          />

          {/* Ethical Guardrail Disclaimer */}
          <div className="p-4 rounded-xl border border-border/70 bg-bg-surface text-xs sm:text-sm text-text-secondary leading-relaxed flex items-start gap-3">
            <FiShield size={17} className="text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-text-primary">Methodology Notice:</strong> CyberShield performs passive, ethical footprint queries. An account is marked Confirmed only with explicit cryptographic or avatar proof. An absence of public records does not imply an address is safe.
            </span>
          </div>

        </div>
      ) : (
        /* 4. CLEAN & SPACIOUS EMPTY STATE */
        <div className="py-16 px-6 text-center rounded-xl border border-border/60 bg-bg-elevated/40 max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
            <FiSearch size={22} />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-text-primary">
            Ready to Investigate
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            Enter an email address above to discover associated online services, public profile signals, and domain infrastructure.
          </p>
        </div>
      )}

      {/* 5. PRINT-ONLY INVESTIGATION REPORT */}
      {discoveryData && (
        <div id="email-discovery-print-report" className="hidden print:block p-8 bg-white text-slate-900 font-sans text-xs">
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                CyberShield — Email Account Discovery Report
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">
                Passive Footprint, Public Profile Signals & Exposure Intelligence
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-600">
              <div>Date: {new Date(discoveryData.timestamp).toISOString().split('T')[0]}</div>
              <div>Report ID: CS-DISC-{discoveryData.email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 border border-slate-300 p-3 bg-slate-50">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Target Email</div>
              <div className="font-mono font-bold text-slate-900">{discoveryData.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Confirmed Services</div>
              <div className="font-bold text-emerald-700">{confirmedCount} Verified</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-[11px] mb-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300">Service</th>
                <th className="p-1.5 border-r border-slate-300">Status</th>
                <th className="p-1.5">Observed Finding</th>
              </tr>
            </thead>
            <tbody>
              {allServices.map((svc, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-1.5 border-r border-slate-300 font-semibold">{svc.name}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono uppercase text-[10px]">{svc.status}</td>
                  <td className="p-1.5 text-[10px] text-slate-700">{svc.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-300 text-[10px] text-slate-500 font-mono">
            Generated client-side via CyberShield Email Account Discovery. No credentials stored or exposed.
          </div>
        </div>
      )}

    </div>
  );
}
