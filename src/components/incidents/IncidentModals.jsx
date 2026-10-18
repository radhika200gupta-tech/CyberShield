import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiFileText, FiCrosshair, FiSearch, FiLayers, FiAlertTriangle, FiEdit2, FiTrash2, FiLink, FiMaximize } from 'react-icons/fi';
import Button from '../common/Button';
import InvestigationWizard from './InvestigationWizard';
import DetectiveIllustration from './DetectiveIllustration';
import { CATEGORIES, SEVERITIES, STATUSES, SAMPLE_CASES, getAvailableScanners, getIncidents } from '../../utils/incidentStorage';
import { ROUTES } from '../../constants/routes';

const Modal = ({ open, onClose, children, max = 'max-w-2xl' }) => open ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
    <div className={`relative w-full ${max} bg-[#090e17] border border-amber-500/30 rounded-2xl shadow-2xl p-5 text-left max-h-[92vh] overflow-y-auto`}>
      <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"><FiX size={18} /></button>
      {children}
    </div>
  </div>
) : null;

const INTAKE_MODES = [
  { id: 'manual', title: 'Report an Incident', desc: 'Directly report observed security activity.', icon: FiFileText, color: 'text-primary' },
  { id: 'scanner', title: 'Create from Scanner', desc: 'Import real results from QR, URL, or screenshot telemetry.', icon: FiCrosshair, color: 'text-accent' },
  { id: 'guided', title: 'Guided Incident Wizard', desc: 'Launch the immersive 4-stage digital forensics investigation protocol.', icon: FiSearch, color: 'text-amber-400', highlight: true },
  { id: 'sample', title: 'Sample Investigations', desc: 'Explore simulated scenarios for drills and testing.', icon: FiLayers, color: 'text-text-primary', badge: 'SIMULATED' },
];

export function CreateModal({ isOpen, onClose, onCreate, initialOption = null }) {
  const navigate = useNavigate(), [flow, setFlow] = useState(initialOption), [err, setErr] = useState('');
  const [manual, setManual] = useState({ title: '', category: 'Malicious QR', severity: 'High', desc: '', asset: '' });
  const [selectedScan, setSelectedScan] = useState(null), [scanReview, setScanReview] = useState(null), [selectedSample, setSelectedSample] = useState(SAMPLE_CASES[0]);
  const scans = useMemo(() => (isOpen ? getAvailableScanners() : []), [isOpen]), existingIncidents = useMemo(() => (isOpen ? getIncidents() : []), [isOpen]);

  const selectScanForReview = (sc) => {
    setSelectedScan(sc);
    setScanReview({ title: `${sc.sourceType}: ${sc.target.slice(0, 42)}`, category: sc.suggestedCategory, severity: sc.riskLevel || 'Medium', asset: sc.target, desc: `Source: ${sc.sourceType}\nTarget: ${sc.target}\nVerdict: ${sc.verdict}${sc.riskScore ? ` (Score: ${sc.riskScore})` : ''}${sc.timestamp ? `\nTimestamp: ${new Date(sc.timestamp).toLocaleString()}` : ''}` });
  };
  const isDuplicate = selectedScan && existingIncidents.some((i) => i.sourceId === selectedScan.id || (i.evidenceReferences && i.evidenceReferences.includes(selectedScan.target)));

  const handleManual = (e) => {
    e.preventDefault(); if (!manual.title.trim() || !manual.desc.trim()) { setErr('Title and description required.'); return; }
    onCreate({ ...manual, description: manual.desc, affectedAsset: manual.asset, sourceType: 'manual' }); onClose();
  };
  const confirmScanImport = () => {
    if (!selectedScan || !scanReview) return;
    onCreate({ title: scanReview.title, category: scanReview.category, severity: scanReview.severity, description: scanReview.desc, affectedAsset: scanReview.asset, evidenceReferences: [selectedScan.target], sourceType: 'scanner', sourceId: selectedScan.id }); onClose();
  };
  const importSample = () => {
    if (!selectedSample) return;
    onCreate({ title: selectedSample.title, category: selectedSample.category, severity: selectedSample.severity, description: selectedSample.desc, affectedAsset: selectedSample.asset, evidenceReferences: [selectedSample.evidence], sourceType: 'sample', isSample: true }); onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} max={flow === null ? 'max-w-4xl' : 'max-w-2xl'}>
      {flow === null ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div className="md:col-span-5 hidden sm:block">
            <DetectiveIllustration className="h-full min-h-[340px]" />
          </div>
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">CYBERSHIELD COMMAND CENTER</span>
              <h2 className="font-display font-bold text-xl text-text-primary mt-0.5">Create a New Incident</h2>
              <p className="text-xs text-text-secondary mt-0.5">Choose how you want to start your investigation.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTAKE_MODES.map((opt) => (
                <button key={opt.id} onClick={() => setFlow(opt.id)} className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${opt.highlight ? 'border-amber-500/60 bg-[#0d1624] hover:border-amber-400' : 'border-border bg-[#0d1522] hover:bg-surface-hover'}`}>
                  <div className="flex justify-between items-center mb-1.5"><opt.icon size={16} className={opt.color} />{opt.badge && <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">{opt.badge}</span>}</div>
                  <h4 className="font-bold text-xs text-text-primary">{opt.title}</h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setFlow(null)} className="text-xs text-amber-400 hover:underline mb-3 font-mono cursor-pointer">← Back to Options</button>
          {flow === 'guided' && <InvestigationWizard onLaunch={(rec) => { onCreate(rec); onClose(); }} onCancel={() => setFlow(null)} />}
          {flow === 'manual' && (
            <form onSubmit={handleManual} className="space-y-3 text-xs">
              <h3 className="font-display font-bold text-base text-text-primary">Report an Incident</h3>
              <div><label className="text-text-secondary uppercase block mb-1">Incident Title *</label><input type="text" value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} className="w-full bg-bg-elevated border border-border rounded px-2.5 py-1.5 text-text-primary" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-text-secondary uppercase block mb-1">Category</label><select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1.5 text-text-primary">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-text-secondary uppercase block mb-1">Severity</label><select value={manual.severity} onChange={(e) => setManual({ ...manual, severity: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1.5 text-text-primary">{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="text-text-secondary uppercase block mb-1">Target Asset</label><input type="text" value={manual.asset} onChange={(e) => setManual({ ...manual, asset: e.target.value })} className="w-full bg-bg-elevated border border-border rounded px-2.5 py-1 text-text-primary" /></div>
              <div><label className="text-text-secondary uppercase block mb-1">Description *</label><textarea rows={2} value={manual.desc} onChange={(e) => setManual({ ...manual, desc: e.target.value })} className="w-full bg-bg-elevated border border-border rounded px-2.5 py-1.5 text-text-primary" /></div>
              {err && <p className="text-danger font-semibold">{err}</p>}
              <div className="flex justify-end gap-2 pt-1"><Button variant="outline" size="sm" onClick={() => setFlow(null)}>Cancel</Button><Button variant="primary" size="sm" type="submit">Create Incident</Button></div>
            </form>
          )}
          {flow === 'scanner' && (
            <div className="space-y-3 text-xs">
              <h3 className="font-display font-bold text-base text-text-primary">Create from Scanner Telemetry</h3>
              {scans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {scans.map((sc) => (
                      <div key={sc.id} onClick={() => selectScanForReview(sc)} className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedScan?.id === sc.id ? 'border-accent bg-accent/15' : 'border-border bg-bg-elevated hover:bg-surface'}`}>
                        <div className="flex justify-between items-center"><span className="font-mono text-[10px] text-accent uppercase font-bold">{sc.sourceType}</span><span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${sc.riskLevel === 'High' ? 'text-danger bg-danger/10' : sc.riskLevel === 'Medium' ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>{sc.riskLevel}</span></div>
                        <p className="font-semibold text-text-primary truncate mt-0.5">{sc.target}</p><p className="text-[10px] text-text-muted mt-0.5">{sc.verdict}{sc.timestamp ? ` · ${new Date(sc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                      </div>
                    ))}
                  </div>
                  {selectedScan && scanReview ? (
                    <div className="p-3 rounded-xl bg-bg-elevated border border-border space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="font-mono text-accent text-[10px] font-bold uppercase">{selectedScan.sourceType}</span><span className="text-[10px] text-amber-400 font-mono font-bold">{selectedScan.verdict}</span></div>
                        <div><label className="text-[10px] text-text-muted uppercase block">Incident Title</label><input type="text" value={scanReview.title} onChange={(e) => setScanReview({ ...scanReview, title: e.target.value })} className="w-full bg-[#090e17] border border-border rounded px-2 py-1 text-text-primary text-xs" /></div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div><label className="text-[10px] text-text-muted uppercase block">Category</label><select value={scanReview.category} onChange={(e) => setScanReview({ ...scanReview, category: e.target.value })} className="w-full bg-[#090e17] border border-border rounded p-1 text-text-primary text-xs">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                          <div><label className="text-[10px] text-text-muted uppercase block">Severity</label><select value={scanReview.severity} onChange={(e) => setScanReview({ ...scanReview, severity: e.target.value })} className="w-full bg-[#090e17] border border-border rounded p-1 text-text-primary text-xs">{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                        </div>
                        {isDuplicate && <p className="text-[10px] text-warning bg-warning/10 p-1.5 rounded border border-warning/20">A record with this scan target already exists in registry.</p>}
                      </div>
                      <Button variant="primary" size="sm" onClick={confirmScanImport} className="w-full mt-2">Confirm & Import Incident</Button>
                    </div>
                  ) : <div className="p-4 rounded-xl bg-bg-elevated border border-border text-center text-text-muted flex items-center justify-center">Select a scan result on the left to review and import.</div>}
                </div>
              ) : (
                <div className="p-5 text-center rounded-xl bg-bg-elevated border border-border space-y-2">
                  <p className="text-xs text-text-muted">No saved scanner telemetry found. Run a scan to generate telemetry.</p>
                  <div className="flex justify-center gap-2 pt-1"><Button variant="outline" size="sm" onClick={() => { onClose(); navigate(ROUTES.QR_SCANNER); }} icon={FiMaximize}>QR Scanner</Button><Button variant="outline" size="sm" onClick={() => { onClose(); navigate(ROUTES.URL_SCANNER); }} icon={FiLink}>URL Scanner</Button></div>
                </div>
              )}
            </div>
          )}
          {flow === 'sample' && (
            <div className="space-y-3 text-xs">
              <h3 className="font-display font-bold text-base text-text-primary">Simulated Case Investigations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">{SAMPLE_CASES.map((s) => (
                  <div key={s.id} onClick={() => setSelectedSample(s)} className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedSample?.id === s.id ? 'border-amber-400 bg-amber-500/10' : 'border-border bg-bg-elevated'}`}><div className="flex justify-between font-bold text-text-primary"><span>{s.title}</span><span className="text-amber-400">{s.severity}</span></div><p className="text-[10px] text-text-muted mt-0.5 truncate">{s.desc}</p></div>
                ))}</div>
                {selectedSample && (
                  <div className="p-3 rounded-xl bg-bg-elevated border border-border space-y-2 flex flex-col justify-between">
                    <div><span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{selectedSample.category}</span><h4 className="font-bold text-text-primary mt-0.5">{selectedSample.title}</h4><p className="text-text-secondary mt-1">{selectedSample.desc}</p></div>
                    <Button variant="primary" size="sm" onClick={importSample} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">Import Simulated Incident</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function ViewModal({ incident, onClose, onEdit }) {
  if (!incident) return null;
  return (
    <Modal open={Boolean(incident)} onClose={onClose} max="max-w-lg">
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{incident.id}</span><span className="text-text-muted font-mono capitalize">Source: {incident.sourceType}</span>{incident.isSample && <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">SIMULATED</span>}</div>
        <h3 className="font-display font-bold text-lg text-text-primary">{incident.title}</h3>
        <div className="flex gap-2"><span className="px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-secondary">Category: <strong className="text-text-primary">{incident.category}</strong></span><span className="px-2 py-0.5 rounded bg-bg-elevated border border-border text-amber-400 font-bold">Severity: {incident.severity}</span><span className="px-2 py-0.5 rounded bg-bg-elevated border border-border text-accent font-bold">Status: {incident.status}</span></div>
        <div className="p-3 rounded-xl bg-bg-elevated border border-border text-text-secondary whitespace-pre-line leading-relaxed">{incident.description}</div>
        {incident.affectedAsset && <p className="text-text-muted">Target Asset: <strong className="text-text-primary">{incident.affectedAsset}</strong></p>}
        {incident.evidenceReferences?.length > 0 && <div className="space-y-1"><span className="text-[10px] font-mono text-text-muted uppercase">Evidence References:</span>{incident.evidenceReferences.map((e, idx) => <p key={idx} className="font-mono text-[10px] text-accent bg-bg-elevated p-1 rounded truncate">{e}</p>)}</div>}
        <div className="flex justify-between items-center pt-2 border-t border-border"><span className="text-[10px] font-mono text-text-muted">{new Date(incident.createdAt).toLocaleDateString()}</span><Button variant="primary" size="sm" onClick={() => { onClose(); onEdit(incident); }} icon={FiEdit2}>Edit Incident</Button></div>
      </div>
    </Modal>
  );
}

export function EditModal({ incident, onClose, onSave }) {
  if (!incident) return null;
  const [data, setData] = useState({ title: incident.title, category: incident.category, severity: incident.severity, status: incident.status, desc: incident.description, asset: incident.affectedAsset || '' });
  return (
    <Modal open={Boolean(incident)} onClose={onClose} max="max-w-md">
      <div className="space-y-3 text-xs">
        <h3 className="font-display font-bold text-base text-text-primary">Edit {incident.id}</h3>
        <div><label className="text-text-secondary uppercase block mb-1">Headline</label><input type="text" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1.5 text-text-primary" /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="text-text-secondary uppercase block mb-1">Category</label><select value={data.category} onChange={(e) => setData({ ...data, category: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1 text-text-primary">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-text-secondary uppercase block mb-1">Severity</label><select value={data.severity} onChange={(e) => setData({ ...data, severity: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1 text-text-primary">{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="text-text-secondary uppercase block mb-1">Status</label><select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1 text-text-primary">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="text-text-secondary uppercase block mb-1">Target Asset</label><input type="text" value={data.asset} onChange={(e) => setData({ ...data, asset: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1 text-text-primary" /></div>
        <div><label className="text-text-secondary uppercase block mb-1">Description</label><textarea rows={2} value={data.desc} onChange={(e) => setData({ ...data, desc: e.target.value })} className="w-full bg-bg-elevated border border-border rounded p-1.5 text-text-primary" /></div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="primary" size="sm" onClick={() => { onSave(incident.id, { title: data.title, category: data.category, severity: data.severity, status: data.status, description: data.desc, affectedAsset: data.asset }); onClose(); }}>Save Changes</Button></div>
      </div>
    </Modal>
  );
}

export function DeleteModal({ incident, onClose, onConfirm }) {
  if (!incident) return null;
  return (
    <Modal open={Boolean(incident)} onClose={onClose} max="max-w-sm">
      <div className="text-center space-y-3">
        <FiAlertTriangle size={28} className="text-danger mx-auto" /><h3 className="font-display font-bold text-base text-text-primary">Delete {incident.id}?</h3><p className="text-xs text-text-secondary">Permanently delete "{incident.title}"?</p>
        <div className="flex justify-center gap-2 pt-1"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="danger" size="sm" onClick={() => { onConfirm(incident.id); onClose(); }} icon={FiTrash2}>Delete</Button></div>
      </div>
    </Modal>
  );
}
