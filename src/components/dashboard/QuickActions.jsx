import { useNavigate } from 'react-router-dom';
import { FiCamera, FiCrosshair, FiLink, FiMaximize, FiKey, FiShield, FiArrowRight } from 'react-icons/fi';
import { ROUTES } from '../../constants/routes';

const ACTIONS = [
  { icon: FiCamera, title: 'Screenshot Phishing Analyzer', description: 'Analyze screenshots for threats', path: ROUTES.SCREENSHOT_ANALYZER, borderColor: 'border-l-primary', iconColor: 'text-primary' },
  { icon: FiCrosshair, title: 'Phishing Simulator', description: 'Practice threat detection', path: ROUTES.PHISHING_SIMULATOR, borderColor: 'border-l-accent', iconColor: 'text-accent' },
  { icon: FiLink, title: 'Smart URL Scanner', description: 'Scan links for reputation risk', path: ROUTES.URL_SCANNER, borderColor: 'border-l-warning', iconColor: 'text-warning' },
  { icon: FiMaximize, title: 'QR Security Scanner', description: 'Analyze QR code destinations', path: ROUTES.QR_SCANNER, borderColor: 'border-l-primary', iconColor: 'text-primary' },
  { icon: FiKey, title: 'Password Security Lab', description: 'Check strength & entropy', path: ROUTES.PASSWORD_LAB, borderColor: 'border-l-accent', iconColor: 'text-accent' },
  { icon: FiShield, title: 'Security Command Center', description: 'Monitor overall risk', path: ROUTES.SECURITY_CENTER, borderColor: 'border-l-warning', iconColor: 'text-warning' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Active Security Tools</h3>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACTIONS.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`flex items-center justify-between p-4 bg-bg-elevated/40 hover:bg-surface border border-border/50 border-l-2 ${action.borderColor} rounded-r-xl rounded-l-sm text-left group transition-all`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded bg-surface/50 border border-border/50 ${action.iconColor}`}>
                <action.icon size={16} />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm group-hover:text-accent transition-colors">{action.title}</p>
                <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide">{action.description}</p>
              </div>
            </div>
            <FiArrowRight className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
