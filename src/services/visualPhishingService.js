import Tesseract from 'tesseract.js';
import { analyzePhishingHeuristics } from '../utils/phishingHeuristics';

class VisualPhishingService {
  constructor() {
    this.isAnalyzing = false;
  }

  async analyzeImage(file, onProgress, onTimelineEvent) {
    if (this.isAnalyzing) throw new Error("Analysis already in progress.");
    this.isAnalyzing = true;
    
    const startTime = performance.now();
    
    try {
      onTimelineEvent('IMAGE LOADED', 'info');
      onTimelineEvent('OCR INITIALIZED', 'info');
      
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              onProgress(`Analyzing... ${Math.round(m.progress * 100)}%`, m.progress * 100);
            } else {
              onProgress(m.status, m.progress ? m.progress * 100 : 0);
            }
          }
        }
      );

      onTimelineEvent('TEXT EXTRACTED', 'success');
      
      const text = result.data.text.trim();
      const confidence = result.data.confidence;
      
      onTimelineEvent('RUNNING PHISHING HEURISTICS', 'info');
      
      // Perform Heuristic Analysis
      const analysis = analyzePhishingHeuristics(result);
      
      // Emit events for findings
      analysis.indicators.forEach(ind => {
         onTimelineEvent(`${ind.category.toUpperCase()} DETECTED`, 'warning');
      });
      
      onTimelineEvent('RISK SCORE GENERATED', 'info');
      onTimelineEvent('ANALYSIS COMPLETE', 'success');
      
      const processingTime = ((performance.now() - startTime) / 1000).toFixed(1);
      
      const finalResult = {
         id: Date.now().toString(),
         fileName: file.name,
         text,
         confidence: Math.round(confidence),
         score: analysis.score,
         indicators: analysis.indicators,
         matchingWords: analysis.matchingWords,
         detectedUrls: analysis.detectedUrls,
         textSignals: analysis.textSignals,
         urlSignals: analysis.urlSignals,
         visualSignals: analysis.visualSignals,
         processingTime,
         date: new Date().toLocaleString(),
         wordsCount: result.data.words ? result.data.words.length : 0
      };
      
      this.saveToHistory(finalResult);
      
      return finalResult;

    } catch (err) {
      console.error(err);
      onTimelineEvent('ANALYSIS FAILED', 'error');
      throw err;
    } finally {
      this.isAnalyzing = false;
    }
  }

  saveToHistory(result) {
    try {
      const history = this.getHistory();
      // Store lightweight version without full word arrays or text to save space
      const lightweight = {
        id: result.id,
        fileName: result.fileName,
        score: result.score,
        date: result.date,
        topIndicator: result.indicators.length > 0 ? result.indicators[0].category : 'No indicators',
      };
      const updated = [lightweight, ...history].slice(0, 10);
      localStorage.setItem('visualPhishingHistory', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to history", e);
    }
  }

  getHistory() {
    try {
      const hist = localStorage.getItem('visualPhishingHistory');
      return hist ? JSON.parse(hist) : [];
    } catch (e) {
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem('visualPhishingHistory');
  }
}

export const visualPhishingService = new VisualPhishingService();
