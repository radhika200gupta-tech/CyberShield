/**
 * DetectiveIllustration.jsx
 * Cyber-noir detective illustration with fedora, trench coat, glowing magnifier and crosshairs.
 */
export default function DetectiveIllustration({ className = '', compact = false }) {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl overflow-hidden bg-gradient-to-b from-[#0b131f] via-[#090e17] to-[#060a10] border border-amber-500/25 shadow-[inset_0_1px_1px_rgba(245,166,35,0.15)] ${compact ? 'min-h-[220px]' : 'min-h-[280px]'} ${className}`}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> CASE TRIAGE
        </span>
        <span className="text-[9px] font-mono text-text-muted">FORENSIC SUITE</span>
      </div>

      <div className="relative z-10 my-auto py-1 w-full max-w-[200px] flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="magGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" /><stop offset="50%" stopColor="#d97706" stopOpacity="0.3" /><stop offset="100%" stopColor="#0b131f" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="trenchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" /><stop offset="60%" stopColor="#0f172a" /><stop offset="100%" stopColor="#05080f" />
            </linearGradient>
            <linearGradient id="amberRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" /><stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M 60 210 V 90 Q 60 40 120 20 Q 180 40 180 90 V 210" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M 75 210 V 95 Q 75 52 120 35 Q 165 52 165 95 V 210" stroke="#f59e0b" strokeWidth="0.75" opacity="0.25" />
          <ellipse cx="112" cy="74" rx="46" ry="11" fill="#0b111e" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.4" />
          <path d="M 85 73 C 85 54 94 42 110 40 C 122 39 133 46 138 52 C 142 58 141 68 141 73 Z" fill="url(#trenchGrad)" stroke="#334155" strokeWidth="1" />
          <path d="M 86 68 C 96 66 128 66 139 69" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.7" />
          <path d="M 98 74 C 98 84 104 93 114 93 C 122 93 128 85 128 74 Z" fill="#090d16" />
          <path d="M 82 108 L 94 88 L 108 106 L 120 88 L 134 108 L 148 116 L 152 220 H 64 L 68 116 Z" fill="url(#trenchGrad)" stroke="#1e293b" strokeWidth="1.2" />
          <path d="M 94 88 L 108 118 L 106 170" stroke="url(#amberRimGrad)" strokeWidth="1.5" />
          <path d="M 120 88 L 109 118" stroke="#334155" strokeWidth="1.5" />
          <path d="M 68 116 L 85 108" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" />
          <path d="M 148 116 L 132 108" stroke="#334155" strokeWidth="0.8" />
          <circle cx="152" cy="116" r="38" fill="url(#magGlow)" />
          <circle cx="152" cy="116" r="26" fill="#121d2f" fillOpacity="0.45" stroke="#fbbf24" strokeWidth="2.5" />
          <path d="M 136 104 A 20 20 0 0 1 166 98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <circle cx="152" cy="116" r="16" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.8" />
          <line x1="152" y1="96" x2="152" y2="136" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.7" />
          <line x1="132" y1="116" x2="172" y2="116" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.7" />
          <circle cx="152" cy="116" r="2.5" fill="#f59e0b" />
          <line x1="134" y1="134" x2="114" y2="154" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
          <line x1="133" y1="135" x2="115" y2="153" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 112 148 C 112 142 120 138 126 142 L 130 148 C 132 153 126 159 120 158 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
          <circle cx="178" cy="85" r="1.5" fill="#fbbf24" opacity="0.7" /><circle cx="188" cy="110" r="1" fill="#fbbf24" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 w-full text-center">
        <p className="text-[10px] font-display font-medium text-amber-200/90 tracking-wide uppercase">Better Detection · A Safer Tomorrow</p>
        <p className="text-[9px] text-text-muted mt-0.5 leading-snug">Every signal leaves a trace. Start connecting the evidence.</p>
      </div>
    </div>
  );
}
