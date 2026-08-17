import { useState } from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import ThemeToggle from '../common/ThemeToggle';
import { recentActivity } from '../../data/mockDashboard';

export default function DashboardHeader({ title, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifCount = 3;

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-text-secondary" onClick={onMenuClick} aria-label="Open sidebar">
          <FiMenu size={20} />
        </button>
        <h1 className="font-display font-semibold text-lg text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <FiBell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-card shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-text-primary">Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {recentActivity.slice(0, 4).map((item) => (
                  <div key={item.id} className="px-4 py-3 text-sm hover:bg-surface-hover transition-colors">
                    <p className="text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
