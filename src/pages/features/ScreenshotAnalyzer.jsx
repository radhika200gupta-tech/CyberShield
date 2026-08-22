import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { FiCamera, FiUploadCloud, FiShield, FiType, FiAlertCircle, FiCheckCircle, FiFileText } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const PHISHING_RULES = [
  {
    category: "Urgency / Pressure",
    pattern: /(urgent|immediately|act now|expires|expiring|suspended|within \d+ (minutes|hours)|limited time)/i,
    severity: "high",
    points: 30,
    description: "The screenshot contains language designed to create panic or urgency.",
    recommendation: "Take your time. Do not let urgency force you into clicking links or providing info."
  },
  {
    category: "Credential Request",
    pattern: /(verify your account|verify account|confirm your account|login|sign in|credentials|verify your identity|password|username)/i,
    severity: "high",
    points: 30,
    description: "The screenshot appears to request account credentials.",
    recommendation: "Avoid entering credentials until the sender and domain are verified."
  },
  {
    category: "Authentication Code Request",
    pattern: /(verify code|verification code|authentication code|authentication|security code|one time code|one-time code|one time password|otp|enter code|enter verification code|confirmation code)/i,
    severity: "medium",
    points: 20,
    description: "The content appears to involve an authentication or verification code.",
    recommendation: "Never share verification codes or OTPs with anyone, even support."
  },
  {
    category: "Financial / Payment",
    pattern: /(payment|bank|credit card|debit card|transaction|refund|invoice)/i,
    severity: "medium",
    points: 20,
    description: "The text references financial transactions or payment methods.",
    recommendation: "Verify payment requests through an official channel, not through emailed links."
  },
  {
    category: "Suspicious Link",
    pattern: /(http:\/\/|bit\.ly|tinyurl|t\.co)/i,
    severity: "medium",
    points: 20,
    description: "A shortened or unencrypted (HTTP) link was detected.",
    recommendation: "Do not open suspicious or shortened links. Always check the full destination URL."
  },
  {
    category: "Sensitive Information",
    pattern: /(pin|cvv|security number|card number|bank details)/i,
    severity: "high",
    points: 30,
    description: "The screenshot requests highly sensitive security codes or financial info.",
    recommendation: "Never share PINs, CVVs, or full card numbers."
  }
];

const analyzeTextForPhishing = (text) => {
  let score = 0;
  const indicators = [];
  const recommendations = new Set();

  if (!text) return { score: 0, indicators: [], recommendations: [] };

  // Normalize OCR text: lowercase, safely handle punctuation (preserve URL chars and hyphens), and collapse whitespace
  const normalizedText = text.toLowerCase().replace(/[^\w\s:/\.-]/g, ' ').replace(/\s+/g, ' ').trim();

  PHISHING_RULES.forEach(rule => {
    if (rule.pattern.test(normalizedText)) {
      score += rule.points;
      indicators.push({
        category: rule.category,
        description: rule.description,
        severity: rule.severity
      });
      recommendations.add(rule.recommendation);
    }
  });

  return {
    score: Math.min(score, 100),
    indicators,
    recommendations: Array.from(recommendations)
  };
};

const getRiskLevel = (score) => {
  if (score < 30) return { label: 'Low', color: 'text-success' };
  if (score < 60) return { label: 'Medium', color: 'text-warning' };
  if (score < 80) return { label: 'High', color: 'text-danger' };
  return { label: 'Critical', color: 'text-danger' };
};

export default function ScreenshotAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Reset analysis states when a new file is uploaded
      setIsAnalyzing(false);
      setOcrProgress(null);
      setExtractedText(null);
      setAnalysisResults(null);
      setError(null);
      setActiveTab(0);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setOcrProgress(null);
    setExtractedText(null);
    setAnalysisResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isAnalyzing) return;

    setIsAnalyzing(true);
    setOcrProgress('Initializing OCR engine...');
    setError(null);
    setExtractedText(null);
    setAnalysisResults(null);
    setActiveTab(0);

    try {
      const result = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(`Analyzing... ${Math.round(m.progress * 100)}%`);
            } else {
              setOcrProgress(m.status);
            }
          }
        }
      );

      const text = result.data.text.trim();
      setExtractedText(text);
      setAnalysisResults(analyzeTextForPhishing(text));
      setOcrProgress('Complete');
    } catch (err) {
      setError('An error occurred during text extraction. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-display font-semibold text-text-primary">
            Screenshot Phishing Analyzer
          </h1>
          <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-medium font-mono uppercase tracking-wider">
            Browser-based analysis
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Analyze screenshots for suspicious phishing signals and security indicators.
        </p>
      </div>

      {/* Main Upload Section */}
      <Card className="p-1.5 sm:p-2">
        <div className="grid lg:grid-cols-2 gap-2">
          {/* Left: Upload Area */}
          {previewUrl ? (
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center border-2 border-border rounded-xl bg-surface min-h-[400px]">
              <img src={previewUrl} alt="Screenshot Preview" className="max-h-[260px] object-contain rounded-lg shadow-sm border border-border mb-6" />
              <p className="text-sm font-medium text-text-primary truncate max-w-full px-4 mb-4">
                {selectedFile?.name}
              </p>
              <Button variant="outline" onClick={handleRemove} disabled={isAnalyzing}>
                Clear Screenshot
              </Button>
            </div>
          ) : (
            <div
              className="p-8 sm:p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl bg-surface hover:bg-surface-hover hover:border-primary/50 transition-colors cursor-pointer group min-h-[400px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiUploadCloud size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Upload a screenshot</h3>
              <p className="text-sm text-text-secondary mb-1">
                Drop your screenshot here or choose a file
              </p>
              <p className="text-xs text-text-muted mb-8">PNG, JPG or JPEG</p>
              <Button variant="primary" onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}>
                Choose Screenshot
              </Button>
            </div>
          )}

          {/* Right: Analysis Preview */}
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-bg-elevated rounded-xl min-h-[400px]">
            {isAnalyzing ? (
              <>
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                  <FiShield size={28} className="text-accent" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Analyzing Screenshot</h3>
                <p className="text-sm text-text-secondary max-w-xs mb-6 capitalize">
                  {ocrProgress || 'Initializing engine...'}
                </p>
                <div className="w-full max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent animate-pulse w-full" />
                </div>
              </>
            ) : error ? (
              <>
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                  <FiAlertCircle size={28} className="text-danger" />
                </div>
                <h3 className="text-lg font-medium text-danger mb-2">Analysis Failed</h3>
                <p className="text-sm text-text-secondary max-w-xs">{error}</p>
                <div className="mt-8">
                  <Button variant="outline" onClick={handleAnalyze}>Try Again</Button>
                </div>
              </>
            ) : analysisResults ? (
              <>
                <div className="text-xs font-mono text-text-muted mb-4 uppercase tracking-wider">Frontend Heuristic Analysis</div>
                <div className="w-24 h-24 rounded-full bg-surface border-4 border-border flex items-center justify-center mb-4 relative">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-border opacity-50" />
                    <circle
                      cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8"
                      strokeDasharray={`${(analysisResults.score / 100) * 289} 289`}
                      className={getRiskLevel(analysisResults.score).color}
                    />
                  </svg>
                  <span className={`text-2xl font-display font-bold ${getRiskLevel(analysisResults.score).color}`}>
                    {analysisResults.score}
                  </span>
                </div>
                <h3 className={`text-xl font-medium mb-1 ${getRiskLevel(analysisResults.score).color}`}>
                  {getRiskLevel(analysisResults.score).label} Risk
                </h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  {analysisResults.indicators.length} suspicious indicator(s) found.
                </p>
                <div className="mt-6">
                  <Button variant="outline" onClick={handleAnalyze}>Re-Analyze</Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                  <FiShield size={28} className={previewUrl ? "text-accent" : "text-text-muted"} />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  {previewUrl ? 'Ready to Analyze' : 'Waiting for Screenshot'}
                </h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  {previewUrl
                    ? 'Click below to begin extracting text and detecting threats.'
                    : 'Upload a screenshot to begin security analysis.'}
                </p>
                {previewUrl && (
                  <div className="mt-8">
                    <Button variant="primary" onClick={handleAnalyze}>Analyze Screenshot</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* 3 Small Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: FiType, title: 'OCR Analysis', desc: 'Extract visible text from screenshots.', color: 'text-primary bg-primary/10' },
          { icon: FiAlertCircle, title: 'Threat Indicators', desc: 'Identify suspicious phrases, links and requests.', color: 'text-danger bg-danger/10' },
          { icon: FiCheckCircle, title: 'Risk Assessment', desc: 'Understand the potential security risk.', color: 'text-success bg-success/10' },
        ].map((item) => (
          <Card key={item.title} className="p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon size={18} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">{item.title}</h4>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Security Analysis Tabs */}
      <div>
        <h3 className="text-lg font-display font-semibold text-text-primary mb-4">Security Analysis</h3>
        <Card className="overflow-hidden">
          <div className="flex border-b border-border px-2">
            {['Detected Indicators', 'Extracted Text', 'Recommendations'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === i
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-8">
            {activeTab === 0 && analysisResults ? (
              <div className="text-left space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {analysisResults.indicators.length > 0 ? (
                  analysisResults.indicators.map((ind, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-surface flex items-start gap-4">
                      <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${ind.severity === 'high' ? 'bg-danger' : 'bg-warning'}`} />
                      <div>
                        <h5 className="text-sm font-medium text-text-primary mb-1">{ind.category}</h5>
                        <p className="text-sm text-text-secondary">{ind.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiCheckCircle size={32} className="mx-auto text-success mb-3" />
                    <h5 className="font-medium text-text-primary mb-1">No suspicious indicators detected</h5>
                    <p className="text-sm text-text-secondary">No obvious phishing signs were found by the current rules.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 1 && extractedText !== null ? (
              <div className="text-left bg-surface border border-border p-6 rounded-lg max-h-[400px] overflow-y-auto">
                {extractedText ? (
                  <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                    {extractedText}
                  </pre>
                ) : (
                  <p className="text-sm text-text-muted italic text-center py-4">No readable text detected in this screenshot.</p>
                )}
              </div>
            ) : activeTab === 2 && analysisResults ? (
              <div className="text-left space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {analysisResults.recommendations.length > 0 ? (
                  analysisResults.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                      <FiAlertCircle className="text-primary mt-0.5 shrink-0" size={16} />
                      <p className="text-sm text-text-primary">{rec}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-text-secondary">No specific recommendations at this time. Stay vigilant.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <FiFileText size={20} className="text-text-muted" />
                </div>
                <h4 className="text-text-primary font-medium mb-1">
                  {activeTab === 1 ? 'Extracted text will appear here.' : 'No analysis results yet.'}
                </h4>
                <p className="text-sm text-text-secondary">Upload a screenshot and run analysis to begin.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
