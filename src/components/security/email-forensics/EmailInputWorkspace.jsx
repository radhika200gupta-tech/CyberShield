import { useState, useEffect } from 'react';
import { 
  FiMail, FiPlay, FiTrash2, FiHelpCircle, 
  FiFileText, FiAlertCircle, FiChevronDown, FiChevronUp 
} from 'react-icons/fi';
import Button from '../../common/Button';
import { SAMPLE_EMAILS } from '../../../data/sampleEmailHeaders';

export default function EmailInputWorkspace({ onAnalyze, onClear, isAnalyzing, error, initialValue = '' }) {
  const [inputText, setInputText] = useState(initialValue);
  const [showGuide, setShowGuide] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (initialValue) {
      setInputText(initialValue);
    }
  }, [initialValue]);

  const handleAnalyze = () => {
    if (!inputText || !inputText.trim()) {
      setLocalError('Please paste raw email headers or an email message before analyzing.');
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed.includes('\n') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setLocalError('An email address alone cannot be evaluated for SPF/DKIM/DMARC authentication. Please paste complete RFC 5322 headers from your email client (or use "Investigate Sender" for OSINT footprint discovery).');
      return;
    }
    setLocalError(null);
    onAnalyze(inputText);
  };

  const handleLoadSample = (sampleId) => {
    const sample = SAMPLE_EMAILS.find(s => s.id === sampleId);
    if (sample) {
      setInputText(sample.rawContent);
      setLocalError(null);
      onAnalyze(sample.rawContent);
    }
  };

  const handleClear = () => {
    setInputText('');
    setLocalError(null);
    if (onClear) onClear();
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm w-full min-w-0 flex flex-col gap-4">
      
      {/* Workspace Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <FiMail className="text-accent" size={18} />
            <span>Email Header & Message Input Workspace</span>
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Paste raw RFC 5322 email headers (or the entire raw message). Analyzed 100% on-device.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-accent hover:underline font-mono cursor-pointer px-2.5 py-1 rounded hover:bg-accent/10 transition-colors"
          >
            <FiHelpCircle size={14} />
            <span>How to get raw headers?</span>
            {showGuide ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expandable Guide: How to extract email headers */}
      {showGuide && (
        <div className="p-4 sm:p-5 rounded-xl bg-surface/70 border border-accent/30 text-xs sm:text-sm space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <FiFileText className="text-accent" size={16} />
            <span>How to extract raw headers from common email clients:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-text-secondary leading-relaxed font-sans">
            <div className="p-3.5 rounded-lg bg-bg-elevated/60 border border-border/40">
              <strong className="text-text-primary block font-medium mb-1">Gmail (Web)</strong>
              Open the email &rarr; click the three dots (&vellip;) next to the Reply button &rarr; select <em>"Show original"</em> &rarr; click <em>"Copy to clipboard"</em>.
            </div>
            <div className="p-3.5 rounded-lg bg-bg-elevated/60 border border-border/40">
              <strong className="text-text-primary block font-medium mb-1">Microsoft Outlook / 365</strong>
              Open message &rarr; click three dots (&hellip;) &rarr; select <em>"View"</em> &rarr; <em>"View message details"</em> (or File &rarr; Properties &rarr; Internet Headers).
            </div>
            <div className="p-3.5 rounded-lg bg-bg-elevated/60 border border-border/40">
              <strong className="text-text-primary block font-medium mb-1">Apple Mail</strong>
              Select the email message &rarr; from top menu click <em>View</em> &rarr; <em>Message</em> &rarr; <em>All Headers</em> (or press Shift+Cmd+H).
            </div>
          </div>
          <p className="text-xs text-text-muted font-mono pt-1">
            <strong>Privacy Guarantee:</strong> CyberShield does not connect to your inbox or send email content to external cloud APIs. All parsing is executed locally within your browser.
          </p>
        </div>
      )}

      {/* Textarea for Raw Headers */}
      <div className="flex flex-col gap-2">
        <textarea
          rows={10}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (localError) setLocalError(null);
          }}
          disabled={isAnalyzing}
          placeholder={`Paste raw email headers here... For example:

Delivered-To: user@example.com
Received: from mail.relay.org (192.0.2.1) by mx.google.com...
Authentication-Results: mx.google.com; spf=pass; dkim=pass; dmarc=pass...
From: "Security Team" <security@example.com>
Subject: Verification Notice
...`}
          className="w-full bg-surface border border-border rounded-xl p-4 font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent custom-scrollbar leading-relaxed resize-y min-h-[220px]"
          spellCheck="false"
        />

        {(localError || error) && (
          <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
            <FiAlertCircle size={16} className="shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}
      </div>

      {/* Action Controls & Sample Scenarios */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        
        {/* Sample Load Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
          <span className="text-text-muted font-mono text-xs uppercase font-semibold mr-1">
            Load Sample:
          </span>
          {SAMPLE_EMAILS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleLoadSample(sample.id)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface/70 hover:bg-surface hover:border-accent/40 text-text-secondary hover:text-accent font-mono text-xs transition-colors cursor-pointer"
              title={sample.description}
            >
              {sample.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          {inputText && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isAnalyzing}
              className="text-xs sm:text-sm px-3.5 py-2.5 border-border hover:border-danger/40 hover:text-danger cursor-pointer"
            >
              <FiTrash2 size={14} className="mr-1.5" />
              <span>Clear</span>
            </Button>
          )}

          <Button
            variant="primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="text-sm px-6 py-2.5 font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-2 shadow-md"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FiPlay size={14} />
                <span>Analyze Email</span>
              </>
            )}
          </Button>
        </div>

      </div>

    </div>
  );
}
