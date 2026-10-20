import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiCpu, FiSend, FiRefreshCw, FiCopy, FiCheck, FiInfo, 
  FiAlertTriangle, FiShield, FiFileText, FiLock, FiCornerDownRight, 
  FiLayers, FiMail, FiGlobe, FiPaperclip, FiMic, FiMicOff, 
  FiPlus, FiX, FiTrash2, FiEdit2, FiClock, FiChevronRight, 
  FiChevronDown, FiCheckCircle, FiActivity, FiPlay, FiUploadCloud, 
  FiMessageSquare, FiSidebar, FiAlertOctagon,
  FiVolume2, FiVolumeX, FiCompass, FiHelpCircle, FiImage, FiFile,
  FiArrowUp, FiSearch
} from 'react-icons/fi';
import Button from '../common/Button';
import { 
  aiCopilotService, 
  COPILOT_SESSIONS_STORAGE_KEY, 
  COPILOT_ACTIVE_SESSION_KEY 
} from '../../services/aiCopilotService';
import { 
  parseUserIntent, 
  matchVoiceCommand, 
  VOICE_DESTINATIONS, 
  extractUrlFromText, 
  extractEmailAddress, 
  extractEmailContentFromPrompt 
} from '../../services/voiceNavigationService';
import { 
  setTransferredScreenshot, 
  setTransferredEmail, 
  setTransferredUrl, 
  setTransferredPassword,
  consumeTransferredThreat
} from '../../services/imageHandoffService';

/**
 * Format bytes into human-readable string.
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders formatted markdown safely without external parser dependencies.
 * Handles headers, bold text, inline code, code blocks with copy snippet button,
 * blockquotes, bullet lists, numbered lists, and horizontal rules.
 */
function FormattedMessage({ content }) {
  if (!content) return null;

  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let blockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        const fullCode = codeBuffer.join('\n');
        const currentIdx = blockKey++;
        elements.push(
          <div key={`code-${currentIdx}`} className="my-3 rounded-xl bg-black/80 border border-border/80 font-mono text-xs sm:text-sm overflow-hidden shadow-inner group">
            <div className="flex items-center justify-between px-3.5 py-2 bg-surface/50 border-b border-border/60 text-xs text-text-muted">
              <span>Code / Payload Preview</span>
              <button
                onClick={() => handleCopyCode(fullCode, currentIdx)}
                className="flex items-center gap-1.5 text-accent hover:text-white transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCodeIdx === currentIdx ? (
                  <>
                    <FiCheck size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <FiCopy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-accent/95 overflow-x-auto whitespace-pre leading-relaxed">{fullCode}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base sm:text-lg font-bold text-text-primary mt-4 mb-2 flex items-center gap-2 tracking-tight">
          {formatInline(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm sm:text-base font-semibold text-accent mt-3 mb-1.5 uppercase tracking-wider">
          {formatInline(line.replace('#### ', ''))}
        </h4>
      );
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-border/50" />);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="my-3 pl-4 py-2 border-l-2 border-accent/70 bg-accent/5 rounded-r-lg text-sm text-text-secondary leading-relaxed font-normal">
          {formatInline(line.replace('> ', ''))}
        </blockquote>
      );
      continue;
    }

    // Unordered List item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2);
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 my-1 text-sm sm:text-base text-text-secondary leading-relaxed pl-1">
          <span className="text-accent font-bold mt-1 text-xs shrink-0">•</span>
          <span className="flex-1">{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // Numbered List item
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2.5 my-1 text-sm sm:text-base text-text-secondary leading-relaxed pl-1">
          <span className="text-accent font-mono font-bold text-xs sm:text-sm mt-0.5 shrink-0">{numMatch[1]}.</span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty line spacer
    if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm sm:text-base text-text-secondary leading-relaxed my-1.5">
        {formatInline(line)}
      </p>
    );
  }

  // Close unclosed code block if necessary
  if (inCodeBlock && codeBuffer.length > 0) {
    const fullCode = codeBuffer.join('\n');
    elements.push(
      <div key={`code-${blockKey++}`} className="my-3 p-4 rounded-xl bg-black/80 border border-border/80 font-mono text-xs sm:text-sm text-accent overflow-x-auto shadow-inner">
        <pre className="whitespace-pre">{fullCode}</pre>
      </div>
    );
  }

  return <div className="space-y-0.5 text-left">{elements}</div>;
}

/**
 * Handles inline code `code` and bold **text**.
 */
function formatInline(text) {
  if (!text) return '';
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="font-mono text-xs sm:text-sm bg-bg-surface px-1.5 py-0.5 rounded border border-border/80 text-accent font-medium">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Strips markdown symbols for clean Text-to-Speech audio reading.
 */
function stripMarkdownForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/>\s+/gm, '')
    .replace(/[-*]\s+/gm, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .trim();
}

export default function AICopilotChat() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Threat Intelligence Investigation Context (in-memory React state, not leaked to localStorage)
  const [activeThreatContext, setActiveThreatContext] = useState(null);
  const [threatHandoffNotice, setThreatHandoffNotice] = useState(null);

  // --- Sessions Management ---
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(COPILOT_SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load copilot sessions:', e);
    }
    const initSession = {
      id: 'session-default',
      title: 'Initial Security Triage',
      createdAt: new Date().toLocaleDateString(),
      messages: [aiCopilotService.getWelcomeMessage()]
    };
    return [initSession];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(COPILOT_ACTIVE_SESSION_KEY);
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return 'session-default';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Active session messages
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || {
      id: 'session-default',
      title: 'Security Triage',
      messages: [aiCopilotService.getWelcomeMessage()]
    };
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  // Persist sessions in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COPILOT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      localStorage.setItem(COPILOT_ACTIVE_SESSION_KEY, activeSessionId);
    } catch (e) {
      console.warn('Failed to save copilot sessions:', e);
    }
  }, [sessions, activeSessionId]);

  // --- Chat Input & Attachment State ---
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Attachments state (Supports multiple images + supported file + sample artifact)
  const [attachedImages, setAttachedImages] = useState([]); // Array of { id, file, previewUrl, name, size, type }
  const [attachedFile, setAttachedFile] = useState(null); // { file, name, size, type, contentText, isSupported }
  const [selectedArtifact, setSelectedArtifact] = useState(null); // Pre-packaged security artifact

  // Modals & Drawers
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isVoiceCommandsModalOpen, setIsVoiceCommandsModalOpen] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');

  // Speech Recognition state (Voice-to-Text & Navigation)
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [voiceNavFeedback, setVoiceNavFeedback] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    try {
      return localStorage.getItem('cybershield_audio_muted') === 'true';
    } catch {
      return false;
    }
  });

  // Speech Recognition lifecycle and duplicate prevention refs
  const speechRecognitionRef = useRef(null);
  const isListeningIntentActiveRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const restartRetryCountRef = useRef(0);
  const isSubmittingCommandRef = useRef(false);

  // Text-to-Speech (TTS) state
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Drag and drop indicator
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Progressive Scanning Animation state
  const [scanningArtifact, setScanningArtifact] = useState(null);
  const [scanningStage, setScanningStage] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  // DOM refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);
  const lastAttachmentRef = useRef(null);
  const lastEmailTextRef = useRef(null);
  const lastUrlRef = useRef(null);

  const securityTools = useMemo(() => aiCopilotService.getSecurityTools(), []);
  const suggestedPrompts = useMemo(() => aiCopilotService.getSuggestedPrompts(), []);
  const sampleArtifacts = useMemo(() => aiCopilotService.getSampleArtifacts(), []);

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    if (!toolSearchQuery.trim()) return securityTools;
    const q = toolSearchQuery.toLowerCase();
    return securityTools.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) || 
      t.category.toLowerCase().includes(q)
    );
  }, [securityTools, toolSearchQuery]);

  // Clean up SpeechSynthesis and SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      isListeningIntentActiveRef.current = false;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Auto-scroll on new messages or thinking state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, scanningStage]);

  // Helper to update active session messages
  const updateActiveSessionMessages = (updater) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        const nextMessages = typeof updater === 'function' ? updater(s.messages) : updater;
        return { ...s, messages: nextMessages };
      }
      return s;
    }));
  };

  // --- Threat Intelligence Ingestion & Context Handling ---
  useEffect(() => {
    const incomingThreat = consumeTransferredThreat() || location.state?.threatRecord;
    const isFromThreatIntel = location.state?.fromThreatIntel;

    if (incomingThreat) {
      if (incomingThreat.indicator || incomingThreat.id) {
        setActiveThreatContext(incomingThreat);
        setThreatHandoffNotice(null);

        // Generate the initial structured threat explanation
        const explanation = aiCopilotService.generateThreatRecordExplanation(incomingThreat);

        const investigationMsg = {
          id: `threat-intel-${Date.now()}`,
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'THREAT_INTEL_INVESTIGATION',
          isDemo: true,
          text: explanation.text,
          analysisContext: {
            type: 'threat_intel',
            threat: incomingThreat
          },
          followUps: explanation.followUps || [
            'Explain this threat in simple words.',
            'Why is this classified as high risk?',
            'What evidence is available?',
            'What should I do next?',
            'Summarize this threat for my project report.'
          ]
        };

        // If current session only has the default welcome message, replace it; otherwise append
        updateActiveSessionMessages(prev => {
          if (prev.length <= 1 && prev[0]?.id === 'welcome-init') {
            return [investigationMsg];
          }
          return [...prev, investigationMsg];
        });

        // Set session title to reflect this investigation
        const shortHost = incomingThreat.evidence?.host || incomingThreat.indicator || 'Threat Intel';
        const sessionTitle = `Threat: ${shortHost.length > 20 ? shortHost.slice(0, 18) + '...' : shortHost}`;
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: sessionTitle } : s));

        // If unmuted, speak concise summary
        if (!isAudioMuted && 'speechSynthesis' in window) {
          const spoken = aiCopilotService.getSpokenSummary(explanation.text);
          if (spoken) speakUtterance(investigationMsg.id, spoken);
        }
      } else {
        setThreatHandoffNotice({
          type: 'error',
          message: 'A threat handoff was initiated, but the record was missing indicator telemetry.'
        });
      }
    } else if (isFromThreatIntel) {
      // Honest error as required by Requirement 3
      setThreatHandoffNotice({
        type: 'error',
        message: 'Navigation from Threat Intelligence succeeded, but no threat record could be transferred. Please return to Threat Intelligence and click Inspect on an indicator to investigate.'
      });
    }
  }, [location.state]);

  const handleClearActiveThreat = () => {
    setActiveThreatContext(null);
    setThreatHandoffNotice(null);
    const clearMsg = {
      id: `clear-${Date.now()}`,
      sender: 'copilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'SYSTEM',
      isDemo: true,
      text: `ℹ️ **Active Threat Investigation Cleared**: The previous threat context has been dismissed. You can continue asking general cybersecurity questions, attach screenshots, or return to **[Real-Time Threat Intelligence](/app/coming-soon/threat-intel)** to select a new indicator.`,
      followUps: aiCopilotService.getFollowUpPrompts('DEFAULT')
    };
    updateActiveSessionMessages(prev => [...prev, clearMsg]);
  };

  // --- Session Controls ---
  const handleCreateNewChat = () => {
    // Cancel any active speech
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Security Chat ${sessions.length + 1}`,
      createdAt: new Date().toLocaleDateString(),
      messages: [aiCopilotService.getWelcomeMessage()]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveThreatContext(null);
    setThreatHandoffNotice(null);
    setInputValue('');
    setAttachedImages([]);
    setAttachedFile(null);
    setSelectedArtifact(null);
    // Explicitly reset session-level investigation context refs
    lastAttachmentRef.current = null;
    lastEmailTextRef.current = null;
    lastUrlRef.current = null;
    setIsSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSelectSession = (id) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setActiveSessionId(id);
    setActiveThreatContext(null);
    setThreatHandoffNotice(null);
    setIsSidebarOpen(false);
    setAttachedImages([]);
    setAttachedFile(null);
    setSelectedArtifact(null);
    // Reset transient session attachment refs
    lastAttachmentRef.current = null;
    lastEmailTextRef.current = null;
    lastUrlRef.current = null;
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      handleCreateNewChat();
      return;
    }
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (id, e) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s));
    setEditingSessionId(null);
  };

  const handleClearAllConversations = () => {
    localStorage.removeItem(COPILOT_SESSIONS_STORAGE_KEY);
    localStorage.removeItem(COPILOT_ACTIVE_SESSION_KEY);
    const freshId = `session-${Date.now()}`;
    const fresh = [{
      id: freshId,
      title: 'Initial Security Triage',
      createdAt: new Date().toLocaleDateString(),
      messages: [aiCopilotService.getWelcomeMessage()]
    }];
    setSessions(fresh);
    setActiveSessionId(freshId);
    setIsClearConfirmOpen(false);
    setIsSidebarOpen(false);
  };

  // --- Attachments Handling ---
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImages = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file. Please select PNG, JPG, or WebP.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      validImages.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    setAttachedImages(prev => [...prev, ...validImages]);
    setIsPlusMenuOpen(false);
    e.target.value = '';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTextReadable = file.name.match(/\.(txt|eml|log|json|csv|md)$/i) || (file.type && (file.type.startsWith('text/') || file.type.includes('json')));
    let contentText = null;

    if (isTextReadable) {
      try {
        contentText = await file.text();
      } catch (err) {
        console.warn('Could not read file text:', err);
      }
    }

    setAttachedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'text/plain',
      isSupported: isTextReadable,
      contentText
    });

    setIsPlusMenuOpen(false);
    e.target.value = '';
  };

  const removeAttachedImage = (idToRemove) => {
    setAttachedImages(prev => {
      const removed = prev.find(img => img.id === idToRemove);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter(img => img.id !== idToRemove);
    });
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const removeSelectedArtifact = () => {
    setSelectedArtifact(null);
  };

  // --- Drag & Drop ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setAttachedImages(prev => [...prev, {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          type: file.type
        }]);
      } else {
        const isTextReadable = file.name.match(/\.(txt|eml|log|json|csv|md)$/i) || (file.type && (file.type.startsWith('text/') || file.type.includes('json')));
        let contentText = null;
        if (isTextReadable) {
          try {
            contentText = await file.text();
          } catch (err) {
            console.warn('Error reading dropped file:', err);
          }
        }
        setAttachedFile({
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          isSupported: isTextReadable,
          contentText
        });
      }
    }
  };

  // --- Clipboard Image Paste (Ctrl+V) ---
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        hasImage = true;
        const file = item.getAsFile();
        if (file) {
          const previewUrl = URL.createObjectURL(file);
          const customName = `pasted_screenshot_${Date.now().toString().slice(-4)}.png`;
          const imageObj = {
            id: `img-paste-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file: new File([file], customName, { type: file.type }),
            previewUrl,
            name: customName,
            size: file.size,
            type: file.type,
            isPasted: true
          };
          setAttachedImages(prev => [...prev, imageObj]);
          setVoiceNavFeedback('📋 Screenshot pasted from clipboard! Ready for analysis.');
          setTimeout(() => setVoiceNavFeedback(null), 3500);
        }
      }
    }

    if (hasImage) {
      e.preventDefault();
    }
  }, []);

  // Global window paste listener for Ctrl+V everywhere inside Copilot
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Avoid intercepting if user is inside another input/textarea that is not the copilot composer
      if (e.target && e.target !== textareaRef.current && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;
      let hasImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          hasImage = true;
          break;
        }
      }
      if (hasImage) {
        handlePaste(e);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handlePaste]);

  // --- Speech Recognition (Voice-to-Text & Navigation) ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari with microphone permissions enabled.');
      setTimeout(() => setVoiceNotice(null), 6000);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch {}
    }

    isListeningIntentActiveRef.current = true;
    intentionalStopRef.current = false;
    restartRetryCountRef.current = 0;
    isSubmittingCommandRef.current = false;
    setInterimTranscript('');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcriptChunk = item[0].transcript;
          if (item.isFinal) {
            finalChunk += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        if (finalChunk) {
          setFinalTranscript(prev => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          isListeningIntentActiveRef.current = false;
          intentionalStopRef.current = true;
          setIsListening(false);
          setVoiceNotice('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
          setTimeout(() => setVoiceNotice(null), 6000);
        } else if (event.error === 'audio-capture') {
          isListeningIntentActiveRef.current = false;
          intentionalStopRef.current = true;
          setIsListening(false);
          setVoiceNotice('No microphone detected. Please connect an audio input device.');
          setTimeout(() => setVoiceNotice(null), 6000);
        } else if (event.error !== 'no-speech') {
          setVoiceNotice(`Speech recognition notice: ${event.error}. You can also type in the composer.`);
          setTimeout(() => setVoiceNotice(null), 5000);
        }
      };

      recognition.onend = () => {
        if (intentionalStopRef.current || !isListeningIntentActiveRef.current) {
          setIsListening(false);
          setInterimTranscript('');
          return;
        }

        // Recover from unexpected recognition drop with bounded backoff
        if (restartRetryCountRef.current < 3) {
          restartRetryCountRef.current += 1;
          setTimeout(() => {
            if (isListeningIntentActiveRef.current && !intentionalStopRef.current) {
              try {
                recognition.start();
              } catch (e) {
                console.warn('Speech recognition restart caught:', e);
                setIsListening(false);
              }
            }
          }, 300);
        } else {
          isListeningIntentActiveRef.current = false;
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      isListeningIntentActiveRef.current = false;
      setIsListening(false);
      setVoiceNotice('Could not initialize speech recognition. Please enter your command using the keyboard.');
      setTimeout(() => setVoiceNotice(null), 6000);
    }
  };

  const stopListening = () => {
    isListeningIntentActiveRef.current = false;
    intentionalStopRef.current = true;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCancelVoice = () => {
    stopListening();
    setFinalTranscript('');
    setInterimTranscript('');
  };

  const handleExecuteVoiceCommand = () => {
    const fullCommand = `${finalTranscript} ${interimTranscript}`.trim();
    if (!fullCommand) return;
    if (isSubmittingCommandRef.current) return;

    stopListening();
    setFinalTranscript('');
    setInterimTranscript('');

    handleSendMessage(fullCommand);
  };

  const handleApplyVoiceToComposer = () => {
    const fullCommand = `${finalTranscript} ${interimTranscript}`.trim();
    stopListening();
    if (fullCommand) {
      setInputValue(prev => prev ? `${prev} ${fullCommand}` : fullCommand);
    }
    setFinalTranscript('');
    setInterimTranscript('');
    textareaRef.current?.focus();
  };

  const handleToggleAudioMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cybershield_audio_muted', next.toString());
      } catch {}
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
      }
      return next;
    });
  };

  // Helper to speak utterance cleanly
  const speakUtterance = (msgId, textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        setSpeakingMessageId(null);
      };

      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      setSpeakingMessageId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setSpeakingMessageId(null);
    }
  };

  // --- Text-to-Speech (TTS) ---
  const handleToggleSpeak = (msgId, text, isFullReport = false) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio playback is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    const textToSpeak = isFullReport ? stripMarkdownForSpeech(text) : aiCopilotService.getSpokenSummary(text);
    speakUtterance(msgId, textToSpeak);
  };

  // --- Progressive Scanning Simulation ---
  const handleLaunchArtifactScan = async (artifact, isCustom = false) => {
    if (!artifact) return;
    setIsArtifactModalOpen(false);
    setScanningArtifact(artifact);
    setScanResult(null);
    setScanningStage({
      stage: 1,
      stageName: isCustom ? 'Preparing screenshot' : 'Preparing artifact',
      percent: 20,
      message: 'Validating payload structure and forensic metadata envelope...'
    });

    try {
      const result = await aiCopilotService.simulateScanning(artifact, (stageInfo) => {
        setScanningStage(stageInfo);
      });
      setScanResult(result);
    } catch (err) {
      console.error('Scan simulation error:', err);
      setScanningStage(null);
      setScanningArtifact(null);
    }
  };

  const handleInsertScanReportToChat = () => {
    if (!scanningArtifact || !scanResult) return;

    const reportText = `### 🔍 Forensic Demo Scan Report: ${scanningArtifact.title || scanningArtifact.name || 'Security Artifact'}
*(Progressive 4-Stage Forensic Inspection)*

**Threat Classification**: 🚨 **${scanResult.threatLevel}**  
**Attack Vector**: **${scanResult.classification}**  
**Confidence**: **${scanResult.confidence}**

---

#### Key Findings Identified:
${scanResult.findings.map(f => `- ${f}`).join('\n')}

#### Forensic Evidence Breakdown:
${scanResult.evidence.map(e => `- \`${e}\``).join('\n')}

> **Demonstration Limitations**: ${scanResult.limitations}

#### Recommended Next Steps:
${scanResult.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

    const assistantMessage = {
      id: Date.now().toString(),
      sender: 'copilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'SCAN_REPORT',
      isDemo: true,
      text: reportText,
      followUps: [
        'Generate an executive incident summary for this event.',
        'What are the immediate containment steps?',
        'Explain SPF, DKIM, and DMARC alignment.'
      ]
    };

    updateActiveSessionMessages(prev => [...prev, assistantMessage]);
    setScanningArtifact(null);
    setScanResult(null);
    setScanningStage(null);
  };

  // --- Send Message ---
  const handleSendMessage = async (textOverride = null) => {
    const textToSend = textOverride !== null ? textOverride : inputValue;
    const trimmed = textToSend.trim();

    // Must have at least text or an attachment
    if (!trimmed && attachedImages.length === 0 && !attachedFile && !selectedArtifact) {
      return;
    }
    if (isThinking) return;
    if (isSubmittingCommandRef.current) return;
    isSubmittingCommandRef.current = true;
    setTimeout(() => {
      isSubmittingCommandRef.current = false;
    }, 700);

    // Snapshot current composer attachments before any state reset
    const currentImages = [...attachedImages];
    const currentFile = attachedFile;
    const currentArtifact = selectedArtifact;

    // Build intent context
    const intentContext = {
      attachments: currentImages.length > 0 ? currentImages : (currentFile ? [currentFile] : []),
      activeAttachment: currentImages.length > 0 ? (currentImages[0].file || currentImages[0]) : currentFile,
      lastAttachment: lastAttachmentRef.current,
      lastEmailText: lastEmailTextRef.current,
      lastUrl: lastUrlRef.current,
      messages: messages,
      rawInput: trimmed
    };

    const intent = parseUserIntent(trimmed, intentContext);

    // 1. HANDOFF ACTION
    if (intent.type === 'HANDOFF_ACTION') {
      if (intent.status === 'SUCCESS') {
        const userMsg = {
          id: Date.now().toString(),
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: trimmed,
          attachmentMeta: {
            images: currentImages.length > 0 ? currentImages.map(img => ({
              name: img.name,
              size: img.size,
              previewUrl: img.previewUrl,
              file: img.file || (img instanceof File || img instanceof Blob ? img : null)
            })) : null,
            file: currentFile ? {
              name: currentFile.name,
              size: currentFile.size,
              type: currentFile.type
            } : null
          },
          rawFile: currentImages.length > 0 ? (currentImages[0].file || currentImages[0]) : (currentFile?.file || currentFile)
        };

        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `✅ **Handoff Executed:** ${intent.feedback}\n\nNavigating to **[${intent.destination.label}](${intent.destination.path})**...`,
          isHandoff: true
        };

        updateActiveSessionMessages(prev => [...prev, userMsg, assistantMsg]);
        setInputValue('');
        setAttachedImages([]);
        setAttachedFile(null);
        setSelectedArtifact(null);

        // Keep last attachment ref updated
        if (intent.file) lastAttachmentRef.current = intent.file;
        if (intent.emailContent) lastEmailTextRef.current = intent.emailContent;
        if (intent.url) lastUrlRef.current = intent.url;

        // Perform in-memory handoff transfer
        if (intent.action === 'HANDOFF_SCREENSHOT' || intent.action === 'HANDOFF_QR') {
          setTransferredScreenshot(intent.file);
        } else if (intent.action === 'HANDOFF_EMAIL') {
          setTransferredEmail(intent.emailContent);
        } else if (intent.action === 'HANDOFF_URL') {
          setTransferredUrl(intent.url);
        } else if (intent.action === 'HANDOFF_PASSWORD') {
          setTransferredPassword(intent.password);
        }

        setVoiceNavFeedback(`🎙️ ${intent.feedback}`);

        // Navigate with state payload
        setTimeout(() => {
          setVoiceNavFeedback(null);
          navigate(intent.destination.path, {
            state: {
              transferredFile: intent.file,
              emailContent: intent.emailContent,
              url: intent.url,
              password: intent.password,
              autoScan: intent.autoScan || false,
              fromCopilot: true
            }
          });
        }, 600);

        return;
      } else if (intent.status === 'MISSING_CONTENT') {
        const userMsg = {
          id: Date.now().toString(),
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: trimmed
        };
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ **Action Required:** ${intent.feedback}`
        };
        updateActiveSessionMessages(prev => [...prev, userMsg, assistantMsg]);
        setInputValue('');
        return;
      }
    }

    // 2. DIRECT NAVIGATION
    if (intent.type === 'NAVIGATE') {
      const userMsg = {
        id: Date.now().toString(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: trimmed
      };
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🚀 **Navigating:** ${intent.feedback}\n\nOpening **[${intent.destination.label}](${intent.destination.path})**...`
      };
      updateActiveSessionMessages(prev => [...prev, userMsg, assistantMsg]);
      setInputValue('');
      setVoiceNavFeedback(`🎙️ ${intent.feedback}`);

      // Reverse handoff: check if active attachments or URLs should transfer
      let transferredFile = null;
      let emailContent = null;
      let url = null;

      if (['screenshot-analyzer', 'visual-phishing', 'qr-scanner'].includes(intent.destination.id)) {
        transferredFile = currentImages.length > 0 ? (currentImages[0].file || currentImages[0]) : lastAttachmentRef.current;
        if (transferredFile) {
          setTransferredScreenshot(transferredFile);
        }
      } else if (intent.destination.id === 'email-forensics') {
        emailContent = extractEmailContentFromPrompt(trimmed) || currentFile?.contentText || lastEmailTextRef.current;
        if (emailContent) {
          setTransferredEmail(emailContent);
        }
      } else if (intent.destination.id === 'url-scanner') {
        const detectedUrl = extractUrlFromText(trimmed);
        if (detectedUrl) {
          url = detectedUrl;
          setTransferredUrl(url);
        }
      }

      setTimeout(() => {
        setVoiceNavFeedback(null);
        navigate(intent.destination.path, {
          state: {
            transferredFile,
            emailContent,
            url,
            fromCopilot: true
          }
        });
      }, 600);
      return;
    }

    // 3. CONTROL ACTIONS
    if (intent.type === 'CONTROL_ACTION') {
      setInputValue('');
      if (intent.action === 'GO_BACK') {
        setVoiceNavFeedback(`🎙️ ${intent.feedback}`);
        setTimeout(() => {
          setVoiceNavFeedback(null);
          navigate(-1);
        }, 500);
        return;
      } else if (intent.action === 'NEW_CHAT') {
        handleCreateNewChat();
        return;
      } else if (intent.action === 'READ_ALOUD') {
        const assistantMsgs = messages.filter(m => m.sender === 'copilot');
        if (assistantMsgs.length > 0) {
          const last = assistantMsgs[assistantMsgs.length - 1];
          handleToggleSpeak(last.id, last.text);
        }
        return;
      } else if (intent.action === 'STOP_SPEAKING') {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      } else if (intent.action === 'STOP_LISTENING') {
        stopListening();
        return;
      }
    }

    // 4. AMBIGUOUS REQUEST
    if (intent.type === 'AMBIGUOUS') {
      const userMsg = {
        id: Date.now().toString(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: trimmed
      };
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🤔 **Clarification Needed:**\n\n${intent.feedback}`
      };
      updateActiveSessionMessages(prev => [...prev, userMsg, assistantMsg]);
      setInputValue('');
      return;
    }

    // 5. REGULAR CHAT QUERY
    // Track attachments in refs for subsequent turns
    if (currentImages.length > 0) {
      lastAttachmentRef.current = currentImages[currentImages.length - 1].file || currentImages[currentImages.length - 1];
    } else if (currentFile) {
      lastAttachmentRef.current = currentFile.file || currentFile;
      if (currentFile.contentText) {
        lastEmailTextRef.current = currentFile.contentText;
      }
    }
    const detectedEmail = extractEmailAddress(trimmed);
    if (detectedEmail || (trimmed && /(Received:|From:|To:|Subject:|Authentication-Results:)/i.test(trimmed))) {
      lastEmailTextRef.current = trimmed;
    }
    const detectedUrl = extractUrlFromText(trimmed);
    if (detectedUrl) {
      lastUrlRef.current = detectedUrl;
    }

    // Build user message attachment metadata
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
      attachmentMeta: {
        images: currentImages.length > 0 ? currentImages.map(img => ({
          name: img.name,
          size: img.size,
          previewUrl: img.previewUrl,
          file: img.file || (img instanceof File || img instanceof Blob ? img : null)
        })) : null,
        file: currentFile ? {
          name: currentFile.name,
          size: currentFile.size,
          type: currentFile.type
        } : null,
        artifact: currentArtifact ? {
          title: currentArtifact.title,
          type: currentArtifact.type
        } : null
      },
      rawFile: currentImages.length > 0 ? (currentImages[0].file || currentImages[0]) : (currentFile?.file || currentFile)
    };

    // If first message in a newly created chat, auto-update title
    if (messages.length <= 1 && trimmed) {
      const summaryTitle = trimmed.length > 28 ? trimmed.substring(0, 25) + '...' : trimmed;
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: summaryTitle } : s));
    }

    updateActiveSessionMessages(prev => [...prev, userMessage]);

    // Current attachments payload passed to service
    const currentAttachments = {
      images: currentImages,
      image: currentImages.length > 0 ? currentImages[0] : null,
      file: currentFile,
      sampleArtifact: currentArtifact,
      threatContext: activeThreatContext
    };

    // Reset composer state
    setInputValue('');
    setAttachedImages([]);
    setAttachedFile(null);
    setSelectedArtifact(null);
    setIsThinking(true);
    setThinkingStatus(null);

    try {
      const response = await aiCopilotService.sendMessage(
        trimmed,
        messages,
        currentAttachments,
        (status) => setThinkingStatus(status)
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        timestamp: response.timestamp,
        category: response.category,
        isDemo: response.isDemo,
        text: response.text,
        analysisContext: response.analysisContext || null,
        followUps: response.followUps || []
      };

      updateActiveSessionMessages(prev => [...prev, assistantMessage]);

      // If audio output is enabled (unmuted), speak concise summary
      if (!isAudioMuted && 'speechSynthesis' in window) {
        const spokenSummary = aiCopilotService.getSpokenSummary(response.text);
        if (spokenSummary) {
          speakUtterance(assistantMessage.id, spokenSummary);
        }
      }
    } catch (err) {
      console.error('Copilot send error:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        text: 'An error occurred while evaluating your request in demonstration mode. Please select one of the suggested prompts or choose a cybersecurity tool above.'
      };
      updateActiveSessionMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      setThinkingStatus(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Copy & Regenerate ---
  const handleCopyText = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerateLast = () => {
    if (isThinking) return;
    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length === 0) return;
    const lastUserMsg = userMessages[userMessages.length - 1];
    handleSendMessage(lastUserMsg.text);
  };

  // --- Tool Actions ---
  const handleSelectTool = (tool) => {
    setIsToolsDrawerOpen(false);
    if (tool.isArtifactTrigger) {
      setIsArtifactModalOpen(true);
      return;
    }
    setInputValue(tool.defaultPrompt);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const isFreshConversation = messages.length <= 1 && !activeThreatContext;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8rem)] min-h-[550px] w-full rounded-2xl bg-bg/95 border border-border/80 shadow-2xl overflow-hidden relative font-sans text-text-primary">

      {/* =========================================================================
          1. VOICE NAVIGATION FEEDBACK TOAST BANNER
      ========================================================================== */}
      {voiceNavFeedback && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-accent text-bg font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <FiCompass className="animate-spin" size={16} />
          <span>{voiceNavFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          2. TOP HEADER (CHATGPT-LIKE BRANDING & CONTROLS)
      ========================================================================== */}
      <header className="px-4 sm:px-6 py-3 border-b border-border/80 bg-surface/50 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Left: Sidebar toggle, glowing avatar, title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer shrink-0"
            title="Toggle recent conversations"
            aria-label="Toggle conversations sidebar"
          >
            <FiSidebar size={18} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0 shadow-sm">
              <FiCpu size={16} className="text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate">
                  CyberShield AI Security Copilot
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Engine Online" />
              </div>
              <p className="text-xs text-text-secondary truncate hidden sm:block">
                Intelligent threat triage, client-side OCR forensics & incident playbooks
              </p>
            </div>
          </div>
        </div>

        {/* Right: Demo Badge, Tools Drawer, Voice Guide, New Chat */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Security Engine Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-semibold shrink-0 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="hidden sm:inline">Local Security Engine</span>
            <span className="sm:hidden">Active</span>
          </div>

          {/* Voice Audio Mute / Unmute Toggle */}
          <button
            onClick={handleToggleAudioMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isAudioMuted 
                ? 'bg-surface border-border text-text-muted hover:text-text-primary' 
                : 'bg-accent/15 border-accent/40 text-accent hover:bg-accent/25'
            }`}
            title={isAudioMuted ? 'Voice Audio Muted (Click to Unmute)' : 'Voice Audio Active (Click to Mute)'}
            aria-label={isAudioMuted ? 'Unmute voice audio' : 'Mute voice audio'}
          >
            {isAudioMuted ? <FiVolumeX size={14} className="text-text-muted" /> : <FiVolume2 size={14} className="text-accent" />}
            <span className="hidden md:inline">{isAudioMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* Voice Commands Guide Button */}
          <button
            onClick={() => setIsVoiceCommandsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-border bg-surface text-text-secondary hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
            title="View voice navigation commands"
          >
            <FiCompass size={13} className="text-accent" />
            <span className="hidden md:inline">Voice Commands</span>
          </button>

          {/* Cybersecurity Tools Drawer Trigger */}
          <button
            onClick={() => setIsToolsDrawerOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isToolsDrawerOpen 
                ? 'bg-accent/20 border-accent text-accent' 
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-accent/40'
            }`}
            title="Browse Built-in Cybersecurity Tools"
          >
            <FiShield size={13} className="text-accent" />
            <span className="hidden sm:inline">Sec Tools</span>
            <FiChevronDown size={12} className={`transition-transform duration-200 ${isToolsDrawerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* New Chat Button */}
          <Button
            variant="outline"
            onClick={handleCreateNewChat}
            disabled={isThinking}
            className="text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 border-border hover:bg-surface cursor-pointer shrink-0"
            title="Start new conversation"
          >
            <FiPlus size={13} />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN BODY (SIDEBAR CONVERSATIONS + CHAT CANVAS)
      ========================================================================== */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* RECENT CONVERSATIONS SIDEBAR / DRAWER */}
        {isSidebarOpen && (
          <aside className="w-64 sm:w-72 bg-bg-elevated/95 border-r border-border flex flex-col shrink-0 z-30 backdrop-blur-xl absolute inset-y-0 left-0 animate-fade-in shadow-2xl">
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FiClock size={13} className="text-accent" />
                <span>Conversations</span>
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer"
                aria-label="Close sessions sidebar"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* New Chat in Sidebar */}
            <div className="p-2.5 border-b border-border/60">
              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-semibold text-xs hover:bg-accent/20 transition-colors cursor-pointer"
              >
                <FiPlus size={14} />
                <span>New Conversation</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSession.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-accent/15 border border-accent/40 text-text-primary' 
                        : 'bg-surface/50 border border-transparent text-text-secondary hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FiMessageSquare size={13} className={isActive ? 'text-accent shrink-0' : 'text-text-muted shrink-0'} />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id, e);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          onBlur={(e) => handleSaveRename(session.id, e)}
                          autoFocus
                          className="w-full bg-black/60 border border-accent rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none"
                        />
                      ) : (
                        <div className="truncate font-medium">{session.title}</div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className="p-1 text-text-muted hover:text-accent rounded hover:bg-black/30"
                          title="Rename chat"
                        >
                          <FiEdit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 text-text-muted hover:text-danger rounded hover:bg-black/30"
                          title="Delete chat"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted bg-surface/40">
              <span>{sessions.length} Chat{sessions.length > 1 ? 's' : ''} stored locally</span>
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="text-danger hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </aside>
        )}

        {/* -------------------------------------------------------------------------
            CONVERSATION CANVAS / MESSAGES FEED
        -------------------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface/20 relative overflow-hidden">
          
          {/* ACTIVE THREAT INVESTIGATION CONTEXT BANNER */}
          {activeThreatContext && (
            <div className="bg-surface/95 border-b border-accent/30 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0 z-10 backdrop-blur-md animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30 shrink-0">
                  <FiShield size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold text-accent">
                      Active Threat Investigation:
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-text-primary truncate max-w-xs sm:max-w-md select-all" title={activeThreatContext.indicator}>
                      {activeThreatContext.indicator}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                      (activeThreatContext.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-danger/20 text-danger border border-danger/40' :
                      (activeThreatContext.severity || '').toUpperCase() === 'HIGH' ? 'bg-danger/10 text-danger border border-danger/20' :
                      'bg-warning/10 text-warning border border-warning/20'
                    }`}>
                      {activeThreatContext.severity} Severity
                    </span>
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-2 mt-1 font-mono flex-wrap">
                    <span>Source: <strong className="text-text-secondary">{activeThreatContext.source}</strong> (ID: #{activeThreatContext.id})</span>
                    <span>•</span>
                    <span>Status: <strong className="text-text-secondary">{activeThreatContext.evidence?.urlStatus || 'reported'}</strong></span>
                    <span>•</span>
                    <span className="text-accent font-medium">CyberShield Heuristic Assessment</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto shrink-0">
                <button
                  onClick={() => navigate('/app/coming-soon/threat-intel')}
                  className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg border border-border/80 transition-colors cursor-pointer"
                  title="Return to Real-Time Threat Intelligence dashboard"
                >
                  Feed Dashboard
                </button>
                <button
                  onClick={handleClearActiveThreat}
                  className="px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 rounded-lg border border-danger/30 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Clear this active threat from copilot session context"
                >
                  <FiX size={14} />
                  Clear Investigation
                </button>
              </div>
            </div>
          )}

          {/* HANDOFF ERROR NOTIFICATION BANNER */}
          {threatHandoffNotice && (
            <div className="bg-danger/10 border-b border-danger/30 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs sm:text-sm text-danger shrink-0 z-10 animate-fade-in">
              <div className="flex items-center gap-2">
                <FiAlertOctagon size={16} className="shrink-0 text-danger" />
                <span>{threatHandoffNotice.message}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/app/coming-soon/threat-intel')}
                  className="px-2.5 py-1 rounded-lg bg-danger/15 text-danger font-semibold border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer text-xs"
                >
                  Back to Threat Intel
                </button>
                <button
                  onClick={() => setThreatHandoffNotice(null)}
                  className="p-1 hover:bg-danger/20 rounded cursor-pointer text-danger"
                  title="Dismiss notice"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Messages Canvas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col gap-6 min-h-0">
            
            {/* WELCOME SCREEN (Empty state before conversation starts) */}
            {isFreshConversation && (
              <div className="max-w-3xl mx-auto my-auto flex flex-col items-center text-center py-6 animate-fade-in w-full">
                
                {/* Glowing Avatar */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent/25 via-primary/30 to-accent/10 border border-accent/40 flex items-center justify-center shadow-xl">
                    <FiCpu className="text-accent" size={32} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-bg-surface flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-2">
                  CyberShield AI Security Copilot
                </h2>
                
                <p className="text-sm sm:text-base text-text-secondary max-w-xl mb-5 leading-relaxed">
                  Your cybersecurity companion for screenshot OCR triage, RFC 5322 email headers, SPF/DKIM/DMARC troubleshooting, and NIST-aligned containment playbooks.
                </p>

                {/* Voice Navigation Quick Tip */}
                <div className="w-full max-w-xl p-3 mb-6 rounded-xl bg-accent/10 border border-accent/25 text-left flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-text-primary">
                    <FiCompass className="text-accent shrink-0" size={18} />
                    <span><strong>Voice-Controlled Navigation Active</strong>: Click the mic and say <em>"Open Email Forensics"</em> or <em>"Open Visual Phishing"</em>!</span>
                  </div>
                  <button
                    onClick={() => setIsVoiceCommandsModalOpen(true)}
                    className="text-xs text-accent hover:underline font-mono shrink-0 cursor-pointer font-semibold"
                  >
                    View All
                  </button>
                </div>

                {/* Example Prompts Grid */}
                <div className="w-full text-left">
                  <div className="text-xs sm:text-sm font-mono text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 font-semibold">
                    <FiCornerDownRight size={14} className="text-accent" />
                    <span>Try asking the Copilot:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedPrompts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="p-3.5 rounded-xl bg-bg-elevated/80 border border-border/80 text-left hover:border-accent/50 hover:bg-bg-elevated transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="text-xs font-mono text-accent uppercase tracking-wider mb-1 font-medium">
                          {item.category}
                        </div>
                        <div className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors mb-1">
                          {item.title}
                        </div>
                        <div className="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed">
                          "{item.prompt}"
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MESSAGES LIST */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSpeaking = speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 max-w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-accent/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <FiCpu className="text-accent" size={18} />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`flex flex-col min-w-0 ${
                      isUser
                        ? 'max-w-[90%] sm:max-w-[80%] md:max-w-[75%] bg-accent/15 border border-accent/35 text-text-primary rounded-2xl rounded-tr-xs'
                        : 'max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] bg-bg-elevated/95 border border-border/80 text-text-primary rounded-2xl rounded-tl-xs'
                    } p-4 sm:p-5 shadow-sm transition-all`}
                  >
                    {/* Header: Sender & Timestamp & Copy & TTS button */}
                    <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-border/50 text-xs sm:text-sm font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-text-primary truncate">
                          {isUser ? 'Security Analyst' : 'CyberShield Copilot'}
                        </span>
                        {!isUser && (
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-accent/10 border border-accent/25 text-accent shrink-0">
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-text-muted shrink-0 text-xs">
                        <span>{msg.timestamp}</span>

                        {/* Text-to-Speech Button on Assistant Messages */}
                        {!isUser && (
                          <button
                            onClick={() => handleToggleSpeak(msg.id, msg.text)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isSpeaking ? 'text-accent bg-accent/15 animate-pulse' : 'text-text-muted hover:text-text-primary hover:bg-surface'
                            }`}
                            title={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
                            aria-label={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
                          >
                            {isSpeaking ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
                          </button>
                        )}

                        {/* Copy Response Button on Assistant Messages */}
                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface transition-colors cursor-pointer"
                            title="Copy response markdown"
                            aria-label="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                <FiCheck size={12} />
                                <span>Copied</span>
                              </span>
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Attached Image / File Badges on User Message */}
                    {isUser && msg.attachmentMeta && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* Multiple Images */}
                        {msg.attachmentMeta.images && msg.attachmentMeta.images.map((img, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-border/80 flex items-center gap-2.5 max-w-xs">
                            {img.previewUrl && (
                              <img 
                                src={img.previewUrl} 
                                alt="screenshot" 
                                className="w-10 h-10 object-cover rounded-lg border border-border shrink-0" 
                              />
                            )}
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold text-text-primary truncate">
                                {img.name}
                              </div>
                              <div className="text-xs font-mono text-text-muted">
                                {formatBytes(img.size)} • Screenshot
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* File Attachment */}
                        {msg.attachmentMeta.file && (
                          <div className="p-2.5 rounded-xl bg-black/40 border border-border/80 flex items-center gap-2 max-w-xs">
                            <FiFileText className="text-accent shrink-0" size={16} />
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold text-text-primary truncate">
                                {msg.attachmentMeta.file.name}
                              </div>
                              <div className="text-xs font-mono text-text-muted">
                                {formatBytes(msg.attachmentMeta.file.size)} • Document
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sample Artifact */}
                        {msg.attachmentMeta.artifact && (
                          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-2 max-w-xs">
                            <FiLayers className="text-accent shrink-0" size={16} />
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold text-text-primary truncate">
                                {msg.attachmentMeta.artifact.title}
                              </div>
                              <div className="text-xs font-mono text-accent">
                                Security Artifact
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Body Content */}
                    {isUser ? (
                      <p className="text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed font-normal">
                        {msg.text}
                      </p>
                    ) : (
                      <FormattedMessage content={msg.text} />
                    )}

                    {/* Contextual Follow-up Prompts on Assistant Bubbles */}
                    {!isUser && msg.followUps && msg.followUps.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/50 text-left">
                        <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                          <FiCornerDownRight size={13} className="text-accent" />
                          <span>Suggested follow-up actions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.followUps.map((promptText, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(promptText)}
                              disabled={isThinking}
                              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-surface/80 border border-border/70 text-text-secondary hover:text-text-primary hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer text-left shadow-2xs font-medium"
                            >
                              {promptText}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {/* Thinking / Processing State with dynamic OCR feedback */}
            {isThinking && (
              <div className="flex gap-3.5 justify-start max-w-full animate-fade-in">
                <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-accent/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <FiCpu className="text-accent animate-pulse" size={17} />
                </div>

                <div className="bg-bg-elevated/95 border border-border/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 flex items-center gap-3 text-xs sm:text-sm font-mono text-text-secondary shadow-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                  <span>{thinkingStatus || 'Evaluating security indicators & threat heuristics...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* =========================================================================
              4. REGENERATE BAR
          ========================================================================== */}
          {!isFreshConversation && !isThinking && (
            <div className="px-4 py-1.5 flex justify-end">
              <button
                onClick={handleRegenerateLast}
                className="text-[11px] text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface/60 transition-colors cursor-pointer"
                title="Regenerate the response for the last query"
              >
                <FiRefreshCw size={11} />
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              5. MODERN CHAT COMPOSER (CHATGPT-STYLE ROUNDED P用於底)
          ========================================================================== */}
          <div 
            ref={composerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 sm:p-4 bg-bg-elevated/80 border-t border-border/80 flex flex-col gap-2 relative z-10 transition-colors ${
              isDraggingOver ? 'bg-accent/5 border-accent' : ''
            }`}
          >
            {/* Drag & Drop Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 bg-bg-elevated/95 border-2 border-dashed border-accent rounded-t-xl z-20 flex items-center justify-center gap-2 text-accent text-sm font-semibold pointer-events-none animate-pulse">
                <FiUploadCloud size={20} />
                <span>Drop screenshots or security logs to attach...</span>
              </div>
            )}

            {/* Voice Notice Banner if mic unavailable or ambiguous */}
            {voiceNotice && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle size={14} className="shrink-0 text-amber-400" />
                  <span>{voiceNotice}</span>
                </div>
                <button onClick={() => setVoiceNotice(null)} className="text-amber-400 hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            {/* Live Speech Recognition Bar */}
            {(isListening || finalTranscript.trim() || interimTranscript.trim()) && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-accent/10 via-surface to-accent/5 border border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-lg">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0 mt-0.5 sm:mt-0">
                    <span className={`w-3 h-3 rounded-full block ${isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                    <span className={`w-3 h-3 rounded-full absolute inset-0 block ${isListening ? 'bg-red-500' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold flex items-center gap-2">
                      <span className={isListening ? 'text-red-400' : 'text-emerald-400'}>
                        {isListening ? '🎙️ Listening (Continuous Mode)...' : '⏸️ Voice Paused — Ready to Send or Edit'}
                      </span>
                    </div>
                    <div className="text-xs text-text-primary mt-1 break-words leading-relaxed font-normal bg-bg-elevated/70 p-2 rounded-lg border border-border/60">
                      {finalTranscript && <span className="text-text-primary font-medium">{finalTranscript} </span>}
                      {interimTranscript && <span className="text-accent italic opacity-90 animate-pulse">{interimTranscript}</span>}
                      {!finalTranscript && !interimTranscript && (
                        <span className="text-text-muted italic">Speak your command or cybersecurity query...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {isListening ? (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="px-2.5 py-1.5 text-xs text-amber-300 hover:text-white rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center gap-1"
                      title="Stop listening and keep transcript"
                    >
                      <FiMicOff size={13} />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startListening}
                      className="px-2.5 py-1.5 text-xs text-accent hover:text-white rounded-lg bg-accent/15 border border-accent/30 hover:bg-accent/25 transition-colors cursor-pointer flex items-center gap-1"
                      title="Resume listening"
                    >
                      <FiMic size={13} />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyVoiceToComposer}
                    className="px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-1"
                    title="Transfer spoken text to input composer to edit before sending"
                  >
                    <FiEdit2 size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteVoiceCommand}
                    disabled={!finalTranscript.trim() && !interimTranscript.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-accent text-bg rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Execute spoken command"
                  >
                    <FiSend size={12} />
                    <span>Send</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelVoice}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors cursor-pointer"
                    title="Clear and close voice input"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Attachment Previews in Composer */}
            {(attachedImages.length > 0 || attachedFile || selectedArtifact) && (
              <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-surface/70 border border-border/80">
                {/* Images */}
                {attachedImages.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs">
                    {img.previewUrl && (
                      <img src={img.previewUrl} alt="prev" className="w-6 h-6 object-cover rounded border border-border" />
                    )}
                    <span className="font-medium text-text-primary max-w-[120px] truncate">{img.name}</span>
                    <span className="text-[10px] text-text-muted">({formatBytes(img.size)})</span>
                    <button onClick={() => removeAttachedImage(img.id)} className="text-text-muted hover:text-danger p-0.5 cursor-pointer" title="Remove attachment">
                      <FiX size={13} />
                    </button>
                  </div>
                ))}

                {/* File */}
                {attachedFile && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs">
                    <FiFileText className="text-accent" size={14} />
                    <span className="font-medium text-text-primary max-w-[140px] truncate">{attachedFile.name}</span>
                    <span className="text-[10px] text-text-muted">({formatBytes(attachedFile.size)})</span>
                    <button onClick={removeAttachedFile} className="text-text-muted hover:text-danger p-0.5 cursor-pointer" title="Remove file">
                      <FiX size={13} />
                    </button>
                  </div>
                )}

                {/* Sample Artifact */}
                {selectedArtifact && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent/15 border border-accent/40 text-xs">
                    <FiLayers className="text-accent" size={14} />
                    <span className="font-medium text-text-primary max-w-[140px] truncate">{selectedArtifact.title}</span>
                    <button onClick={removeSelectedArtifact} className="text-text-muted hover:text-danger p-0.5 cursor-pointer" title="Remove artifact">
                      <FiX size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rounded Floating Input Container */}
            <div 
              onPaste={handlePaste}
              className="relative flex items-end gap-2 bg-surface/90 border border-border/90 rounded-2xl p-2 shadow-inner focus-within:border-accent/60 transition-colors"
            >
              
              {/* Plus (+) Menu Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen(prev => !prev)}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    isPlusMenuOpen 
                      ? 'bg-accent/20 text-accent' 
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                  title="Attach file or screenshot"
                  aria-label="Add attachment"
                >
                  <FiPlus size={18} />
                </button>

                {/* Plus Menu Popover */}
                {isPlusMenuOpen && (
                  <div className="absolute bottom-12 left-0 w-64 bg-bg-elevated/95 border border-border rounded-xl shadow-2xl p-2 z-30 backdrop-blur-xl animate-fade-in space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        imageInputRef.current?.click();
                        setIsPlusMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface rounded-lg text-left cursor-pointer transition-colors"
                    >
                      <FiImage className="text-accent" size={15} />
                      <div className="min-w-0">
                        <div>Upload Screenshot / Image</div>
                        <div className="text-[10px] text-text-muted">PNG, JPG, WebP (OCR analysis)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsPlusMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface rounded-lg text-left cursor-pointer transition-colors"
                    >
                      <FiFileText className="text-accent" size={15} />
                      <div className="min-w-0">
                        <div>Upload Security Document</div>
                        <div className="text-[10px] text-text-muted">.eml, .txt, .log, .json, .csv</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsArtifactModalOpen(true);
                        setIsPlusMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface rounded-lg text-left cursor-pointer transition-colors border-t border-border/60"
                    >
                      <FiLayers className="text-accent" size={15} />
                      <div className="min-w-0">
                        <div>Browse Sample Artifacts</div>
                        <div className="text-[10px] text-text-muted">Progressive 4-stage scanner</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.eml,.log,.json,.csv,.md,.pdf,text/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={isListening ? "Listening to your voice..." : "Ask Copilot, paste a screenshot (Ctrl+V), or say 'Open Webcam'..."}
                disabled={isThinking}
                className="flex-1 bg-transparent border-0 text-sm sm:text-base text-text-primary placeholder:text-text-muted resize-none focus:outline-none max-h-36 min-h-[40px] py-2 px-1.5 leading-relaxed custom-scrollbar font-sans"
              />

              {/* Microphone Voice Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice navigation or dictation'}
                aria-label="Voice input"
              >
                {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isThinking || (!inputValue.trim() && attachedImages.length === 0 && !attachedFile && !selectedArtifact)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  (!inputValue.trim() && attachedImages.length === 0 && !attachedFile && !selectedArtifact) || isThinking
                    ? 'text-text-muted/40 bg-surface/50 cursor-not-allowed'
                    : 'bg-accent text-bg hover:bg-accent/90 shadow-md font-bold'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <FiArrowUp size={18} />
              </button>

            </div>

            {/* Bottom Keyboard & Voice Hint */}
            <div className="flex items-center justify-between text-xs font-mono text-text-muted px-1.5 py-0.5">
              <span>Press <strong className="text-text-secondary">Enter</strong> to send, <strong className="text-text-secondary">Shift+Enter</strong> for newline</span>
              <span className="hidden sm:inline">Supports OCR, .eml parsing & voice navigation</span>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          6. CYBERSECURITY TOOLS DRAWER
      ========================================================================== */}
      {isToolsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-bg-elevated border-l border-border h-full flex flex-col shadow-2xl animate-slide-left">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShield className="text-accent" size={18} />
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Cybersecurity Tools & Playbooks</h3>
              </div>
              <button
                onClick={() => setIsToolsDrawerOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Tool Search Bar */}
            <div className="p-3 border-b border-border/60">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3 text-text-muted" size={14} />
                <input
                  type="text"
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  placeholder="Search tools, headers, SPF, SIEM..."
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Tools List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool)}
                  className="w-full p-3 rounded-xl bg-surface/60 border border-border/80 hover:border-accent/50 hover:bg-surface text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
                      {tool.category}
                    </span>
                    <FiChevronRight size={13} className="text-text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors mb-1">
                    {tool.title}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-border text-[11px] text-text-muted text-center bg-surface/40">
              Select a tool to populate pre-configured prompts or trigger progressive scanning.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. SAMPLE ARTIFACTS / PROGRESSIVE SCAN MODAL
      ========================================================================== */}
      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-bg-elevated border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiLayers className="text-accent" size={18} />
                <h3 className="text-sm font-bold text-text-primary">Sample Artifacts & Progressive Scanner</h3>
              </div>
              <button
                onClick={() => setIsArtifactModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                Select a pre-packaged security artifact to experience CyberShield's progressive 4-stage forensic scanning animation:
              </p>

              {sampleArtifacts.map((art) => (
                <div
                  key={art.id}
                  className="p-3.5 rounded-xl bg-surface/70 border border-border/80 hover:border-accent/40 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">{art.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent">
                      {art.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {art.description}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                    <button
                      onClick={() => {
                        setSelectedArtifact(art);
                        setIsArtifactModalOpen(false);
                      }}
                      className="text-xs text-text-muted hover:text-text-primary px-2.5 py-1 rounded bg-bg-elevated border border-border cursor-pointer"
                    >
                      Attach to Chat
                    </button>
                    <button
                      onClick={() => handleLaunchArtifactScan(art)}
                      className="text-xs font-semibold text-bg bg-accent hover:bg-accent/90 px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FiPlay size={11} />
                      <span>Launch 4-Stage Scan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          8. PROGRESSIVE SCANNING STAGE MODAL
      ========================================================================== */}
      {scanningStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-bg-elevated border border-accent/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0">
                <FiActivity className="text-accent animate-pulse" size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary">
                  {scanResult ? 'Progressive Forensic Scan Completed' : 'Executing Progressive Forensic Scan'}
                </h3>
                <p className="text-xs text-text-secondary">
                  Target: <strong className="text-accent">{scanningArtifact?.title || scanningArtifact?.name || 'Security Artifact'}</strong>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-accent font-semibold">{scanningStage.stageName}</span>
                <span className="text-text-muted">{scanningStage.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${scanningStage.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted italic pt-1">
                {scanningStage.message}
              </p>
            </div>

            {/* Completed Report Panel */}
            {scanResult && (
              <div className="p-4 rounded-xl bg-surface/80 border border-border space-y-3 max-h-64 overflow-y-auto custom-scrollbar text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Threat Classification:</span>
                  <span className="font-bold text-danger">{scanResult.threatLevel}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Attack Vector:</span>
                  <span className="font-semibold text-text-primary">{scanResult.classification}</span>
                </div>
                <div>
                  <div className="font-semibold text-accent mb-1">Key Findings:</div>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    {scanResult.findings.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              {scanResult ? (
                <>
                  <button
                    onClick={() => {
                      setScanningArtifact(null);
                      setScanResult(null);
                      setScanningStage(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleInsertScanReportToChat}
                    className="px-3.5 py-1.5 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiCheckCircle size={13} />
                    <span>Insert Report into Chat</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setScanningArtifact(null);
                    setScanResult(null);
                    setScanningStage(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary cursor-pointer"
                >
                  Cancel Scan
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          9. VOICE COMMANDS REFERENCE MODAL
      ========================================================================== */}
      {isVoiceCommandsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-bg-elevated border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCompass className="text-accent" size={18} />
                <h3 className="text-sm font-bold text-text-primary">Voice Commands Reference Guide</h3>
              </div>
              <button
                onClick={() => setIsVoiceCommandsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 text-xs">
              <p className="text-text-secondary leading-relaxed">
                CyberShield features full voice-controlled navigation across all modules using the browser Web Speech API. Click the microphone and speak any of the following commands:
              </p>

              <div>
                <h4 className="font-semibold text-accent mb-2 uppercase tracking-wider text-[11px]">
                  1. Navigation Commands (Auto-Routes):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  {VOICE_DESTINATIONS.map(dest => (
                    <div key={dest.id} className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                      <span className="text-text-primary">"Open {dest.label}"</span>
                      <span className="text-[10px] text-text-muted">→ {dest.path}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-accent mb-2 uppercase tracking-wider text-[11px]">
                  2. Voice Action Commands:
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Go back"</span>
                    <span className="text-[10px] text-text-muted">Navigates to previous page</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Start a new chat"</span>
                    <span className="text-[10px] text-text-muted">Creates fresh session</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Read response aloud"</span>
                    <span className="text-[10px] text-text-muted">Text-to-speech audio playback</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Stop speaking"</span>
                    <span className="text-[10px] text-text-muted">Silences audio speech</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-accent mb-2 uppercase tracking-wider text-[11px]">
                  3. Context-Aware Cross-Page Handoffs:
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Open this in Screenshot Analyzer"</span>
                    <span className="text-[10px] text-text-muted">Transfers attached screenshot</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Open Email Forensics with this email"</span>
                    <span className="text-[10px] text-text-muted">Transfers email file or headers</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Scan this URL in URL Scanner"</span>
                    <span className="text-[10px] text-text-muted">Transfers URL to Smart Scanner</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/70 flex items-center justify-between">
                    <span className="text-text-primary">"Test this password in Password Lab: Secret"</span>
                    <span className="text-[10px] text-text-muted">Transfers password for testing</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25 text-[11px] text-text-secondary leading-relaxed">
                <strong>Disambiguation Note</strong>: Ordinary questions (e.g. <em>"What is visual phishing?"</em>) will be answered by Copilot instead of navigating away.
              </div>
            </div>

            <div className="p-3 border-t border-border flex justify-end">
              <button
                onClick={() => setIsVoiceCommandsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 cursor-pointer"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          10. CLEAR ALL CONVERSATIONS CONFIRMATION MODAL
      ========================================================================== */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-bg-elevated border border-danger/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-danger">
              <FiAlertOctagon size={20} />
              <h3 className="text-sm font-bold text-text-primary">Clear All Conversations?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This action will permanently delete all stored local conversation history and resets Copilot to a fresh session. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllConversations}
                className="px-3.5 py-1.5 rounded-xl bg-danger text-white font-semibold text-xs hover:bg-danger/90 cursor-pointer shadow-md"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
