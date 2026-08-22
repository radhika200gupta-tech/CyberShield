const CORNER_BASE = 'absolute w-7 h-7 border-accent transition-colors duration-300';

export default function ScannerOverlay({ active = false, detected = false }) {
  const cornerColor = detected ? 'border-success' : 'border-accent';

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* corner brackets */}
      <div className={`${CORNER_BASE} ${cornerColor} top-4 left-4 border-t-2 border-l-2 rounded-tl-md`} />
      <div className={`${CORNER_BASE} ${cornerColor} top-4 right-4 border-t-2 border-r-2 rounded-tr-md`} />
      <div className={`${CORNER_BASE} ${cornerColor} bottom-4 left-4 border-b-2 border-l-2 rounded-bl-md`} />
      <div className={`${CORNER_BASE} ${cornerColor} bottom-4 right-4 border-b-2 border-r-2 rounded-br-md`} />

      {/* subtle frame border */}
      <div className="absolute inset-8 rounded-lg border border-border/60" />

      {/* animated scan line */}
      {active && !detected && (
        <div className="absolute inset-x-8 top-8 bottom-8 overflow-hidden rounded-lg">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_8px_var(--color-accent)] animate-scan" />
        </div>
      )}
    </div>
  );
}
