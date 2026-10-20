import React from 'react';
import { FiSearch, FiFilter, FiDownload, FiRotateCcw, FiX, FiCheck } from 'react-icons/fi';
import Button from '../../common/Button';

export default function ThreatFeedFilters({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  statusFilter,
  onStatusChange,
  tagFilter,
  onTagChange,
  availableTags = [],
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  onExportCsv,
  isExporting = false
}) {
  return (
    <div className="bg-surface/90 border border-border/80 rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-4">
      {/* Top row: Search Bar & Export Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search indicator URL, host IP, malware family, or reporter..."
            className="w-full bg-bg-elevated border border-border rounded-lg pl-10 pr-9 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              title="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-danger bg-danger/10 border border-danger/20 hover:bg-danger/20 transition-all cursor-pointer"
              title="Reset all active filters"
            >
              <FiRotateCcw size={13} />
              Reset Filters
            </button>
          )}

          <Button
            onClick={onExportCsv}
            variant="outline"
            size="sm"
            disabled={filteredCount === 0 || isExporting}
            className="text-xs font-semibold py-2 px-3 border-accent/40 text-accent hover:bg-accent/10 hover:border-accent"
            title="Export filtered records to sanitized CSV"
          >
            <FiDownload size={14} className="mr-1.5" />
            Export CSV ({filteredCount})
          </Button>
        </div>
      </div>

      {/* Bottom row: Filter Controls and Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-text-muted font-medium mr-1">
            <FiFilter size={14} className="text-accent" />
            <span>Filters:</span>
          </div>

          {/* Severity Select */}
          <div className="flex items-center gap-2 bg-bg-elevated/70 border border-border/70 rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Severity</span>
            <select
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-mono text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-surface text-text-primary">All Severities</option>
              <option value="CRITICAL" className="bg-surface text-danger font-semibold">Critical</option>
              <option value="HIGH" className="bg-surface text-danger font-semibold">High</option>
              <option value="MEDIUM" className="bg-surface text-warning font-semibold">Medium</option>
              <option value="LOW" className="bg-surface text-success font-semibold">Low</option>
            </select>
          </div>

          {/* Online/Offline Status Select */}
          <div className="flex items-center gap-2 bg-bg-elevated/70 border border-border/70 rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-mono text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-surface text-text-primary">All States</option>
              <option value="ONLINE" className="bg-surface text-success font-semibold">Online (Active)</option>
              <option value="OFFLINE" className="bg-surface text-text-muted">Offline</option>
            </select>
          </div>

          {/* Malware Tag Select */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2 bg-bg-elevated/70 border border-border/70 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tag</span>
              <select
                value={tagFilter}
                onChange={(e) => onTagChange(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-mono text-text-primary focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL" className="bg-surface text-text-primary">All Tags</option>
                {availableTags.slice(0, 15).map(tag => (
                  <option key={tag} value={tag} className="bg-surface text-text-primary">
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sort and Count */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 bg-bg-elevated/70 border border-border/70 rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-mono text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-surface text-text-primary">Newest Report</option>
              <option value="oldest" className="bg-surface text-text-primary">Oldest Report</option>
              <option value="severity_desc" className="bg-surface text-text-primary">Severity (High &rarr; Low)</option>
              <option value="severity_asc" className="bg-surface text-text-primary">Severity (Low &rarr; High)</option>
            </select>
          </div>

          <span className="text-xs sm:text-sm font-mono text-text-muted">
            Showing <strong className="text-text-primary">{filteredCount}</strong> of <span className="text-text-secondary">{totalCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
