import React, { useState } from 'react';
import { 
  FiCopy, FiCheck, FiChevronLeft, FiChevronRight, 
  FiExternalLink, FiMaximize2, FiAlertOctagon, FiAlertTriangle, FiInfo, FiShield, FiCpu
} from 'react-icons/fi';

export default function ThreatFeedTable({
  threats = [],
  selectedThreatId = null,
  onSelectThreat,
  onExplainWithCopilot,
  currentPage = 1,
  pageSize = 15,
  onPageChange,
  onPageSizeChange,
  onResetFilters
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, threat) => {
    e.stopPropagation();
    if (threat && threat.indicator) {
      navigator.clipboard.writeText(threat.indicator);
      setCopiedId(threat.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const totalPages = Math.ceil(threats.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, threats.length);
  const currentThreats = threats.slice(startIndex, endIndex);

  const getSeverityBadge = (severity) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL':
        return {
          label: 'Critical',
          icon: FiAlertOctagon,
          className: 'bg-danger/15 text-danger border-danger/30'
        };
      case 'HIGH':
        return {
          label: 'High',
          icon: FiAlertTriangle,
          className: 'bg-danger/10 text-danger border-danger/20'
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          icon: FiInfo,
          className: 'bg-warning/10 text-warning border-warning/20'
        };
      case 'LOW':
      default:
        return {
          label: 'Low',
          icon: FiShield,
          className: 'bg-success/10 text-success border-success/20'
        };
    }
  };

  const formatTimestamp = (raw) => {
    if (!raw) return 'Unknown';
    try {
      // If already UTC date like "2026-10-19 12:32:13", parse cleanly
      const d = new Date(raw.includes('UTC') ? raw : `${raw} UTC`);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return raw;
    }
  };

  if (threats.length === 0) {
    return (
      <div className="bg-surface/90 border border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-accent mb-4 shadow-sm">
          <FiShield size={26} />
        </div>
        <h4 className="text-base font-semibold text-text-primary mb-1">
          No threat intelligence records found
        </h4>
        <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
          No indicators matched your current search and filter combination. Try clearing some criteria.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface/90 border border-border/80 rounded-xl overflow-hidden backdrop-blur-md shadow-sm flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-bg-elevated/70 text-text-muted font-mono uppercase tracking-wider text-xs font-semibold">
              <th className="py-3 px-3 w-12 text-center">Status</th>
              <th className="py-3 px-4 min-w-[280px]">Indicator (Reported URL)</th>
              <th className="py-3 px-3 w-20">Type</th>
              <th className="py-3 px-3 min-w-[150px]">Category & Tags</th>
              <th className="py-3 px-3 w-28">Severity</th>
              <th className="py-3 px-3 w-36">First Reported</th>
              <th className="py-3 px-3 w-32 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {currentThreats.map((threat) => {
              const isSelected = selectedThreatId === threat.id;
              const sevBadge = getSeverityBadge(threat.severity);
              const SevIcon = sevBadge.icon;
              const isOnline = (threat.evidence?.urlStatus || '').toLowerCase() === 'online';

              return (
                <tr
                  key={threat.id}
                  onClick={() => onSelectThreat(threat)}
                  className={`hover:bg-surface-hover/80 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-accent/5 ring-1 ring-inset ring-accent/30' : ''
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectThreat(threat);
                    }
                  }}
                  role="button"
                  aria-label={`Inspect threat ${threat.indicator}`}
                >
                  {/* Status Indicator */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center justify-center" title={`Status: ${threat.evidence?.urlStatus || 'Unknown'}`}>
                      {isOnline ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-text-muted/40"></span>
                      )}
                    </div>
                  </td>

                  {/* Indicator URL */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 max-w-lg">
                      <button
                        onClick={(e) => handleCopy(e, threat)}
                        className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0"
                        title={copiedId === threat.id ? 'Copied!' : 'Copy indicator URL'}
                        aria-label="Copy URL"
                      >
                        {copiedId === threat.id ? (
                          <FiCheck size={14} className="text-success" />
                        ) : (
                          <FiCopy size={14} />
                        )}
                      </button>

                      <span
                        className="font-mono text-text-primary hover:text-accent transition-colors truncate max-w-md select-all text-xs sm:text-sm"
                        title={threat.indicator}
                      >
                        {threat.indicator}
                      </span>
                    </div>

                    {/* Metadata line under URL */}
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-text-muted font-mono">
                      <span>Host: <strong className="text-text-secondary">{threat.evidence?.host || 'Unknown'}</strong></span>
                      {threat.evidence?.fileExtension && (
                        <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 font-semibold">
                          {threat.evidence.fileExtension}
                        </span>
                      )}
                      <span>Reporter: {threat.evidence?.reporter || 'community'}</span>
                    </div>
                  </td>

                  {/* Indicator Type */}
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-bg-elevated text-text-secondary border border-border/70 uppercase">
                      {threat.indicatorType || 'URL'}
                    </span>
                  </td>

                  {/* Category & Tags */}
                  <td className="py-3.5 px-3">
                    <div className="text-xs sm:text-sm font-medium text-text-secondary mb-1">
                      {threat.category}
                    </div>
                    {threat.tags && threat.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {threat.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border/60 text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                        {threat.tags.length > 3 && (
                          <span className="text-xs font-mono text-text-muted">
                            +{threat.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted/60 italic">No tags</span>
                    )}
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${sevBadge.className}`}
                      >
                        <SevIcon size={12} />
                        {sevBadge.label}
                      </span>
                      <span className="text-xs font-mono text-text-muted tracking-tight">
                        Assessed
                      </span>
                    </div>
                  </td>

                  {/* First Reported */}
                  <td className="py-3.5 px-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                    {formatTimestamp(threat.firstSeen)}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectThreat(threat);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-text-primary hover:text-accent hover:bg-surface border border-border/70 hover:border-accent/40 transition-all cursor-pointer"
                        title="Inspect technical threat details"
                      >
                        <FiMaximize2 size={11} />
                        Inspect
                      </button>
                      {onExplainWithCopilot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExplainWithCopilot(threat);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-accent hover:bg-accent/15 border border-accent/30 hover:border-accent transition-all cursor-pointer shadow-2xs"
                          title="Explain this threat with AI Security Copilot"
                        >
                          <FiCpu size={11} />
                          Explain
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-border/60 bg-bg-elevated/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            Showing <strong className="text-text-primary">{startIndex + 1}</strong> - <strong className="text-text-primary">{endIndex}</strong> of <strong className="text-text-primary">{threats.length}</strong>
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-text-muted text-xs">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface text-text-primary text-xs font-mono border border-border/60 rounded px-2 py-1 focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded border border-border/60 text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
            aria-label="Previous page"
          >
            <FiChevronLeft size={14} />
          </button>

          <span className="px-3 py-1 text-xs font-mono text-text-secondary">
            Page <strong className="text-text-primary">{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded border border-border/60 text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
            aria-label="Next page"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
