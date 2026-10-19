import { useRef, useState, useEffect, useCallback } from 'react';
import { FiUploadCloud, FiAlertCircle, FiImage, FiShield, FiClipboard } from 'react-icons/fi';
import Button from '../../common/Button';
import { generateSampleScreenshot } from '../../../utils/sampleScreenshots';

export default function ImageDropzone({ onFileSelected, isAnalyzing, error, onErrorClear }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const validateAndSelect = useCallback((file) => {
    if (!file) return;
    
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const hasValidType = acceptedTypes.includes(file.type.toLowerCase()) || 
      /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!hasValidType) {
      if (onErrorClear) onErrorClear('Unsupported file format. Please upload a PNG, JPG, JPEG, or WEBP screenshot.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (onErrorClear) onErrorClear('File size exceeds the 10 MB limit. Please select a smaller screenshot.');
      return;
    }

    if (onErrorClear) onErrorClear(null);
    onFileSelected(file);
  }, [onErrorClear, onFileSelected]);

  // Clipboard (Ctrl+V) paste handler
  useEffect(() => {
    const handlePaste = (e) => {
      if (isAnalyzing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      let foundImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            foundImage = true;
            validateAndSelect(file);
            break;
          }
        }
      }

      if (!foundImage && e.clipboardData?.types?.includes('text/plain')) {
        // user pasted non-image text
        if (onErrorClear) {
          onErrorClear('Pasted content is text, not an image. Please paste a screenshot image (Ctrl+V) or upload a file.');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAnalyzing, onErrorClear, validateAndSelect]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isAnalyzing) return;
    const file = e.dataTransfer.files[0];
    validateAndSelect(file);
  };

  const handleLoadSample = async (type) => {
    if (isAnalyzing || loadingSample) return;
    setLoadingSample(true);
    try {
      if (onErrorClear) onErrorClear(null);
      const sampleFile = await generateSampleScreenshot(type);
      onFileSelected(sampleFile);
    } catch (err) {
      console.error("Failed to generate sample screenshot:", err);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      
      {/* ERROR ALERT IF VALIDATION FAILED */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <FiAlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => onErrorClear && onErrorClear(null)} 
            className="text-danger hover:underline text-[11px] font-semibold uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DROPZONE CONTAINER */}
      <div 
        className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl transition-all cursor-pointer group min-h-[360px] sm:min-h-[420px] w-full min-w-0 ${
          dragActive 
            ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(36,216,197,0.2)]' 
            : 'border-border/60 bg-surface/30 hover:bg-surface/50 hover:border-accent/40'
        }`}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-5 group-hover:scale-105 group-hover:border-accent/50 transition-all shadow-lg">
          <FiUploadCloud size={32} className="text-accent" />
        </div>

        <h3 className="text-lg sm:text-xl font-display font-semibold text-text-primary mb-2 tracking-tight">
          Upload Screenshot to Inspect
        </h3>
        <p className="text-sm text-text-secondary mb-1.5 max-w-md leading-relaxed">
          Drag and drop your screenshot here, or click to browse files from your computer.
        </p>
        <p className="text-xs text-text-muted font-mono mb-4">
          Supported formats: PNG • JPG • JPEG • WEBP (Up to 10 MB)
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono">
            <FiClipboard size={12} /> Paste from clipboard (Ctrl+V) supported
          </span>
        </div>
        
        <div>
          <Button 
            variant="primary" 
            disabled={isAnalyzing} 
            className="px-6 py-2.5 text-xs font-semibold tracking-wider uppercase shadow-lg pointer-events-none sm:pointer-events-auto"
          >
            Select Screenshot Image
          </Button>
        </div>

        <div className="mt-8 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-text-muted uppercase tracking-wider font-mono">
          <FiShield className="text-accent" size={12} />
          <span>Local Client-Side Processing • No External Upload</span>
        </div>
      </div>

      {/* QUICK SAMPLE TEST BUTTONS */}
      <div className="bg-bg-elevated/70 border border-border rounded-xl p-4 sm:p-5 shadow-sm w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <FiImage size={13} className="text-accent" /> 1-Click Test Scenarios:
          </span>
          <span className="text-xs text-text-muted font-mono">Instant OCR & Heuristic Evaluation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={isAnalyzing || loadingSample}
            onClick={() => handleLoadSample('urgent-bank')}
            className="p-3 text-left bg-surface/70 hover:bg-surface border border-danger/30 hover:border-danger/60 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <span className="text-xs font-semibold text-text-primary group-hover:text-danger transition-colors">
                Urgent Banking Phish
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Simulates unauthorized access warning with OTP & password demand.
            </p>
          </button>

          <button
            type="button"
            disabled={isAnalyzing || loadingSample}
            onClick={() => handleLoadSample('it-helpdesk')}
            className="p-3 text-left bg-surface/70 hover:bg-surface border border-warning/30 hover:border-warning/60 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs font-semibold text-text-primary group-hover:text-warning transition-colors">
                IT Helpdesk Expiry
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Simulates corporate password expiration with short URL lure.
            </p>
          </button>

          <button
            type="button"
            disabled={isAnalyzing || loadingSample}
            onClick={() => handleLoadSample('clean-receipt')}
            className="p-3 text-left bg-surface/70 hover:bg-surface border border-success/30 hover:border-success/60 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-semibold text-text-primary group-hover:text-success transition-colors">
                Clean Order Receipt
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Simulates a routine online purchase confirmation without phishing cues.
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
