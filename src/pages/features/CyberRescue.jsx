import { useState, useEffect } from 'react';
import {
  FiLifeBuoy,
  FiPhoneCall,
  FiExternalLink,
  FiCheck,
  FiRotateCcw,
  FiAlertCircle,
  FiAlertTriangle,
  FiLink,
  FiLock,
  FiSmartphone,
  FiCreditCard,
  FiSearch,
  FiMail,
  FiShare2,
  FiShield,
  FiCopy,
  FiFileText,
  FiZap,
} from 'react-icons/fi';
import { TbShieldCheck } from 'react-icons/tb';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import {
  RESCUE_SCENARIOS,
  EMERGENCY_INFO,
  analyzeSuspiciousLink,
  ACCOUNT_SECURITY_ACTIONS,
  OTP_GUIDES,
  PAYMENT_FRAUD_ACTIONS,
} from '../../data/cyberRescueData';

const STORAGE_KEY = 'cybershield_simple_rescue_progress';

const ICONS = {
  link: FiLink,
  lock: FiLock,
  phone: FiSmartphone,
  alert: FiCreditCard,
};

export default function CyberRescue() {
  const [selectedId, setSelectedId] = useState('phishing-link');

  // Simple checklist progress saved in localStorage
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Tool A: Suspicious Link Analyzer State
  const [urlInput, setUrlInput] = useState('');
  const [urlResult, setUrlResult] = useState(null);

  // Tool B: Account Security Assistant State
  const [accountType, setAccountType] = useState('email');

  // Tool C: OTP Response Guide State
  const [otpType, setOtpType] = useState('banking');

  // Tool D: Fraud Response Assistant State
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [fraudDetails, setFraudDetails] = useState({
    amount: '',
    bankOrApp: '',
    refId: '',
    dateTime: '',
  });
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps));
    } catch {
      // Ignore storage errors
    }
  }, [completedSteps]);

  // Current active scenario
  const currentScenario =
    RESCUE_SCENARIOS.find((s) => s.id === selectedId) || RESCUE_SCENARIOS[0];

  const currentCompleted = completedSteps[selectedId] || [];
  const totalSteps = currentScenario.steps.length;
  const validCompleted = currentCompleted.filter((idx) => idx < totalSteps);
  const completedCount = validCompleted.length;
  const percent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isAllCompleted = totalSteps > 0 && completedCount === totalSteps;

  // Toggle step completion
  const toggleStep = (stepIndex) => {
    setCompletedSteps((prev) => {
      const list = prev[selectedId] ? [...prev[selectedId]] : [];
      const idx = list.indexOf(stepIndex);
      if (idx > -1) {
        list.splice(idx, 1);
      } else {
        list.push(stepIndex);
      }
      return { ...prev, [selectedId]: list };
    });
  };

  // Reset current scenario progress
  const resetProgress = () => {
    setCompletedSteps((prev) => {
      const updated = { ...prev };
      delete updated[selectedId];
      return updated;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="CyberRescue — Personal Cybercrime Recovery Assistant"
        description="Select what happened to get simple, step-by-step recovery guidance, interactive tools, and official emergency helpline contacts."
        badge="Recovery Assistant"
        icon={<FiLifeBuoy className="text-primary" />}
      />

      {/* Emergency Contacts Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Helpline 1930 */}
        <div className="rounded-xl border border-danger/30 bg-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
              <FiPhoneCall size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">National Cyber Financial Fraud Helpline</p>
              <p className="text-lg font-bold text-text-primary">Call 1930</p>
            </div>
          </div>
          <a
            href={EMERGENCY_INFO.helplineUrl}
            className="px-3.5 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:brightness-110 transition shadow-sm"
          >
            Call Now
          </a>
        </div>

        {/* Official Portal */}
        <div className="rounded-xl border border-primary/30 bg-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FiExternalLink size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Official Government of India Portal</p>
              <p className="text-sm font-bold text-text-primary">cybercrime.gov.in</p>
            </div>
          </div>
          <a
            href={EMERGENCY_INFO.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/20 transition"
          >
            Visit Portal
          </a>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-border bg-surface/50 p-3.5 text-xs text-text-secondary flex items-center gap-2.5">
        <FiAlertCircle className="text-primary shrink-0 text-sm" />
        <span>
          <b>Safe Recovery Advice:</b> CyberShield never asks for your passwords, OTPs, or banking details. Always contact your bank directly through their official app or the phone number printed on the back of your card.
        </span>
      </div>

      {/* Incident Options (4 Scenarios) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
          What happened? Select an incident:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RESCUE_SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === selectedId;
            const Icon = ICONS[scenario.icon] || FiAlertCircle;
            const completedForScenario = (completedSteps[scenario.id] || []).filter(
              (idx) => idx < scenario.steps.length
            ).length;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedId(scenario.id)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm'
                    : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-black' : 'bg-surface-hover text-text-primary'}`}>
                      <Icon size={16} />
                    </div>
                    {completedForScenario > 0 && (
                      <span className="text-[10px] font-mono text-success">
                        {completedForScenario}/{scenario.steps.length} done
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40 text-[11px] text-text-muted">
                  {isSelected ? (
                    <span className="text-primary font-medium">● Selected</span>
                  ) : (
                    'Click to view steps'
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Urgent First Action Alert */}
      {currentScenario.urgentAction && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 sm:p-5 text-danger space-y-2 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-danger/20 pb-2">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-danger shrink-0" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-danger">
                Urgent First Action — {currentScenario.title}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-danger/20 text-danger border border-danger/30 font-semibold">
              🚨 Act Immediately
            </span>
          </div>

          <div className="pt-0.5">
            <h4 className="text-sm sm:text-base font-bold text-text-primary">
              {currentScenario.urgentAction.title}
            </h4>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
              {currentScenario.urgentAction.instruction}
            </p>
          </div>
        </div>
      )}

      {/* Incident-Specific Interactive Tool */}
      <Card className="p-5 sm:p-6 space-y-4 border-primary/25 bg-surface/90 shadow-md">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-primary">
              Incident Interactive Tool
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-2.5 py-0.5 rounded-full border border-border/40">
            {selectedId === 'phishing-link' && 'Link Inspection'}
            {selectedId === 'entered-password' && 'Account Shield'}
            {selectedId === 'shared-otp' && 'OTP Containment'}
            {selectedId === 'fraudulent-payment' && 'Fraud Response'}
          </span>
        </div>

        {selectedId === 'phishing-link' && (
          <SuspiciousLinkAnalyzer
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            urlResult={urlResult}
            setUrlResult={setUrlResult}
          />
        )}

        {selectedId === 'entered-password' && (
          <AccountSecurityAssistant
            accountType={accountType}
            setAccountType={setAccountType}
          />
        )}

        {selectedId === 'shared-otp' && (
          <OtpResponseGuide
            otpType={otpType}
            setOtpType={setOtpType}
          />
        )}

        {selectedId === 'fraudulent-payment' && (
          <FraudResponseAssistant
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            fraudDetails={fraudDetails}
            setFraudDetails={setFraudDetails}
            copiedSummary={copiedSummary}
            setCopiedSummary={setCopiedSummary}
          />
        )}
      </Card>

      {/* Selected Scenario Checklist */}
      <Card className="p-5 sm:p-6 space-y-5">
        {/* Checklist Header & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary font-display">
              Recovery Steps: {currentScenario.title}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Follow these simple steps in order to secure your account and recover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary font-medium">
              {completedCount} of {totalSteps} done ({percent}%)
            </span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={resetProgress}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-danger transition"
                title="Reset checklist"
              >
                <FiRotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Simple Progress Bar */}
        <div className="h-2 w-full bg-bg rounded-full border border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Recovery Steps Checklist Items */}
        <div className="space-y-3 pt-1">
          {currentScenario.steps.map((stepText, idx) => {
            const isChecked = currentCompleted.includes(idx);

            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'border-success/30 bg-success/5 text-text-muted'
                    : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover text-text-primary'
                }`}
              >
                {/* Checkbox Box */}
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? 'bg-success border-success text-black'
                      : 'border-border-hover bg-bg'
                  }`}
                >
                  {isChecked && <FiCheck size={13} className="stroke-[3]" />}
                </div>

                {/* Step Text */}
                <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                  <span className={`font-mono text-xs mr-2 font-semibold ${isChecked ? 'text-text-muted' : 'text-primary'}`}>
                    Step {idx + 1}:
                  </span>
                  <span className={isChecked ? 'line-through text-text-muted' : 'text-text-primary'}>
                    {stepText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recovery Checklist Completion Message */}
        {isAllCompleted && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 sm:p-5 text-primary space-y-2.5 shadow-sm animate-fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 text-primary">
                <TbShieldCheck size={24} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                    <span>Recovery Checklist Completed!</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold">
                      100% Done
                    </span>
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                  Great job! You've completed all the recommended recovery steps for this incident.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-primary/20 text-[11px] text-text-muted flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-text-secondary">Disclaimer:</span>
              <span>Completing these steps does not guarantee that your account or device is fully secure.</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Tool A: Suspicious Link Analyzer Sub-Component
 */
function SuspiciousLinkAnalyzer({ urlInput, setUrlInput, urlResult, setUrlResult }) {
  const handleAnalyze = (e) => {
    e?.preventDefault();
    const result = analyzeSuspiciousLink(urlInput);
    setUrlResult(result);
  };

  const handleClear = () => {
    setUrlInput('');
    setUrlResult(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <FiLink className="text-primary" />
          Suspicious Link Analyzer
        </h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Paste an unfamiliar link to perform client-side pattern checks for suspicious domain structures, misleading hostnames, or insecure connections.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste suspicious URL here (e.g., http://login-verify-sbi.xyz/update)..."
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-xs sm:text-sm text-text-primary outline-none transition focus:border-primary/60 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs sm:text-sm hover:brightness-110 transition shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <FiSearch size={14} />
              Analyze Link
            </button>
            {(urlInput || urlResult) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2.5 rounded-xl border border-border bg-surface text-text-muted hover:text-text-primary text-xs sm:text-sm transition shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Error State */}
      {urlResult && urlResult.error && (
        <div className="p-3.5 rounded-xl border border-warning/40 bg-warning/10 text-warning text-xs flex items-center gap-2 animate-fade-in">
          <FiAlertTriangle size={15} className="shrink-0" />
          <span>{urlResult.error}</span>
        </div>
      )}

      {/* Valid Analysis Output */}
      {urlResult && !urlResult.error && (
        <div className="space-y-3.5 pt-2 border-t border-border/50 animate-fade-in">
          {/* Risk Level Header */}
          <div className="p-3.5 rounded-xl border border-border bg-bg/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Target Hostname:
              </span>
              <p className="text-sm font-bold text-text-primary font-mono truncate">
                {urlResult.domain}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${urlResult.badgeClass}`}>
                {urlResult.riskCategory}
              </span>
            </div>
          </div>

          {/* Warning Signs Found */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
              Pattern Indicators Found ({urlResult.flags.length})
            </p>
            {urlResult.flags.length === 0 ? (
              <div className="p-3 rounded-lg border border-success/30 bg-success/5 text-success text-xs flex items-center gap-2">
                <FiCheck size={14} className="shrink-0" />
                <span>No immediate structural red flags detected in basic pattern check.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {urlResult.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-0.5 ${
                      flag.level === 'danger'
                        ? 'border-danger/30 bg-danger/5 text-danger'
                        : 'border-warning/30 bg-warning/5 text-warning'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <span>{flag.level === 'danger' ? '⚠️' : '⚡'}</span>
                      <span>{flag.title}</span>
                    </p>
                    <p className="text-[11px] opacity-90 pl-5 leading-relaxed text-text-secondary">
                      {flag.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Precautions */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-surface/60 space-y-1.5">
            <p className="text-xs font-semibold text-text-primary">
              Recommended Precautions:
            </p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              {urlResult.precautions.map((prec, i) => (
                <li key={i}>{prec}</li>
              ))}
            </ul>
          </div>

          {/* Strict Threat-Intel Disclaimer */}
          <div className="p-3 rounded-lg border border-border/40 bg-surface/40 text-[11px] text-text-muted leading-relaxed">
            {urlResult.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tool B: Account Security Assistant Sub-Component
 */
function AccountSecurityAssistant({ accountType, setAccountType }) {
  const current = ACCOUNT_SECURITY_ACTIONS[accountType] || ACCOUNT_SECURITY_ACTIONS.email;

  const types = [
    { id: 'email', label: 'Email Account', icon: FiMail },
    { id: 'social', label: 'Social Media', icon: FiShare2 },
    { id: 'banking', label: 'Banking & Financial', icon: FiCreditCard },
    { id: 'other', label: 'Other Accounts', icon: FiLock },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <FiLock className="text-primary" />
          Account Security Assistant
        </h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Select the type of account where you entered your credentials to view customized, prioritized security recovery actions.
        </p>
      </div>

      {/* Account Type Selector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {types.map((type) => {
          const isSelected = accountType === type.id;
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setAccountType(type.id)}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold'
                  : 'border-border bg-bg/50 hover:border-border-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-primary' : 'text-text-muted'} />
              <span className="text-xs truncate">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Account Overview */}
      <div className="space-y-3 pt-1">
        <div className="p-3.5 rounded-xl border border-border bg-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <span className="text-xs font-bold text-text-primary">
              Target Scope: {current.label}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">
              {current.sublabel}
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
            Prioritized Plan
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {current.summary}
        </p>

        {/* Prioritized Action Cards */}
        <div className="space-y-2">
          {current.priorityActions.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-border/70 bg-surface hover:border-border-hover transition space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="text-primary font-mono text-[11px]">{item.priority}</span>
                  <span>{item.title}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed pl-1">
                {item.action}
              </p>
            </div>
          ))}
        </div>

        {/* Safe Reminder */}
        <div className="p-3 rounded-xl border border-border/50 bg-bg/50 text-[11px] text-text-muted flex items-center gap-2">
          <FiShield className="text-primary shrink-0" size={14} />
          <span>
            <b>Privacy Guarantee:</b> Never enter your passwords into CyberRescue. Always update credentials directly on the official service.
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Tool C: OTP Response Guide Sub-Component
 */
function OtpResponseGuide({ otpType, setOtpType }) {
  const current = OTP_GUIDES[otpType] || OTP_GUIDES.banking;

  const types = [
    { id: 'banking', label: 'Banking / Payment' },
    { id: 'whatsapp', label: 'WhatsApp / Chat' },
    { id: 'email', label: 'Email Account' },
    { id: 'other', label: 'Other Service' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <FiSmartphone className="text-primary" />
          OTP Response Guide
        </h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Select what kind of One-Time Password was shared to access targeted containment procedures.
        </p>
      </div>

      {/* OTP Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {types.map((type) => {
          const isSelected = otpType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setOtpType(type.id)}
              className={`p-3 rounded-xl border text-center transition ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold text-xs'
                  : 'border-border bg-bg/50 hover:border-border-hover text-text-secondary hover:text-text-primary text-xs'
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Guide Content */}
      <div className="space-y-3 pt-1">
        <div className="p-3.5 rounded-xl border border-border bg-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <span className="text-xs font-bold text-text-primary">
              Category: {current.label}
            </span>
            <p className="text-[11px] text-text-muted mt-0.5">
              {current.description}
            </p>
          </div>
          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border self-start sm:self-auto font-semibold ${current.badgeColor}`}>
            {current.badge}
          </span>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          {current.actions.map((act) => (
            <div
              key={act.step}
              className="p-3 rounded-xl border border-border/70 bg-surface flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {act.step}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-primary">{act.title}</p>
                <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {act.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Explicit Warning */}
        <div className="p-3 rounded-xl border border-danger/30 bg-danger/5 text-danger text-[11px] flex items-center gap-2">
          <FiAlertTriangle className="shrink-0" size={14} />
          <span>
            <b>Critical Safety Rule:</b> Never share or disclose your OTP to anyone, even if they claim to be from your bank or law enforcement.
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Tool D: Fraud Response Assistant Sub-Component
 */
function FraudResponseAssistant({
  paymentMethod,
  setPaymentMethod,
  fraudDetails,
  setFraudDetails,
  copiedSummary,
  setCopiedSummary,
}) {
  const currentMethod = PAYMENT_FRAUD_ACTIONS[paymentMethod] || PAYMENT_FRAUD_ACTIONS.upi;

  const methods = [
    { id: 'upi', label: 'UPI' },
    { id: 'card', label: 'Debit / Credit Card' },
    { id: 'netbanking', label: 'Net Banking' },
  ];

  const handleCopySummary = async () => {
    const summaryText = `=========================================
CYBERSHIELD FRAUD INCIDENT SUMMARY
=========================================
Incident Type: Fraudulent / Unauthorized Payment
Payment Method: ${currentMethod.label}
Payment App / Bank: ${fraudDetails.bankOrApp || 'Not specified'}
Transaction Amount: ${fraudDetails.amount ? `₹${fraudDetails.amount}` : 'Not specified'}
Date & Time: ${fraudDetails.dateTime || 'Not specified'}
Transaction / UTR Reference ID: ${fraudDetails.refId || 'Not specified'}
-----------------------------------------
Emergency Directives:
- National Cyber Financial Helpline: 1930
- Official Reporting Portal: https://cybercrime.gov.in/
- Evidence Preserved: Payment receipt, SMS & screenshots
=========================================`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = summaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <FiCreditCard className="text-primary" />
          Fraud Response Assistant
        </h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Select your payment channel to view method-specific recovery protocols and prepare a standardized incident summary for 1930 and cybercrime.gov.in.
        </p>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-3 gap-2">
        {methods.map((m) => {
          const isSelected = paymentMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`p-3 rounded-xl border text-center transition ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold text-xs'
                  : 'border-border bg-bg/50 hover:border-border-hover text-text-secondary hover:text-text-primary text-xs'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Immediate Method Actions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-text-primary">
            Immediate Actions for {currentMethod.label}
          </p>
          <span className="text-[10px] text-text-muted font-mono">{currentMethod.sublabel}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentMethod.actions.map((act, i) => (
            <div key={i} className="p-3 rounded-xl border border-border/70 bg-surface space-y-1">
              <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span className="text-primary font-mono text-[11px]">{i + 1}.</span>
                <span>{act.title}</span>
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed pl-3.5">
                {act.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Summary Builder */}
      <div className="rounded-xl border border-border bg-bg/40 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/40 pb-2">
          <div>
            <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FiFileText className="text-primary" />
              Incident Summary Builder (Non-Sensitive)
            </h5>
            <p className="text-[11px] text-text-muted mt-0.5">
              Prepare non-sensitive reference details to read over helpline 1930 or paste into cybercrime.gov.in.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/20 transition self-start sm:self-auto shrink-0"
          >
            {copiedSummary ? <FiCheck size={13} /> : <FiCopy size={13} />}
            <span>{copiedSummary ? '✓ Copied!' : 'Copy Summary'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Amount Debited (₹)
            </label>
            <input
              type="text"
              value={fraudDetails.amount}
              onChange={(e) => setFraudDetails((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g. 5000"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary outline-none focus:border-primary/60 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Payment App / Bank Name
            </label>
            <input
              type="text"
              value={fraudDetails.bankOrApp}
              onChange={(e) => setFraudDetails((prev) => ({ ...prev, bankOrApp: e.target.value }))}
              placeholder="e.g. Google Pay / SBI"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary outline-none focus:border-primary/60 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Transaction / UTR Reference ID
            </label>
            <input
              type="text"
              value={fraudDetails.refId}
              onChange={(e) => setFraudDetails((prev) => ({ ...prev, refId: e.target.value }))}
              placeholder="e.g. 12-digit UTR 324598124501"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary outline-none focus:border-primary/60 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1">
              Date & Time of Transaction
            </label>
            <input
              type="text"
              value={fraudDetails.dateTime}
              onChange={(e) => setFraudDetails((prev) => ({ ...prev, dateTime: e.target.value }))}
              placeholder="e.g. 2026-10-18 14:30"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-primary outline-none focus:border-primary/60 font-mono"
            />
          </div>
        </div>

        <p className="text-[10px] text-text-muted leading-relaxed">
          🔒 <b>Strict Privacy Guarantee:</b> Never enter card CVVs, PINs, OTPs, or passwords. Only reference metadata is copied for reporting purposes.
        </p>
      </div>

      {/* Official Emergency Contact Reference */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs">
        <div className="flex items-center gap-2">
          <FiZap className="text-primary" />
          <span className="text-text-primary font-medium">Emergency Reporting Line:</span>
          <span className="font-bold text-primary font-mono">1930</span>
        </div>
        <a
          href="https://cybercrime.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
        >
          <span>cybercrime.gov.in</span>
          <FiExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
