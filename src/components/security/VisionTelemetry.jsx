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
    <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm">
      <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">Vision Telemetry</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col bg-surface/50 border border-border/50 rounded p-2">
            <span className="text-[8px] font-mono text-text-muted uppercase tracking-wider mb-0.5">{m.label}</span>
            <span className="text-xs font-mono font-semibold text-text-primary">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
