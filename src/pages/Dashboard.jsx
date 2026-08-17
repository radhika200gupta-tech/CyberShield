import { FiShield, FiAlertTriangle, FiLink, FiKey } from 'react-icons/fi';
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-text-primary">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-text-secondary mt-1">Here&rsquo;s what CyberShield AI has been watching for you.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiShield} label="Security Score" value={dashboardCards.securityScore} suffix="/100" color="primary" trend={{ positive: true, label: '4 pts this week' }} />
        <StatCard icon={FiAlertTriangle} label="Threats Detected" value={dashboardCards.threatsDetected} color="danger" trend={{ positive: false, label: '3 more than last week' }} />
        <StatCard icon={FiLink} label="Safe URLs" value={dashboardCards.safeUrls} color="success" trend={{ positive: true, label: '12 scanned today' }} />
        <StatCard icon={FiKey} label="Password Health" value={dashboardCards.passwordHealth} suffix="%" color="accent" trend={{ positive: true, label: '6% improvement' }} />
      </div>

      <QuickActions />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <ChartCard title="Weekly Threats" subtitle="Detections over the last 7 days">
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

        <RecentActivity activity={recentActivity} />
      </div>
    </div>
  );
}
