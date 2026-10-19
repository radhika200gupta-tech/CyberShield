import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCompass, FiPlus, FiLayers, FiSearch, FiEye, FiEdit2, FiTrash2, FiRotateCcw, FiBriefcase, FiAlertCircle, FiAlertTriangle, FiRefreshCw, FiCheckCircle, FiCrosshair, FiFileText } from 'react-icons/fi';
import Button from '../components/common/Button';
import { CreateModal, ViewModal, EditModal, DeleteModal } from '../components/incidents/IncidentModals';
import { getIncidents, createIncident, updateIncident, deleteIncident, calculateMetrics, CATEGORIES, STATUSES } from '../utils/incidentStorage';
import { useToast } from '../context/ToastContext';

const SEV_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const SEV_BADGES = { Critical: 'bg-danger/15 text-danger border-danger/30', High: 'bg-danger/10 text-danger border-danger/25', Medium: 'bg-warning/10 text-warning border-warning/25', Low: 'bg-success/10 text-success border-success/25' };
const STAT_BADGES = { Open: 'bg-accent/10 text-accent border-accent/25', 'In Progress': 'bg-primary/10 text-primary border-primary/25', Resolved: 'bg-success/10 text-success border-success/25' };

export default function IncidentCommandCenter() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState(() => getIncidents());
  const [search, setSearch] = useState(''), [sevFilter, setSevFilter] = useState('All'), [statFilter, setStatFilter] = useState('All'), [catFilter, setCatFilter] = useState('All'), [sort, setSort] = useState('newest');
  const [createOpt, setCreateOpt] = useState(null), [viewItem, setViewItem] = useState(null), [editItem, setEditItem] = useState(null), [delItem, setDelItem] = useState(null);

  useEffect(() => {
    const handleStorage = (e) => { if (e.key === 'cybershield_incidents_v1') setIncidents(getIncidents()); };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const metrics = useMemo(() => calculateMetrics(incidents), [incidents]);
  const filtered = useMemo(() => incidents.filter((i) => {
    const q = search.toLowerCase(), match = !q || i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || (i.affectedAsset || '').toLowerCase().includes(q);
    return match && (sevFilter === 'All' || i.severity === sevFilter) && (statFilter === 'All' || i.status === statFilter) && (catFilter === 'All' || i.category === catFilter);
  }).sort((a, b) => sort === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : (SEV_ORDER[b.severity] || 0) - (SEV_ORDER[a.severity] || 0)), [incidents, search, sevFilter, statFilter, catFilter, sort]);

  const handleCreate = (data) => { const rec = createIncident(data); setIncidents(getIncidents()); showToast(`Incident ${rec.id} created.`, 'success'); return rec; };
  const handleUpdate = (id, up) => { const rec = updateIncident(id, up); setIncidents(getIncidents()); showToast(`Incident ${id} updated.`, 'success'); if (viewItem?.id === id) setViewItem(rec); };
  const handleDelete = (id) => { deleteIncident(id); setIncidents(getIncidents()); showToast(`Incident ${id} deleted.`, 'info'); if (viewItem?.id === id) setViewItem(null); };

  return (
    <div className="space-y-6 max-w-[1500px] w-full min-w-0 mx-auto pb-12 text-left font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,166,35,0.15)]"><FiCompass size={22} /></div>
          <div><div className="flex items-center gap-2"><h1 className="font-display font-bold text-2xl text-text-primary tracking-tight">Incident Command Center</h1><span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold">LIVE TRIAGE</span></div><p className="text-xs text-text-secondary mt-0.5">Monitor, investigate and resolve security incidents.</p></div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setCreateOpt('sample')} icon={FiLayers} className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">Sample Investigations</Button>
          <Button variant="primary" size="sm" onClick={() => setCreateOpt('menu')} icon={FiPlus} className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-[0_0_20px_rgba(245,166,35,0.25)]">Create Incident</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Incidents', val: metrics.total, icon: FiBriefcase, color: 'text-amber-400 border-amber-500/25 bg-amber-500/10' }, { label: 'Open', val: metrics.open, icon: FiAlertCircle, color: 'text-accent border-accent/25 bg-accent/10' }, { label: 'High Severity', val: metrics.highSeverity, sub: 'High & Critical', icon: FiAlertTriangle, color: 'text-danger border-danger/25 bg-danger/10' }, { label: 'In Progress', val: metrics.inProgress, icon: FiRefreshCw, color: 'text-primary border-primary/25 bg-primary/10' }, { label: 'Resolved', val: metrics.resolved, icon: FiCheckCircle, color: 'text-success border-success/25 bg-success/10' },
        ].map((m) => (<div key={m.label} className="bg-surface border border-border/70 rounded-xl p-4 shadow-sm flex justify-between items-start"><div><p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{m.label} {m.sub && <span className="text-[9px] lowercase">({m.sub})</span>}</p><p className="font-mono font-bold text-2xl text-text-primary mt-1">{m.val}</p></div><div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${m.color}`}><m.icon size={15} /></div></div>))}
      </div>

      <div className="bg-surface border border-border/70 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents by ID, title, target asset..." className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:border-accent" /></div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">{['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (<button key={s} onClick={() => setSevFilter(s)} className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${sevFilter === s ? 'border-amber-400 bg-amber-500/15 text-amber-300' : 'border-border text-text-secondary bg-bg-elevated/40'}`}>{s}</button>))}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2"><div className="flex items-center gap-1"><span className="text-text-muted">Status:</span><select value={statFilter} onChange={(e) => setStatFilter(e.target.value)} className="bg-bg-elevated border border-border rounded px-2 py-0.5 text-text-primary"><option value="All">All Statuses</option>{STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}</select></div><div className="flex items-center gap-1"><span className="text-text-muted">Category:</span><select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-bg-elevated border border-border rounded px-2 py-0.5 text-text-primary"><option value="All">All Categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div></div>
          <div className="flex items-center gap-2 ml-auto"><div className="flex items-center gap-1"><span className="text-text-muted">Sort:</span><select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-bg-elevated border border-border rounded px-2 py-0.5 text-text-primary"><option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="severity">Highest Severity First</option></select></div>{(search || sevFilter !== 'All' || statFilter !== 'All' || catFilter !== 'All') && <button onClick={() => { setSearch(''); setSevFilter('All'); setStatFilter('All'); setCatFilter('All'); setSort('newest'); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border text-text-secondary hover:text-text-primary"><FiRotateCcw size={11} /> Reset</button>}</div>
        </div>
      </div>

      <div className="bg-surface border border-border/70 rounded-xl overflow-hidden">
        {incidents.length === 0 ? (
          <div className="p-10 text-center space-y-3"><FiBriefcase size={28} className="text-amber-400 mx-auto" /><h3 className="font-bold text-base text-text-primary">No Incidents in Registry</h3><Button variant="primary" size="sm" onClick={() => setCreateOpt('menu')}>Create First Incident</Button></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2"><FiAlertCircle size={24} className="text-text-muted mx-auto" /><h3 className="font-bold text-sm text-text-primary">No Matching Incidents</h3><Button variant="outline" size="sm" onClick={() => { setSearch(''); setSevFilter('All'); setStatFilter('All'); setCatFilter('All'); }}>Clear Filters</Button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead><tr className="border-b border-border/80 bg-bg-elevated/60 text-text-muted font-mono uppercase"><th className="py-2.5 px-3.5 w-24">Incident ID</th><th className="py-2.5 px-3.5">Title</th><th className="py-2.5 px-3.5 w-36">Category</th><th className="py-2.5 px-3.5 w-24">Severity</th><th className="py-2.5 px-3.5 w-28">Status</th><th className="py-2.5 px-3.5 w-36">Date Created</th><th className="py-2.5 px-3.5 w-24 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-hover/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono text-text-primary font-bold">{inc.id}</td>
                    <td className="py-2.5 px-3.5"><div className="flex items-center gap-1.5 flex-wrap"><button onClick={() => setViewItem(inc)} className="font-semibold text-text-primary hover:text-accent text-left line-clamp-1 cursor-pointer">{inc.title}</button>{inc.isSample && <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">SIMULATED</span>}</div>{inc.affectedAsset && <p className="text-[10px] text-text-muted truncate mt-0.5">Asset: {inc.affectedAsset}</p>}</td>
                    <td className="py-2.5 px-3.5 text-text-secondary"><span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border/60">{inc.category}</span></td>
                    <td className="py-2.5 px-3.5"><span className={`px-2 py-0.5 rounded-full font-medium border ${SEV_BADGES[inc.severity] || SEV_BADGES.Medium}`}>{inc.severity}</span></td>
                    <td className="py-2.5 px-3.5"><span className={`px-2 py-0.5 rounded font-medium border ${STAT_BADGES[inc.status] || STAT_BADGES.Open}`}>{inc.status}</span></td>
                    <td className="py-2.5 px-3.5 text-text-muted font-mono">{new Date(inc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap"><div className="flex items-center justify-end gap-1"><button onClick={() => navigate(`/app/incidents/report/${inc.id}`)} className="p-1 rounded text-teal-400 hover:bg-teal-400/15" title="Resolution & RCA Report"><FiFileText size={14} /></button><button onClick={() => navigate(`/app/incidents/investigate?id=${inc.id}`)} className="p-1 rounded text-accent hover:bg-accent/15" title="Investigate in Workspace"><FiCrosshair size={14} /></button><button onClick={() => setViewItem(inc)} className="p-1 rounded text-text-secondary hover:text-accent" title="View"><FiEye size={14} /></button><button onClick={() => setEditItem(inc)} className="p-1 rounded text-text-secondary hover:text-primary" title="Edit"><FiEdit2 size={14} /></button><button onClick={() => setDelItem(inc)} className="p-1 rounded text-text-secondary hover:text-danger" title="Delete"><FiTrash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2 border-t border-border/50 bg-bg-elevated/40 flex justify-between text-[11px] text-text-muted font-mono"><span>Showing {filtered.length} of {incidents.length} incident{incidents.length !== 1 ? 's' : ''}</span><span className="hidden sm:inline">CYBERSHIELD LOCAL STORAGE SECURE REGISTRY</span></div>
      </div>

      <CreateModal isOpen={Boolean(createOpt)} onClose={() => setCreateOpt(null)} onCreate={handleCreate} initialOption={createOpt === 'menu' ? null : createOpt} />
      <ViewModal incident={viewItem} onClose={() => setViewItem(null)} onEdit={(inc) => setEditItem(inc)} />
      <EditModal incident={editItem} onClose={() => setEditItem(null)} onSave={handleUpdate} />
      <DeleteModal incident={delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete} />
    </div>
  );
}
