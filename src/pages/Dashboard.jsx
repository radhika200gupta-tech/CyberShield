import { FiShield, FiAlertTriangle, FiLink, FiKey, FiActivity, FiCpu, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import ChartCard from '../components/charts/ChartCard';
import WeeklyThreatsChart from '../components/charts/WeeklyThreatsChart';
import MonthlyScansChart from '../components/charts/MonthlyScansChart';
import RiskDistributionChart from '../components/charts/RiskDistributionChart';
import {
  dashboardCards, weeklyThreats, monthlyScans, riskDistribution, recentActivity,
} from '../data/mockDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Operator';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 animate-fade-in">
      
      {/* 1. PREMIUM HEADER / SECURITY STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 mb-3">
             <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
             <span className="text-[10px] font-bold text-success uppercase tracking-widest">Security Systems Operational</span>
          </div>
          <h1 className="font-display font-semibold text-2xl text-text-primary tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Here's your current security posture across phishing, URLs, passwords, and threat activity.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded border border-border/50 bg-bg-elevated/30 flex items-center gap-2">
            <FiShield className="text-primary" size={14} />
            <span className="text-xs font-mono text-text-primary">PROTECTED</span>
          </div>
          <div className="px-3 py-1.5 rounded border border-border/50 bg-bg-elevated/30 flex items-center gap-2">
            <FiActivity className="text-accent" size={14} />
            <span className="text-xs font-mono text-text-primary">MONITORING: LAST 7 DAYS</span>
          </div>
        </div>
      </div>

      {/* 2. SECURITY OVERVIEW */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiShield} label="Security Score" value={dashboardCards.securityScore} suffix="/100" color="primary" trend={{ positive: true, label: '4 pts this week' }} />
        <StatCard icon={FiAlertTriangle} label="Threats Detected" value={dashboardCards.threatsDetected} color="danger" trend={{ positive: false, label: '3 more than last week' }} />
        <StatCard icon={FiLink} label="Safe URLs" value={dashboardCards.safeUrls} color="success" trend={{ positive: true, label: '12 scanned today' }} />
        <StatCard icon={FiKey} label="Password Health" value={dashboardCards.passwordHealth} suffix="%" color="accent" trend={{ positive: true, label: '6% improvement' }} />
      </div>

      {/* 3. QUICK SECURITY TOOLS */}
      <div className="pt-2">
        <QuickActions />
      </div>

      {/* 4. SECURITY INTELLIGENCE / ANALYTICS */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 bg-text-muted rounded-full" />
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Security Intelligence</h3>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            <ChartCard title="Weekly Threat Activity" subtitle="Detections over the last 7 days">
              <WeeklyThreatsChart data={weeklyThreats} />
            </ChartCard>
            <ChartCard title="Monthly Scans" subtitle="Total scans run per month">
              <MonthlyScansChart data={monthlyScans} />
            </ChartCard>
            <div className="sm:col-span-2">
              <ChartCard title="Risk Distribution" subtitle="Breakdown of all scans by risk level">
                <RiskDistributionChart data={riskDistribution} />
              </ChartCard>
            </div>
          </div>

          {/* 5. RECENT SECURITY ACTIVITY */}
          <div className="lg:col-span-1">
            <RecentActivity activity={recentActivity} />
          </div>
        </div>
      </div>

      {/* 6. SECURITY INSIGHTS */}
      <div className="grid md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl border border-border/30 bg-bg-elevated/20 flex items-start gap-3">
           <FiCpu className="text-accent shrink-0 mt-0.5" size={16} />
           <div>
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">Threat Monitoring</h4>
             <p className="text-[10px] text-text-muted leading-relaxed">Active heuristic engines detected {dashboardCards.threatsDetected} potential threats in recent scans.</p>
           </div>
        </div>
        <div className="p-4 rounded-xl border border-border/30 bg-bg-elevated/20 flex items-start gap-3">
           <FiShield className="text-primary shrink-0 mt-0.5" size={16} />
           <div>
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">Security Posture</h4>
             <p className="text-[10px] text-text-muted leading-relaxed">Overall posture is stable at {dashboardCards.securityScore}/100. Consider completing pending Phishing Simulator training.</p>
           </div>
        </div>
        <div className="p-4 rounded-xl border border-border/30 bg-bg-elevated/20 flex items-start gap-3">
           <FiLock className="text-success shrink-0 mt-0.5" size={16} />
           <div>
             <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">Account Security</h4>
             <p className="text-[10px] text-text-muted leading-relaxed">Global password health averages {dashboardCards.passwordHealth}%. Multi-factor authentication is active.</p>
           </div>
        </div>
      </div>

      {/* 7. BOTTOM SYSTEM STATUS */}
      <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
          <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-widest">CYBERSHIELD MONITORING ACTIVE</span>
        </div>
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Browser-side security intelligence
        </span>
      </div>

    </div>
  );
}
