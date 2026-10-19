import { loadHistory as loadUrlHistory } from './scanHistory.js';
import { visualPhishingService } from '../services/visualPhishingService.js';

export const STORAGE_KEY = 'cybershield_incidents_v1';
export const INVESTIGATION_KEY = 'cybershield_investigations_v1';
export const CATEGORIES = ['Phishing Attempt', 'Malicious QR', 'Suspicious URL', 'Account Compromise', 'Malware', 'Other'];
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];
export const REL_TYPES = ['related to', 'derived from', 'supports', 'contradicts'];
export const EV_TYPES = ['URL', 'Screenshot', 'File Reference', 'Log', 'Email', 'QR Code', 'Other'];
export const SAMPLE_CASES = [
  { id: 'SMP-01', title: 'Suspicious Recruitment Email', category: 'Phishing Attempt', severity: 'Medium', asset: 'Exchange / HR Inbox', evidence: 'EML-2026-0881.eml', desc: 'Unsolicited VP offer requiring passport scan.' },
  { id: 'SMP-02', title: 'Cafeteria Decal Quishing', category: 'Malicious QR', severity: 'High', asset: 'Cafeteria POS Stand #3', evidence: 'pay-quick-verify.net/auth', desc: 'Tampered QR decal overlaid on cafeteria menu code.' },
  { id: 'SMP-03', title: 'AitM Reverse-Proxy Alert', category: 'Suspicious URL', severity: 'Critical', asset: 'Identity Gateway (Okta)', evidence: 'https://auth.sso-gateway.net', desc: 'Reverse-proxy session cookie interception targeting employee logins.' },
  { id: 'SMP-04', title: 'Open S3 Bucket Exposure', category: 'Other', severity: 'High', asset: 'AWS S3 / prod-backup', evidence: 's3://prod-backup (Public Read)', desc: 'Unrestricted cloud storage bucket containing unmasked database logs.' }
];
const SEEDED = [
  { id: 'INC-0007', title: 'Suspicious QR code detected', category: 'Malicious QR', severity: 'High', status: 'Open', affectedAsset: 'Cafeteria POS #3', evidenceReferences: ['pay-quick-verify.net/auth'], description: 'Payment QR overlaid with decal redirecting to fake portal.', createdAt: new Date(Date.now() - 72e5).toISOString(), isSample: true, sourceType: 'scanner' },
  { id: 'INC-0006', title: 'Phishing email campaign', category: 'Phishing Attempt', severity: 'High', status: 'In Progress', affectedAsset: 'Exec Inboxes', evidenceReferences: ['wire-remittance.pdf.eml'], description: 'Mass executive impersonation wire fraud attempt.', createdAt: new Date(Date.now() - 216e5).toISOString(), isSample: true, sourceType: 'manual' },
  { id: 'INC-0005', title: 'Suspicious URL in message', category: 'Suspicious URL', severity: 'Medium', status: 'Open', affectedAsset: 'Slack Channel', evidenceReferences: ['tinyurl.com/auth-m365'], description: 'Shortened link redirecting to deceptive Microsoft 365 login screen.', createdAt: new Date(Date.now() - 864e5).toISOString(), isSample: true, sourceType: 'scanner' },
  { id: 'INC-0001', title: 'Campus QR Drill (Simulated)', category: 'Malicious QR', severity: 'High', status: 'Resolved', affectedAsset: 'North Campus Board', evidenceReferences: ['sim-audit-payload'], description: 'Controlled drill evaluating employee QR awareness.', createdAt: new Date(Date.now() - 35e7).toISOString(), isSample: true, sourceType: 'sample' }
];

export const getIncidents = () => { try { const r = localStorage.getItem(STORAGE_KEY); if (!r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED)); return SEEDED; } return JSON.parse(r) || []; } catch { return []; } };
export const saveIncidents = (l) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); } catch {} };

export const saveQrScan = (res) => {
  try {
    if (!res) return null;
    const target = (typeof res === 'string' ? res : (res?.classified?.parsed?.url || res?.classified?.parsed?.address || res?.classified?.parsed?.number || res?.classified?.parsed?.ssid || res?.classified?.parsed?.text || res?.classified?.raw || res?.target || res?.url || '')).trim() || 'QR destination';
    const verdict = res?.riskLevel?.label || res?.verdict || (res?.riskScore != null ? (res.riskScore <= 39 ? 'High Risk' : res.riskScore <= 59 ? 'Suspicious' : res.riskScore <= 79 ? 'Moderate Risk' : 'Low Risk') : 'Analyzed');
    const score = res?.riskScore ?? res?.score ?? null;
    const levelKey = (res?.riskLevel?.key || res?.level || (score != null ? (score <= 39 ? 'DANGEROUS' : score <= 59 ? 'SUSPICIOUS' : score <= 79 ? 'CAUTION' : 'SAFE') : 'SAFE')).toLowerCase();
    const entry = { id: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, target, verdict, score, level: levelKey, timestamp: res?.timestamp || new Date().toISOString() };
    let cur = [];
    try {
      const curRaw = localStorage.getItem('cybershield_qr_scan_history');
      if (curRaw) {
        const parsed = JSON.parse(curRaw);
        if (Array.isArray(parsed)) cur = parsed;
      }
    } catch {}
    localStorage.setItem('cybershield_qr_scan_history', JSON.stringify([entry, ...cur.filter((e) => e && typeof e === 'object' && e.target !== target && e.id !== entry.id)].slice(0, 15)));
    window.dispatchEvent(new Event('storage'));
    return entry;
  } catch {
    return null;
  }
};

export const createIncident = (d) => {
  const cur = getIncidents(), max = cur.reduce((m, i) => Math.max(m, parseInt((i.id || '').replace(/^INC-0*/i, ''), 10) || 0), 0), now = new Date().toISOString();
  const rec = { id: `INC-${String(max > 0 ? max + 1 : 1001).padStart(4, '0')}`, title: (d.title || '').trim(), category: d.category || 'Other', severity: d.severity || 'Medium', status: d.status || 'Open', description: (d.description || d.desc || '').trim(), affectedAsset: (d.affectedAsset || d.asset || '').trim(), evidenceReferences: Array.isArray(d.evidenceReferences) ? d.evidenceReferences : d.evidence ? [d.evidence] : [], observations: d.observations || '', sourceType: d.sourceType || 'manual', sourceId: d.sourceId || null, isSample: Boolean(d.isSample), createdAt: d.createdAt || now, updatedAt: now };
  saveIncidents([rec, ...cur]);
  return rec;
};

export const updateIncident = (id, up) => { const l = getIncidents(), idx = l.findIndex((i) => i.id === id); if (idx === -1) return null; const rec = { ...l[idx], ...up, id: l[idx].id, createdAt: l[idx].createdAt, updatedAt: new Date().toISOString() }; l[idx] = rec; saveIncidents(l); return rec; };
export const deleteIncident = (id) => { const l = getIncidents().filter((i) => i.id !== id); saveIncidents(l); return l; };

export const calculateMetrics = (l = []) => ({
  total: l.length, open: l.filter((i) => i.status === 'Open').length,
  highSeverity: l.filter((i) => i.severity === 'High' || i.severity === 'Critical').length,
  inProgress: l.filter((i) => i.status === 'In Progress').length, resolved: l.filter((i) => i.status === 'Resolved').length
});

export const getAvailableScanners = () => {
  const scans = [];
  try {
    const rawQr = localStorage.getItem('cybershield_qr_scan_history');
    if (rawQr) {
      const qrList = JSON.parse(rawQr);
      if (Array.isArray(qrList)) {
        qrList.filter((q) => q && typeof q === 'object').forEach((qr) => {
          const lvl = (qr.level || qr.riskLevel || '').toLowerCase();
          const riskLevel = (lvl === 'dangerous' || lvl === 'high') ? 'High' : (lvl === 'suspicious' || lvl === 'caution' || lvl === 'medium') ? 'Medium' : 'Low';
          scans.push({ id: qr.id || `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sourceType: 'QR Security Scanner', target: qr.target || qr.url || qr.text || qr.raw || qr.decoded || 'QR destination', verdict: qr.verdict || 'Analyzed', riskScore: qr.score ?? qr.riskScore ?? null, riskLevel, timestamp: qr.timestamp || new Date().toISOString(), suggestedCategory: 'Malicious QR' });
        });
      }
    }
  } catch {}
  try {
    const urlHist = loadUrlHistory();
    if (Array.isArray(urlHist)) {
      urlHist.filter((u) => u && typeof u === 'object').forEach((url) => {
        scans.push({ id: url.id || `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sourceType: 'Smart URL Scanner', target: url.url || 'URL destination', verdict: url.verdict || (url.score >= 50 ? 'Suspicious' : 'Clean'), riskScore: url.score, riskLevel: url.score >= 70 ? 'High' : url.score >= 35 ? 'Medium' : 'Low', timestamp: url.timestamp || new Date().toISOString(), suggestedCategory: 'Suspicious URL' });
      });
    }
  } catch {}
  try {
    const vpHist = visualPhishingService.getHistory();
    if (Array.isArray(vpHist)) {
      vpHist.filter((v) => v && typeof v === 'object').forEach((vp) => {
        scans.push({ id: vp.id || `vp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sourceType: 'Screenshot Phishing Analyzer', target: vp.fileName || 'Screenshot', verdict: vp.topIndicator || 'Analyzed', riskScore: vp.score, riskLevel: vp.score >= 60 ? 'High' : 'Medium', timestamp: vp.timestamp || new Date().toISOString(), suggestedCategory: 'Phishing Attempt' });
      });
    }
  } catch {}
  try {
    const rawCmd = localStorage.getItem('commandHistory');
    if (rawCmd) {
      const cmdList = JSON.parse(rawCmd);
      if (Array.isArray(cmdList)) {
        cmdList.filter((c) => c && typeof c === 'object').forEach((cmd, idx) => {
          scans.push({ id: `cmd-${idx}`, sourceType: 'Security Command Center', target: cmd.command || 'Command Execution', verdict: cmd.status || cmd.risk || 'Analyzed', riskScore: cmd.risk === 'High' ? 85 : 45, riskLevel: cmd.risk === 'High' ? 'High' : 'Medium', timestamp: cmd.timestamp || new Date().toISOString(), suggestedCategory: 'Account Compromise' });
        });
      }
    }
  } catch {}
  return scans;
};

export const getInvestigation = (incId, inc) => {
  try {
    const all = JSON.parse(localStorage.getItem(INVESTIGATION_KEY) || '{}');
    if (all[incId]) return all[incId];
    const ev = (inc?.evidenceReferences || []).map((ref, idx) => ({ id: `ev-${idx + 1}`, title: ref, type: ref.includes('http') || ref.includes('.net') ? 'URL' : ref.endsWith('.png') ? 'Screenshot' : 'File Reference', source: inc?.sourceType || 'Incident Dossier', description: `Evidence attached during triage: ${ref}`, relevance: 'High', timestamp: new Date(inc?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
    if (ev.length === 0 && inc?.affectedAsset) ev.push({ id: 'ev-1', title: inc.affectedAsset, type: 'File Reference', source: 'Asset Registry', description: `Target asset reported: ${inc.affectedAsset}`, relevance: 'Medium', timestamp: 'Initial triage' });
    const initial = {
      notes: inc ? `Initial investigation started for ${inc.id} (${inc.title}). Analyst assigned to verify telemetry and check for lateral propagation.` : '',
      checklist: [true, ev.length > 0, false, false, false],
      checklistTimes: [new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ev.length > 0 ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null, null, null, null],
      evidence: ev,
      findings: [{ id: 'fn-1', title: `Suspicious activity in ${inc?.category || 'signal'}`, confidence: inc?.severity === 'Critical' || inc?.severity === 'High' ? 'High' : 'Medium', classification: inc?.severity === 'Critical' ? 'Confirmed Threat' : 'Suspicious Activity', description: inc?.description || 'Observed anomaly requires triage.', linkedEvidence: ev[0]?.title || '', timestamp: 'Triage Stage' }],
      timeline: [
        { id: 'tl-1', title: `Incident ${inc?.id || incId} detected`, type: 'Detection', description: inc?.title || 'Initial anomaly logged', node: inc?.id || incId, timestamp: new Date(inc?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...(ev[0] ? [{ id: 'tl-2', title: `Evidence item attached: ${ev[0].title}`, type: 'Evidence Collected', description: ev[0].description, node: ev[0].title, timestamp: ev[0].timestamp }] : [])
      ],
      relationships: ev.map((e) => ({ id: `rel-${e.id}`, from: 'incident', to: e.id, label: 'supports' }))
    };
    saveInvestigation(incId, initial);
    return initial;
  } catch { return { notes: '', checklist: [false, false, false, false, false], checklistTimes: [], evidence: [], findings: [], timeline: [], relationships: [] }; }
};

export const saveInvestigation = (incId, data) => {
  try {
    const all = JSON.parse(localStorage.getItem(INVESTIGATION_KEY) || '{}');
    all[incId] = data;
    localStorage.setItem(INVESTIGATION_KEY, JSON.stringify(all));
  } catch {}
};
