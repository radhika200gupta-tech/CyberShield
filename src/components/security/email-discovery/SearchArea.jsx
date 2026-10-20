import { useState } from 'react';
import { FiMail, FiSearch, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { SAMPLE_DISCOVERY_SCENARIOS } from '../../../data/sampleEmailDiscoveryData';

export default function SearchArea({
  onAnalyze,
  onReset,
  isAnalyzing,
  error,
  initialEmail = ''
}) {
  const [email, setEmail] = useState(initialEmail);
  const [activeScenarioId, setActiveScenarioId] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isAnalyzing || !email.trim()) return;
    onAnalyze(email.trim(), { isSample: false });
  };

  const handleSelectScenario = (sc) => {
    if (isAnalyzing) return;
    setEmail(sc.email);
    setActiveScenarioId(sc.id);
    onAnalyze(sc.email, { isSample: true, sampleId: sc.id });
  };

  const handleClear = () => {
    setEmail('');
    setActiveScenarioId('');
    if (onReset) onReset();
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="discovery-email-input"
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted"
        >
          <FiMail size={13} className="text-accent" />
          <span>Email Address to Investigate</span>
        </label>

        {/* Input + Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <FiMail size={16} />
            </div>
            <input
              id="discovery-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setActiveScenarioId('');
              }}
              disabled={isAnalyzing}
              placeholder="e.g. name@company.com or user@gmail.com"
              className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border rounded-lg text-sm sm:text-base font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
            />
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isAnalyzing || !email.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#05080D] font-semibold text-sm rounded-lg hover:bg-primary-dim shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <FiSearch size={15} />
                <span>Investigate Email</span>
              </>
            )}
          </button>

          {/* Clear Button */}
          {email && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isAnalyzing}
              className="px-3.5 py-3 rounded-lg border border-border bg-bg-surface hover:bg-bg-elevated text-xs font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title="Clear input"
            >
              <FiRefreshCw size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs sm:text-sm text-rose-400 animate-fade-in">
          <FiAlertCircle className="shrink-0 mt-0.5" size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Subtle Bottom Footer: Demo/Live Note & Sample Chips */}
      <div className="pt-2.5 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        
        {/* Sample chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-text-muted text-xs font-mono mr-1">
            Try Sample:
          </span>
          {SAMPLE_DISCOVERY_SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                disabled={isAnalyzing}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                    : 'bg-bg-surface border border-border/70 text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                {sc.title.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Live / Demo Mode Status Note */}
        <div className="text-xs text-text-muted font-mono self-start md:self-auto">
          {activeScenarioId ? (
            <span className="text-blue-400 font-medium">
              ● Viewing Demonstration Scenario (Simulated Telemetry)
            </span>
          ) : (
            <span>
              ● Live Client-Side Lookup (Passive Gravatar & Domain Telemetry)
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
