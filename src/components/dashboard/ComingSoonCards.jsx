import { useNavigate } from 'react-router-dom';
import { FiMap, FiCpu, FiCamera, FiEye, FiZap, FiArrowRight } from 'react-icons/fi';
import { ROUTES } from '../../constants/routes';

const COMING_SOON_ITEMS = [
  {
    title: 'Live Cyber Threat Map',
    description: 'Real-time community telemetry visualization and synchronized threat stream',
    icon: FiMap,
    path: '/app/coming-soon/threat-map',
    category: 'Global Intel',
    borderColor: 'hover:border-primary/50',
    iconColor: 'text-primary',
    accentDot: 'bg-primary',
    badge: 'Active Tool',
    actionLabel: 'Open Map',
  },
  {
    title: 'AI Security Copilot',
    description: 'Interactive security assistant for threat triage, playbooks, and forensic analysis',
    icon: FiCpu,
    path: '/app/coming-soon/ai-copilot',
    category: 'AI Assistant',
    borderColor: 'hover:border-accent/50',
    iconColor: 'text-accent',
    accentDot: 'bg-accent',
    badge: 'Active Assistant',
    actionLabel: 'Open Copilot',
  },
  {
    title: 'Webcam Security Lab',
    description: 'Real-time optical telemetry, browser camera audit, and local privacy verification',
    icon: FiCamera,
    path: ROUTES.WEBCAM_SECURITY,
    category: 'Privacy Lab',
    borderColor: 'hover:border-accent/50',
    iconColor: 'text-accent',
    accentDot: 'bg-accent',
    badge: 'Active Tool',
    actionLabel: 'Open Tool',
  },
  {
    title: 'Visual Phishing Detection',
    description: 'Scans screenshots and visual UI for cloned branding and fake forms',
    icon: FiEye,
    path: ROUTES.VISUAL_PHISHING,
    category: 'Visual Intel',
    borderColor: 'hover:border-accent/50',
    iconColor: 'text-accent',
    accentDot: 'bg-accent',
    badge: 'Active Tool',
    actionLabel: 'Open Tool',
  },
  {
    title: 'Real-Time Threat Intelligence',
    description: 'Continuous telemetry feeds from global honeypots and threat databases',
    icon: FiZap,
    path: '/app/coming-soon/threat-intel',
    category: 'Live Feeds',
    borderColor: 'hover:border-primary/50',
    iconColor: 'text-primary',
    accentDot: 'bg-primary',
    badge: 'Active Feed',
    actionLabel: 'Open Intel',
  },
];

export default function ComingSoonCards() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            Security Intelligence & Privacy Labs
          </h3>
        </div>
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider px-2 py-0.5 rounded border border-border/50 bg-bg-elevated/40">
          Operational Modules
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {COMING_SOON_ITEMS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => navigate(item.path)}
            className={`p-4 bg-bg-elevated/40 hover:bg-surface border border-border/50 ${item.borderColor} rounded-xl text-left group transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-surface/60 border border-border/50 ${item.iconColor} group-hover:scale-105 transition-transform`}>
                  <item.icon size={16} />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-text-muted bg-bg-elevated/80 border border-border/50 group-hover:text-text-secondary group-hover:border-border transition-colors">
                  <span className={`w-1 h-1 rounded-full ${item.accentDot}`} />
                  {item.badge || 'Active Tool'}
                </span>
              </div>

              <h4 className="font-semibold text-text-primary text-sm group-hover:text-accent transition-colors leading-snug line-clamp-1 mb-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-border/30 flex items-center justify-between text-[11px] text-text-muted group-hover:text-accent font-medium transition-colors">
              <span className="text-[10px] font-mono uppercase tracking-wide opacity-80">{item.category}</span>
              <div className="flex items-center gap-1">
                <span>{item.actionLabel || 'Preview'}</span>
                <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
