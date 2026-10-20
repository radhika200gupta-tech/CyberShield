import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiPrinter, FiCheckCircle, FiSave, FiAlertTriangle, FiAlertCircle, FiFolder, FiPlus, FiTrash2, FiShield, FiX, FiInfo } from 'react-icons/fi';
import Button from '../components/common/Button';
import { getIncidents, updateIncident, getInvestigation, getReport, saveReport } from '../utils/incidentStorage';
import { useToast } from '../context/ToastContext';
import { ROUTES } from '../constants/routes';

const OUTCOMES = ['Contained', 'Mitigated', 'Remediated', 'Under Monitoring'], STAGE_TYPES = ['Confirmed', 'Hypothesis', 'Unknown'], PREV_STATUSES = ['Planned', 'In Progress', 'Completed'];
const TABS = [{ id: 'all', label: 'Report Overview' }, { id: 'rca', label: 'Root Cause Analysis' }, { id: 'findings', label: 'Key Findings' }, { id: 'remediation', label: 'Conclusion & Remediation' }, { id: 'prevention', label: 'Prevention Plan' }, { id: 'notes', label: 'Analyst Notes' }];

export default function IncidentResolutionReport() {
  const navigate = useNavigate(), { incidentId: paramId } = useParams(), { showToast } = useToast();
  const [incidents, setIncidents] = useState(() => getIncidents()), activeId = paramId || incidents[0]?.id;
  const incident = useMemo(() => incidents.find((i) => i.id === activeId) || incidents[0] || null, [incidents, activeId]);
  const [inv, setInv] = useState(() => incident ? getInvestigation(incident.id, incident) : null);
  const [rep, setRep] = useState(() => incident ? getReport(incident.id, incident, inv) : null);
  const [activeTab, setActiveTab] = useState('all'), [errors, setErrors] = useState({}), [confirmModal, setConfirmModal] = useState(null);
  const summaryRef = useRef(null), conclusionRef = useRef(null), rcaRef = useRef(null), previewRef = useRef(null);

  useEffect(() => {
    if (incident) {
      const timer = setTimeout(() => {
        const curInv = getInvestigation(incident.id, incident);
        setInv(curInv);
        setRep(getReport(incident.id, incident, curInv));
        setErrors({});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [incident]);

  const updateRep = useCallback((fn) => setRep((prev) => {
    const next = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn };
    if (incident?.id) saveReport(incident.id, next);
    return next;
  }), [incident]);

  const handleSaveDraft = () => { if (incident && rep) { saveReport(incident.id, rep); showToast(`Draft for ${incident.id} saved securely.`, 'success'); } };
  const validateReport = () => {
    const errs = {};
    if (!rep.executiveSummary?.trim()) { errs.executiveSummary = 'Executive summary is required.'; summaryRef.current?.focus(); }
    else if (!rep.rootCause?.weakness?.trim() || !rep.rootCause?.impact?.trim()) { errs.rootCause = 'Initial weakness and impact descriptions are required.'; rcaRef.current?.focus(); }
    else if (!rep.conclusion?.trim()) { errs.conclusion = 'Formal conclusion and residual risk are required.'; conclusionRef.current?.focus(); }
    setErrors(errs); return Object.keys(errs).length === 0;
  };

  const handleFinalize = () => { if (!validateReport()) { showToast('Complete required sections before finalization.', 'error'); return; } setConfirmModal('finalize'); };
  const confirmFinalize = () => { updateRep({ status: 'Finalized' }); setConfirmModal(null); showToast(`Dossier for ${incident.id} finalized!`, 'success'); };
  const confirmResolve = () => { if (incident) { updateIncident(incident.id, { status: 'Resolved' }); setIncidents(getIncidents()); setConfirmModal(null); showToast(`Incident ${incident.id} marked as Resolved.`, 'success'); } };

  if (!incident || !rep) return <main className="p-12 text-center text-text-muted space-y-3 font-sans"><FiAlertCircle size={36} className="text-amber-400 mx-auto" /><h2 className="text-base font-bold text-text-primary">No Incident Dossier Found</h2><Button variant="primary" size="sm" onClick={() => navigate(ROUTES.INCIDENTS)}>Command Center</Button></main>;
  const isFinalized = rep.status === 'Finalized', rca = rep.rootCause || {}, res = rep.resolution || {};

  return (
    <main className="space-y-4 max-w-[1700px] w-full min-w-0 mx-auto pb-16 text-left font-sans text-text-primary text-xs animate-fade-in">
      <header className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/app/incidents/investigate?id=${incident.id}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-primary font-semibold transition-colors"><FiArrowLeft size={13} /> Back to Investigation</Link>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0"><FiFolder size={18} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm text-text-primary">{incident.id}</span>
              <span className={`px-2 py-0.2 rounded font-mono font-bold text-[10px] border ${incident.severity === 'Critical' || incident.severity === 'High' ? 'bg-danger/20 text-danger border-danger/40' : 'bg-warning/20 text-warning border-warning/40'}`}>{incident.severity.toUpperCase()}</span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] border ${incident.status === 'Resolved' ? 'bg-success/20 text-success border-success/40' : 'bg-accent/20 text-accent border-accent/40'}`}>{incident.status}</span>
              {isFinalized && <span className="px-2 py-0.2 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">REPORT SEALED</span>}
              <span className="px-2 py-0.2 rounded font-mono text-[9px] font-bold text-danger bg-danger/10 border border-danger/30 uppercase tracking-widest">CONFIDENTIAL</span>
            </div>
            <h1 className="font-display font-bold text-base text-text-primary truncate max-w-xl mt-0.5">{incident.title}</h1>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">Detected: {new Date(incident.createdAt).toLocaleDateString()} · Lead: {rep.preparedBy} · Updated: {new Date(rep.lastUpdated || incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" icon={FiSave} onClick={handleSaveDraft} className="border-border text-text-secondary hover:text-text-primary">Save Draft</Button>
          <Button variant="outline" size="sm" icon={FiFileText} onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })} className="border-border text-text-secondary hover:text-accent">Preview Report</Button>
          <Button variant="outline" size="sm" icon={FiPrinter} onClick={() => window.print()} className="border-teal-500/30 text-teal-300 hover:bg-teal-500/10">Print / Save as PDF</Button>
          {incident.status !== 'Resolved' && <Button variant="outline" size="sm" icon={FiCheckCircle} onClick={() => setConfirmModal('resolve')} className="border-success/40 text-success hover:bg-success/10">Resolve Incident</Button>}
          <Button variant="primary" size="sm" icon={FiShield} onClick={handleFinalize} className="bg-primary hover:bg-primary-hover text-black font-bold shadow-[0_0_15px_rgba(36,216,197,0.25)]">Finalize Report</Button>
        </div>
      </header>

      <nav aria-label="Report sections" className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
        {TABS.map((t) => (<button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${activeTab === t.id ? 'border-teal-400 bg-teal-500/15 text-teal-300' : 'border-border text-text-muted bg-[#0b101b] hover:text-text-secondary'}`}>{t.label}</button>))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <section aria-label="Report editor" className="lg:col-span-6 space-y-3.5 no-print">
          {(activeTab === 'all' || activeTab === 'rca') && (
            <article ref={rcaRef} className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <div><h2 className="font-display font-bold text-xs uppercase tracking-wider text-teal-400 flex items-center gap-1.5"><FiShield size={13} /> 2. Root Cause Analysis Diagram</h2><p className="text-[10px] text-text-muted mt-0.5">Four-stage causal progression: Weakness → Factor → Impact → Action</p></div>
                <span className="font-mono text-[9px] text-teal-300 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">RCA ENGINE</span>
              </div>
              <svg className="w-full h-5 hidden sm:block" viewBox="0 0 540 16" fill="none">
                <defs><marker id="rca-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#24d8c5" /></marker></defs>
                <line x1="120" y1="8" x2="145" y2="8" stroke="#24d8c5" strokeWidth="1.5" markerEnd="url(#rca-arrow)" strokeDasharray="3 2" />
                <line x1="260" y1="8" x2="285" y2="8" stroke="#24d8c5" strokeWidth="1.5" markerEnd="url(#rca-arrow)" strokeDasharray="3 2" />
                <line x1="400" y1="8" x2="425" y2="8" stroke="#24d8c5" strokeWidth="1.5" markerEnd="url(#rca-arrow)" strokeDasharray="3 2" />
              </svg>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  { key: 'weakness', tKey: 'weaknessType', label: '1. Initial Weakness', color: 'border-rose-500/40 text-rose-300 bg-rose-500/5', desc: 'Perimeter or architecture gap' }, { key: 'contributing', tKey: 'contributingType', label: '2. Contributing Factor', color: 'border-amber-500/40 text-amber-300 bg-amber-500/5', desc: 'Circumstance enabling vector' }, { key: 'impact', tKey: 'impactType', label: '3. Incident Impact', color: 'border-purple-500/40 text-purple-300 bg-purple-500/5', desc: 'Exposure scope or compromise' }, { key: 'action', tKey: 'actionType', label: '4. Corrective Action', color: 'border-teal-500/40 text-teal-300 bg-teal-500/5', desc: 'Control deployed to sever vector' }
                ].map((stg) => (<div key={stg.key} className={`p-2.5 rounded-lg border ${stg.color} space-y-1.5`}><div className="flex justify-between items-center"><span className="font-bold text-[11px]">{stg.label}</span><select value={rca[stg.tKey] || 'Confirmed'} onChange={(e) => updateRep({ rootCause: { ...rca, [stg.tKey]: e.target.value } })} className="bg-[#070b12] border border-border rounded px-1 py-0.2 text-[9px] font-mono">{STAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div><textarea rows={2} value={rca[stg.key] || ''} onChange={(e) => updateRep({ rootCause: { ...rca, [stg.key]: e.target.value } })} placeholder={stg.desc} className="w-full bg-[#070b12] border border-border/70 rounded p-1.5 text-xs text-text-primary focus:border-teal-400 resize-none leading-relaxed" /></div>))}
              </div>
              {errors.rootCause && <p className="text-[11px] text-danger font-semibold flex items-center gap-1"><FiAlertTriangle size={12} /> {errors.rootCause}</p>}
            </article>
          )}

          {(activeTab === 'all' || activeTab === 'all') && (
            <article ref={summaryRef} className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-2">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5"><h2 className="font-display font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5"><FiFileText size={13} className="text-teal-400" /> 1. Executive Summary</h2><span className="text-[10px] font-mono text-text-muted">{(rep.executiveSummary || '').length} chars</span></div>
              <textarea rows={3} value={rep.executiveSummary || ''} onChange={(e) => updateRep({ executiveSummary: e.target.value })} placeholder="Document high-level incident summary: observed vector, scope, and resolution..." className="w-full bg-[#070b12] border border-border rounded p-2 text-xs text-text-primary focus:border-teal-400 resize-none leading-relaxed" />
              {errors.executiveSummary && <p className="text-[11px] text-danger font-semibold flex items-center gap-1"><FiAlertTriangle size={12} /> {errors.executiveSummary}</p>}
            </article>
          )}

          {(activeTab === 'all' || activeTab === 'findings') && (
            <article className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-2.5">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5"><div><h2 className="font-display font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5"><FiAlertTriangle size={13} /> 3. Key Findings ({rep.keyFindings?.length || 0})</h2><p className="text-[10px] text-text-muted">Report findings with inline evidence references</p></div><button type="button" onClick={() => updateRep({ keyFindings: [...(rep.keyFindings || []), { id: `rep-fn-${Date.now()}`, title: 'Observed Threat Finding', description: 'Corroborated by telemetry signature.', evidenceRef: 'EV-01' }] })} className="px-2 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer"><FiPlus size={11} /> Add Finding</button></div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(rep.keyFindings || []).map((f, idx) => (
                  <div key={f.id || idx} className="p-2.5 rounded-lg bg-[#070b12] border border-border/70 space-y-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <input type="text" value={f.title} onChange={(e) => { const upd = [...rep.keyFindings]; upd[idx] = { ...upd[idx], title: e.target.value }; updateRep({ keyFindings: upd }); }} className="flex-1 bg-transparent border-b border-border font-bold text-text-primary text-xs focus:border-rose-400 pb-0.5" />
                      <div className="flex items-center gap-1"><span className="font-mono text-[9px] text-text-muted">Ref:</span><input type="text" value={f.evidenceRef || ''} onChange={(e) => { const upd = [...rep.keyFindings]; upd[idx] = { ...upd[idx], evidenceRef: e.target.value }; updateRep({ keyFindings: upd }); }} placeholder="EV-01" className="w-16 bg-[#0b101b] border border-border rounded px-1 py-0.2 text-[9px] font-mono text-accent" /><button type="button" onClick={() => updateRep({ keyFindings: rep.keyFindings.filter((_, i) => i !== idx) })} className="p-1 text-text-muted hover:text-danger cursor-pointer"><FiTrash2 size={12} /></button></div>
                    </div>
                    <textarea rows={1} value={f.description} onChange={(e) => { const upd = [...rep.keyFindings]; upd[idx] = { ...upd[idx], description: e.target.value }; updateRep({ keyFindings: upd }); }} placeholder="Finding detail..." className="w-full bg-transparent border-0 text-[11px] text-text-secondary focus:ring-0 p-0 leading-relaxed resize-none" />
                  </div>
                ))}
              </div>
            </article>
          )}

          {(activeTab === 'all' || activeTab === 'remediation') && (
            <article className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5"><h2 className="font-display font-bold text-xs uppercase tracking-wider text-teal-400 flex items-center gap-1.5"><FiCheckCircle size={13} /> 4. Resolution & Remediation</h2><div className="flex items-center gap-1.5"><span className="font-mono text-[10px] text-text-muted">Outcome:</span><select value={res.finalOutcome || 'Contained'} onChange={(e) => updateRep({ resolution: { ...res, finalOutcome: e.target.value } })} className="bg-[#070b12] border border-teal-500/30 text-teal-300 font-bold rounded px-1.5 py-0.5 text-[10px] font-mono">{OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div></div>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-text-secondary uppercase">Actions Taken</span><button type="button" onClick={() => updateRep({ resolution: { ...res, actionsTaken: [...(res.actionsTaken || []), 'New containment action verified.'] } })} className="text-[10px] text-teal-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"><FiPlus size={10} /> Add Action</button></div>
                <div className="space-y-1">{(res.actionsTaken || []).map((act, i) => (<div key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" /><input type="text" value={act} onChange={(e) => { const acts = [...res.actionsTaken]; acts[i] = e.target.value; updateRep({ resolution: { ...res, actionsTaken: acts } }); }} className="flex-1 bg-[#070b12] border border-border rounded px-2 py-1 text-xs text-text-primary" /><button type="button" onClick={() => updateRep({ resolution: { ...res, actionsTaken: res.actionsTaken.filter((_, idx) => idx !== i) } })} className="text-text-muted hover:text-danger p-1 cursor-pointer"><FiTrash2 size={11} /></button></div>))}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[10px] text-text-muted uppercase block mb-0.5">Verification Performed</label><input type="text" value={res.verification || ''} onChange={(e) => updateRep({ resolution: { ...res, verification: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded px-2 py-1 text-xs text-text-primary" /></div>
                <div><label className="text-[10px] text-text-muted uppercase block mb-0.5">Remaining Issues</label><input type="text" value={res.remainingIssues || ''} onChange={(e) => updateRep({ resolution: { ...res, remainingIssues: e.target.value } })} className="w-full bg-[#070b12] border border-border rounded px-2 py-1 text-xs text-text-primary" /></div>
              </div>
              <div ref={conclusionRef}>
                <label className="text-[10px] text-text-muted uppercase block mb-0.5">Formal Conclusion & Residual Risk *</label>
                <textarea rows={2} value={rep.conclusion || ''} onChange={(e) => updateRep({ conclusion: e.target.value })} placeholder="Document investigation outcome, remaining uncertainty, and residual risk..." className="w-full bg-[#070b12] border border-border rounded p-2 text-xs text-text-primary focus:border-teal-400 resize-none leading-relaxed" />
                {errors.conclusion && <p className="text-[11px] text-danger font-semibold flex items-center gap-1 mt-0.5"><FiAlertTriangle size={12} /> {errors.conclusion}</p>}
              </div>
            </article>
          )}

          {(activeTab === 'all' || activeTab === 'prevention') && (
            <article className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-2.5">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5"><h2 className="font-display font-bold text-xs uppercase tracking-wider text-teal-300 flex items-center gap-1.5"><FiCheckCircle size={13} /> 5. Prevention Plan ({rep.preventionPlan?.length || 0})</h2><button type="button" onClick={() => updateRep({ preventionPlan: [...(rep.preventionPlan || []), { id: `prev-${Date.now()}`, description: 'Implement hardening policy', owner: 'SOC Team', status: 'Planned', targetDate: new Date(Date.now() + 6048e5).toISOString().slice(0, 10) }] })} className="px-2 py-1 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer"><FiPlus size={11} /> Add Measure</button></div>
              <div className="space-y-2">
                {(rep.preventionPlan || []).map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 rounded-lg bg-[#070b12] border border-border/70 space-y-1.5">
                    <div className="flex items-center gap-2"><input type="text" value={p.description} onChange={(e) => { const list = [...rep.preventionPlan]; list[idx] = { ...list[idx], description: e.target.value }; updateRep({ preventionPlan: list }); }} placeholder="Measure description..." className="flex-1 bg-transparent border-b border-border text-xs text-text-primary focus:border-teal-400 pb-0.5" /><button type="button" onClick={() => updateRep({ preventionPlan: rep.preventionPlan.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-danger p-1 cursor-pointer"><FiTrash2 size={12} /></button></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-[9px] text-text-muted uppercase block">Owner</label><input type="text" value={p.owner || ''} onChange={(e) => { const list = [...rep.preventionPlan]; list[idx] = { ...list[idx], owner: e.target.value }; updateRep({ preventionPlan: list }); }} className="w-full bg-[#0b101b] border border-border rounded px-1.5 py-0.5 text-[10px] text-text-primary" /></div>
                      <div><label className="text-[9px] text-text-muted uppercase block">Status</label><select value={p.status || 'Planned'} onChange={(e) => { const list = [...rep.preventionPlan]; list[idx] = { ...list[idx], status: e.target.value }; updateRep({ preventionPlan: list }); }} className="w-full bg-[#0b101b] border border-border rounded px-1 py-0.5 text-[10px] text-text-secondary">{PREV_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}</select></div>
                      <div><label className="text-[9px] text-text-muted uppercase block">Target Date</label><input type="date" value={p.targetDate || ''} onChange={(e) => { const list = [...rep.preventionPlan]; list[idx] = { ...list[idx], targetDate: e.target.value }; updateRep({ preventionPlan: list }); }} className="w-full bg-[#0b101b] border border-border rounded px-1 py-0.5 text-[10px] text-text-primary" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {(activeTab === 'all' || activeTab === 'notes') && (
            <article className="bg-[#0b101b] border border-border/80 rounded-xl p-3.5 shadow space-y-2">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5"><h2 className="font-display font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5"><FiInfo size={13} /> Internal Analyst Notes</h2><label className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted cursor-pointer"><input type="checkbox" checked={Boolean(rep.includeNotesInPrint)} onChange={(e) => updateRep({ includeNotesInPrint: e.target.checked })} className="rounded text-teal-400" /><span>Include in PDF Report</span></label></div>
              <textarea rows={3} value={rep.analystNotes || ''} onChange={(e) => updateRep({ analystNotes: e.target.value })} placeholder="Internal leads and correlation notes..." className="w-full bg-[#070b12] border border-border rounded p-2 text-xs text-text-primary focus:border-amber-400 resize-none leading-relaxed" />
              <p className="text-[9px] text-text-muted italic">Internal notes are omitted from formal export unless opted in above.</p>
            </article>
          )}
        </section>

        <section ref={previewRef} aria-label="Formal document preview" className="lg:col-span-6 w-full print-container">
          <div className="report-paper bg-white text-slate-900 border border-slate-300 rounded-xl p-6 sm:p-9 shadow-2xl relative font-sans text-xs leading-relaxed select-text space-y-5">
            <div className="absolute top-6 right-6 border-2 border-red-700/80 text-red-700 font-mono font-extrabold text-[11px] tracking-widest px-2.5 py-0.5 rotate-[-10deg] uppercase shadow-sm select-none pointer-events-none">CONFIDENTIAL</div>
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
              <div className="space-y-0.5"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-600" /><h3 className="font-mono font-bold text-xs text-teal-800 tracking-wider">CYBERSHIELD DEFENSE SUITE</h3></div><h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">INCIDENT RESPONSE & RCA REPORT</h2><p className="font-mono text-[10px] text-slate-500">REF: CS-IRR-{incident.id} · CLASSIFICATION: LAWFUL FORENSIC USE</p></div>
              <div className="text-right font-mono text-[9px] text-slate-500 pt-1"><div>DATE: {new Date(incident.createdAt).toLocaleDateString()}</div><div>AUTHOR: {rep.preparedBy || 'SOC Team'}</div></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-mono">
              <div><span className="text-slate-500 block">INCIDENT ID:</span><strong className="text-slate-900 font-bold">{incident.id}</strong></div><div><span className="text-slate-500 block">SEVERITY:</span><span className={`font-bold ${incident.severity === 'Critical' || incident.severity === 'High' ? 'text-red-700' : 'text-amber-700'}`}>{incident.severity.toUpperCase()}</span></div><div><span className="text-slate-500 block">STATUS:</span><span className="text-teal-700 font-bold">{incident.status}</span></div><div><span className="text-slate-500 block">ASSET:</span><span className="text-slate-900 truncate block">{incident.affectedAsset || 'Enterprise Network'}</span></div>
            </div>

            <div className="space-y-1 page-break-inside-avoid"><h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">1. Executive Summary</h4><p className="text-slate-700 text-justify text-[11px] leading-relaxed">{rep.executiveSummary || 'No executive summary provided.'}</p></div>

            <div className="space-y-2 page-break-inside-avoid">
              <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">2. Root Cause Analysis Progression</h4>
              <svg className="w-full h-5 hidden sm:block" viewBox="0 0 520 16" fill="none">
                <defs><marker id="paper-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f766e" /></marker></defs>
                <line x1="115" y1="8" x2="140" y2="8" stroke="#0f766e" strokeWidth="1.5" markerEnd="url(#paper-arrow)" strokeDasharray="3 2" />
                <line x1="250" y1="8" x2="275" y2="8" stroke="#0f766e" strokeWidth="1.5" markerEnd="url(#paper-arrow)" strokeDasharray="3 2" />
                <line x1="385" y1="8" x2="410" y2="8" stroke="#0f766e" strokeWidth="1.5" markerEnd="url(#paper-arrow)" strokeDasharray="3 2" />
              </svg>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 text-center">
                {[
                  { label: 'Initial Weakness', text: rca.weakness, type: rca.weaknessType, border: 'border-red-400 bg-red-50 text-red-950' }, { label: 'Contributing Factor', text: rca.contributing, type: rca.contributingType, border: 'border-amber-400 bg-amber-50 text-amber-950' }, { label: 'Incident Impact', text: rca.impact, type: rca.impactType, border: 'border-purple-400 bg-purple-50 text-purple-950' }, { label: 'Corrective Action', text: rca.action, type: rca.actionType, border: 'border-teal-500 bg-teal-50 text-teal-950' }
                ].map((box, i) => (<div key={box.label} className={`p-2 rounded-lg border-2 ${box.border} flex flex-col justify-between text-left`}><div><div className="flex justify-between items-center mb-0.5"><span className="font-bold text-[9px] uppercase">{box.label}</span><span className="text-[7.5px] font-mono px-1 rounded bg-white/80 border">{box.type || 'Confirmed'}</span></div><p className="text-[9.5px] font-medium leading-snug">{box.text || 'Pending'}</p></div>{i < 3 && <div className="text-center font-bold text-slate-400 text-xs mt-1 sm:hidden">↓</div>}</div>))}
              </div>
            </div>

            <div className="space-y-1.5 page-break-inside-avoid">
              <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">3. Key Investigative Findings</h4>
              {(rep.keyFindings || []).length === 0 ? <p className="text-slate-500 italic text-[10px]">No specific findings recorded.</p> : (
                <ul className="space-y-1 pl-1">
                  {(rep.keyFindings || []).map((f, i) => (<li key={i} className="text-[10px] text-slate-800 flex items-start gap-1.5"><span className="text-teal-700 font-bold shrink-0">•</span><span><strong>{f.title}</strong>{f.evidenceRef && <span className="font-mono font-semibold text-teal-700 text-[9px] ml-1">[{f.evidenceRef}]</span>}: {f.description}</span></li>))}
                </ul>
              )}
            </div>

            <div className="space-y-2 page-break-inside-avoid">
              <div className="flex justify-between items-center border-b border-slate-200 pb-0.5"><h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800">4. Resolution & Remediation</h4><span className="font-mono text-[9px] font-bold px-2 py-0.2 rounded bg-teal-100 text-teal-900 border border-teal-300">OUTCOME: {res.finalOutcome || 'Contained'}</span></div>
              <ul className="space-y-0.5 pl-1">{(res.actionsTaken || []).map((act, i) => (<li key={i} className="text-[10px] text-slate-700 flex items-start gap-1.5"><span className="text-emerald-600 font-bold shrink-0">✓</span><span>{act}</span></li>))}</ul>
              <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono bg-slate-50 p-2 rounded border border-slate-200"><div><span className="text-slate-500 block">VERIFICATION:</span>{res.verification || 'Standard monitoring SLA.'}</div><div><span className="text-slate-500 block">REMAINING ISSUES:</span>{res.remainingIssues || 'None identified.'}</div></div>
            </div>

            <div className="space-y-1.5 page-break-inside-avoid">
              <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">5. Preventive Recommendations</h4>
              <table className="w-full text-left text-[9.5px] border-collapse border border-slate-200">
                <thead className="bg-slate-100 font-mono text-slate-600 uppercase"><tr><th className="p-1 border border-slate-200">Measure</th><th className="p-1 border border-slate-200 w-24">Owner</th><th className="p-1 border border-slate-200 w-20">Status</th><th className="p-1 border border-slate-200 w-20">Target</th></tr></thead>
                <tbody>{(rep.preventionPlan || []).map((p, i) => (<tr key={i} className="border-b border-slate-200"><td className="p-1 border border-slate-200 font-medium">{p.description}</td><td className="p-1 border border-slate-200 font-mono text-slate-600">{p.owner || 'SOC'}</td><td className="p-1 border border-slate-200 font-mono font-semibold text-teal-800">{p.status}</td><td className="p-1 border border-slate-200 font-mono text-slate-600">{p.targetDate || 'TBD'}</td></tr>))}</tbody>
              </table>
            </div>

            <div className="space-y-1 page-break-inside-avoid"><h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">6. Conclusion</h4><p className="text-slate-700 text-justify text-[10.5px] leading-relaxed">{rep.conclusion || 'Conclusion pending final analyst review.'}</p></div>
            {rep.includeNotesInPrint && rep.analystNotes && (<div className="space-y-1 page-break-inside-avoid bg-amber-50/70 p-2.5 rounded border border-amber-200"><h4 className="font-mono font-bold text-[10px] uppercase text-amber-900">7. Internal Analyst Notes (Declassified Annex)</h4><p className="text-[10px] text-amber-950 font-mono whitespace-pre-line leading-relaxed">{rep.analystNotes}</p></div>)}
            <div className="border-t-2 border-slate-800 pt-3 flex justify-between items-center text-[9px] font-mono text-slate-500"><div>CYBERSHIELD CYBER DEFENSE LAB · FORENSIC REPORT VALIDATION</div><div>PAGE 1 OF 1</div></div>
          </div>
        </section>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md no-print">
          <div className="relative w-full max-w-sm bg-[#090e17] border border-border rounded-xl p-5 text-left space-y-3.5 text-xs">
            <button type="button" onClick={() => setConfirmModal(null)} className="absolute top-3 right-3 text-text-muted hover:text-text-primary"><FiX size={16} /></button>
            {confirmModal === 'finalize' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-teal-400"><FiShield size={22} /><h3 className="font-bold text-sm text-text-primary">Certify & Finalize Dossier?</h3></div>
                <p className="text-text-secondary leading-relaxed">This certifies the root-cause analysis, timestamps, and findings as an official cybercrime investigation report.</p>
                <div className="flex justify-end gap-2 pt-2 border-t border-border"><Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>Cancel</Button><Button variant="primary" size="sm" onClick={confirmFinalize} className="bg-primary hover:bg-primary-hover text-black font-bold">Confirm Finalize</Button></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success"><FiCheckCircle size={22} /><h3 className="font-bold text-sm text-text-primary">Mark Incident as Resolved?</h3></div>
                <p className="text-text-secondary leading-relaxed">This will transition incident <strong className="text-text-primary">{incident.id}</strong> status to <strong className="text-success">Resolved</strong> in the central Incident Command Center.</p>
                <div className="flex justify-end gap-2 pt-2 border-t border-border"><Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>Cancel</Button><Button variant="primary" size="sm" onClick={confirmResolve} className="bg-success hover:bg-success-hover text-black font-bold">Resolve Incident</Button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
