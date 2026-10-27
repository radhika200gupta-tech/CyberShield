import { useState } from 'react';
import { 
  FiMoon, FiSun, FiMonitor, FiBell, FiLock, 
  FiRefreshCw, FiSave, FiSettings
} from 'react-icons/fi';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4">
    <div className="pr-4">
      <h4 className="text-sm font-medium text-text-primary">{label}</h4>
      <p className="text-xs text-text-secondary mt-1">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-elevated ${checked ? 'bg-accent' : 'bg-border'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

// Restore the appearance theme controls in Settings
const SHOW_APPEARANCE_SETTINGS = true;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const defaultSettings = {
    notifications: {
      securityAlerts: true,
      scanResults: true,
      productUpdates: false
    },
    privacy: {
      saveScanHistory: true,
      showRecommendations: true
    }
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cybershield_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.error('Failed to parse settings');
      }
    }
    return defaultSettings;
  });

  const handleSave = () => {
    localStorage.setItem('cybershield_settings', JSON.stringify(settings));
    showToast('Settings saved successfully', 'success');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setTheme('dark');
    showToast('Settings reset to defaults', 'info');
  };

  const updateSection = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader 
        title="Account & Preferences" 
        description="Manage your account settings, theme preferences, and notifications."
        icon={<FiSettings />}
      >
        <Button variant="ghost" onClick={handleReset}>
          <FiRefreshCw className="mr-2" size={14} /> Reset
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <FiSave className="mr-2" size={14} /> Save Settings
        </Button>
      </PageHeader>

      <div className="space-y-6">
        {/* Appearance - Temporarily hidden for dark-mode only */}
        {SHOW_APPEARANCE_SETTINGS && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-4">
              <FiMonitor className="text-accent" /> Appearance
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`theme-option-card p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'active border-accent bg-accent/10 ring-1 ring-accent/30'
                    : 'border-border hover:border-border-hover bg-surface hover:bg-surface-hover'
                }`}
              >
                <FiSun size={24} className={theme === 'light' ? 'text-accent' : 'text-text-muted'} />
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  Light
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`theme-option-card p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'active border-accent bg-accent/10 ring-1 ring-accent/30'
                    : 'border-border hover:border-border-hover bg-surface hover:bg-surface-hover'
                }`}
              >
                <FiMoon size={24} className={theme === 'dark' ? 'text-accent' : 'text-text-muted'} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  Dark
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`theme-option-card p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'active border-accent bg-accent/10 ring-1 ring-accent/30'
                    : 'border-border hover:border-border-hover bg-surface hover:bg-surface-hover'
                }`}
              >
                <FiMonitor size={24} className={theme === 'system' ? 'text-accent' : 'text-text-muted'} />
                <span className={`text-sm font-medium ${theme === 'system' ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  System
                </span>
              </button>
            </div>
          </Card>
        )}

        {/* Notifications */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-medium text-text-primary mb-2 flex items-center gap-2 border-b border-border pb-4">
            <FiBell className="text-accent" /> Notifications
          </h3>
          <div className="divide-y divide-border">
            <Toggle 
              label="Security Alerts" 
              description="Receive immediate notifications for critical security events."
              checked={settings.notifications.securityAlerts}
              onChange={(val) => updateSection('notifications', 'securityAlerts', val)}
            />
            <Toggle 
              label="Scan Results" 
              description="Get notified when automated scans complete."
              checked={settings.notifications.scanResults}
              onChange={(val) => updateSection('notifications', 'scanResults', val)}
            />
            <Toggle 
              label="Product Updates" 
              description="Receive news about new features and improvements."
              checked={settings.notifications.productUpdates}
              onChange={(val) => updateSection('notifications', 'productUpdates', val)}
            />
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-medium text-text-primary mb-2 flex items-center gap-2 border-b border-border pb-4">
            <FiLock className="text-accent" /> Privacy
          </h3>
          <div className="divide-y divide-border">
            <Toggle 
              label="Save scan history locally" 
              description="Keep a record of your past URL and Screenshot scans in your browser."
              checked={settings.privacy.saveScanHistory}
              onChange={(val) => updateSection('privacy', 'saveScanHistory', val)}
            />
            <Toggle 
              label="Show security recommendations" 
              description="Allow CyberShield to provide contextual security tips."
              checked={settings.privacy.showRecommendations}
              onChange={(val) => updateSection('privacy', 'showRecommendations', val)}
            />
          </div>
        </Card>

      </div>
    </div>
  );
}
