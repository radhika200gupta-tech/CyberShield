import { useState } from "react";
import { FiShield, FiAlertTriangle, FiSearch, FiAlertOctagon } from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const initialWeeklyData = [
  { day: "Mon", threats: 2 },
  { day: "Tue", threats: 1 },
  { day: "Wed", threats: 3 },
  { day: "Thu", threats: 0 },
  { day: "Fri", threats: 2 },
  { day: "Sat", threats: 1 },
  { day: "Sun", threats: 0 },
];

export default function SecurityCommandCenter() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);

  const [score, setScore] = useState(() => {
    try {
      const saved = localStorage.getItem("securityScore");
      return saved !== null && !isNaN(Number(saved)) ? Number(saved) : 82;
    } catch {
      return 82;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("commandHistory");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Command Scanner
  const detectCommand = () => {
    if (!command.trim()) return;

    const text = command.toLowerCase();

    let status = "Safe";
    let risk = "Low";
    let reason = "No dangerous pattern detected.";

    if (
      text.includes("rm -rf") ||
      text.includes("del /f") ||
      text.includes("format c:") ||
      text.includes("shutdown")
    ) {
      status = "Dangerous";
      risk = "High";
      reason = "This command can cause data loss, destructive disk operations, or system shutdown.";
    } else if (
      text.includes("chmod 777") ||
      text.includes("sudo") ||
      text.includes("taskkill")
    ) {
      status = "Review";
      risk = "Medium";
      reason = "This command modifies permissions, requests root privileges, or forcefully terminates processes.";
    }

    const scan = {
      command: command.trim(),
      status,
      risk,
      reason,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setResult(scan);

    const newScore =
      status === "Dangerous"
        ? Math.max(score - 10, 0)
        : status === "Review"
        ? Math.max(score - 5, 0)
        : score;

    setScore(newScore);
    try {
      localStorage.setItem("securityScore", newScore.toString());
    } catch {
      // ignore storage write errors
    }

    const newHistory = [scan, ...history].slice(0, 10);
    setHistory(newHistory);
    try {
      localStorage.setItem("commandHistory", JSON.stringify(newHistory));
    } catch {
      // ignore storage write errors
    }

    setCommand("");
  };

  const highRiskCount = history.filter((item) => item.status === "Dangerous" || item.risk === "High").length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="w-full space-y-6">
        <PageHeader 
          title="Command Center"
          description="Detect and review potentially risky terminal and shell commands."
          icon={<FiShield />}
        >
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-text-secondary">
              Command Shield Active
            </span>
          </div>
        </PageHeader>

        {/* 4 Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FiShield size={20} />}
            label="Security Score"
            value={`${score}/100`}
            sub="Current security rating"
            color="cyan"
          />

          <StatCard
            icon={<FiAlertTriangle size={20} />}
            label="Threat Level"
            value={
              score >= 80
                ? "Low"
                : score >= 50
                ? "Medium"
                : "High"
            }
            sub="Based on recent command scans"
            color={score >= 80 ? "green" : score >= 50 ? "amber" : "red"}
          />

          <StatCard
            icon={<FiSearch size={20} />}
            label="Commands Scanned"
            value={history.length}
            sub="Recent command checks"
            color="blue"
          />

          <StatCard
            icon={<FiAlertOctagon size={20} />}
            label="High Risk"
            value={highRiskCount}
            sub="Dangerous commands detected"
            color="red"
          />
        </div>

        {/* Command Scanner */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-lg">
              🔍 
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Command Scanner
              </h2>
              <p className="text-xs text-text-secondary">
                Analyze bash, powershell, or shell commands before execution
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  detectCommand();
                }
              }}
              placeholder="Example: rm -rf /var/log or sudo chmod 777"
              className="flex-1 rounded-xl border border-border bg-bg px-4 py-3 font-mono text-sm text-text-primary outline-none transition focus:border-accent/50"
            />

            <Button
              onClick={detectCommand}
            >
              Scan Command
            </Button>
          </div>

          <p className="mt-3 text-xs text-text-secondary">
            Press Enter or click Scan Command to analyze risk patterns.
          </p>
        </div>

        {/* Scan Result */}
        {result && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Scan Result
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Latest command security analysis
                </p>
              </div>

              <span
                className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                  result.status === "Dangerous"
                    ? "bg-danger/10 text-danger border border-danger/30"
                    : result.status === "Review"
                    ? "bg-warning/10 text-warning border border-warning/30"
                    : "bg-success/10 text-success border border-success/30"
                }`}
              >
                {result.status}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-bg p-4">
              <p className="break-all font-mono text-sm text-text-primary font-semibold">
                <span className="text-primary">$</span> {result.command}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs font-medium text-text-secondary">
                  Risk Level
                </p>
                <p
                  className={`mt-2 text-xl font-bold ${
                    result.risk === "High"
                      ? "text-danger"
                      : result.risk === "Medium"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {result.risk}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs font-medium text-text-secondary">
                  Analysis Reasoning
                </p>
                <p className="mt-2 text-sm text-text-primary">
                  {result.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score & Weekly Threat Analytics Chart */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Security Score Display Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Security Score
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Overall system protection rating
                </p>
              </div>
              <span className="text-2xl">🛡️</span>
            </div>

            <div className="my-6 text-center">
              <p className="text-6xl font-extrabold text-accent tracking-tight">
                {score}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-text-secondary">
                OUT OF 100
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-bg border border-border">
                <div
                  className={`h-full transition-all duration-500 ${
                    score >= 80
                      ? "bg-success"
                      : score >= 50
                      ? "bg-warning"
                      : "bg-danger"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(score, 0), 100)}%`,
                  }}
                />
              </div>

              <p className="mt-5 text-sm font-semibold">
                {score >= 80
                  ? "🟢 Good Security Posture"
                  : score >= 50
                  ? "🟡 Security Review Recommended"
                  : "🔴 Critical Risk Detected"}
              </p>
            </div>

            <p className="text-xs text-center text-text-secondary">
              Score dynamically adjusts based on detected high-risk commands.
            </p>
          </div>

          {/* Weekly Threat Analytics Recharts */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  📊 Threat Analytics
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Weekly command threat activity
                </p>
              </div>
              <span className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
                Last 7 Days
              </span>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={initialWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="threatAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-text-muted)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--color-text-muted)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      color: "var(--color-text-primary)",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "var(--color-text-secondary)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="threats"
                    stroke="var(--color-danger)"
                    strokeWidth={2.5}
                    fill="url(#threatAreaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                🕒 Scan History
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Recently analyzed command logs
              </p>
            </div>

            <span className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text-secondary">
              {history.length} {history.length === 1 ? "scan" : "scans"}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-3 text-sm text-text-secondary">
                No commands scanned yet. Enter a command above to analyze.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-bg p-4 transition hover:border-border-hover"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="break-all font-mono text-sm text-text-primary font-semibold">
                        <span className="text-primary">$</span> {item.command}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {item.reason} • <span className="text-text-muted">{item.time}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.risk === "High"
                            ? "bg-danger/10 text-danger border border-danger/30"
                            : item.risk === "Medium"
                            ? "bg-warning/10 text-warning border border-warning/30"
                            : "bg-success/10 text-success border border-success/30"
                        }`}
                      >
                        {item.risk} Risk
                      </span>

                      <span className="text-xs font-medium text-text-secondary">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colorMap = {
    cyan: "bg-accent/10 text-accent border-accent/20",
    blue: "bg-primary/10 text-primary border-primary/20",
    red: "bg-danger/10 text-danger border-danger/20",
    green: "bg-success/10 text-success border-success/20",
    amber: "bg-warning/10 text-warning border-warning/20",
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          <p className="mt-1 text-[11px] text-text-secondary">{sub}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-base ${
            colorMap[color] || colorMap.cyan
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


