import { Scanner } from '@yudiel/react-qr-scanner';
import ScannerOverlay from './ScannerOverlay';
import ScanStatus from './ScanStatus';

/**
 * ScannerViewport
 *
 * Displays the live camera feed and decodes QR codes using @yudiel/react-qr-scanner.
 * Renders the custom CyberShield scan-line overlay and status indicator on top.
 */
export default function ScannerViewport({ enabled = true, paused = false, onDetect, onError }) {

  function handleScan(detectedCodes) {
    if (detectedCodes && detectedCodes.length > 0) {
      const text = detectedCodes[0]?.rawValue;
      if (text) {
        onDetect?.(text);
      }
    }
  }

  function handleError(error) {
    const kind = error?.kind;
    if (kind === 'permission-denied') {
      onError?.('permission-denied');
    } else if (kind === 'no-camera') {
      onError?.('no-camera');
    } else {
      onError?.('unknown');
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-lg overflow-hidden bg-bg-elevated">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        paused={paused}
        components={{ finder: false }}
        styles={{
          container: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
          video: { width: '100%', height: '100%', objectFit: 'cover' },
        }}
      />

      <ScannerOverlay active={!paused} detected={paused} />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <ScanStatus
          state={paused ? 'detected' : 'active'}
          label={paused ? 'QR detected' : 'Position QR inside frame'}
        />
      </div>
    </div>
  );
}
