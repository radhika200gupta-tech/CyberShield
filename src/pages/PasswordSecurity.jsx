import { useState, useMemo } from "react";
import {
  FiKey,
  FiClock,
  FiLock,
  FiAlertTriangle,
  FiSearch,
  FiCheckCircle,
  FiAlertOctagon,
} from 'react-icons/fi';
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { estimateCrackTime } from "../utils/passwordCrackingEstimator";

// Native Web Crypto API to calculate SHA-1 hash locally
async function getSha1Hash(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export default function PasswordSecurity() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  // Have I Been Pwned API State
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [breachResult, setBreachResult] = useState(null); // { checked, count, isPwned, error }

  const commonPasswords = useMemo(
    () => [
      "password",
      "password123",
      "123456",
      "12345678",
      "123456789",
      "qwerty",
      "admin",
      "welcome",
      "letmein",
      "iloveyou",
      "monkey",
      "dragon",
      "football",
      "master",
    ],
    []
  );

  const analysis = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      long: password.length >= 12,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
      spaces: password.length > 0 && !/\s/.test(password),
    };

    const isCommon =
      Boolean(password) && commonPasswords.includes(password.toLowerCase());

    const score = Object.values(checks).filter(Boolean).length;

    let strength = "Not Tested";
    let risk = "—";

    if (password) {
      if (isCommon || score < 3) {
        strength = "Very Weak";
        risk = "HIGH";
      } else if (score < 5) {
        strength = "Weak";
        risk = "MEDIUM";
      } else if (score < 6) {
        strength = "Good";
        risk = "LOW";
      } else {
        strength = "Strong";
        risk = "LOW";
      }
    }

    // Local approximate cracking estimate
    const crackEstimate = estimateCrackTime(password, isCommon);

    return {
      checks,
      score,
      strength,
      risk,
      isCommon,
      crackEstimate,
      upper: (password.match(/[A-Z]/g) || []).length,
      lower: (password.match(/[a-z]/g) || []).length,
      numbers: (password.match(/[0-9]/g) || []).length,
      symbols: (password.match(/[^A-Za-z0-9]/g) || []).length,
    };
  }, [password, commonPasswords]);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let newPassword = "";
    for (let i = 0; i < 16; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(newPassword);
    setCopied(false);
    setBreachResult(null);
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Have I Been Pwned (HIBP) k-Anonymity API check
  const checkPwnedPassword = async () => {
    if (!password) {
      setBreachResult({ error: "Please enter a password first." });
      return;
    }

    setCheckingBreach(true);
    setBreachResult(null);

    try {
      // 1. Calculate SHA-1 locally in browser
      const fullHash = await getSha1Hash(password);
      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);

      // 2. Fetch from HIBP API (only sends first 5 characters of hash)
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) {
        throw new Error(`Service returned HTTP ${res.status}`);
      }

      const text = await res.text();
      const lines = text.split('\n');

      let breachCount = 0;
      for (const line of lines) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (hashSuffix === suffix) {
          breachCount = parseInt(countStr, 10);
          break;
        }
      }

      setBreachResult({
        checked: true,
        count: breachCount,
        isPwned: breachCount > 0,
      });
    } catch {
      setBreachResult({
        checked: false,
        error: "Unable to reach the breach database. Please verify your internet connection.",
      });
    } finally {
      setCheckingBreach(false);
    }
  };

  const recommendation = () => {
    if (!password) return "Enter a password to start the security analysis.";
    if (analysis.isCommon) return "⚠️ This password is commonly used and easily cracked. Create a unique passphrase.";
    if (!analysis.checks.length) return "Use at least 8 characters to meet baseline security requirements.";
    if (!analysis.checks.long) return "Use 12 or more characters for stronger defense against brute-force attacks.";
    if (!analysis.checks.upper) return "Add uppercase letters (A-Z) to increase password complexity.";
    if (!analysis.checks.lower) return "Add lowercase letters (a-z) to diversify character sets.";
    if (!analysis.checks.number) return "Add at least one number (0-9).";
    if (!analysis.checks.symbol) return "Add a special symbol like !, @, #, $, or &.";
    if (!analysis.checks.spaces) return "Remove spaces to ensure security compliance and avoid whitespace issues.";
    return "Excellent! Your password passes all security checks and demonstrates strong resilience.";
  };

  const checksList = [
    { label: "8+ characters", passed: analysis.checks.length },
    { label: "12+ characters", passed: analysis.checks.long },
    { label: "Uppercase letter", passed: analysis.checks.upper },
    { label: "Lowercase letter", passed: analysis.checks.lower },
    { label: "Number", passed: analysis.checks.number },
    { label: "Special symbol", passed: analysis.checks.symbol },
    { label: "No spaces", passed: analysis.checks.spaces },
  ];

  const { crackEstimate } = analysis;

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 pb-12 animate-fade-in">
      <div className="w-full space-y-6">
        <PageHeader 
          title="Password Security Lab"
          description="Evaluate password strength, inspect approximate cracking time, and check public breach records using Have I Been Pwned."
          icon={<FiKey className="text-primary" />}
        />

        {/* Password Input Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Test Your Password
            </h2>
            <span className="text-[11px] font-mono text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
              <FiLock size={11} /> Calculated Locally in Browser
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCopied(false);
                  setBreachResult(null);
                }}
                placeholder="Type or paste a password to analyze..."
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 font-mono text-sm text-text-primary outline-none transition focus:border-accent/50"
              />
            </div>

            <button
              type="button"
              onClick={() => setShow(!show)}
              className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-surface-hover"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={generatePassword}
            >
              ⚡ Generate Password
            </Button>

            {/* Have I Been Pwned API Check Button */}
            <button
              type="button"
              onClick={checkPwnedPassword}
              disabled={!password || checkingBreach}
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiSearch size={14} />
              {checkingBreach ? "Checking Breach Records..." : "Check Data Breaches"}
            </button>

            <button
              type="button"
              onClick={copyPassword}
              disabled={!password}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPassword("");
                setCopied(false);
                setBreachResult(null);
              }}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
            >
              Clear
            </button>
          </div>

          {/* Breach Status API Result Display */}
          {breachResult && (
            <div className="mt-4 pt-4 border-t border-border/50">
              {breachResult.error && (
                <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 text-warning text-xs flex items-center gap-2">
                  <FiAlertTriangle size={15} className="shrink-0" />
                  <span>{breachResult.error}</span>
                </div>
              )}

              {breachResult.checked && breachResult.isPwned && (
                <div className="p-3.5 rounded-xl border border-danger/40 bg-danger/10 text-danger text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FiAlertOctagon size={16} />
                    <span>Compromised in Known Data Breaches!</span>
                  </div>
                  <p className="text-danger/90 leading-relaxed">
                    This password was found <b>{breachResult.count.toLocaleString()} times</b> in previously exposed data breach records (via Have I Been Pwned API). You should never use this password.
                  </p>
                  <p className="text-[10px] text-text-muted pt-1">
                    k-Anonymity Verified: Only the first 5 characters of SHA-1 hash were sent to the API. Your password was never transmitted.
                  </p>
                </div>
              )}

              {breachResult.checked && !breachResult.isPwned && (
                <div className="p-3.5 rounded-xl border border-success/40 bg-success/10 text-success text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FiCheckCircle size={16} />
                    <span>Not Found in Known Breach Records</span>
                  </div>
                  <p className="text-success/90 leading-relaxed">
                    Good news! This password was not found in known public data breach records (via Have I Been Pwned API).
                  </p>
                  <p className="text-[10px] text-text-muted pt-1">
                    k-Anonymity Verified: Only the first 5 characters of SHA-1 hash were sent to the API. Your password was never transmitted.
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="mt-3 text-xs text-text-secondary">
            {password.length} {password.length === 1 ? "character" : "characters"} entered
          </p>
        </div>

        {/* 3-METRIC GRID: Strength, Risk Level, and Approximate Cracking Time */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full min-w-0">
          {/* 1. Password Strength */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Password Strength
                </h2>
                <span className="text-xl">💪</span>
              </div>

              <p
                className={`mt-4 text-3xl font-bold font-display ${
                  analysis.strength === "Strong"
                    ? "text-success"
                    : analysis.strength === "Good"
                    ? "text-accent"
                    : analysis.strength === "Weak"
                    ? "text-warning"
                    : analysis.strength === "Very Weak"
                    ? "text-danger"
                    : "text-text-secondary"
                }`}
              >
                {analysis.strength}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                Security Score: <b className="text-text-primary">{analysis.score}/7 checks passed</b>
              </p>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-bg border border-border">
              <div
                className={`h-full transition-all duration-300 ${
                  analysis.score >= 6
                    ? "bg-success"
                    : analysis.score >= 5
                    ? "bg-primary"
                    : analysis.score >= 3
                    ? "bg-warning"
                    : "bg-danger"
                }`}
                style={{
                  width: `${(analysis.score / 7) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 2. Security Risk Level */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Security Risk Level
                </h2>
                <span className="text-xl">🛡️</span>
              </div>

              <p
                className={`mt-4 text-3xl font-bold font-display ${
                  analysis.risk === "HIGH"
                    ? "text-danger"
                    : analysis.risk === "MEDIUM"
                    ? "text-warning"
                    : analysis.risk === "LOW"
                    ? "text-success"
                    : "text-text-secondary"
                }`}
              >
                {analysis.risk}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                {password
                  ? `${Math.round((analysis.score / 7) * 100)}% of baseline checks passed`
                  : "Enter a password to evaluate risk level."}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-border/50 text-[11px] text-text-muted flex items-center justify-between">
              <span>Risk Threshold</span>
              <span className="font-mono">{analysis.risk === 'LOW' ? 'Secure' : analysis.risk === 'MEDIUM' ? 'Elevated' : 'Critical'}</span>
            </div>
          </div>

          {/* 3. Approximate Cracking Time Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <FiClock className="text-primary" size={15} />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted font-mono">
                    Time to Crack
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                  Approximate
                </span>
              </div>

              <p
                className={`mt-4 text-2xl sm:text-3xl font-bold font-display tracking-tight ${crackEstimate.color}`}
              >
                {crackEstimate.timeText}
              </p>

              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                {password
                  ? 'Estimated theoretical brute-force time (~1B guesses/sec).'
                  : 'Enter password to estimate time.'}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-border/50 text-[11px] text-text-muted">
              <span>Note: Approximate estimate, not a guarantee.</span>
            </div>
          </div>
        </div>

        {/* Basic Warning for Common Passwords or Predictable Patterns */}
        {crackEstimate.patternWarning && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning flex items-start gap-3">
            <FiAlertTriangle className="text-lg shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Security Notice</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {crackEstimate.patternWarning}
              </p>
            </div>
          </div>
        )}

        {/* Security Checks */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            🔍 Security Checks
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {checksList.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition ${
                  check.passed
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-danger/30 bg-danger/5 text-danger"
                }`}
              >
                <span className="text-base">{check.passed ? "✅" : "❌"}</span>
                <span className="text-sm font-medium">{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Character Breakdown */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            🔤 Character Breakdown
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatBox name="Total" value={password.length} />
            <StatBox name="Uppercase" value={analysis.upper} />
            <StatBox name="Lowercase" value={analysis.lower} />
            <StatBox name="Numbers" value={analysis.numbers} />
            <StatBox name="Symbols" value={analysis.symbols} />
          </div>
        </div>

        {/* Recommendation Section */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-lg font-semibold text-text-primary">
              Security Recommendation
            </h2>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {recommendation()}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ name, value }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4 text-center">
      <p className="text-xs font-medium text-text-secondary">{name}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
