/**
 * scanHistory.js
 *
 * Simple localStorage-backed history of past scans. No database, no
 * backend — just a small helper module kept separate from the
 * scanning/risk logic in src/security.
 */

const STORAGE_KEY = 'cybershield_scan_history';
const MAX_ENTRIES = 10;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScanToHistory({ url, result }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    score: result.score,
    verdict: result.classification.label,
    level: result.classification.level,
    timestamp: new Date().toISOString(),
    result, // full result object, so a past scan can be re-displayed
  };

  const existing = loadHistory();
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage may be unavailable (e.g. private mode) — fail silently.
  }

  return next;
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return [];
}
