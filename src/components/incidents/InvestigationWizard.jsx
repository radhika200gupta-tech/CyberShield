import { useState, useMemo } from 'react';
import { FiMail, FiCrosshair, FiLink, FiTerminal, FiShield, FiDatabase, FiCheck, FiArrowRight, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import Button from '../common/Button';
import DetectiveIllustration from './DetectiveIllustration';
import { CATEGORIES, SEVERITIES, getAvailableScanners } from '../../utils/incidentStorage';

const CAT_ICONS = { 'Phishing Attempt': FiMail, 'Malicious QR': FiCrosshair, 'Suspicious URL': FiLink, 'Account Compromise': FiTerminal, 'Malware': FiShield, 'Other': FiDatabase };
const CAT_HINTS = { 'Phishing Attempt': 'Spoofed sender, deceptive call-to-action, credential harvester.', 'Malicious QR': 'Tampered physical decals, fake menu codes, quishing redirects.', 'Suspicious URL': 'Homograph domains, shortened links, reverse-proxy phishing.', 'Account Compromise': 'Unauthorized login, suspicious API token, privilege escalation.', 'Malware': 'Suspicious executable, backdoor beacon, ransomware note.', 'Other': 'Unclassified security anomaly or data exposure event.' };
const SEV_CARDS = { Critical: { color: 'text-danger border-danger/40 bg-danger/10', sub: 'Active exploit or confirmed breach' }, High: { color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', sub: 'Direct credential theft or malicious payload' }, Medium: { color: 'text-warning border-warning/40 bg-warning/10', sub: 'Suspicious lure or external anomaly' }, Low: { color: 'text-success border-success/40 bg-success/10', sub: 'Minor reconnaissance or isolated scan attempt' } };
const STAGES = ['PROTOCOL INTRO', 'DETECT INCIDENT', 'EVALUATE THREAT', 'FOLLOW EVIDENCE', 'CASE DOSSIER'];

export default function InvestigationWizard({ onLaunch, onCancel }) {
  const [stage, setStage] = useState(0), [created, setCreated] = useState(null), [manualRef, setManualRef] = useState(''), [err, setErr] = useState('');
  const [draft, setDraft] = useState({ title: '', category: 'Malicious QR', severity: 'High', asset: '', impact: '', desc: '', evidence: [] });
  const scanners = useMemo(() => getAvailableScanners(), []), prvId = useMemo(() => `PRV-${Math.floor(1000 + Math.random() * 9000)}`, []);

  const addEv = (item) => { if (item && !draft.evidence.includes(item)) setDraft((d) => ({ ...d, evidence: [...d.evidence, item] })); };
  const remEv = (idx) => setDraft((d) => ({ ...d, evidence: d.evidence.filter((_, i) => i !== idx) }));

  const nextStage = () => {
    if (stage === 1 && (!draft.title.trim() || !draft.desc.trim())) { setErr('Case title and initial narrative are required.'); return; }
    setErr(''); setStage((s) => s + 1);
  };

  const handleLaunch = () => {
    const rec = onLaunch({ title: draft.title, category: draft.category, severity: draft.severity, description: `${draft.desc}${draft.impact ? `\n\nImpact Scope: ${draft.impact}` : ''}`, affectedAsset: draft.asset, evidenceReferences: draft.evidence, sourceType: 'guided' });
    setCreated(rec); setStage(5);
  };

  return (
    <div className="text-left font-sans animate-fade-in">
      {stage === 0 && (
        <div className="space-y-4 py-1">
          <div className="flex justify-between items-center border-b border-border/70 pb-2">
            <span className="font-mono text-[10px] text-amber-400 font-bold uppercase tracking-widest">CYBERSHIELD INVESTIGATION PROTOCOL</span>
            <span className="text-xs font-mono text-text-muted">{prvId}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 hidden sm:block">
              <DetectiveIllustration compact className="h-full min-h-[250px]" />
            </div>
            <div className="md:col-span-7 space-y-3">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-text-primary tracking-tight">INVESTIGATION PROTOCOL</h2>
                <p className="text-xs font-semibold text-amber-300 italic mt-0.5">Every signal leaves a trace. Start connecting the evidence.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0c1422] border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-mono text-amber-400 font-bold">{prvId} · Provisional Dossier</p>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">FORENSIC INTAKE</span>
                </div>
                <p className="text-text-muted text-[11px]">Initialize a structured 4-stage digital forensics intake pipeline.</p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-text-muted pt-1">
                  {['01 DETECT', '02 EVALUATE', '03 EVIDENCE', '04 LAUNCH'].map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-bg-elevated border border-border">{s}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                This protocol standardizes triage, captures real scanner telemetry, scores risk severity, and builds an auditable incident record before containment actions.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => setStage(1)} icon={FiArrowRight} iconPosition="right" className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-[0_0_20px_rgba(245,166,35,0.25)]">INITIALIZE INVESTIGATION</Button>
          </div>
        </div>
      )}

      {stage >= 1 && stage <= 4 && (
        <div className="space-y-3.5">
          <div className="flex justify-between items-center border-b border-border/70 pb-2">
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">STAGE 0{stage} OF 04</span><span className="text-xs font-bold text-text-primary uppercase tracking-wide">{STAGES[stage]}</span></div>
            <span className="text-xs font-mono text-text-muted">{prvId}</span>
          </div>

          {stage === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = CAT_ICONS[cat] || FiShield, active = draft.category === cat;
                  return (
                    <button key={cat} type="button" onClick={() => setDraft({ ...draft, category: cat })} className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${active ? 'border-amber-400 bg-amber-500/15' : 'border-border bg-bg-elevated hover:bg-surface'}`}>
                      <div className="flex justify-between items-center mb-1"><Icon size={14} className={active ? 'text-amber-400' : 'text-text-muted'} />{active && <FiCheck size={12} className="text-amber-400" />}</div>
                      <p className="text-xs font-bold text-text-primary">{cat}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-amber-300/80 font-mono italic">Context: {CAT_HINTS[draft.category]}</p>
              <div><label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Incident Title *</label><input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Rogue QR decal detected on Cafeteria POS" className="w-full bg-bg-elevated border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:border-amber-400" /></div>
              <div><label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Attack Narrative *</label><textarea rows={2} value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="Describe indicators, victim actions, malicious destination..." className="w-full bg-bg-elevated border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:border-amber-400" /></div>
              {err && <p className="text-xs text-danger font-semibold">{err}</p>}
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEVERITIES.map((s) => (
                  <button key={s} type="button" onClick={() => setDraft({ ...draft, severity: s })} className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${draft.severity === s ? 'border-amber-400 bg-amber-500/15' : 'border-border bg-bg-elevated'}`}>
                    <p className={`text-xs font-bold ${SEV_CARDS[s].color}`}>{s}</p><p className="text-[10px] text-text-muted mt-1 leading-tight">{SEV_CARDS[s].sub}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Target Asset</label><input type="text" value={draft.asset} onChange={(e) => setDraft({ ...draft, asset: e.target.value })} placeholder="e.g. POS Stand #3, Exec Inboxes" className="w-full bg-bg-elevated border border-border rounded px-2.5 py-1 text-xs text-text-primary" /></div>
                <div><label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Estimated Impact</label><input type="text" value={draft.impact} onChange={(e) => setDraft({ ...draft, impact: e.target.value })} placeholder="e.g. 200+ users exposed" className="w-full bg-bg-elevated border border-border rounded px-2.5 py-1 text-xs text-text-primary" /></div>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-elevated border border-border flex justify-between items-center text-[11px] font-mono text-text-secondary"><span>Triage Summary:</span><span className="text-amber-400 font-bold">{draft.category} // {draft.severity} Severity // {draft.asset || 'Asset Pending'}</span></div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-mono text-text-secondary uppercase block mb-1">Live Scanner Findings ({scanners.length} available)</span>
                {scanners.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto space-y-1 p-1 bg-bg-elevated rounded border border-border">
                    {scanners.map((sc) => (
                      <div key={sc.id} className="flex justify-between items-center p-1.5 rounded bg-surface border border-border/70 text-[11px]">
                        <span className="truncate mr-2"><strong className="text-accent font-mono">[{sc.sourceType}]</strong> {sc.target} <span className="text-amber-400">({sc.verdict})</span></span>
                        <button type="button" onClick={() => addEv(`[${sc.sourceType}] ${sc.target} (${sc.verdict})`)} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] shrink-0 font-bold">+ Attach</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-text-muted italic p-2 bg-bg-elevated rounded border border-border">No scanner telemetry found. You can add manual evidence pointers below.</p>}
              </div>
              <div className="flex gap-2"><input type="text" value={manualRef} onChange={(e) => setManualRef(e.target.value)} placeholder="e.g. URL, QR payload, or SHA256 checksum" className="flex-1 bg-bg-elevated border border-border rounded px-2.5 py-1 text-xs text-text-primary" /><Button variant="outline" size="sm" onClick={() => { addEv(manualRef.trim()); setManualRef(''); }} icon={FiPlus}>Add</Button></div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {draft.evidence.map((ev, idx) => (
                  <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-[#0b1320] border border-amber-500/20 text-[11px] font-mono text-accent">
                    <span className="truncate mr-2">{ev}</span><button type="button" onClick={() => remEv(idx)} className="text-text-muted hover:text-danger"><FiTrash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="p-3.5 rounded-xl bg-[#09111c] border border-amber-500/40 space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/60 pb-1.5"><span className="font-mono text-amber-400 font-bold">{prvId} // DOSSIER READY</span><span className="font-bold text-amber-400 uppercase">{draft.severity} SEVERITY</span></div>
              <h4 className="font-bold text-sm text-text-primary">{draft.title}</h4>
              <p className="text-text-secondary leading-relaxed">{draft.desc}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px]">
                <div>Category: <strong className="text-text-primary">{draft.category}</strong></div>
                <div>Target Asset: <strong className="text-text-primary">{draft.asset || 'Unspecified'}</strong></div>
                {draft.impact && <div className="col-span-2">Impact Scope: <strong className="text-text-primary">{draft.impact}</strong></div>}
              </div>
              {draft.evidence.length > 0 && <p className="text-text-muted text-[10px] font-mono">{draft.evidence.length} evidence pointer(s) attached.</p>}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setStage((s) => s - 1)}><FiArrowLeft className="mr-1" /> Back</Button>
            {stage < 4 ? <Button variant="primary" size="sm" onClick={nextStage} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">Stage 0{stage + 1} →</Button>
              : <Button variant="primary" size="sm" onClick={handleLaunch} icon={FiCheck} className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-[0_0_20px_rgba(245,166,35,0.25)]">LAUNCH INVESTIGATION</Button>}
          </div>
        </div>
      )}

      {stage === 5 && created && (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,166,35,0.2)]"><FiCheck size={24} /></div>
          <div><span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest">CASE INITIALIZED SUCCESSFULLY</span><h3 className="font-display font-bold text-2xl text-text-primary mt-0.5">{created.id}</h3><p className="text-xs text-text-secondary max-w-sm mx-auto mt-0.5">{created.title}</p></div>
          <Button variant="primary" size="sm" onClick={onCancel} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">Return to Command Center</Button>
        </div>
      )}
    </div>
  );
}
