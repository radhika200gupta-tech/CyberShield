import { useRef, useState } from 'react';
import { FiUploadCloud, FiAlertCircle } from 'react-icons/fi';
import { classNames } from '../../../utils/classNames';
import { decodeFromImageFile } from '../utils/qrDecoder';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function QRUpload({ onDecoded, compact = false }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | processing | failure

  async function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setStatus('failure');
      return;
    }
    setStatus('processing');
    try {
      const text = await decodeFromImageFile(file);
      if (text) {
        setStatus('idle');
        onDecoded?.(text);
      } else {
        setStatus('failure');
      }
    } catch {
      setStatus('failure');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload a QR code image"
        className={classNames(
          'w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors duration-200 text-center cursor-pointer',
          compact ? 'py-4 px-4' : 'py-8 px-6',
          status === 'failure'
            ? 'border-danger/50 bg-danger/5'
            : 'border-border hover:border-border-hover hover:bg-surface-hover'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {status === 'processing' ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm text-text-secondary">Reading QR image…</span>
          </>
        ) : status === 'failure' ? (
          <>
            <FiAlertCircle className="text-danger" size={20} />
            <span className="text-sm text-danger">No QR code detected in this image.</span>
            <span className="text-xs text-text-muted">Try another image or use the camera instead.</span>
          </>
        ) : (
          <>
            <FiUploadCloud className={classNames('text-accent', compact ? '' : 'mb-1')} size={compact ? 18 : 22} />
            <span className="text-sm text-text-primary font-medium">Upload QR Image</span>
            <span className="text-xs text-text-muted">Click to browse files · PNG, JPG, WEBP</span>
          </>
        )}
      </button>
    </div>
  );
}
