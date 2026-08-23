import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiKey, FiLink, FiMail, FiShield, FiClock,
  FiUser, FiSettings, FiLogOut, FiX, FiCamera, FiCrosshair,
  FiMaximize, FiCpu, FiActivity, FiFileText, FiEye, FiServer, FiMap, FiZap,
  FiChevronLeft, FiChevronRight
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

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('cybershield_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cybershield_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 h-screen bg-bg-elevated border-r border-border flex flex-col z-50 transition-all duration-300 shrink-0',
          isCollapsed ? 'w-[76px]' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={classNames("flex items-center h-16 border-b border-border shrink-0 px-5 relative", isCollapsed ? "justify-center px-0" : "justify-between")}>
          <div className="flex items-center justify-center overflow-hidden">
             <Logo size="sm" to={ROUTES.DASHBOARD} iconOnly={isCollapsed} />
          </div>
          
          <button 
            className={classNames(
              "hidden lg:flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0", 
              isCollapsed ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-border rounded-full shadow-sm z-50' : ''
            )} 
            onClick={toggleCollapse} 
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={20} />}
          </button>

          <button className={classNames("lg:hidden text-text-muted shrink-0", isCollapsed ? "hidden" : "block")} onClick={onClose} aria-label="Close sidebar">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 flex flex-col">
          <nav className="space-y-1">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = ICONS[link.icon];
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    classNames(
                      'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                      isActive
                        ? 'text-accent bg-accent/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                      isCollapsed ? 'justify-center' : 'gap-3'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                      )}
                      <Icon size={17} className="shrink-0" />
                      
                      {!isCollapsed && (
                        <span className="whitespace-nowrap">
                          {link.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div>
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 whitespace-nowrap">
                Coming Soon
              </h3>
            )}
            {isCollapsed && (
               <div className="h-px w-8 mx-auto bg-border mb-4 mt-2" />
            )}
            <nav className="space-y-1">
              {COMING_SOON_LINKS.map((link) => {
                const Icon = ICONS[link.icon];
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={onClose}
                    title={isCollapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      classNames(
                        'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                        isActive
                          ? 'text-accent bg-accent/10'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                        isCollapsed ? 'justify-center' : 'justify-between'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                        )}
                        <div className={classNames("flex items-center", isCollapsed ? 'justify-center' : 'gap-3')}>
                          <Icon size={17} className="shrink-0" />
                          {!isCollapsed && (
                            <span className="truncate">
                              {link.label}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-auto pt-6 border-t border-border space-y-1">
            <NavLink
              to={ROUTES.PROFILE}
              onClick={onClose}
              title={isCollapsed ? "Profile" : undefined}
              className={({ isActive }) =>
                classNames(
                  'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                  isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                  )}
                  <FiUser size={17} className="shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">Profile</span>}
                </>
              )}
            </NavLink>
            
            <NavLink
              to={ROUTES.SETTINGS}
              onClick={onClose}
              title={isCollapsed ? "Settings" : undefined}
              className={({ isActive }) =>
                classNames(
                  'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                  isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                  )}
                  <FiSettings size={17} className="shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
                </>
              )}
            </NavLink>
            
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Log Out" : undefined}
              className={classNames("group w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors relative", isCollapsed ? 'justify-center' : 'gap-3')}
            >
              <FiLogOut size={17} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Log Out</span>}
            </button>

            <NavLink 
              to={ROUTES.PROFILE}
              onClick={onClose}
              className={classNames("flex items-center mt-3 pt-3 border-t border-border px-1 hover:bg-surface-hover rounded-lg transition-all cursor-pointer", isCollapsed ? 'justify-center' : 'gap-3')}
            >
              <div 
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm"
                title={isCollapsed ? user?.name : undefined}
              >
                {user?.avatarInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.plan} Plan</p>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
