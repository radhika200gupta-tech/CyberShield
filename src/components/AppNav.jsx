import { NavLink } from 'react-router-dom';
import { FiSearch, FiCrosshair, FiTarget } from 'react-icons/fi';
import { classNames } from '../utils/classNames';

const LINKS = [
  { to: '/', label: 'URL Scanner', icon: FiSearch, end: true },
  { to: '/qr-scanner', label: 'QR Security', icon: FiCrosshair, end: false },
  { to: '/challenge', label: 'Phishing Challenge', icon: FiTarget, end: false },
];

export default function AppNav() {
  return (
    <nav className="relative z-10 flex items-center justify-center gap-1 pt-6 sm:pt-8">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 p-1 glass">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              classNames(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )
            }
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
