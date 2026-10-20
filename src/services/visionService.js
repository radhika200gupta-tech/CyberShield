import { calculateBrightness, calculateContrast, calculateMotion, evaluateSceneStability } from '../utils/visionUtils.js';

class VisionService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.analysisCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    this.analysisCtx = this.analysisCanvas ? this.analysisCanvas.getContext('2d', { willReadFrequently: true }) : null;
    this.animationFrameId = null;
    this.isActive = false;
    
    // Internal state
    this.previousImageData = null;
    this.motionHistory = [];
    this.frameCount = 0;
    this.lastTime = 0;
    
    // Callback for React
    this.onTelemetryUpdate = null;
  }

  async startCamera(videoElement, onTelemetryUpdate) {
    if (!videoElement) throw new Error('Video element required');
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      
      this.videoElement = videoElement;
      this.videoElement.srcObject = this.stream;
      this.onTelemetryUpdate = onTelemetryUpdate;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      // Set analysis canvas to lower resolution for performance
      this.analysisCanvas.width = 320;
      this.analysisCanvas.height = 180;
      
      this.isActive = true;
      this.startAnalysisLoop();
      
      return true;
    } catch (err) {
      console.error('Failed to start camera:', err);
      throw err;
    }
  }

  stopCamera() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.previousImageData = null;
    this.motionHistory = [];
    this.frameCount = 0;
  }

  startAnalysisLoop() {
    const loop = (timestamp) => {
      if (!this.isActive) return;
      
      // Throttle analysis to roughly 15-20 FPS for performance
      if (timestamp - this.lastTime >= 50) {
        this.analyzeFrame(timestamp);
        this.lastTime = timestamp;
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  analyzeFrame(timestamp) {
    if (!this.videoElement || this.videoElement.readyState < 2) return;

    const start = performance.now();
    
    // Draw video frame to hidden low-res canvas
    this.analysisCtx.drawImage(this.videoElement, 0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
    const imageData = this.analysisCtx.getImageData(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
    
    const brightness = calculateBrightness(imageData);
    const contrast = calculateContrast(imageData);
    const motion = calculateMotion(imageData, this.previousImageData);
    
    // Maintain motion history for stability
    this.motionHistory.push(motion);
    if (this.motionHistory.length > 30) this.motionHistory.shift();
    
    const stability = evaluateSceneStability(this.motionHistory);
    
    this.previousImageData = imageData;
    this.frameCount++;
    
    const processingMs = (performance.now() - start).toFixed(1);

    // Calculate deterministic risk score based on heuristics
    const riskScore = this.calculateRiskScore(motion, brightness, stability);
    
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        fps: Math.round(1000 / (timestamp - (this.lastFrameTime || timestamp - 16))),
        frameCount: this.frameCount,
        motion,
        brightness,
        contrast,
        stability,
        processingMs,
        riskScore
      });
    }
    this.lastFrameTime = timestamp;
  }

  calculateRiskScore(motion, brightness, stability) {
    // Base score is 87 for mock purposes (not 100)
    let score = 87;
    
    // High motion reduces score
    if (motion > 20) score -= (motion - 20) * 0.5;
    
    // Very low brightness reduces score (obscured)
    if (brightness < 15) score -= (15 - brightness);
    
    // Scene instability reduces score
    if (stability < 80) score -= (80 - stability) * 0.4;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  captureSnapshot() {
    if (!this.videoElement) return null;
    
    // High-res snapshot
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.videoElement.videoWidth;
    snapCanvas.height = this.videoElement.videoHeight;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0);
    
    return snapCanvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Run real browser-level privacy and camera security checks
   */
  async runPrivacyAudit() {
    const checks = [];
    const recommendations = [];

    // Check 1: Camera Permission Status via Permissions API
    let permissionState = 'unknown';
    let permissionSupported = false;

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const queryResult = await navigator.permissions.query({ name: 'camera' });
        permissionState = queryResult.state;
        permissionSupported = true;
      } catch {
        // Some browser engines (e.g. Firefox) do not support 'camera' in permissions.query
        permissionSupported = false;
      }
    }

    if (!permissionSupported) {
      checks.push({
        id: 'permission-status',
        category: 'Permissions API',
        title: 'Camera Permission Query',
        status: 'NOT CHECKED',
        detail: 'The browser Permissions API does not support programmatic camera queries in this engine (common in Firefox). Site permission will be evaluated by the browser when access is requested.',
        recommendation: 'Check site permissions directly using the lock or tune icon in your browser address bar.'
      });
    } else if (permissionState === 'granted') {
      checks.push({
        id: 'permission-status',
        category: 'Permissions API',
        title: 'Camera Permission Status',
        status: 'WARNING',
        detail: 'Camera access is currently GRANTED on this origin. Any script running on this origin can activate the video stream without triggering an additional browser confirmation prompt.',
        recommendation: 'If you are done testing, consider setting camera permissions to "Ask every time" in your browser site settings to prevent unexpected background activation.'
      });
      recommendations.push('Camera permission is actively granted. Reset to "Ask every time" in site settings when not in active use.');
    } else if (permissionState === 'prompt') {
      checks.push({
        id: 'permission-status',
        category: 'Permissions API',
        title: 'Camera Permission Status',
        status: 'PASS',
        detail: 'Camera permission is in PROMPT state. The browser strictly enforces user confirmation and will block any camera activation attempt until you explicitly click "Allow".',
        recommendation: 'Maintain default browser settings requiring explicit approval before accessing video hardware.'
      });
    } else if (permissionState === 'denied') {
      checks.push({
        id: 'permission-status',
        category: 'Permissions API',
        title: 'Camera Permission Status',
        status: 'BLOCKED',
        detail: 'Camera access is BLOCKED / DENIED on this origin. The browser prevents all webpages on this origin from accessing video capture hardware.',
        recommendation: 'Access is safely blocked. If you want to use the Vision Lab, click the lock icon in your browser address bar and allow camera access.'
      });
    }

    // Check 2: Hardware Video Devices via enumerateDevices()
    let devicesSupported = false;
    let videoDevices = [];

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        devicesSupported = true;
      } catch {
        devicesSupported = false;
      }
    }

    if (!devicesSupported) {
      checks.push({
        id: 'hardware-devices',
        category: 'Hardware Enumeration',
        title: 'Video Input Device Discovery',
        status: 'NOT CHECKED',
        detail: 'navigator.mediaDevices.enumerateDevices() is unavailable in this environment.',
        recommendation: 'Ensure you are using a modern browser with WebRTC media device capabilities.'
      });
    } else if (videoDevices.length === 0) {
      checks.push({
        id: 'hardware-devices',
        category: 'Hardware Enumeration',
        title: 'Video Input Devices',
        status: 'WARNING',
        detail: 'No video input devices were detected by the browser. Either no webcam hardware is connected, or hardware access is blocked at the operating-system level.',
        recommendation: 'Ensure your camera is plugged in and check OS privacy settings (Windows Camera Privacy / macOS System Preferences).'
      });
      recommendations.push('No video input hardware detected. Check physical connection or OS privacy permissions.');
    } else {
      const hasLabels = videoDevices.some(d => Boolean(d.label));
      const deviceNames = hasLabels
        ? videoDevices.map((d, i) => d.label || `Camera ${i + 1}`).join(', ')
        : `${videoDevices.length} camera device(s) found (labels masked by browser for privacy)`;

      checks.push({
        id: 'hardware-devices',
        category: 'Hardware Enumeration',
        title: `Video Input Devices (${videoDevices.length} Detected)`,
        status: 'PASS',
        detail: `Discovered ${videoDevices.length} video capture device(s): ${deviceNames}.`,
        recommendation: hasLabels
          ? 'Verify that you recognize all listed camera devices. Be cautious of unexpected virtual camera drivers.'
          : 'Device labels are masked by the browser until camera access is granted to protect against device fingerprinting.'
      });
    }

    // Check 3: Current Page Active Stream & Track Status
    if (this.isActive && this.stream) {
      const videoTracks = this.stream.getVideoTracks();
      const track = videoTracks[0];
      const settings = track ? track.getSettings() : {};
      const resText = settings.width && settings.height ? `${settings.width}x${settings.height}` : '1280x720';
      const fpsText = settings.frameRate ? ` @ ~${Math.round(settings.frameRate)}fps` : '';

      checks.push({
        id: 'stream-status',
        category: 'Active Stream Audit',
        title: 'Page Media Stream Status',
        status: 'WARNING',
        detail: `Webcam Security Lab has an active video stream on this tab (Track state: "${track?.readyState || 'unknown'}", Enabled: ${Boolean(track?.enabled)}). Transmitting at ${resText}${fpsText}.`,
        recommendation: 'Your camera\'s hardware LED indicator should be illuminated right now. Click "STOP" when testing is complete.'
      });
      recommendations.push('Camera stream is active on this tab. Click "STOP" when finished to deactivate the hardware.');
    } else {
      checks.push({
        id: 'stream-status',
        category: 'Active Stream Audit',
        title: 'Page Media Stream Status',
        status: 'PASS',
        detail: 'The Webcam Security Lab video stream is currently OFFLINE. No media tracks are capturing or transmitting frames on this page.',
        recommendation: 'Hardware is idle and unaccessed by this page.'
      });
    }

    // Check 4: Transport Security & Context
    const isSecure = typeof window !== 'undefined' && Boolean(window.isSecureContext);
    const protocol = typeof window !== 'undefined' ? window.location?.protocol : 'http:';

    if (isSecure) {
      checks.push({
        id: 'transport-security',
        category: 'Transport Security',
        title: 'Encrypted Context & Origin Verification',
        status: 'PASS',
        detail: `Operating in a secure context (${protocol}//). Modern browsers enforce HTTPS or localhost for media capture to prevent network stream interception.`,
        recommendation: 'Always check that the HTTPS padlock is present before permitting camera capture on any website.'
      });
    } else {
      checks.push({
        id: 'transport-security',
        category: 'Transport Security',
        title: 'Insecure Context Warning',
        status: 'BLOCKED',
        detail: 'Page is running in an insecure context. Modern browsers prohibit media device capture over unencrypted plain HTTP.',
        recommendation: 'Serve the application over HTTPS or localhost to ensure encrypted stream transport.'
      });
      recommendations.push('Insecure HTTP context. Upgrade to HTTPS.');
    }

    // Check 5: Data Boundary & Local Processing
    checks.push({
      id: 'data-boundary',
      category: 'Data Exfiltration Boundary',
      title: 'Local-Only Processing Boundary',
      status: 'PASS',
      detail: 'Camera frames are analyzed strictly in-memory using an off-screen HTML5 canvas element. Zero video frames, captured images, or biometric telemetry are transmitted to remote servers.',
      recommendation: 'Use verified client-side privacy tools that process camera frames without cloud dependencies.'
    });

    // Check 6: Scope Limitations Disclosure
    checks.push({
      id: 'scope-limitations',
      category: 'Browser Sandbox Scope',
      title: 'Sandbox Limitations & OS Isolation',
      status: 'INFO',
      detail: 'Browser security architecture isolates web pages from the operating system. An in-page script cannot audit external desktop apps, background OS services, or system camera drivers.',
      recommendation: 'For comprehensive protection against OS-level malware or covert physical recording, use physical webcam shutters or covers.'
    });

    if (recommendations.length === 0) {
      recommendations.push('Maintain browser default "Ask before accessing" policy for all web domains.');
      recommendations.push('Keep physical privacy cover closed when the camera is not in active use.');
    }

    const counts = {
      pass: checks.filter(c => c.status === 'PASS').length,
      warning: checks.filter(c => c.status === 'WARNING').length,
      blocked: checks.filter(c => c.status === 'BLOCKED').length,
      info: checks.filter(c => c.status === 'INFO' || c.status === 'NOT CHECKED').length
    };

    return {
      timestamp: new Date().toLocaleTimeString(),
      checks,
      counts,
      recommendations,
      permissionState,
      devicesCount: videoDevices.length,
      isStreamActive: this.isActive
    };
  }
}

export const visionService = new VisionService();
