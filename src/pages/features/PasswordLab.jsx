import { useState, useMemo } from "react";
import { FiKey, FiEye, FiEyeOff, FiCheck, FiX, FiInfo, FiShield, FiClock, FiAlertTriangle, FiLock, FiCpu } from 'react-icons/fi';
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

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

    return {
      checks,
      score,
      strength,
      risk,
      isCommon,
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="w-full space-y-6">
        <PageHeader 
          title="Password Security Lab"
          description="Evaluate password strength and identify security risks."
          icon={<FiKey />}
        />

        {/* Password Input Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">
            Test Your Password
          </h2>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCopied(false);
                }}
                placeholder="Enter password..."
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
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={generatePassword}
            >
              ⚡ Generate Password
            </Button>

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
              }}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
            >
              Clear
            </button>
          </div>

          <p className="mt-3 text-xs text-text-secondary">
            {password.length} {password.length === 1 ? "character" : "characters"} entered
          </p>
        </div>

        {/* Strength & Risk Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Password Strength */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Password Strength
              </h2>
              <span className="text-xl">💪</span>
            </div>

            <p
              className={`mt-4 text-3xl font-bold ${
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

            <p className="mt-2 text-sm text-text-secondary">
              Security Score: <b className="text-text-primary">{analysis.score}/7</b>
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-bg border border-border">
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

          {/* Security Risk Level */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Security Risk Level
              </h2>
              <span className="text-xl">🛡️</span>
            </div>

            <p
              className={`mt-4 text-3xl font-bold ${
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

            <p className="mt-2 text-sm text-text-secondary">
              {password
                ? `${Math.round((analysis.score / 7) * 100)}% of security checks passed`
                : "Enter a password to evaluate risk level."}
            </p>
          </div>
        </div>

        {/* Common Password Warning */}
        {analysis.isCommon && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <b>Common Password Detected</b>
            </div>
            <p className="mt-1 text-sm text-danger">
              This password is in lists of commonly used passwords and is extremely vulnerable to dictionary attacks.
            </p>
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


