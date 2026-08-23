import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ImageInspectionViewer({ imageUrl, matchingWords, showOverlay, isAnalyzing }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imgRef.current && imageUrl) {
       imgRef.current.onload = () => {
         setImgDims({
           width: imgRef.current.naturalWidth,
           height: imgRef.current.naturalHeight
         });
       };
    }
  }, [imageUrl]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] max-h-[600px] bg-surface/50 rounded-xl border border-border overflow-hidden flex items-center justify-center group">
      
      {imageUrl && (
        <div className="relative inline-block max-w-full max-h-full">
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Inspection" 
            className={`max-w-full max-h-[500px] object-contain transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
          />
          
          {showOverlay && !isAnalyzing && matchingWords && imgRef.current && imgDims.width > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {matchingWords.map((mw, i) => {
                // Calculate responsive coordinates
                const renderedWidth = imgRef.current.clientWidth;
                const renderedHeight = imgRef.current.clientHeight;
                
                const scaleX = renderedWidth / imgDims.width;
                const scaleY = renderedHeight / imgDims.height;

                const left = mw.bbox.x0 * scaleX;
                const top = mw.bbox.y0 * scaleY;
                const width = (mw.bbox.x1 - mw.bbox.x0) * scaleX;
                const height = (mw.bbox.y1 - mw.bbox.y0) * scaleY;

                return (
                  <div 
                    key={i}
                    className="absolute border-2 border-danger bg-danger/20 shadow-[0_0_8px_rgba(255,0,0,0.5)]"
                    style={{ left, top, width, height }}
                  >
                    {/* Label tooltip that appears slightly above */}
                    <div className="absolute bottom-full left-0 mb-1 whitespace-nowrap bg-danger text-white text-[8px] font-bold px-1 rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      {mw.category}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Scanning Animation */}
      {isAnalyzing && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
           <div className="bg-bg-elevated/80 border border-accent/30 rounded-lg px-4 py-2 backdrop-blur-md shadow-lg mb-4 text-center">
             <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest block mb-1 animate-pulse">VISUAL INSPECTION IN PROGRESS</span>
             <span className="text-[10px] text-text-secondary">OCR ENGINE ACTIVE</span>
           </div>
           
           <motion.div 
             className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_12px_rgba(25,195,125,0.8)]"
             animate={{ top: ['0%', '100%', '0%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
           />
        </div>
      )}
    </div>
  );
}
