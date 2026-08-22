import { calculateBrightness, calculateContrast, calculateMotion, evaluateSceneStability } from '../utils/visionUtils';

class VisionService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
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
    // Base score is 100 (Safe)
    let score = 100;
    
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
}

export const visionService = new VisionService();
