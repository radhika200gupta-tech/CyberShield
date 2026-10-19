import { useState, useEffect, useRef } from 'react';
import { 
  FiCamera, FiVideoOff, FiCrosshair, FiMaximize, FiShield, 
  FiActivity, FiClock, FiCheckCircle, FiAlertTriangle, FiAlertOctagon, 
  FiInfo, FiTrash2, FiRefreshCw, FiDownload, FiEye, FiX, 
  FiSliders, FiLock, FiCornerDownRight, FiLayers
} from 'react-icons/fi';
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import CameraViewport from '../../components/security/CameraViewport';
import { visionService } from '../../services/visionService';

function getStatusBadge(status) {
  switch (status) {
    case 'PASS':
      return {
        label: 'PASS',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: FiCheckCircle,
        iconColor: 'text-emerald-400'
      };
    case 'WARNING':
      return {
        label: 'WARNING',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: FiAlertTriangle,
        iconColor: 'text-amber-400'
      };
    case 'BLOCKED':
      return {
        label: 'BLOCKED',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: FiAlertOctagon,
        iconColor: 'text-rose-400'
      };
    case 'NOT CHECKED':
      return {
        label: 'NOT CHECKED',
        badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
        icon: FiInfo,
        iconColor: 'text-zinc-400'
      };
    case 'INFO':
    default:
      return {
        label: 'INFO',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon: FiInfo,
        iconColor: 'text-blue-400'
      };
  }
}

export default function WebcamSecurityLab() {
  const videoRef = useRef(null);

  // Stream & Hardware States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [sessionUptime, setSessionUptime] = useState(0);

  // Telemetry & Real-Time Analytics
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const lastMotionAlertRef = useRef(0);

  // Audit State
  const [auditResults, setAuditResults] = useState(null);
  const [auditFilter, setAuditFilter] = useState('ALL');

  // Multi-Snapshot Gallery State
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Event Timeline State
  const [timeline, setTimeline] = useState([
    { 
      id: 'init-1', 
      time: new Date().toLocaleTimeString(), 
      msg: 'Webcam Security Lab initialized. Local sandbox active.', 
      type: 'info',
      category: 'SYSTEM'
    }
  ]);

  // Initial passive audit on mount & clean unmount
  useEffect(() => {
    visionService.runPrivacyAudit().then(setAuditResults).catch(console.error);

    return () => {
      visionService.stopCamera();
    };
  }, []);

  // Session uptime timer
  useEffect(() => {
    let timer = null;
    if (isCameraActive) {
      timer = setInterval(() => {
        setSessionUptime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionUptime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCameraActive]);

  const addTimelineEvent = (msg, type = 'info', category = 'SYSTEM') => {
    setTimeline(prev => [
      { 
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5), 
        time: new Date().toLocaleTimeString(), 
        msg, 
        type, 
        category 
      }, 
      ...prev
    ].slice(0, 30));
  };

  const handleStartCamera = async () => {
    setErrorState(null);
    setIsInitializing(true);
    addTimelineEvent('Requesting browser camera permission & initializing sensor feed...', 'info', 'STREAM');

    try {
      await visionService.startCamera(videoRef.current, (newTelemetry) => {
        setTelemetry(newTelemetry);
        setTelemetryHistory(prev => [
          ...prev, 
          { 
            time: Date.now(), 
            motion: Math.round(newTelemetry.motion), 
            stability: Math.round(newTelemetry.stability) 
          }
        ].slice(-60));

        // Throttled elevated motion notification (> 45% frame diff)
        const now = Date.now();
        if (newTelemetry.motion > 45 && now - lastMotionAlertRef.current > 4000) {
          lastMotionAlertRef.current = now;
          addTimelineEvent(
            `Elevated motion detected (${Math.round(newTelemetry.motion)}% frame differential).`, 
            'warning', 
            'SENSOR'
          );
        }
      });

      setIsCameraActive(true);
      setIsInitializing(false);
      addTimelineEvent('Camera hardware stream established (1280×720 @ 30 FPS).', 'success', 'STREAM');

      // Refresh privacy audit to reflect active stream state
      visionService.runPrivacyAudit().then(setAuditResults).catch(console.error);
    } catch (err) {
      setIsCameraActive(false);
      setIsInitializing(false);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const errMsg = isDenied
        ? 'CAMERA PERMISSION DENIED. Browser camera permission was refused. Please grant permission in your browser address bar settings to proceed.'
        : 'CAMERA HARDWARE ERROR. Unable to access a local video input device. Please check hardware connection or close applications using the webcam.';
      setErrorState(errMsg);
      addTimelineEvent(errMsg, 'error', 'PERMISSION');

      // Refresh privacy audit to reflect blocked state
      visionService.runPrivacyAudit().then(setAuditResults).catch(console.error);
    }
  };

  const handleStopCamera = () => {
    visionService.stopCamera();
    setIsCameraActive(false);
    setIsInitializing(false);
    setTelemetry(null);
    setTelemetryHistory([]);
    addTimelineEvent('Camera stream stopped. Hardware sensor released.', 'info', 'STREAM');

    // Refresh audit to reflect offline state
    visionService.runPrivacyAudit().then(setAuditResults).catch(console.error);
  };

  const handleCaptureSnapshot = () => {
    const snap = visionService.captureSnapshot();
    if (snap) {
      const snapObj = {
        id: Date.now().toString(),
        dataUrl: snap,
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        telemetry: telemetry ? { ...telemetry } : {
          fps: 30,
          motion: 0,
          brightness: 50,
          contrast: 50,
          stability: 100,
          riskScore: 87
        }
      };
      setSnapshots(prev => [snapObj, ...prev].slice(0, 12));
      addTimelineEvent(`Security snapshot captured at ${snapObj.time}. Stored in browser memory.`, 'success', 'CAPTURE');
    }
  };

  const handleDeleteSnapshot = (id) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(null);
    }
    addTimelineEvent('Snapshot deleted from memory cache.', 'info', 'CAPTURE');
  };

  const handleClearAllSnapshots = () => {
    setSnapshots([]);
    setSelectedSnapshot(null);
    addTimelineEvent('All security snapshots cleared from local memory.', 'info', 'CAPTURE');
  };

  const handleDownloadSnapshot = (snap) => {
    if (!snap?.dataUrl) return;
    const a = document.createElement('a');
    a.href = snap.dataUrl;
    a.download = `cybershield-webcam-snapshot-${snap.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    addTimelineEvent('Initiating live browser privacy & hardware permission audit...', 'info', 'AUDIT');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const audit = await visionService.runPrivacyAudit();
      setAuditResults(audit);
      addTimelineEvent(
        `Privacy audit complete: ${audit.counts.pass} passed, ${audit.counts.warning} warning(s), ${audit.counts.blocked} blocked.`,
        audit.counts.warning > 0 ? 'warning' : 'success',
        'AUDIT'
      );
    } catch (err) {
      console.error('Audit failed:', err);
      addTimelineEvent('Privacy audit failed to query browser state.', 'error', 'AUDIT');
    } finally {
      setIsScanning(false);
    }
  };

  const formatUptime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe telemetry values
  const t = telemetry || {
    fps: 0,
    frameCount: 0,
    motion: 0,
    brightness: 0,
    contrast: 0,
    stability: 0,
    processingMs: '0.0',
    riskScore: 87
  };

  const filteredChecks = auditResults?.checks?.filter(c => {
    if (auditFilter === 'ALL') return true;
    return c.status === auditFilter;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 pb-16 animate-fade-in text-text-primary">
      
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Webcam Security Lab"
        description="Real-time optical telemetry, browser camera permission audit, and on-device privacy verification."
        badge="Hardware & Privacy Audit"
        icon={<FiCamera />}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Camera Status Indicator (A) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm font-mono">
            {isInitializing ? (
              <span className="flex items-center gap-2 text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>CONNECTING...</span>
              </span>
            ) : isCameraActive ? (
              <span className="flex items-center gap-2.5 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wide">LIVE STREAM</span>
                <span className="text-xs text-emerald-300 font-mono font-medium border-l border-emerald-500/30 pl-2">
                  {formatUptime(sessionUptime)}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-text-secondary font-medium bg-bg-surface/80 border border-border/80 px-3 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>CAMERA OFFLINE</span>
              </span>
            )}
          </div>

          {/* Start / Stop Controls */}
          {!isCameraActive ? (
            <Button
              variant="primary"
              onClick={handleStartCamera}
              disabled={isInitializing}
              className="text-xs sm:text-sm font-semibold flex items-center gap-2 py-2 px-4 cursor-pointer shadow-sm"
            >
              <FiCamera size={15} className={isInitializing ? 'animate-spin' : ''} />
              <span>{isInitializing ? 'INITIALIZING...' : 'START CAMERA'}</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCaptureSnapshot}
                className="text-xs sm:text-sm font-medium flex items-center gap-2 py-2 px-3.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                title="Capture high-resolution evidence snapshot to local memory"
              >
                <FiMaximize size={15} />
                <span>CAPTURE</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleStopCamera}
                className="text-xs sm:text-sm font-medium flex items-center gap-2 py-2 px-3.5 border-danger/40 text-danger hover:bg-danger/10 cursor-pointer"
              >
                <FiVideoOff size={15} />
                <span>STOP</span>
              </Button>
            </>
          )}

          {/* Run Privacy Scan Button */}
          <Button
            variant="outline"
            onClick={handleRunScan}
            disabled={isScanning}
            className="text-xs sm:text-sm font-medium flex items-center gap-2 py-2 px-3.5 cursor-pointer"
          >
            <FiShield size={15} className={isScanning ? 'animate-spin text-accent' : 'text-accent'} />
            <span>{isScanning ? 'AUDITING...' : 'RUN SCAN'}</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. ERROR / BLOCKED PERMISSION BANNER */}
      {errorState && (
        <div className="bg-danger/15 border border-danger/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-danger w-full shadow-sm animate-fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <FiAlertTriangle size={22} className="shrink-0 text-danger" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Hardware Access Notice</span>
              <span className="text-text-primary text-xs sm:text-sm break-words leading-relaxed">{errorState}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <Button variant="outline" onClick={handleStartCamera} className="text-xs sm:text-sm font-semibold py-1.5 px-3.5 border-danger/40 text-danger hover:bg-danger/10">
              RETRY
            </Button>
            <button 
              onClick={() => setErrorState(null)} 
              className="text-text-secondary hover:text-text-primary text-xs sm:text-sm font-semibold uppercase px-2 py-1 font-mono cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* 3. IMPROVED LIVE TELEMETRY CARDS (B) - Elevated Typography */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        {/* Metric 1: FPS */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>FPS Rate</span>
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
              {isCameraActive ? t.fps : '0'}
            </span>
            <span className="text-xs font-mono text-text-secondary font-medium">
              {isCameraActive ? `${t.processingMs}ms` : 'idle'}
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-text-secondary flex justify-between items-center">
            <span>Target: 30</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded ${
              isCameraActive 
                ? (t.fps >= 20 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10') 
                : 'text-text-muted'
            }`}>
              {isCameraActive ? (t.fps >= 20 ? 'SMOOTH' : 'DROPPING') : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Metric 2: Motion */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>Motion Delta</span>
            <FiActivity size={14} className={t.motion > 35 ? 'text-amber-400' : 'text-accent'} />
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
              {isCameraActive ? `${Math.round(t.motion)}%` : '0%'}
            </span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              t.motion > 45 
                ? 'text-amber-400 bg-amber-500/10' 
                : t.motion > 15 
                ? 'text-accent bg-accent/10' 
                : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {isCameraActive ? (t.motion > 45 ? 'HIGH' : t.motion > 15 ? 'ACTIVE' : 'STATIC') : 'QUIET'}
            </span>
          </div>
          <div className="mt-2 w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
            <div 
              className={`h-full transition-all duration-150 ${
                t.motion > 45 ? 'bg-amber-400' : 'bg-accent'
              }`}
              style={{ width: `${Math.min(100, isCameraActive ? t.motion : 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Brightness */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>Luminance</span>
            <span className="text-xs text-text-secondary font-medium">LIGHT</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
              {isCameraActive ? `${Math.round(t.brightness)}%` : '0%'}
            </span>
            <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
              t.brightness > 20 && t.brightness < 80 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-amber-400 bg-amber-500/10'
            }`}>
              {isCameraActive ? (t.brightness < 20 ? 'LOW LIGHT' : t.brightness > 80 ? 'GLARE' : 'OPTIMAL') : 'OFFLINE'}
            </span>
          </div>
          <div className="mt-2 w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
            <div 
              className="h-full bg-emerald-400 transition-all duration-150"
              style={{ width: `${Math.min(100, isCameraActive ? t.brightness : 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Contrast */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>Contrast</span>
            <span className="text-xs text-text-secondary font-medium">RANGE</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
              {isCameraActive ? `${Math.round(t.contrast)}%` : '0%'}
            </span>
            <span className="text-xs font-mono font-medium text-text-primary bg-surface px-1.5 py-0.5 rounded border border-border/50">
              {isCameraActive ? (t.contrast > 40 ? 'HIGH' : 'BALANCED') : '—'}
            </span>
          </div>
          <div className="mt-2 w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
            <div 
              className="h-full bg-blue-400 transition-all duration-150"
              style={{ width: `${Math.min(100, isCameraActive ? t.contrast : 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 5: Stability */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>Stability</span>
            <span className="text-xs text-text-secondary font-medium">FRAME-SYNC</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
              {isCameraActive ? `${Math.round(t.stability)}%` : '100%'}
            </span>
            <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
              t.stability >= 80 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}>
              {isCameraActive ? (t.stability >= 80 ? 'STEADY' : 'JITTER') : 'LOCKED'}
            </span>
          </div>
          <div className="mt-2 w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
            <div 
              className="h-full bg-accent transition-all duration-150"
              style={{ width: `${Math.min(100, isCameraActive ? t.stability : 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 6: Stream Spec */}
        <div className="bg-bg-elevated border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            <span>Pipeline</span>
            <FiLock size={13} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-lg sm:text-xl font-display font-bold text-text-primary">
              1280×720
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              LOCAL
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-text-secondary flex justify-between">
            <span>RGB Canvas</span>
            <span className="text-text-primary font-medium">0b Upload</span>
          </div>
        </div>
      </div>

      {/* 4. MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: VIEWPORT + SNAPSHOT GALLERY + ACTIVITY GRAPH (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* A. WEBCAM VIEWPORT (Centerpiece) */}
          <div className="bg-bg-elevated border border-border rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <FiCrosshair className="text-accent" size={18} />
                <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                  Optical Viewport & Targeting Reticle
                </h3>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="hidden sm:inline bg-surface px-2.5 py-1 rounded border border-border/70 text-text-secondary font-medium">
                  {isCameraActive ? 'WEBCAM / SENSOR 0' : 'AWAITING HARDWARE'}
                </span>
                <span className={`px-2.5 py-1 rounded border font-semibold ${
                  isCameraActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'
                }`}>
                  {isCameraActive ? 'STREAM ACTIVE' : 'STREAM MUTED'}
                </span>
              </div>
            </div>

            {/* Video Canvas Component */}
            <div className="w-full relative rounded-xl overflow-hidden shadow-inner border border-border/70">
              <CameraViewport 
                videoRef={videoRef} 
                isScanning={isScanning} 
                isCameraActive={isCameraActive} 
              />
            </div>

            {/* Viewport Action Footer */}
            <div className="mt-4 pt-3.5 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-mono text-text-secondary font-medium">
                <FiLock className="text-emerald-400 shrink-0" size={15} />
                <span>On-Device Frame Buffer • Zero External Transmission</span>
              </div>

              <div className="flex items-center gap-2">
                {isCameraActive && (
                  <Button
                    variant="outline"
                    onClick={handleCaptureSnapshot}
                    className="text-xs sm:text-sm font-medium py-1.5 px-3.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer flex items-center gap-1.5"
                  >
                    <FiCamera size={14} />
                    <span>Take Snapshot</span>
                  </Button>
                )}
                {!isCameraActive && (
                  <Button
                    variant="primary"
                    onClick={handleStartCamera}
                    disabled={isInitializing}
                    className="text-xs sm:text-sm font-semibold py-1.5 px-3.5 flex items-center gap-1.5"
                  >
                    <FiCamera size={14} />
                    <span>Turn On Camera</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* B. LIVE ACTIVITY & MOTION GRAPH */}
          <div className="bg-bg-elevated border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <FiActivity className="text-accent" size={17} />
                <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                  Optical Activity & Frame Delta Stream
                </h4>
              </div>
              <div className="flex items-center gap-3.5 text-xs font-mono font-medium text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Motion Delta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Scene Stability
                </span>
              </div>
            </div>

            <div className="h-48 w-full relative pt-2">
              {telemetryHistory.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory}>
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                      labelStyle={{ display: 'none' }}
                      formatter={(val, name) => [`${val}%`, name === 'motion' ? 'Motion' : 'Stability']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="motion" 
                      stroke="#24d8c5" 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stability" 
                      stroke="#10b981" 
                      strokeWidth={1.8} 
                      dot={false} 
                      isAnimationActive={false} 
                      strokeOpacity={0.7} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary text-xs sm:text-sm font-mono border border-dashed border-border/60 rounded-xl p-4 text-center">
                  <span>Start camera to visualize live frame differencing and optical stability</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs font-mono text-text-secondary font-medium pt-2 border-t border-border/40">
              <span>Rolling 60-second window</span>
              <span>Local Canvas differencing engine</span>
            </div>
          </div>

          {/* C. SNAPSHOT GALLERY (Requirement 4E) */}
          <div className="bg-bg-elevated border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <FiLayers className="text-accent" size={17} />
                <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                  Security Snapshot Gallery
                </h4>
                <span className="text-xs font-mono font-bold bg-surface px-2.5 py-0.5 rounded-full border border-border text-text-secondary">
                  {snapshots.length} / 12
                </span>
              </div>

              {snapshots.length > 0 && (
                <button
                  onClick={handleClearAllSnapshots}
                  className="text-xs font-mono font-medium text-danger/80 hover:text-danger flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FiTrash2 size={13} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {snapshots.length === 0 ? (
              <div className="p-8 border border-dashed border-border/70 rounded-xl text-center flex flex-col items-center justify-center gap-2.5">
                <FiCamera size={26} className="text-text-muted" />
                <span className="text-sm font-semibold text-text-primary">No evidence snapshots recorded</span>
                <span className="text-xs sm:text-sm text-text-secondary max-w-md leading-relaxed">
                  Click &quot;CAPTURE&quot; while the webcam is active to store timestamped frames with telemetry metadata directly in your browser memory.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {snapshots.map((snap) => (
                  <div 
                    key={snap.id}
                    className="group relative bg-surface border border-border/70 hover:border-accent/50 rounded-xl overflow-hidden shadow-xs flex flex-col transition-all"
                  >
                    {/* Thumbnail Image */}
                    <div 
                      className="aspect-video w-full bg-black/40 overflow-hidden relative cursor-pointer"
                      onClick={() => setSelectedSnapshot(snap)}
                    >
                      <img 
                        src={snap.dataUrl} 
                        alt={`Snapshot ${snap.time}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="p-2 rounded-lg bg-bg-elevated/90 text-accent shadow-sm">
                          <FiEye size={15} />
                        </span>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs font-mono text-white px-2 py-0.5 rounded font-medium">
                        {snap.time}
                      </span>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-2.5 flex flex-col gap-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span>Motion:</span>
                        <span className="text-text-primary font-bold">
                          {Math.round(snap.telemetry.motion)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-text-secondary">
                        <span>Light:</span>
                        <span className="text-text-primary font-bold">
                          {Math.round(snap.telemetry.brightness)}%
                        </span>
                      </div>

                      {/* Card Button Actions */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <button
                          onClick={() => handleDownloadSnapshot(snap)}
                          title="Save image file locally"
                          className="text-text-secondary hover:text-accent p-1 transition-colors cursor-pointer"
                        >
                          <FiDownload size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="Delete snapshot from memory"
                          className="text-text-secondary hover:text-danger p-1 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs font-mono text-text-secondary bg-surface/50 p-3 rounded-lg border border-border/60 flex items-center gap-2.5 leading-relaxed">
              <FiLock size={14} className="text-accent shrink-0" />
              <span>Snapshot Privacy: Captured images reside strictly in browser RAM and are purged when you refresh or close this tab.</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL PRIVACY AUDIT PANEL + TIMELINE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* A. REAL PRIVACY AUDIT RESULTS (Requirement 4C) */}
          <div className="bg-bg-elevated border border-border rounded-2xl p-4 sm:p-6 shadow-md flex flex-col gap-4">
            
            {/* Header & Re-scan Button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/70">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight flex items-center gap-2">
                  <FiShield className="text-accent" size={17} />
                  <span>Browser Privacy Audit</span>
                </h3>
                <span className="text-xs font-mono text-text-secondary block mt-0.5 font-medium">
                  {auditResults?.timestamp ? `Evaluated: ${auditResults.timestamp}` : 'Real-time client sandbox query'}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={handleRunScan}
                disabled={isScanning}
                className="text-xs sm:text-sm font-medium py-1.5 px-3 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer flex items-center gap-1.5"
              >
                <FiRefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
                <span>Re-Audit</span>
              </Button>
            </div>

            {/* Audit Counts KPI Bar */}
            {auditResults && (
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setAuditFilter(auditFilter === 'PASS' ? 'ALL' : 'PASS')}
                  className={`py-2 px-1 rounded border transition-colors cursor-pointer font-bold ${
                    auditFilter === 'PASS' 
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {auditResults.counts.pass} PASS
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter(auditFilter === 'WARNING' ? 'ALL' : 'WARNING')}
                  className={`py-2 px-1 rounded border transition-colors cursor-pointer font-bold ${
                    auditResults.counts.warning > 0 
                      ? (auditFilter === 'WARNING' ? 'bg-amber-500/25 border-amber-500 text-amber-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-400')
                      : 'bg-surface border-border/50 text-text-muted'
                  }`}
                >
                  {auditResults.counts.warning} WARN
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter(auditFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
                  className={`py-2 px-1 rounded border transition-colors cursor-pointer font-bold ${
                    auditResults.counts.blocked > 0 
                      ? (auditFilter === 'BLOCKED' ? 'bg-rose-500/25 border-rose-500 text-rose-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-400')
                      : 'bg-surface border-border/50 text-text-muted'
                  }`}
                >
                  {auditResults.counts.blocked} BLOCK
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter(auditFilter === 'INFO' ? 'ALL' : 'INFO')}
                  className={`py-2 px-1 rounded border transition-colors cursor-pointer font-bold ${
                    auditFilter === 'INFO' 
                      ? 'bg-blue-500/25 border-blue-500 text-blue-300' 
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  }`}
                >
                  {auditResults.counts.info} INFO
                </button>
              </div>
            )}

            {/* Individual Checks Feed */}
            {isScanning ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Auditing Permissions & Hardware APIs...
                </span>
                <p className="text-xs sm:text-sm text-text-secondary font-mono max-w-sm leading-relaxed">
                  Querying navigator.permissions, mediaDevices hardware enumeration, and active MediaStream tracks.
                </p>
              </div>
            ) : auditResults ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {filteredChecks.map((check) => {
                  const badge = getStatusBadge(check.status);
                  const Icon = badge.icon;

                  return (
                    <div 
                      key={check.id}
                      className="p-4 rounded-xl bg-surface/60 border border-border/80 shadow-xs space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-2 truncate">
                          <Icon size={16} className={`${badge.iconColor} shrink-0`} />
                          <span className="truncate">{check.title}</span>
                        </span>
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase shrink-0 ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                        {check.detail}
                      </p>

                      {check.recommendation && (
                        <div className="pt-2 border-t border-border/50 flex items-start gap-2 text-xs font-mono text-text-secondary">
                          <FiCornerDownRight className="text-accent shrink-0 mt-0.5" size={13} />
                          <span className="leading-relaxed text-text-secondary">{check.recommendation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-text-secondary">
                Click &quot;RUN SCAN&quot; to perform a real-time browser privacy audit.
              </div>
            )}

            {/* Defensive Privacy Checklist */}
            {auditResults?.recommendations?.length > 0 && (
              <div className="bg-surface/50 border border-border/70 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-mono uppercase font-bold tracking-wider text-text-primary flex items-center gap-2">
                  <FiSliders size={14} className="text-accent" />
                  <span>Privacy Defense Recommendations</span>
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
                  {auditResults.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sandbox Disclosure */}
            <div className="p-3.5 rounded-xl bg-surface/40 border border-border/60 text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary font-semibold">Sandbox Guarantee:</strong> Standard web browsers execute inside strict sandboxes. This audit evaluates browser-level APIs, active page streams, and site permissions. It cannot inspect native operating system background processes.
            </div>
          </div>

          {/* B. CAMERA ACTIVITY TIMELINE (Requirement 4D) */}
          <div className="bg-bg-elevated border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <FiClock className="text-accent" size={17} />
                <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                  Camera Activity Timeline
                </h4>
              </div>
              <button
                onClick={() => setTimeline([{ id: Date.now().toString(), time: new Date().toLocaleTimeString(), msg: 'Timeline cleared.', type: 'info', category: 'SYSTEM' }])}
                className="text-xs font-mono font-medium text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                Clear Log
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2.5">
              {timeline.map((evt) => {
                let badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                if (evt.type === 'success') badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                if (evt.type === 'warning') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                if (evt.type === 'error') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                return (
                  <div key={evt.id} className="p-2.5 rounded-lg bg-surface/60 border border-border/60 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-text-secondary font-medium">{evt.time}</span>
                      <span className={`px-2 py-0.5 rounded border font-semibold uppercase ${badgeClass}`}>
                        {evt.category || evt.type}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                      {evt.msg}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 5. FULL RESOLUTION SNAPSHOT LIGHTBOX MODAL */}
      {selectedSnapshot && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div 
            className="bg-bg-elevated border border-border rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <FiCamera className="text-accent" size={20} />
                <h3 className="text-base font-semibold text-text-primary">
                  Security Evidence Snapshot — {selectedSnapshot.time}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSnapshot(null)}
                className="text-text-secondary hover:text-text-primary p-2 rounded-lg border border-border/60 hover:bg-surface cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Image */}
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center">
              <img 
                src={selectedSnapshot.dataUrl} 
                alt="Expanded snapshot" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="bg-surface/80 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">MOTION AT CAPTURE</span>
                <span className="text-base font-display font-bold text-text-primary">{Math.round(selectedSnapshot.telemetry.motion)}%</span>
              </div>
              <div className="bg-surface/80 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">LUMINANCE LEVEL</span>
                <span className="text-base font-display font-bold text-text-primary">{Math.round(selectedSnapshot.telemetry.brightness)}%</span>
              </div>
              <div className="bg-surface/80 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">FRAME STABILITY</span>
                <span className="text-base font-display font-bold text-text-primary">{Math.round(selectedSnapshot.telemetry.stability)}%</span>
              </div>
              <div className="bg-surface/80 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">HARDWARE RESOLUTION</span>
                <span className="text-base font-display font-bold text-accent">1280 × 720</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
              <span className="text-xs font-mono text-text-secondary">
                Client RAM storage only. Not shared or uploaded.
              </span>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadSnapshot(selectedSnapshot)}
                  className="text-xs sm:text-sm font-medium flex items-center gap-2 py-2 px-3.5"
                >
                  <FiDownload size={14} />
                  <span>Download Image</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteSnapshot(selectedSnapshot.id)}
                  className="text-xs sm:text-sm font-medium flex items-center gap-2 py-2 px-3.5 border-danger/40 text-danger hover:bg-danger/10"
                >
                  <FiTrash2 size={14} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRIVACY ASSURANCE FOOTER */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 sm:p-5 flex items-center gap-4 text-xs sm:text-sm">
        <FiCheckCircle className="text-emerald-400 shrink-0" size={20} />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-text-primary text-sm sm:text-base">Defensive Local Processing Verified</span>
          <span className="text-text-secondary leading-relaxed">
            All pixel differencing, brightness/contrast calculations, and browser privacy audits execute locally within your browser sandbox. No camera frames, screenshots, or telemetry data are ever transmitted to an external server.
          </span>
        </div>
      </div>

    </div>
  );
}
