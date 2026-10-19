import React from 'react';

export default function VisionTelemetry({ telemetry }) {
  const t = telemetry || {
    fps: 0, frameCount: 0, motion: 0, brightness: 0, contrast: 0, stability: 0, processingMs: '0.0'
  };

  const metrics = [
    { label: 'FPS', value: t.fps },
    { label: 'FRAME', value: t.frameCount },
    { label: 'MOTION', value: `${Math.round(t.motion)}%` },
    { label: 'BRIGHTNESS', value: `${Math.round(t.brightness)}%` },
    { label: 'CONTRAST', value: `${Math.round(t.contrast)}%` },
    { label: 'PROCESSING', value: `${t.processingMs}ms` },
    { label: 'STABILITY', value: `${Math.round(t.stability)}%` },
    { label: 'RESOLUTION', value: '1280×720' }
  ];

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm">
      <h4 className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Vision Telemetry</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col bg-surface/60 border border-border/70 rounded-lg p-2.5">
            <span className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1">{m.label}</span>
            <span className="text-sm sm:text-base font-mono font-bold text-text-primary">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
