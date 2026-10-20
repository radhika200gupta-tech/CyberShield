import React, { useState } from 'react';
import { 
  FiSearch, FiList, FiCopy, FiCheck, FiCpu, FiExternalLink, 
  FiMapPin, FiActivity, FiAlertCircle 
} from 'react-icons/fi';
import Button from '../../common/Button';

export default function ThreatMapEventStream({
  threats = [],
  selectedThreat = null,
  onSelectThreat,
  onExplainWithCopilot,
  selectedLocation = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Filter and search stream items
  const filteredThreats = threats.filter(t => {
    if (severityFilter !== 'ALL' && (t.severity || '').toUpperCase() !== severityFilter) {
      return false;
    }
    if (statusFilter !== 'ALL') {
      const isOnline = (t.evidence?.urlStatus || '').toLowerCase() === 'online';
      if (statusFilter === 'ONLINE' && !isOnline) return false;
      if (statusFilter === 'OFFLINE' && isOnline) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchUrl = (t.indicator || '').toLowerCase().includes(q);
      const matchHost = (t.evidence?.host || '').toLowerCase().includes(q);
      const matchCountry = (t.hostingCountry || '').toLowerCase().includes(q);
      const matchCity = (t.hostingCity || '').toLowerCase().includes(q);
      const matchTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
      const matchCat = (t.category || '').toLowerCase().includes(q);
      if (!matchUrl && !matchHost && !matchCountry && !matchCity && !matchTags && !matchCat) {
        return false;
      }
    }
    return true;
  });

  const handleCopy = (e, threat) => {
    e.stopPropagation();
    if (threat && threat.indicator) {
      navigator.clipboard.writeText(threat.indicator);
      setCopiedId(threat.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatTimestamp = (raw) => {
    if (!raw) return 'Unknown';
    try {
      const d = new Date(raw.includes('UTC') ? raw : `${raw} UTC`);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return raw;
    }
  };

  const getSeverityStyle = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      case 'HIGH':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'MEDIUM':
        return 'bg-[#56A6D9]/15 text-[#56A6D9] border-[#56A6D9]/30';
      case 'LOW':
      default:
        return 'bg-[#20D9D2]/15 text-[#20D9D2] border-[#20D9D2]/30';
    }
  };

  return (
    <div className="flex flex-col bg-[#101A27] border border-[#223244] rounded-2xl overflow-hidden shadow-md">
      {/* Stream Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-[#223244] bg-[#152334]/60 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-[#F1F5F9] flex items-center gap-2 uppercase tracking-wide font-mono">
            <FiList className="text-[#20D9D2]" /> Telemetry Event Stream
          </h3>
          <span className="text-xs font-mono text-[#A5B4C7]">
            Showing <strong className="text-[#F1F5F9]">{filteredThreats.length}</strong> of {threats.length}
          </span>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[170px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A5B4C7]" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search host, URL, malware, country..."
              className="w-full bg-[#070B12] border border-[#223244] rounded-lg pl-8 pr-3 py-1.5 text-xs sm:text-sm font-mono text-[#F1F5F9] placeholder:text-[#A5B4C7]/60 focus:outline-none focus:border-[#20D9D2]"
            />
          </div>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-[#070B12] border border-[#223244] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#20D9D2]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#070B12] border border-[#223244] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#20D9D2]"
          >
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Stream Item List */}
      <div className="p-3 sm:p-4 max-h-[580px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
        {filteredThreats.length === 0 ? (
          <div className="p-10 text-center text-xs sm:text-sm text-[#A5B4C7] font-mono flex flex-col items-center gap-2">
            <FiAlertCircle size={20} className="text-[#A5B4C7]/60" />
            <span>No threat indicators match the current search or filter criteria.</span>
            {selectedLocation && selectedLocation.type !== 'global' && (
              <span className="text-[11px] text-[#20D9D2]">
                Active location scope: {selectedLocation.name}
              </span>
            )}
          </div>
        ) : (
          filteredThreats.map((t) => {
            const isSelected = selectedThreat?.id === t.id;
            const isOnline = (t.evidence?.urlStatus || '').toLowerCase() === 'online';

            return (
              <div
                key={t.id}
                onClick={() => onSelectThreat(t)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected 
                    ? 'bg-[#20D9D2]/10 border-[#20D9D2] shadow-lg ring-1 ring-[#20D9D2]/30' 
                    : 'bg-[#152334]/70 border-[#223244] hover:border-[#20D9D2]/40 hover:bg-[#152334]'
                }`}
              >
                {/* Header: Host, Location Pill, Severity, Timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#A5B4C7]'}`}
                      title={isOnline ? 'Active Online Host' : 'Offline / Inactive'}
                    />
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#F1F5F9] truncate max-w-xs">
                      {t.evidence?.host || t.indicator}
                    </span>
                    {t.isGeolocated && t.hostingCountry ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#101A27] text-[#20D9D2] border border-[#223244] flex items-center gap-1">
                        <FiMapPin size={9} />
                        {t.hostingCountry}
                        {t.hostingCity ? ` • ${t.hostingCity}` : ''}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#A5B4C7] bg-[#101A27] border border-[#223244]">
                        Unmapped
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider border ${getSeverityStyle(t.severity)}`}>
                      {t.severity}
                    </span>
                    <span className="text-[11px] font-mono text-[#A5B4C7]">
                      {formatTimestamp(t.firstSeen)}
                    </span>
                  </div>
                </div>

                {/* Sub-row: Full Indicator URL */}
                <div className="text-xs font-mono text-[#A5B4C7] truncate break-all">
                  {t.indicator}
                </div>

                {/* Footer Actions: Copy, Category, Explain with Copilot */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#223244]/60 text-xs">
                  <span className="text-[11px] font-mono text-[#A5B4C7]/80">
                    {t.category || 'Malware Distribution'}
                  </span>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button
                      onClick={(e) => handleCopy(e, t)}
                      className="p-1.5 rounded-lg hover:bg-[#101A27] text-[#A5B4C7] hover:text-[#F1F5F9] border border-transparent hover:border-[#223244] transition-colors"
                      title="Copy Indicator URL"
                    >
                      {copiedId === t.id ? <FiCheck size={13} className="text-[#10B981]" /> : <FiCopy size={13} />}
                    </button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExplainWithCopilot(t);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs py-1 px-2.5 border-[#20D9D2]/40 text-[#20D9D2] hover:bg-[#20D9D2]/15 flex items-center gap-1 font-semibold"
                    >
                      <FiCpu size={12} /> Explain
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
