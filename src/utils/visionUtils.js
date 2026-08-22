// Computer Vision Heuristics
// Provides lightweight, deterministic image analysis for the frontend.

export function calculateBrightness(imageData) {
  if (!imageData || !imageData.data) return 0;
  let sum = 0;
  const data = imageData.data;
  const len = data.length;
  // Sample every 4th pixel for performance
  let samples = 0;
  for (let i = 0; i < len; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += lum;
    samples++;
  }
  const avg = sum / samples;
  return Math.round((avg / 255) * 100); // 0-100%
}

export function calculateContrast(imageData) {
  if (!imageData || !imageData.data) return 0;
  let sum = 0;
  let sqSum = 0;
  const data = imageData.data;
  const len = data.length;
  let samples = 0;

  for (let i = 0; i < len; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += lum;
    sqSum += lum * lum;
    samples++;
  }

  const avg = sum / samples;
  const variance = (sqSum / samples) - (avg * avg);
  const stdDev = Math.sqrt(Math.max(0, variance));
  
  // Normalize roughly to 0-100% (max realistic stdDev is around 127)
  return Math.min(100, Math.round((stdDev / 127) * 100));
}

export function calculateMotion(currentImageData, previousImageData) {
  if (!currentImageData || !previousImageData) return 0;
  
  const curr = currentImageData.data;
  const prev = previousImageData.data;
  const len = curr.length;
  let diffCount = 0;
  let samples = 0;

  // Compare every 4th pixel (16 bytes)
  for (let i = 0; i < len; i += 16) {
    const diffR = Math.abs(curr[i] - prev[i]);
    const diffG = Math.abs(curr[i + 1] - prev[i + 1]);
    const diffB = Math.abs(curr[i + 2] - prev[i + 2]);
    
    const diff = (diffR + diffG + diffB) / 3;
    if (diff > 25) { // Threshold for considering a pixel "changed"
      diffCount++;
    }
    samples++;
  }

  // Percentage of changed pixels
  const motion = (diffCount / samples) * 100;
  // Scale up slightly for visual effect, but cap at 100
  return Math.min(100, Math.round(motion * 1.5));
}

export function evaluateSceneStability(motionHistory) {
  if (!motionHistory || motionHistory.length === 0) return 100;
  
  // Calculate variance in recent motion
  let sum = 0;
  for (let m of motionHistory) sum += m;
  const avg = sum / motionHistory.length;
  
  let sqSum = 0;
  for (let m of motionHistory) {
    const diff = m - avg;
    sqSum += diff * diff;
  }
  const variance = sqSum / motionHistory.length;
  
  // Stability is inversely proportional to variance
  const stability = 100 - Math.min(100, Math.sqrt(variance) * 2);
  return Math.max(0, Math.round(stability));
}
