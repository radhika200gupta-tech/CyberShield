import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiKey, FiLink, FiMail, FiShield, FiClock,
  FiUser, FiSettings, FiLogOut, FiX, FiCamera, FiCrosshair,
  FiMaximize, FiCpu, FiActivity, FiFileText, FiEye, FiServer, FiMap, FiZap
} from 'react-icons/fi';
import Logo from '../common/Logo';
import { SIDEBAR_LINKS, COMING_SOON_LINKS, ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { classNames } from '../../utils/formatters';

const ICONS = { 
  grid: FiGrid, key: FiKey, link: FiLink, mail: FiMail, shield: FiShield, history: FiClock,
  camera: FiCamera, crosshair: FiCrosshair, maximize: FiMaximize,
  cpu: FiCpu, activity: FiActivity, fileText: FiFileText, eye: FiEye, server: FiServer,
  map: FiMap, zap: FiZap
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 h-screen w-64 bg-bg-elevated border-r border-border flex flex-col z-50 transition-transform duration-300 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <Logo size="sm" to={ROUTES.DASHBOARD} />
          <button className="lg:hidden text-text-muted" onClick={onClose} aria-label="Close sidebar">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <nav className="space-y-1">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = ICONS[link.icon];
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                      isActive
                        ? 'text-accent bg-accent/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                      )}
                      <Icon size={17} />
                      {link.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div>
            <h3 className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Coming Soon</h3>
            <nav className="space-y-1">
              {COMING_SOON_LINKS.map((link) => {
                const Icon = ICONS[link.icon];
                return (
                  <div
                    key={link.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted opacity-70 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} />
                      <span className="truncate">{link.label}</span>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="border-t border-border p-3 space-y-1 shrink-0">
          <NavLink
            to={ROUTES.PROFILE}
            onClick={onClose}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )
            }
          >
            <FiUser size={17} /> Profile
          </NavLink>
          <NavLink
            to={ROUTES.SETTINGS}
            onClick={onClose}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )
            }
          >
            <FiSettings size={17} /> Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <FiLogOut size={17} /> Log Out
          </button>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user?.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.plan} Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
