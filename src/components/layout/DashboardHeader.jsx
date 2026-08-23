import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { recentActivity } from '../../data/mockDashboard';

export default function DashboardHeader({ title, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const notifCount = 3;

  // Close notifications on route change
  useEffect(() => {
    setNotifOpen(false);
  }, [location.pathname]);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              notifOpen ? 'bg-bg-elevated text-primary border border-border/50 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <FiBell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger border border-bg-elevated" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-border bg-surface/50">
                <p className="text-sm font-semibold text-text-primary">Notifications</p>
              </div>
              <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/50">
                {recentActivity.slice(0, 4).map((item) => (
                  <div key={item.id} className="px-4 py-3 text-sm hover:bg-surface transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-text-primary font-medium group-hover:text-primary transition-colors">{item.label}</p>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border bg-surface/50 text-center">
                <button className="text-xs font-medium text-text-secondary hover:text-primary transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
