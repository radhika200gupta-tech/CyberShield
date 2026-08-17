import { useNavigate } from 'react-router-dom';
import { FiCamera, FiCrosshair, FiLink, FiMaximize, FiKey, FiShield, FiArrowRight } from 'react-icons/fi';
import Card from '../common/Card';
import { ROUTES } from '../../constants/routes';

const ACTIONS = [
  { icon: FiCamera, title: 'Screenshot Phishing Analyzer', description: 'Analyze screenshots for threats', path: ROUTES.SCREENSHOT_ANALYZER, color: 'text-primary bg-primary/10 border-primary/20' },
  { icon: FiCrosshair, title: 'Phishing Simulator', description: 'Practice threat detection', path: ROUTES.PHISHING_SIMULATOR, color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: FiLink, title: 'Smart URL Scanner', description: 'Scan links for reputation risk', path: ROUTES.URL_SCANNER, color: 'text-warning bg-warning/10 border-warning/20' },
  { icon: FiMaximize, title: 'QR Security Scanner', description: 'Analyze QR code destinations', path: ROUTES.QR_SCANNER, color: 'text-primary bg-primary/10 border-primary/20' },
  { icon: FiKey, title: 'Password Security Lab', description: 'Check strength & entropy', path: ROUTES.PASSWORD_LAB, color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: FiShield, title: 'Security Command Center', description: 'Monitor overall risk', path: ROUTES.SECURITY_CENTER, color: 'text-warning bg-warning/10 border-warning/20' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ACTIONS.map((action) => (
        <Card
          key={action.title}
          hoverable
          as="button"
          onClick={() => navigate(action.path)}
          className="text-left group"
        >
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${action.color}`}>
            <action.icon size={18} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-sm">{action.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{action.description}</p>
            </div>
            <FiArrowRight className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" size={16} />
          </div>
        </Card>
      ))}
    </div>
  );
}
