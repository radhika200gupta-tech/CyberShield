import { useState } from 'react';
import { FiCrosshair, FiMenu } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import QRScanner from './components/QRScanner';
import './qrSecurity.css';

export default function QRSecurityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="qr-security min-h-screen bg-bg relative overflow-x-hidden">
      <div className="absolute inset-0 grid-fade pointer-events-none" />

      <div className="absolute top-5 left-4 sm:top-6 sm:left-6 z-20">
        <button 
          className="text-text-secondary hover:text-text-primary transition-colors" 
          onClick={() => setSidebarOpen(true)} 
          aria-label="Open sidebar"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 z-40 hidden lg:block" onClick={() => setSidebarOpen(false)} />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-14 sm:pb-20">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 border border-accent/25 mb-4">
            <FiCrosshair className="text-accent" size={22} />
          </div>

          <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted mb-2">
            CyberShield · QR Security Investigation
          </p>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary tracking-tight">
            QR <span className="text-gradient">Security</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base text-text-secondary font-medium">Scan before you trust.</p>

          <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-md mx-auto">
            Analyze what is hidden behind a QR code before opening or interacting with it.
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-mono text-text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-pulse-ring" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            SCANNER READY
          </span>
        </div>

        <QRScanner />

        <p className="mt-10 text-center text-xs text-text-muted">
          Heuristic Analysis · Rule-Based Detection · Client-side only
        </p>
      </main>
    </div>
  );
}
