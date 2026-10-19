import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiClock, FiPlus, FiTrash2, FiEdit2, FiSearch, FiX, FiCheck, FiChevronRight, FiActivity, FiShare2 } from 'react-icons/fi';
import Button from '../components/common/Button';
import { getIncidents, getInvestigation, saveInvestigation, getAvailableScanners, REL_TYPES, EV_TYPES } from '../utils/incidentStorage';
import { ROUTES } from '../constants/routes';

const STAGES = ['Review incident', 'Collect evidence', 'Build timeline', 'Document findings', 'Review investigation'];
const NODE_COLS = { incident: { stroke: '#00e5bf', fill: '#092523', text: '#00e5bf', badge: 'bg-primary/20 text-primary border-primary/30', icon: '🛡️' }, url: { stroke: '#38bdf8', fill: '#0a2336', text: '#38bdf8', badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: '🔗' }, qr: { stroke: '#c084fc', fill: '#221136', text: '#c084fc', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '▦' }, scanner: { stroke: '#fbbf24', fill: '#2d2008', text: '#fbbf24', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '⚡' }, evidence: { stroke: '#2dd4bf', fill: '#082522', text: '#2dd4bf', badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30', icon: '📄' }, screenshot: { stroke: '#34d399', fill: '#0c271d', text: '#34d399', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '📷' }, finding: { stroke: '#f43f5e', fill: '#330c17', text: '#f43f5e', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: '⚠️' } };

export default function InvestigationWorkspace() {
  const navigate = useNavigate(), { incidentId: paramId } = useParams(), [params, setParams] = useSearchParams(), activeId = paramId || params.get('id');
  const [incidents] = useState(() => getIncidents()), incident = useMemo(() => incidents.find((i) => i.id === activeId) || incidents[0] || null, [incidents, activeId]);
  const [inv, setInv] = useState(() => incident ? getInvestigation(incident.id, incident) : null), [selNodeId, setSelNodeId] = useState('incident'), [saveStatus, setSaveStatus] = useState('Saved');
  const [evSearch, setEvSearch] = useState(''), [evType, setEvType] = useState('All'), [evRel, setEvRel] = useState('All'), [modal, setModal] = useState(null), saveTimer = useRef(null);

  useEffect(() => { if (incident) { setInv(getInvestigation(incident.id, incident)); setSelNodeId('incident'); } }, [incident?.id]);

  const updateInv = (fn) => setInv((prev) => {
    const next = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn };
    if (incident?.id) { saveInvestigation(incident.id, next); setSaveStatus('Saving...'); clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => setSaveStatus('Saved'), 500); }
    return next;
  });

  const nodes = useMemo(() => {
    if (!incident || !inv) return [];
    const list = [{ id: 'incident', type: 'incident', title: incident.id, sub: incident.title, desc: incident.description, meta: { Created: new Date(incident.createdAt).toLocaleDateString(), Status: incident.status, Severity: incident.severity, Source: incident.sourceType } }];
    (inv.evidence || []).forEach((e) => list.push({ id: e.id, type: e.type === 'URL' ? 'url' : e.type === 'QR Code' ? 'qr' : e.type === 'Screenshot' ? 'screenshot' : e.source?.includes('Scanner') ? 'scanner' : 'evidence', title: e.title, sub: `${e.type} · ${e.relevance}`, desc: e.description, meta: { Type: e.type, Relevance: e.relevance, Source: e.source, Time: e.timestamp } }));
    (inv.findings || []).forEach((f) => list.push({ id: f.id, type: 'finding', title: f.title, sub: `${f.classification} (${f.confidence})`, desc: f.description, meta: { Threat: f.classification, Confidence: f.confidence, Evidence: f.linkedEvidence || 'None' } }));
    const cx = 380, cy = 175, rx = 265, ry = 115, tot = list.length - 1;
    return list.map((n, i) => i === 0 ? { ...n, x: cx, y: cy } : { ...n, x: Math.round(cx + rx * Math.cos(((i - 1) / Math.max(1, tot)) * 2 * Math.PI - Math.PI / 2)), y: Math.round(cy + ry * Math.sin(((i - 1) / Math.max(1, tot)) * 2 * Math.PI - Math.PI / 2)) });
  }, [incident, inv]);

  const selNode = nodes.find((n) => n.id === selNodeId) || nodes[0];
  const conns = useMemo(() => (inv?.relationships || []).map((r) => ({ ...r, fNode: nodes.find((n) => n.id === r.from), tNode: nodes.find((n) => n.id === r.to) })).filter((r) => r.fNode && r.tNode), [inv?.relationships, nodes]);
  const related = useMemo(() => nodes.filter((n) => conns.some((c) => (c.from === selNode.id && c.to === n.id) || (c.to === selNode.id && c.from === n.id))), [selNode, conns, nodes]);

  const toggleCheck = (idx) => updateInv((p) => {
    const c = [...p.checklist], t = [...(p.checklistTimes || [])]; c[idx] = !c[idx]; t[idx] = c[idx] ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    return { ...p, checklist: c, checklistTimes: t };
  });

  const saveEv = (item) => { updateInv((p) => ({ ...p, evidence: p.evidence.some((e) => e.id === item.id) ? p.evidence.map((e) => e.id === item.id ? item : e) : [item, ...p.evidence], relationships: p.relationships.some((r) => r.to === item.id) ? p.relationships : [...p.relationships, { id: `rel-${item.id}`, from: 'incident', to: item.id, label: 'supports' }] })); setModal(null); };
  const saveTl = (item) => { updateInv((p) => ({ ...p, timeline: (p.timeline.some((t) => t.id === item.id) ? p.timeline.map((t) => t.id === item.id ? item : t) : [...p.timeline, item]).sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || '')) })); setModal(null); };
  const saveFn = (item) => { updateInv((p) => ({ ...p, findings: p.findings.some((f) => f.id === item.id) ? p.findings.map((f) => f.id === item.id ? item : f) : [...p.findings, item], relationships: p.relationships.some((r) => r.to === item.id) ? p.relationships : [...p.relationships, { id: `rel-${item.id}`, from: 'incident', to: item.id, label: item.classification === 'False Positive' ? 'contradicts' : 'related to' }] })); setModal(null); };
  const delItem = () => {
    const { type, id } = modal.data;
    updateInv((p) => ({ ...p, evidence: type === 'evidence' ? p.evidence.filter((e) => e.id !== id) : p.evidence, timeline: type === 'timeline' ? p.timeline.filter((t) => t.id !== id) : p.timeline, findings: type === 'finding' ? p.findings.filter((f) => f.id !== id) : p.findings, relationships: p.relationships.filter((r) => r.id !== id && r.from !== id && r.to !== id) }));
    if (selNodeId === id) setSelNodeId('incident'); setModal(null);
  };

  const filteredEv = (inv?.evidence || []).filter((e) => (!evSearch || e.title.toLowerCase().includes(evSearch.toLowerCase()) || e.description.toLowerCase().includes(evSearch.toLowerCase())) && (evType === 'All' || e.type === evType) && (evRel === 'All' || e.relevance === evRel));
  const scans = useMemo(() => getAvailableScanners(), []);

  if (!incident || !inv) return <div className="p-10 text-center text-text-muted space-y-3"><FiAlertCircle size={32} className="text-amber-400 mx-auto" /><p className="text-sm">No Incident Selected.</p><Button variant="primary" size="sm" onClick={() => navigate(ROUTES.INCIDENTS)}>Command Center</Button></div>;
  const checkDone = inv.checklist.filter(Boolean).length;

  return (
    <div className="space-y-4 max-w-[1600px] w-full min-w-0 mx-auto pb-12 text-left font-sans text-text-primary text-xs animate-fade-in">
      <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 sm:p-4 shadow flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(ROUTES.INCIDENTS)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-primary font-semibold cursor-pointer"><FiArrowLeft size={13} /> Back to Incidents</button>
          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${incident.severity === 'Critical' || incident.severity === 'High' ? 'bg-danger/20 text-danger border-danger/40' : 'bg-warning/20 text-warning border-warning/40'}`}>{incident.severity.toUpperCase()}</span>
          <div><div className="flex items-center gap-2"><h1 className="font-display font-bold text-base text-text-primary truncate max-w-sm">{incident.title}</h1><select value={incident.id} onChange={(e) => setParams({ id: e.target.value })} className="bg-bg-elevated border border-border rounded px-1.5 py-0.5 text-[11px] text-text-secondary">{incidents.map((i) => <option key={i.id} value={i.id}>{i.id} - {i.title.slice(0, 24)}</option>)}</select></div><p className="text-[10px] font-mono text-text-muted mt-0.5">{incident.id} · Created {new Date(incident.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-3 bg-bg-elevated/70 border border-border/60 px-2.5 py-1 rounded-lg text-text-secondary font-mono text-[11px]"><span>Status: <strong className="text-primary font-sans">{incident.status}</strong></span><span>Evidence: <strong className="text-accent">{inv.evidence.length}</strong></span><span>Relations: <strong className="text-sky-400">{inv.relationships.length}</strong></span><span>Findings: <strong className="text-rose-400">{inv.findings.length}</strong></span></div>
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setModal({ type: 'ev', data: { id: `ev-${Date.now()}`, title: '', type: 'URL', source: 'Manual Entry', description: '', relevance: 'High', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } })} className="bg-primary hover:bg-primary-hover text-black font-bold">Add Evidence</Button>
          <Button variant="outline" size="sm" icon={FiShare2} onClick={() => setModal({ type: 'rel' })} className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10">Link Nodes</Button>
          <Button variant="outline" size="sm" icon={FiActivity} onClick={() => setModal({ type: 'sc' })} className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">Telemetry</Button>
          <Button variant="outline" size="sm" icon={FiFileText} onClick={() => navigate(`/app/incidents/report/${incident.id}`)} className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10">Resolution Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-8 bg-[#070b12] border border-border/80 rounded-xl overflow-hidden flex flex-col shadow-inner">
          <div className="px-3 py-2 bg-[#0b101b] border-b border-border/70 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5"><FiActivity size={13} /> Investigation Board</h2>
            <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-mono text-text-muted">
              {['Incident', 'URL', 'QR Scan', 'Scanner Result', 'Evidence', 'Finding'].map((l) => (<span key={l} className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: (NODE_COLS[l === 'QR Scan' ? 'qr' : l === 'Scanner Result' ? 'scanner' : l.toLowerCase()] || NODE_COLS.evidence).stroke }} /> {l}</span>))}
              <button onClick={() => setSelNodeId('incident')} className="px-2 py-0.5 rounded border border-border text-text-secondary hover:text-text-primary ml-1 cursor-pointer">Reset View</button>
            </div>
          </div>
          <div className="relative flex-1 min-h-[340px] max-h-[390px] w-full bg-[#06090f] overflow-hidden select-none">
            <svg className="w-full h-full" viewBox="0 0 760 350" preserveAspectRatio="xMidYMid meet">
              <defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#1e293b" opacity="0.45" /></pattern><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter></defs>
              <rect width="760" height="350" fill="url(#grid)" />
              {conns.map((c) => {
                const isSel = selNodeId === c.from || selNodeId === c.to, isContra = c.label === 'contradicts', col = isSel ? (isContra ? '#f43f5e' : '#00e5bf') : isContra ? '#991b1b' : '#1e293b', mx = (c.fNode.x + c.tNode.x) / 2, my = (c.fNode.y + c.tNode.y) / 2;
                return (<g key={c.id}><line x1={c.fNode.x} y1={c.fNode.y} x2={c.tNode.x} y2={c.tNode.y} stroke={col} strokeWidth={isSel ? 2 : 1} strokeDasharray={isSel ? 'none' : '3 3'} /><rect x={mx - 27} y={my - 7} width="54" height="14" rx="3" fill="#0b101b" stroke={col} strokeWidth="0.8" /><text x={mx} y={my + 3} textAnchor="middle" fill={isSel ? '#f8fafc' : '#64748b'} fontSize="7.5" fontFamily="monospace">{c.label}</text></g>);
              })}
              {nodes.map((n) => {
                const isSel = selNodeId === n.id, isC = n.id === 'incident', cfg = NODE_COLS[n.type] || NODE_COLS.evidence, rad = isC ? 25 : 18;
                return (
                  <g key={n.id} onClick={() => setSelNodeId(n.id)} className="cursor-pointer">
                    {isSel && <circle cx={n.x} cy={n.y} r={rad + 6} fill="none" stroke={cfg.stroke} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />}
                    <circle cx={n.x} cy={n.y} r={rad} fill={cfg.fill} stroke={isSel ? '#ffffff' : cfg.stroke} strokeWidth={isSel ? 2.5 : 1.5} filter={isSel ? 'url(#glow)' : undefined} />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" fill={cfg.text} fontSize={isC ? '13' : '11'} fontWeight="bold">{cfg.icon}</text>
                    <text x={n.x} y={n.y + rad + 11} textAnchor="middle" fill="#f8fafc" fontSize="8.5" fontWeight="600">{n.title.length > 20 ? n.title.slice(0, 18) + '…' : n.title}</text>
                    <text x={n.x} y={n.y + rad + 20} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">{n.type.toUpperCase()}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0b101b] border border-border/80 rounded-xl p-3.5 flex flex-col justify-between shadow">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2"><h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5"><FiFileText size={13} className="text-accent" /> Node Details</h3>{selNode.id !== 'incident' && <button onClick={() => setSelNodeId('incident')} className="text-text-muted hover:text-text-primary cursor-pointer"><FiX size={14} /></button>}</div>
            <div className="flex items-start gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-base shrink-0 ${(NODE_COLS[selNode.type] || NODE_COLS.evidence).badge}`}>{NODE_COLS[selNode.type]?.icon || '📄'}</div>
              <div className="min-w-0"><div className="flex items-center gap-1.5"><span className="font-mono text-[9px] text-accent uppercase font-bold">{selNode.type}</span><span className="px-1 py-0.2 rounded text-[8px] font-mono bg-bg-elevated border border-border text-text-muted">{selNode.id}</span></div><h4 className="font-bold text-xs text-text-primary truncate mt-0.5">{selNode.title}</h4></div>
            </div>
            <p className="text-[11px] text-text-secondary bg-[#080d16] p-2 rounded border border-border/60 leading-relaxed max-h-20 overflow-y-auto">{selNode.desc || 'No description recorded.'}</p>
            <div className="space-y-1 font-mono text-[10px] bg-bg-elevated/40 p-2 rounded border border-border/50">{Object.entries(selNode.meta || {}).map(([k, v]) => (<div key={k} className="flex justify-between text-text-muted"><span>{k}:</span><span className="text-text-primary font-medium truncate max-w-[160px]">{v}</span></div>))}</div>
            <div className="space-y-1 pt-1"><h5 className="font-mono text-[9px] uppercase text-text-muted font-bold tracking-wider">Related Nodes ({related.length})</h5>{related.length === 0 ? <p className="text-[10px] text-text-muted italic">No direct connections attached.</p> : (<div className="space-y-1 max-h-24 overflow-y-auto">{related.map((rn) => (<button key={rn.id} onClick={() => setSelNodeId(rn.id)} className="w-full flex items-center justify-between p-1 rounded bg-bg-elevated/60 hover:bg-surface-hover border border-border/50 text-left text-[11px] cursor-pointer"><span className="truncate text-text-secondary hover:text-accent">{rn.title} <span className="text-[9px] text-text-muted font-mono">({rn.type})</span></span><FiChevronRight size={11} className="text-text-muted shrink-0" /></button>))}</div>)}</div>
          </div>
          {selNode.id !== 'incident' && <div className="pt-2 border-t border-border/60 flex justify-end"><Button variant="danger" size="sm" icon={FiTrash2} onClick={() => setModal({ type: 'del', data: { type: selNode.type === 'finding' ? 'finding' : 'evidence', id: selNode.id, name: selNode.title } })}>Delete Node</Button></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 items-stretch">
        <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><h3 className="font-display font-bold text-xs uppercase text-text-primary flex items-center gap-1.5"><FiFileText size={12} className="text-primary" /> Evidence Locker ({filteredEv.length})</h3><button onClick={() => setModal({ type: 'ev', data: { id: `ev-${Date.now()}`, title: '', type: 'URL', source: 'Manual Entry', description: '', relevance: 'High', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } })} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"><FiPlus size={11} /> Add</button></div>
            <div className="space-y-1"><div className="relative"><FiSearch size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" /><input type="text" placeholder="Search evidence..." value={evSearch} onChange={(e) => setEvSearch(e.target.value)} className="w-full bg-[#070b12] border border-border rounded pl-6 pr-2 py-0.5 text-[10px] text-text-primary" /></div><div className="grid grid-cols-2 gap-1 text-[9px]"><select value={evType} onChange={(e) => setEvType(e.target.value)} className="bg-[#070b12] border border-border rounded p-0.5 text-text-secondary"><option value="All">All Types</option>{EV_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><select value={evRel} onChange={(e) => setEvRel(e.target.value)} className="bg-[#070b12] border border-border rounded p-0.5 text-text-secondary"><option value="All">All Relevance</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>
            <div className="space-y-1 max-h-52 overflow-y-auto">{filteredEv.length === 0 ? <p className="text-center text-text-muted py-3 text-[10px]">No evidence matches.</p> : filteredEv.map((ev) => (<div key={ev.id} className="p-1.5 rounded bg-[#070b12] border border-border/70 flex items-center justify-between gap-1 hover:border-primary/40"><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><span className="font-semibold text-text-primary truncate text-[10px]">{ev.title}</span><span className={`px-1 py-0.2 rounded font-mono text-[8px] font-bold ${ev.relevance === 'High' ? 'text-danger bg-danger/15' : 'text-warning bg-warning/15'}`}>{ev.relevance}</span></div><p className="text-[9px] text-text-muted truncate">{ev.type} · {ev.timestamp}</p></div><div className="flex items-center gap-0.5 shrink-0"><button onClick={() => setModal({ type: 'ev', data: ev })} className="p-1 text-text-muted hover:text-primary cursor-pointer"><FiEdit2 size={10} /></button><button onClick={() => setModal({ type: 'del', data: { type: 'evidence', id: ev.id, name: ev.title } })} className="p-1 text-text-muted hover:text-danger cursor-pointer"><FiTrash2 size={10} /></button></div></div>))}</div>
          </div>
        </div>

        <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><h3 className="font-display font-bold text-xs uppercase text-text-primary flex items-center gap-1.5"><FiClock size={12} className="text-accent" /> Timeline ({inv.timeline.length})</h3><button onClick={() => setModal({ type: 'tl', data: { id: `tl-${Date.now()}`, title: '', type: 'Analyst Action', description: '', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } })} className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"><FiPlus size={11} /> Add</button></div>
            <div className="relative pl-2.5 border-l border-border/80 space-y-2.5 max-h-60 overflow-y-auto">{inv.timeline.map((evt) => (<div key={evt.id} className="relative group text-[10px]"><span className="absolute -left-[14px] top-1 w-1.5 h-1.5 rounded-full bg-accent" /><div className="flex items-center justify-between gap-1"><span className="font-mono text-[8px] text-text-muted">{evt.timestamp}</span><span className="px-1 py-0.2 rounded text-[8px] font-mono bg-bg-elevated border border-border text-accent">{evt.type}</span><button onClick={() => setModal({ type: 'del', data: { type: 'timeline', id: evt.id, name: evt.title } })} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger cursor-pointer"><FiTrash2 size={9} /></button></div><p className="font-semibold text-text-primary mt-0.5">{evt.title}</p><p className="text-[9px] text-text-secondary leading-snug">{evt.description}</p></div>))}</div>
          </div>
        </div>

        <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><h3 className="font-display font-bold text-xs uppercase text-text-primary flex items-center gap-1.5"><FiAlertTriangle size={12} className="text-rose-400" /> Findings ({inv.findings.length})</h3><button onClick={() => setModal({ type: 'fn', data: { id: `fn-${Date.now()}`, title: '', confidence: 'Medium', classification: 'Suspicious Activity', description: '', linkedEvidence: '', timestamp: 'Documented' } })} className="text-[10px] font-bold text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"><FiPlus size={11} /> Add</button></div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">{inv.findings.map((f) => (<div key={f.id} className="p-2 rounded bg-[#070b12] border border-rose-500/30 space-y-0.5"><div className="flex items-start justify-between gap-1"><span className="font-bold text-text-primary text-[10px] leading-tight">{f.title}</span><button onClick={() => setModal({ type: 'del', data: { type: 'finding', id: f.id, name: f.title } })} className="text-text-muted hover:text-danger cursor-pointer"><FiTrash2 size={10} /></button></div><div className="font-mono text-[8px] text-rose-400 font-bold">{f.classification} · {f.confidence}</div><p className="text-[9px] text-text-secondary leading-snug">{f.description}</p></div>))}</div>
          </div>
        </div>

        <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow space-y-2">
          <div className="space-y-1.5"><div className="flex items-center justify-between"><h3 className="font-display font-bold text-xs uppercase text-text-primary flex items-center gap-1.5"><FiEdit2 size={12} className="text-amber-400" /> Analyst Notes</h3><span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold flex items-center gap-1 ${saveStatus === 'Saved' ? 'bg-success/15 text-success border border-success/30' : 'bg-warning/15 text-warning'}`}><FiCheck size={9} /> {saveStatus}</span></div><textarea rows={7} maxLength={500} value={inv.notes || ''} onChange={(e) => updateInv({ notes: e.target.value })} placeholder="Record forensic leads and notes..." className="w-full bg-[#070b12] border border-border/80 rounded p-2 text-[11px] text-text-primary focus:border-accent resize-none leading-relaxed" /></div>
          <div className="text-right text-[9px] font-mono text-text-muted">{(inv.notes || '').length}/500 chars</div>
        </div>

        <div className="bg-[#0b101b] border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><h3 className="font-display font-bold text-xs uppercase text-text-primary flex items-center gap-1.5"><FiCheckCircle size={12} className="text-accent" /> Checklist</h3><span className="font-mono text-[9px] text-accent font-bold">{checkDone}/5 ({Math.round((checkDone / 5) * 100)}%)</span></div>
            <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden border border-border/40"><div className="h-full bg-accent transition-all duration-300" style={{ width: `${(checkDone / 5) * 100}%` }} /></div>
            <div className="space-y-1.5 pt-0.5">{STAGES.map((stg, idx) => { const on = Boolean(inv.checklist[idx]), tm = inv.checklistTimes?.[idx]; return (<div key={stg} onClick={() => toggleCheck(idx)} className={`p-1.5 rounded border cursor-pointer flex items-start gap-1.5 ${on ? 'bg-accent/10 border-accent/40' : 'bg-[#070b12] border-border/60 text-text-muted'}`}><input type="checkbox" checked={on} onChange={() => {}} className="mt-0.5 rounded text-accent cursor-pointer" /><div className="min-w-0 flex-1"><p className={`text-[10px] font-medium leading-tight ${on ? 'text-accent' : 'text-text-secondary'}`}>{stg}</p>{tm && <p className="text-[8px] font-mono text-text-muted">{tm}</p>}</div></div>); })}</div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#090e17] border border-border/90 rounded-xl p-4 text-left space-y-3 text-xs">
            <button onClick={() => setModal(null)} className="absolute top-3 right-3 text-text-muted hover:text-text-primary cursor-pointer"><FiX size={15} /></button>
            {modal.type === 'ev' && (
              <form onSubmit={(e) => { e.preventDefault(); if (modal.data.title.trim()) saveEv(modal.data); }} className="space-y-2">
                <h3 className="font-bold text-sm text-text-primary">Evidence Item</h3>
                <div><label className="text-[10px] text-text-muted uppercase block">Title *</label><input type="text" value={modal.data.title} onChange={(e) => setModal({ ...modal, data: { ...modal.data, title: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" required /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-text-muted uppercase block">Type</label><select value={modal.data.type} onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary">{EV_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div><div><label className="text-[10px] text-text-muted uppercase block">Relevance</label><select value={modal.data.relevance} onChange={(e) => setModal({ ...modal, data: { ...modal.data, relevance: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Source Reference</label><input type="text" value={modal.data.source} onChange={(e) => setModal({ ...modal, data: { ...modal.data, source: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" /></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Description</label><textarea rows={2} value={modal.data.description} onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" /></div>
                <div className="flex justify-end gap-2 pt-1 border-t border-border"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" size="sm" type="submit">Save Evidence</Button></div>
              </form>
            )}
            {modal.type === 'tl' && (
              <form onSubmit={(e) => { e.preventDefault(); if (modal.data.title.trim()) saveTl(modal.data); }} className="space-y-2">
                <h3 className="font-bold text-sm text-text-primary">Timeline Event</h3>
                <div><label className="text-[10px] text-text-muted uppercase block">Title *</label><input type="text" value={modal.data.title} onChange={(e) => setModal({ ...modal, data: { ...modal.data, title: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" required /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-text-muted uppercase block">Type</label><select value={modal.data.type} onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary"><option value="Detection">Detection</option><option value="Evidence Collected">Evidence Collected</option><option value="Analyst Action">Analyst Action</option><option value="Finding">Finding</option></select></div><div><label className="text-[10px] text-text-muted uppercase block">Time</label><input type="text" value={modal.data.timestamp} onChange={(e) => setModal({ ...modal, data: { ...modal.data, timestamp: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" /></div></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Description</label><textarea rows={2} value={modal.data.description} onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" /></div>
                <div className="flex justify-end gap-2 pt-1 border-t border-border"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" size="sm" type="submit">Add Milestone</Button></div>
              </form>
            )}
            {modal.type === 'fn' && (
              <form onSubmit={(e) => { e.preventDefault(); if (modal.data.title.trim()) saveFn(modal.data); }} className="space-y-2">
                <h3 className="font-bold text-sm text-text-primary">Document Finding</h3>
                <div><label className="text-[10px] text-text-muted uppercase block">Title *</label><input type="text" value={modal.data.title} onChange={(e) => setModal({ ...modal, data: { ...modal.data, title: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" required /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-text-muted uppercase block">Classification</label><select value={modal.data.classification} onChange={(e) => setModal({ ...modal, data: { ...modal.data, classification: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary"><option value="Confirmed Threat">Confirmed Threat</option><option value="Suspicious Activity">Suspicious Activity</option><option value="False Positive">False Positive</option><option value="Inconclusive">Inconclusive</option></select></div><div><label className="text-[10px] text-text-muted uppercase block">Confidence</label><select value={modal.data.confidence} onChange={(e) => setModal({ ...modal, data: { ...modal.data, confidence: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Description</label><textarea rows={2} value={modal.data.description} onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary" /></div>
                <div className="flex justify-end gap-2 pt-1 border-t border-border"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" size="sm" type="submit">Save Finding</Button></div>
              </form>
            )}
            {modal.type === 'rel' && (
              <form onSubmit={(e) => { e.preventDefault(); const f = e.target.from.value, t = e.target.to.value, l = e.target.label.value; if (f !== t) { updateInv((p) => ({ ...p, relationships: [...p.relationships, { id: `rel-${Date.now()}`, from: f, to: t, label: l }] })); setModal(null); } }} className="space-y-2">
                <h3 className="font-bold text-sm text-text-primary">Link Graph Nodes</h3>
                <div><label className="text-[10px] text-text-muted uppercase block">Source Node</label><select name="from" defaultValue={nodes[0]?.id} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary">{nodes.map((n) => <option key={n.id} value={n.id}>{n.title} ({n.type})</option>)}</select></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Relationship</label><select name="label" defaultValue="related to" className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary">{REL_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label className="text-[10px] text-text-muted uppercase block">Target Node</label><select name="to" defaultValue={nodes[1]?.id || nodes[0]?.id} className="w-full bg-[#070b12] border border-border rounded p-1 text-text-primary">{nodes.map((n) => <option key={n.id} value={n.id}>{n.title} ({n.type})</option>)}</select></div>
                <div className="flex justify-end gap-2 pt-1 border-t border-border"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" size="sm" type="submit">Connect</Button></div>
              </form>
            )}
            {modal.type === 'sc' && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-text-primary">Import Telemetry</h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {scans.length === 0 ? <p className="text-center text-text-muted py-3">No scans saved.</p> : scans.map((sc) => (
                    <div key={sc.id} onClick={() => saveEv({ id: `ev-sc-${Date.now()}`, title: sc.target, type: sc.suggestedCategory === 'Malicious QR' ? 'QR Code' : 'URL', source: sc.sourceType, description: `${sc.verdict} (${sc.riskLevel})`, relevance: sc.riskLevel === 'High' ? 'High' : 'Medium', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })} className="p-2 rounded bg-[#070b12] border border-border hover:border-accent cursor-pointer flex justify-between items-center text-[10px]">
                      <div className="min-w-0 pr-1.5"><span className="font-mono text-accent uppercase font-bold">{sc.sourceType}</span><p className="font-semibold text-text-primary truncate">{sc.target}</p></div>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${sc.riskLevel === 'High' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>{sc.riskLevel}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-1 border-t border-border"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Close</Button></div>
              </div>
            )}
            {modal.type === 'del' && (
              <div className="text-center space-y-2.5">
                <FiAlertTriangle size={24} className="text-danger mx-auto" /><h4 className="font-bold text-sm text-text-primary">Delete {modal.data.name}?</h4><p className="text-text-muted text-[11px]">Remove this item from active investigation?</p>
                <div className="flex justify-center gap-2 pt-1"><Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" size="sm" onClick={delItem}>Delete</Button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
