import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import { SIDEBAR_LINKS, COMING_SOON_LINKS, ROUTES } from '../../constants/routes';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const allLinks = [
    ...SIDEBAR_LINKS, 
    ...COMING_SOON_LINKS,
    { label: 'Profile', path: ROUTES.PROFILE },
    { label: 'Settings', path: ROUTES.SETTINGS }
  ];
  const activeLink = allLinks.find((l) => l.path === location.pathname);
  const title = activeLink?.label || 'Overview';

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
