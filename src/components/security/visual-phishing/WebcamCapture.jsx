import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiVideoOff } from 'react-icons/fi';
import Button from '../../common/Button';

export default function WebcamCapture({ onCapture, isAnalyzing }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable. Please check permissions.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface/30 border border-danger/30 rounded-xl min-h-[400px]">
         <FiVideoOff className="text-danger mb-4" size={48} />
         <h3 className="text-danger font-semibold mb-2">Camera Error</h3>
         <p className="text-text-secondary text-sm text-center mb-6">{error}</p>
         <Button variant="outline" onClick={startCamera}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden group">
      {isInitializing && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <span className="text-accent animate-pulse font-mono text-sm uppercase tracking-widest">Initializing Camera...</span>
         </div>
      )}
      
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Target Reticle Overlay */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-4 h-4 border-t-2 border-l-2 border-accent/70" />
         <div className="absolute top-1/4 right-1/4 w-4 h-4 border-t-2 border-r-2 border-accent/70" />
         <div className="absolute bottom-1/4 left-1/4 w-4 h-4 border-b-2 border-l-2 border-accent/70" />
         <div className="absolute bottom-1/4 right-1/4 w-4 h-4 border-b-2 border-r-2 border-accent/70" />
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
         <Button 
            variant="primary" 
            onClick={handleCapture}
            disabled={isInitializing || isAnalyzing}
            className="rounded-full w-16 h-16 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-110 transition-transform"
         >
            <FiCamera size={24} />
         </Button>
      </div>
    </div>
  );
}
