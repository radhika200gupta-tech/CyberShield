import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
    <div className="min-h-screen bg-[#05070d] p-6 text-[#e7eaf3]">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl text-[#e7eaf3]">
                Security Command Center
              </h1>
              <p className="mt-1 text-sm text-[#8b93a7]">
                Detect and review potentially risky terminal and shell system commands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-[#1e2433] bg-[#10141f] px-4 py-2.5 shadow-sm sm:self-auto">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-[#8b93a7]">
              Command Shield Active
            </span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="🛡️"
            label="Security Score"
            value={`${score}/100`}
            sub="Current security rating"
            color="cyan"
          />

          <StatCard
            icon="⚠️"
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
            icon="🔍"
            label="Commands Scanned"
            value={history.length}
            sub="Recent command checks"
            color="blue"
          />

          <StatCard
            icon="🚨"
            label="High Risk"
            value={highRiskCount}
            sub="Dangerous commands detected"
            color="red"
          />
        </div>

        {/* Command Scanner */}
        <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-lg">
              🔍
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#e7eaf3]">
                Command Scanner
              </h2>
              <p className="text-xs text-[#8b93a7]">
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
              className="flex-1 rounded-xl border border-[#1e2433] bg-[#05070d] px-4 py-3 font-mono text-sm text-[#e7eaf3] outline-none transition focus:border-cyan-400/50"
            />

            <button
              type="button"
              onClick={detectCommand}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 active:scale-95"
            >
              Scan Command
            </button>
          </div>

          <p className="mt-3 text-xs text-[#8b93a7]">
            Press Enter or click Scan Command to analyze risk patterns.
          </p>
        </div>

        {/* Scan Result */}
        {result && (
          <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#e7eaf3]">
                  Scan Result
                </h2>
                <p className="mt-1 text-xs text-[#8b93a7]">
                  Latest command security analysis
                </p>
              </div>

              <span
                className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                  result.status === "Dangerous"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : result.status === "Review"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                    : "bg-green-500/10 text-green-400 border border-green-500/30"
                }`}
              >
                {result.status}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-[#1e2433] bg-[#05070d] p-4">
              <p className="break-all font-mono text-sm text-cyan-300">
                $ {result.command}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#1e2433] bg-[#05070d] p-4">
                <p className="text-xs font-medium text-[#8b93a7]">
                  Risk Level
                </p>
                <p
                  className={`mt-2 text-xl font-bold ${
                    result.risk === "High"
                      ? "text-red-400"
                      : result.risk === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {result.risk}
                </p>
              </div>

              <div className="rounded-xl border border-[#1e2433] bg-[#05070d] p-4">
                <p className="text-xs font-medium text-[#8b93a7]">
                  Analysis Reasoning
                </p>
                <p className="mt-2 text-sm text-[#e7eaf3]">
                  {result.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score & Weekly Threat Analytics Chart */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Security Score Display Card */}
          <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#e7eaf3]">
                  Security Score
                </h2>
                <p className="mt-1 text-xs text-[#8b93a7]">
                  Overall system protection rating
                </p>
              </div>
              <span className="text-2xl">🛡️</span>
            </div>

            <div className="my-6 text-center">
              <p className="text-6xl font-extrabold text-cyan-400 tracking-tight">
                {score}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-[#8b93a7]">
                OUT OF 100
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#05070d] border border-[#1e2433]">
                <div
                  className={`h-full transition-all duration-500 ${
                    score >= 80
                      ? "bg-green-400"
                      : score >= 50
                      ? "bg-yellow-400"
                      : "bg-red-400"
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

            <p className="text-xs text-center text-[#8b93a7]">
              Score dynamically adjusts based on detected high-risk commands.
            </p>
          </div>

          {/* Weekly Threat Analytics Recharts */}
          <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-6 shadow-xl lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#e7eaf3]">
                  📊 Threat Analytics
                </h2>
                <p className="mt-1 text-xs text-[#8b93a7]">
                  Weekly command threat activity
                </p>
              </div>
              <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
                Last 7 Days
              </span>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={initialWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="threatAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#5a6377"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#5a6377"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#10141f",
                      border: "1px solid #1e2433",
                      borderRadius: "12px",
                      color: "#e7eaf3",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#8b93a7" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="threats"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#threatAreaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#e7eaf3]">
                🕒 Scan History
              </h2>
              <p className="mt-1 text-xs text-[#8b93a7]">
                Recently analyzed command logs
              </p>
            </div>

            <span className="rounded-lg border border-[#1e2433] bg-[#05070d] px-3 py-1.5 text-xs text-[#8b93a7]">
              {history.length} {history.length === 1 ? "scan" : "scans"}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#1e2433] p-8 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-3 text-sm text-[#8b93a7]">
                No commands scanned yet. Enter a command above to analyze.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#1e2433] bg-[#05070d] p-4 transition hover:border-[#2a3245]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="break-all font-mono text-sm text-cyan-300">
                        $ {item.command}
                      </p>
                      <p className="mt-1 text-xs text-[#8b93a7]">
                        {item.reason} • <span className="text-[#5a6377]">{item.time}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.risk === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : item.risk === "Medium"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                            : "bg-green-500/10 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {item.risk} Risk
                      </span>

                      <span className="text-xs font-medium text-[#8b93a7]">
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
    cyan: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    blue: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    red: "bg-red-400/10 text-red-400 border-red-400/20",
    green: "bg-green-400/10 text-green-400 border-green-400/20",
    amber: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  };

  return (
    <div className="rounded-2xl border border-[#1e2433] bg-[#10141f] p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#8b93a7]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#e7eaf3]">{value}</p>
          <p className="mt-1 text-[11px] text-[#8b93a7]">{sub}</p>
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
