import { useNavigate } from 'react-router-dom';
import { FiKey, FiLink, FiMail, FiArrowRight } from 'react-icons/fi';
import Card from '../common/Card';
import { ROUTES } from '../../constants/routes';

const ACTIONS = [
  { icon: FiKey, title: 'Analyze a Password', description: 'Check strength & entropy', path: ROUTES.PASSWORD_ANALYZER, color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: FiLink, title: 'Check a URL', description: 'Scan for reputation risk', path: ROUTES.URL_CHECKER, color: 'text-primary bg-primary/10 border-primary/20' },
  { icon: FiMail, title: 'Scan an Email', description: 'Detect phishing signals', path: ROUTES.PHISHING_DETECTOR, color: 'text-warning bg-warning/10 border-warning/20' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid sm:grid-cols-3 gap-4">
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
