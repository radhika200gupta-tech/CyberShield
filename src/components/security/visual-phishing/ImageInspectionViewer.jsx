import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiPlus, FiMinus, FiUploadCloud, FiTrash2 } from 'react-icons/fi';

export default function ImageInspectionViewer({
  imageUrl,
  matchingWords = [],
  showOverlay = true,
  onToggleOverlay = () => {},
  isAnalyzing = false,
  ocrProgress = '',
  onClear = null,
  onReplace = null
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgDims, setImgDims] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const [renderedDims, setRenderedDims] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const updateRenderedDims = useCallback(() => {
    if (imgRef.current) {
      setRenderedDims({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight
      });
    }
  }, []);

  // Update natural dimensions on image load
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgDims({
        naturalWidth: imgRef.current.naturalWidth,
        naturalHeight: imgRef.current.naturalHeight
      });
      updateRenderedDims();
    }
  };

  // Re-calculate coordinates whenever window resizes or zoom changes
  useEffect(() => {
    window.addEventListener('resize', updateRenderedDims);
    return () => window.removeEventListener('resize', updateRenderedDims);
  }, [updateRenderedDims]);

  useEffect(() => {
    if (!imgRef.current) return;
    const ro = new ResizeObserver(() => {
      updateRenderedDims();
    });
    ro.observe(imgRef.current);
    return () => ro.disconnect();
  }, [updateRenderedDims, zoomLevel, imageUrl]);

  const handleZoomIn = () => {
    setZoomLevel(z => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel(z => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  };

  const handleZoomFit = () => {
    setZoomLevel(1);
  };

  const scaleX = (imgDims.naturalWidth > 0 && renderedDims.width > 0)
    ? renderedDims.width / imgDims.naturalWidth
    : 1;

  const scaleY = (imgDims.naturalHeight > 0 && renderedDims.height > 0)
    ? renderedDims.height / imgDims.naturalHeight
    : 1;

  return (
    <div className="flex flex-col w-full h-full min-w-0 bg-surface/40 rounded-xl border border-border shadow-sm overflow-hidden">
      
      {/* Top Viewer Controls Bar */}
      <div className="px-3.5 py-2.5 bg-bg-elevated/90 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-text-muted font-mono min-w-0">
          <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
          <span className="font-semibold text-text-primary text-xs tracking-wider uppercase truncate">
            Inspection Canvas
          </span>
          {imgDims.naturalWidth > 0 && (
            <span className="text-xs text-text-muted hidden sm:inline font-mono">
              [{imgDims.naturalWidth}×{imgDims.naturalHeight}px]
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-surface border border-border/80 rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5 || isAnalyzing}
              className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors rounded hover:bg-surface-hover cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <FiMinus size={12} />
            </button>
            <button
              type="button"
              onClick={handleZoomFit}
              disabled={isAnalyzing}
              className="px-2 py-0.5 text-xs font-mono text-text-secondary hover:text-accent transition-colors cursor-pointer"
              title="Reset zoom to fit"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5 || isAnalyzing}
              className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors rounded hover:bg-surface-hover cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <FiPlus size={12} />
            </button>
          </div>

          {/* Visual Evidence Toggle */}
          {matchingWords.length > 0 && !isAnalyzing && (
            <button
              type="button"
              onClick={onToggleOverlay}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors border shadow-sm cursor-pointer ${
                showOverlay 
                  ? 'bg-accent/10 border-accent/40 text-accent font-semibold' 
                  : 'bg-surface border-border text-text-muted hover:text-text-primary'
              }`}
              title="Toggle bounding-box highlights"
            >
              {showOverlay ? <FiEye size={12} /> : <FiEyeOff size={12} />}
              <span className="hidden sm:inline">{showOverlay ? 'Highlights: ON' : 'Highlights: OFF'}</span>
              <span className="bg-bg-elevated px-1.5 py-0.2 rounded text-xs font-mono font-semibold">
                {matchingWords.length}
              </span>
            </button>
          )}

          {/* Replace Screenshot */}
          {onReplace && (
            <button
              type="button"
              onClick={onReplace}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors shadow-sm cursor-pointer"
              title="Replace with another screenshot"
            >
              <FiUploadCloud size={12} />
              <span className="hidden sm:inline">Replace</span>
            </button>
          )}

          {/* Clear Screenshot */}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-colors shadow-sm cursor-pointer"
              title="Clear screenshot"
            >
              <FiTrash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-[380px] sm:min-h-[420px] max-h-[460px] p-4 flex items-center justify-center overflow-auto custom-scrollbar bg-bg/50"
      >
        {imageUrl ? (
          <div 
            className="relative inline-block transition-transform duration-200 ease-out"
            style={zoomLevel !== 1 ? { transform: `scale(${zoomLevel})`, transformOrigin: 'center center' } : undefined}
          >
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt="Screenshot Under Inspection" 
              onLoad={handleImageLoad}
              className={`max-w-full max-h-[420px] object-contain rounded-lg shadow-xl border border-border/70 transition-all duration-300 block ${
                isAnalyzing ? 'opacity-40 blur-[1px]' : 'opacity-100'
              }`}
            />
            
            {/* Visual Bounding Boxes Overlay */}
            {showOverlay && !isAnalyzing && matchingWords.length > 0 && imgDims.naturalWidth > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {matchingWords.map((mw, i) => {
                  const left = Math.max(0, mw.bbox.x0 * scaleX);
                  const top = Math.max(0, mw.bbox.y0 * scaleY);
                  const width = Math.max(20, (mw.bbox.x1 - mw.bbox.x0) * scaleX);
                  const height = Math.max(14, (mw.bbox.y1 - mw.bbox.y0) * scaleY);

                  return (
                    <div 
                      key={i}
                      className="absolute border-2 border-danger bg-danger/25 shadow-[0_0_8px_rgba(240,68,82,0.6)] rounded pointer-events-auto group cursor-help transition-all hover:bg-danger/40 hover:z-20"
                      style={{ left, top, width, height }}
                    >
                      {/* Floating Indicator Tooltip Badge */}
                      <div className="absolute bottom-full left-0 mb-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-elevated text-danger text-xs font-mono font-medium px-2 py-0.5 rounded border border-danger/40 shadow-xl whitespace-nowrap pointer-events-none">
                        ⚠️ {mw.category}: "{mw.text}"
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-text-muted">
            <p className="text-xs font-mono">No screenshot loaded in viewport.</p>
          </div>
        )}

        {/* Live Scanline & Progress Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center p-6 bg-bg/40 backdrop-blur-[2px]">
            <div className="bg-bg-elevated/95 border border-accent/40 rounded-xl p-5 shadow-2xl text-center max-w-sm w-full mx-auto">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                <span className="w-3 h-3 rounded-full bg-accent animate-ping" />
              </div>
              <h4 className="text-xs font-mono font-semibold text-accent uppercase tracking-wider mb-1">
                OCR & Heuristics Scanning
              </h4>
              <p className="text-xs text-text-primary font-medium mt-1">
                {ocrProgress || 'Extracting visible text from screenshot...'}
              </p>
              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mt-3 border border-border">
                <motion.div 
                  className="h-full bg-accent shadow-[0_0_8px_rgba(36,216,197,0.8)]"
                  initial={{ width: '10%' }}
                  animate={{ width: ['10%', '65%', '90%', '98%'] }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
              </div>
              <span className="text-xs text-text-muted font-mono mt-2 block">
                Local WebAssembly Optical Engine
              </span>
            </div>

            {/* Glowing horizontal scanline */}
            <motion.div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_rgba(36,216,197,0.9)]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
