import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CameraViewport({ videoRef, isScanning, isCameraActive }) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl border border-border overflow-hidden shadow-lg flex items-center justify-center">
      {/* Video Element */}
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
        muted 
        playsInline
      />
      
      {/* HUD Overlay */}
      {isCameraActive && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
          
          {/* Top HUD */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono font-bold text-accent tracking-wider bg-black/70 px-2.5 py-1 rounded">CAMERA: ACTIVE</span>
              <span className="text-xs font-mono text-white/90 bg-black/70 px-2.5 py-1 rounded w-max">1280 × 720</span>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <span className="text-xs font-mono font-bold text-success tracking-wider bg-black/70 px-2.5 py-1 rounded flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> VISION ENGINE
              </span>
              <span className="text-xs font-mono text-white/90 bg-black/70 px-2.5 py-1 rounded w-max">LOCAL PROCESSING</span>
            </div>
          </div>

          {/* Center Targeting Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border border-accent/20 rounded-full relative flex items-center justify-center">
              <div className="w-2 h-2 bg-accent/50 rounded-full" />
              <div className="absolute top-0 w-full h-px bg-accent/20" />
              <div className="absolute left-0 w-px h-full bg-accent/20" />
            </div>
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-accent/70" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-accent/70" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-accent/70" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-accent/70" />

          {/* Bottom HUD */}
          <div className="flex justify-between items-end">
             <div className="text-xs font-mono text-white/80 bg-black/70 px-2.5 py-1 rounded">
               NO FRAME DATA UPLOADED
             </div>
             <div className="text-xs font-mono font-semibold text-accent bg-black/70 px-2.5 py-1 rounded">
               MODE: {isScanning ? 'SCANNING' : 'MONITORING'}
             </div>
          </div>

          {/* Scan Line Animation */}
          {isScanning && (
            <motion.div 
              className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_rgba(36,216,197,0.8)]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      )}

      {/* Inactive State */}
      {!isCameraActive && (
        <div className="absolute flex flex-col items-center justify-center text-text-muted text-center p-4">
           <span className="text-base font-mono font-semibold tracking-wider text-text-secondary mb-2">CAMERA OFFLINE</span>
           <span className="text-sm text-text-muted">Click &quot;Start Camera&quot; to initialize vision engine</span>
        </div>
      )}
    </div>
  );
}
