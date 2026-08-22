import React, { useState, useEffect, useRef } from 'react';
import { FiCamera, FiVideoOff, FiCrosshair, FiMaximize, FiShield, FiList, FiClock, FiCheckCircle, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/common/Button';
import CameraViewport from '../../components/security/CameraViewport';
import VisionTelemetry from '../../components/security/VisionTelemetry';
import VisionAnalysisPanel from '../../components/security/VisionAnalysisPanel';
import { visionService } from '../../services/visionService';

export default function WebcamSecurityLabPreview() {
  const videoRef = useRef(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [errorState, setErrorState] = useState(null);
  const [timeline, setTimeline] = useState([
    { id: '1', time: new Date().toLocaleTimeString(), msg: 'Vision Lab initialized.', type: 'info' }
  ]);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      visionService.stopCamera();
    };
  }, []);

  const addTimelineEvent = (msg, type = 'info') => {
    setTimeline(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 20));
  };

  const handleStartCamera = async () => {
    setErrorState(null);
    try {
      addTimelineEvent('Requesting camera access...', 'info');
      await visionService.startCamera(videoRef.current, (newTelemetry) => {
        setTelemetry(newTelemetry);
        setTelemetryHistory(prev => [...prev, { time: Date.now(), motion: newTelemetry.motion, stability: newTelemetry.stability }].slice(-60));
        
        // Generate mock events based on real heuristics
        if (newTelemetry.motion > 40 && Math.random() > 0.95) {
          addTimelineEvent('Elevated frame difference detected.', 'warning');
        }
      });
      setIsCameraActive(true);
      addTimelineEvent('Camera stream established.', 'success');
    } catch (err) {
      setIsCameraActive(false);
      setErrorState('CAMERA ACCESS BLOCKED. CyberShield requires browser camera permission to initialize the vision lab.');
      addTimelineEvent('Camera access denied or failed.', 'error');
    }
  };

  const handleStopCamera = () => {
    visionService.stopCamera();
    setIsCameraActive(false);
    setTelemetry(null);
    setTelemetryHistory([]);
    addTimelineEvent('Camera stream stopped.', 'info');
  };

  const handleCapture = () => {
    const snap = visionService.captureSnapshot();
    if (snap) {
      setSnapshot({
        dataUrl: snap,
        telemetry: { ...telemetry },
        time: new Date().toLocaleTimeString()
      });
      addTimelineEvent('Security snapshot captured.', 'success');
    }
  };

  const handleRunScan = () => {
    setIsScanning(true);
    addTimelineEvent('Initiating detailed security scan...', 'info');
    
    setTimeout(() => {
      setIsScanning(false);
      addTimelineEvent('Scan complete. Environmental conditions evaluated.', 'success');
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full bg-surface/50 rounded-card relative overflow-hidden border-t border-border text-left">
      
      {/* ERROR BANNER */}
      {errorState && (
        <div className="bg-danger/20 border-b border-danger/40 p-4 flex items-center justify-between text-danger">
           <div className="flex items-center gap-3">
             <FiAlertTriangle size={20} />
             <div>
               <span className="font-bold text-sm block">CAMERA ACCESS BLOCKED</span>
               <span className="text-xs opacity-90">{errorState}</span>
             </div>
           </div>
           <Button variant="outline" onClick={handleStartCamera} className="text-xs">TRY AGAIN</Button>
        </div>
      )}

      {/* HEADER CONTROLS */}
      <div className="p-4 sm:p-6 bg-bg-elevated/80 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative z-10">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
            <FiCrosshair className="text-accent" /> COMPUTER VISION LAB
          </h2>
          <span className="text-[10px] font-mono text-text-muted mt-1 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/> Frontend Heuristics Engine
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           {!isCameraActive ? (
             <Button variant="primary" onClick={handleStartCamera} className="text-xs flex items-center gap-2">
               <FiCamera /> START CAMERA
             </Button>
           ) : (
             <>
               <Button variant="outline" onClick={handleStopCamera} className="text-xs flex items-center gap-2 border-danger/50 text-danger hover:bg-danger/10">
                 <FiVideoOff /> STOP
               </Button>
               <Button variant="outline" onClick={handleCapture} className="text-xs flex items-center gap-2">
                 <FiMaximize /> CAPTURE
               </Button>
               <Button variant="primary" onClick={handleRunScan} disabled={isScanning} className="text-xs flex items-center gap-2">
                 <FiShield /> {isScanning ? 'SCANNING...' : 'RUN SCAN'}
               </Button>
             </>
           )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border">
        
        {/* LEFT / MAIN: Camera & Telemetry */}
        <div className="flex-1 p-6 flex flex-col gap-6 bg-surface/30">
           <div className="w-full">
             <CameraViewport videoRef={videoRef} isScanning={isScanning} isCameraActive={isCameraActive} />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry */}
              <div className="w-full">
                 <VisionTelemetry telemetry={telemetry} />
              </div>
              
              {/* Snapshot Preview */}
              <div className="w-full">
                 <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm h-full flex flex-col">
                   <div className="flex justify-between items-center mb-3">
                     <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Security Snapshot</h4>
                     {snapshot && <button onClick={() => setSnapshot(null)} className="text-text-muted hover:text-danger"><FiTrash2 size={12}/></button>}
                   </div>
                   
                   {snapshot ? (
                     <div className="flex gap-4">
                       <img src={snapshot.dataUrl} alt="Snapshot" className="w-24 h-24 object-cover rounded border border-border/50" />
                       <div className="flex flex-col gap-1 text-[9px] font-mono text-text-secondary">
                         <span><strong className="text-text-primary">Time:</strong> {snapshot.time}</span>
                         <span><strong className="text-text-primary">Risk:</strong> {snapshot.telemetry.riskScore}/100</span>
                         <span><strong className="text-text-primary">Motion:</strong> {Math.round(snapshot.telemetry.motion)}%</span>
                         <span><strong className="text-text-primary">Light:</strong> {Math.round(snapshot.telemetry.brightness)}%</span>
                       </div>
                     </div>
                   ) : (
                     <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded text-text-muted text-[10px] font-mono">
                       No snapshot captured
                     </div>
                   )}
                 </div>
              </div>
           </div>

           {/* Timeline */}
           <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm flex flex-col h-48">
              <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiList /> Detection Timeline</h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
                 {timeline.map((evt) => (
                   <div key={evt.id} className="flex gap-3 items-start border-b border-border/30 pb-2 last:border-0">
                     <span className="text-[9px] font-mono text-text-muted mt-0.5 whitespace-nowrap"><FiClock className="inline mr-1"/>{evt.time}</span>
                     <span className={`text-[11px] ${evt.type === 'error' || evt.type === 'warning' ? 'text-warning font-semibold' : 'text-text-secondary'}`}>
                       {evt.msg}
                     </span>
                   </div>
                 ))}
              </div>
           </div>
           
           {/* Privacy Notice */}
           <div className="mt-auto bg-success/5 border border-success/20 rounded p-3 flex items-start gap-3">
             <FiCheckCircle className="text-success mt-0.5" />
             <div className="flex flex-col">
               <span className="text-xs font-semibold text-text-primary">LOCAL PROCESSING ENABLED</span>
               <span className="text-[10px] text-text-secondary">Camera frames are analyzed locally in your browser. No image upload is performed by this frontend demonstration.</span>
             </div>
           </div>
        </div>

        {/* RIGHT: Vision Analysis Panel */}
        <div className="w-full lg:w-[380px] p-6 bg-[#050B14]">
           <VisionAnalysisPanel telemetry={telemetry} telemetryHistory={telemetryHistory} />
        </div>
      </div>
    </div>
  );
}
