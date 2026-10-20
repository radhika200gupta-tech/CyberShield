/**
 * In-memory handoff service for transferring artifacts (Screenshots, Emails, URLs, Passwords)
 * between CyberShield security modules without persistent storage, localStorage leaks, or serialization overhead.
 */

// In-memory transfer registers
let pendingTransferredFile = null;
let pendingTransferredEmail = null;
let pendingTransferredUrl = null;
let pendingTransferredPassword = null;
let pendingTransferredThreat = null;

// ==========================================
// THREAT INTELLIGENCE RECORD HANDOFF
// ==========================================
export const setTransferredThreat = (threat) => {
  if (threat && typeof threat === 'object') {
    pendingTransferredThreat = threat;
  }
};

export const consumeTransferredThreat = () => {
  const threat = pendingTransferredThreat;
  pendingTransferredThreat = null;
  return threat;
};

export const hasTransferredThreat = () => {
  return pendingTransferredThreat !== null;
};

// ==========================================
// SCREENSHOT / IMAGE HANDOFF
// ==========================================
export const setTransferredScreenshot = (file) => {
  if (!file) return;
  if (file.file && ((typeof File !== 'undefined' && file.file instanceof File) || (typeof Blob !== 'undefined' && file.file instanceof Blob))) {
    pendingTransferredFile = file.file;
    return;
  }
  if (file.rawFile && ((typeof File !== 'undefined' && file.rawFile instanceof File) || (typeof Blob !== 'undefined' && file.rawFile instanceof Blob))) {
    pendingTransferredFile = file.rawFile;
    return;
  }
  if ((typeof File !== 'undefined' && file instanceof File) || (typeof Blob !== 'undefined' && file instanceof Blob) || (file.name && (file.type || file.previewUrl))) {
    pendingTransferredFile = file;
  }
};

export const consumeTransferredScreenshot = () => {
  const file = pendingTransferredFile;
  pendingTransferredFile = null;
  return file;
};

export const hasTransferredScreenshot = () => {
  return pendingTransferredFile !== null;
};

// ==========================================
// EMAIL CONTENT / HEADERS HANDOFF
// ==========================================
export const setTransferredEmail = (rawText) => {
  if (typeof rawText === 'string' && rawText.trim()) {
    pendingTransferredEmail = rawText;
  }
};

export const consumeTransferredEmail = () => {
  const text = pendingTransferredEmail;
  pendingTransferredEmail = null;
  return text;
};

export const hasTransferredEmail = () => {
  return pendingTransferredEmail !== null;
};

// ==========================================
// URL HANDOFF
// ==========================================
export const setTransferredUrl = (url) => {
  if (typeof url === 'string' && url.trim()) {
    pendingTransferredUrl = url.trim();
  }
};

export const consumeTransferredUrl = () => {
  const url = pendingTransferredUrl;
  pendingTransferredUrl = null;
  return url;
};

export const hasTransferredUrl = () => {
  return pendingTransferredUrl !== null;
};

// ==========================================
// PASSWORD HANDOFF
// ==========================================
export const setTransferredPassword = (password) => {
  if (typeof password === 'string' && password.trim()) {
    pendingTransferredPassword = password;
  }
};

export const consumeTransferredPassword = () => {
  const pwd = pendingTransferredPassword;
  pendingTransferredPassword = null;
  return pwd;
};

export const hasTransferredPassword = () => {
  return pendingTransferredPassword !== null;
};

// ==========================================
// RESET / CLEANUP
// ==========================================
export const clearAllHandoffs = () => {
  pendingTransferredFile = null;
  pendingTransferredEmail = null;
  pendingTransferredUrl = null;
  pendingTransferredPassword = null;
  pendingTransferredThreat = null;
};

export const clearAllTransfers = clearAllHandoffs;
