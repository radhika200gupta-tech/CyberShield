import { FiCheckCircle, FiRotateCcw } from 'react-icons/fi';
import QRContent from './QRContent';
import SecurityVerdict from './SecurityVerdict';
import SecurityFindings from './SecurityFindings';

export default function QRResult({ classified, riskScore, riskLevel, findings, onScanAgain }) {
  const isSafe = riskLevel.key === 'SAFE';

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-border flex items-center gap-2">
        <FiCheckCircle className="text-success" size={16} />
        <span className="font-display font-semibold text-text-primary text-sm tracking-wide">
          {isSafe ? 'QR CODE VERIFIED' : 'QR CODE DETECTED'}
        </span>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-8">
        <QRContent classified={classified} />

        <div className="hairline" />

        <SecurityVerdict riskScore={riskScore} riskLevel={riskLevel} />

        <div className="hairline" />

        <SecurityFindings findings={findings} />
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-border bg-bg-elevated/40">
        <button
          type="button"
          onClick={onScanAgain}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 transition-colors cursor-pointer"
        >
          <FiRotateCcw size={14} />
          Scan Another QR
        </button>
      </div>
    </div>
  );
}
