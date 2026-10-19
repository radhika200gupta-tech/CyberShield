import Tesseract from 'tesseract.js';
import { analyzePhishingHeuristics, getRiskLevel } from '../utils/phishingHeuristics.js';

/**
 * Visual Phishing Detection Service
 * Coordinates optical character recognition (OCR) via Tesseract.js
 * and runs explainable phishing heuristics on extracted text.
 */
class VisualPhishingService {
  constructor() {
    this.isAnalyzing = false;
  }

  /**
   * Validate uploaded image file format (PNG, JPG, WEBP) and size (<= 10MB)
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file was provided.' };
    }

    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const fileType = file.type ? file.type.toLowerCase() : '';
    const fileName = file.name ? file.name.toLowerCase() : '';
    
    const isValidFormat = acceptedTypes.includes(fileType) || 
      fileName.endsWith('.png') || 
      fileName.endsWith('.jpg') || 
      fileName.endsWith('.jpeg') || 
      fileName.endsWith('.webp');

    if (!isValidFormat) {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload a PNG, JPG, JPEG, or WEBP screenshot.'
      };
    }

    // 10MB limit
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size exceeds the 10 MB limit (${sizeMb} MB). Please select a smaller screenshot.`
      };
    }

    return { valid: true };
  }

  /**
   * Format byte count to human-readable string (B, KB, MB)
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Run OCR text extraction and heuristic analysis on an image file
   */
  async analyzeImage(file, onProgress = () => {}, onTimelineEvent = () => {}) {
    if (this.isAnalyzing) {
      throw new Error("Another visual analysis is already running. Please wait for it to finish.");
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.isAnalyzing = true;
    const startTime = performance.now();

    try {
      // Step 1: Log initialization events
      onTimelineEvent({ 
        id: 'evt-load', 
        time: new Date().toLocaleTimeString(), 
        msg: `Screenshot loaded: ${file.name}`, 
        type: 'info' 
      });
      onTimelineEvent({ 
        id: 'evt-init', 
        time: new Date().toLocaleTimeString(), 
        msg: 'Initializing Tesseract OCR engine (WASM worker)...', 
        type: 'info' 
      });

      // Step 2: Execute OCR character recognition
      const ocrResult = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: message => {
            if (message.status === 'recognizing text') {
              const progressPct = Math.round(message.progress * 100);
              onProgress(`Extracting visible text... ${progressPct}%`, progressPct);
            } else if (message.status === 'loading tesseract core') {
              onProgress('Loading optical engine...', 15);
            } else if (message.status === 'initializing api') {
              onProgress('Configuring character dictionary...', 30);
            } else {
              const pct = message.progress ? Math.round(message.progress * 100) : 0;
              onProgress(message.status, pct);
            }
          }
        }
      );

      const rawText = ocrResult?.data?.text?.trim() || "";
      const confidence = Math.round(ocrResult?.data?.confidence || 0);
      const wordsCount = ocrResult?.data?.words?.length || 0;

      onTimelineEvent({ 
        id: 'evt-text', 
        time: new Date().toLocaleTimeString(), 
        msg: `Text extraction complete (${wordsCount} words, ${confidence}% confidence)`, 
        type: 'success' 
      });

      // Step 3: Run explainable heuristics engine
      onTimelineEvent({ 
        id: 'evt-heur', 
        time: new Date().toLocaleTimeString(), 
        msg: 'Evaluating phishing heuristics (urgency, credentials, OTP, links)...', 
        type: 'info' 
      });
      
      const analysis = analyzePhishingHeuristics(ocrResult);

      // Check whether extracted text is insufficient to reach a conclusive judgment
      const isInsufficientEvidence = analysis.indicators.length === 0 && (wordsCount < 3 || rawText.length < 8);

      if (analysis.indicators.length > 0) {
        for (let idx = 0; idx < analysis.indicators.length; idx++) {
          const indicator = analysis.indicators[idx];
          onTimelineEvent({
            id: `evt-ind-${idx}-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            msg: `FLAGGED: ${indicator.category} [${indicator.severity.toUpperCase()}]`,
            type: indicator.severity === 'High' ? 'error' : 'warning'
          });
        }
      } else if (isInsufficientEvidence) {
        onTimelineEvent({ 
          id: 'evt-unreadable', 
          time: new Date().toLocaleTimeString(), 
          msg: 'Insufficient readable text extracted to establish conclusive heuristic assessment. Marked INCONCLUSIVE.', 
          type: 'warning' 
        });
      } else {
        onTimelineEvent({ 
          id: 'evt-clean', 
          time: new Date().toLocaleTimeString(), 
          msg: 'No standard phishing indicators flagged by current heuristics.', 
          type: 'success' 
        });
      }

      const processingTime = ((performance.now() - startTime) / 1000).toFixed(1);
      const risk = getRiskLevel(analysis.score, isInsufficientEvidence);

      onTimelineEvent({ 
        id: 'evt-done', 
        time: new Date().toLocaleTimeString(), 
        msg: `Analysis complete in ${processingTime}s — Assessment: ${risk.label}`, 
        type: 'success' 
      });

      // Step 4: Assemble comprehensive results payload
      const finalResult = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: this.formatBytes(file.size),
        text: rawText,
        confidence,
        wordsCount,
        isUnreadable: wordsCount === 0 || rawText.length === 0,
        isInsufficientEvidence,
        score: isInsufficientEvidence ? 0 : analysis.score,
        displayScore: isInsufficientEvidence ? 'N/A' : analysis.score,
        risk,
        indicators: analysis.indicators,
        matchingWords: analysis.matchingWords,
        detectedUrls: analysis.detectedUrls,
        allRulesEvaluated: analysis.allRulesEvaluated,
        scoringBreakdown: analysis.scoringBreakdown,
        textSignals: analysis.textSignals,
        urlSignals: analysis.urlSignals,
        urgencyCount: analysis.urgencyCount,
        credentialCount: analysis.credentialCount,
        urlCount: analysis.urlCount,
        impersonationCount: analysis.impersonationCount,
        processingTime,
        date: new Date().toLocaleString()
      };

      this.saveToHistory(finalResult);
      return finalResult;

    } catch (err) {
      console.error("Visual Phishing OCR error:", err);
      onTimelineEvent({ 
        id: 'evt-err', 
        time: new Date().toLocaleTimeString(), 
        msg: `Analysis failed: ${err.message || 'OCR extraction error'}`, 
        type: 'error' 
      });
      throw err;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Save lightweight summary to localStorage for history retrieval
   */
  saveToHistory(result) {
    try {
      const history = this.getHistory();
      const lightweight = {
        id: result.id,
        fileName: result.fileName,
        fileSize: result.fileSize,
        score: result.score,
        displayScore: result.displayScore,
        date: result.date,
        riskLabel: result.risk.label,
        riskColor: result.risk.color,
        topIndicator: result.indicators.length > 0 
          ? result.indicators[0].category 
          : result.isInsufficientEvidence 
            ? 'Inconclusive / No Text' 
            : 'Clean / Low Risk',
        indicatorsCount: result.indicators.length
      };
      const updated = [lightweight, ...history.filter(h => h.id !== result.id)].slice(0, 10);
      localStorage.setItem('visualPhishingHistory', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to history", e);
    }
  }

  getHistory() {
    try {
      const hist = localStorage.getItem('visualPhishingHistory');
      return hist ? JSON.parse(hist) : [];
    } catch {
      return [];
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem('visualPhishingHistory');
    } catch {
      // ignore
    }
  }
}

export const visualPhishingService = new VisualPhishingService();
