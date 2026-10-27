import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiZap, FiRefreshCw, FiAlertTriangle, 
  FiClock, FiWifiOff, FiInfo 
} from 'react-icons/fi';
import Button from '../../common/Button';
import ThreatStatsCards from './ThreatStatsCards';
import ThreatFeedFilters from './ThreatFeedFilters';
import ThreatFeedTable from './ThreatFeedTable';
import ThreatDetailsDrawer from './ThreatDetailsDrawer';
import { 
  fetchThreatIntelligenceFeed, 
  calculateUniqueIndicators, 
  generateThreatCsv, 
  downloadCsvFile 
} from '../../../services/threatIntelService';
import { setTransferredThreat } from '../../../services/imageHandoffService';

export default function ThreatIntelligenceDashboard() {
  const navigate = useNavigate();
  // Feed state
  const [threats, setThreats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [providerLastUpdated, setProviderLastUpdated] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [feedSource, setFeedSource] = useState('Threat Telemetry Feed');
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTED' | 'ERROR' | 'CONNECTING'
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // In-flight request controller reference
  const abortControllerRef = useRef(null);

  // Selected threat for details drawer
  const [selectedThreat, setSelectedThreat] = useState(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // CSV export state
  const [isExporting, setIsExporting] = useState(false);

  // Periodic clock update for staleness check
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch once on mount with cleanup
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchThreatIntelligenceFeed({ 
      byteLimit: 65536,
      signal: controller.signal
    }).then(result => {
      if (!isMounted) return;
      if (result.success && result.data && result.data.length > 0) {
        setThreats(result.data);
        setProviderLastUpdated(result.providerLastUpdated);
        setLastFetchedAt(result.fetchedAt);
        setFeedSource(result.sourceName || 'Threat Telemetry Feed');
        setConnectionStatus('CONNECTED');
        setFetchError(null);
      } else if (result.success && result.isGenuinelyEmpty) {
        setThreats([]);
        setProviderLastUpdated(result.providerLastUpdated);
        setLastFetchedAt(result.fetchedAt);
        setFeedSource(result.sourceName || 'Threat Telemetry Feed');
        setConnectionStatus('CONNECTED');
        setFetchError(null);
      } else {
        setConnectionStatus('ERROR');
        setFetchError(result.error || 'Failed to retrieve genuine threat feed.');
      }
    }).catch(err => {
      if (!isMounted || err.name === 'AbortError') return;
      setConnectionStatus('ERROR');
      setFetchError(err.message || 'Network error: could not connect to threat intelligence feed.');
    }).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  /**
   * Manual refresh triggered by user action
   */
  const handleRefresh = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRefreshing(true);
    setFetchError(null);

    try {
      const result = await fetchThreatIntelligenceFeed({ 
        byteLimit: 65536,
        signal: controller.signal
      });

      if (result.success && result.data && result.data.length > 0) {
        setThreats(result.data);
        setProviderLastUpdated(result.providerLastUpdated);
        setLastFetchedAt(result.fetchedAt);
        setFeedSource(result.sourceName || 'Threat Telemetry Feed');
        setConnectionStatus('CONNECTED');
        setFetchError(null);
      } else if (result.success && result.isGenuinelyEmpty) {
        setThreats([]);
        setProviderLastUpdated(result.providerLastUpdated);
        setLastFetchedAt(result.fetchedAt);
        setFeedSource(result.sourceName || 'Threat Telemetry Feed');
        setConnectionStatus('CONNECTED');
        setFetchError(null);
      } else {
        setConnectionStatus('ERROR');
        setFetchError(result.error || 'Failed to retrieve genuine threat feed.');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setConnectionStatus('ERROR');
      setFetchError(err.message || 'Network error: could not connect to threat intelligence feed.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSeverityChange = (sev) => {
    setSeverityFilter(sev);
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTagChange = (tag) => {
    setTagFilter(tag);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  /**
   * Extract all unique tags across the loaded threat feed
   */
  const availableTags = useMemo(() => {
    const tagCount = new Map();
    threats.forEach(t => {
      (t.tags || []).forEach(tag => {
        const cleanTag = String(tag).trim();
        if (!cleanTag) return;
        const count = tagCount.get(cleanTag) || 0;
        tagCount.set(cleanTag, count + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }, [threats]);

  /**
   * Filter and sort the loaded dataset
   */
  const filteredThreats = useMemo(() => {
    let result = [...threats];

    // Search query filter (indicator, host, reporter, tags, category, type)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const matchUrl = (item.indicator || '').toLowerCase().includes(q);
        const matchHost = (item.evidence?.host || '').toLowerCase().includes(q);
        const matchReporter = (item.evidence?.reporter || '').toLowerCase().includes(q);
        const matchTags = (item.tags || []).some(t => t.toLowerCase().includes(q));
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        const matchType = (item.indicatorType || '').toLowerCase().includes(q);
        return matchUrl || matchHost || matchReporter || matchTags || matchCategory || matchType;
      });
    }

    // Severity filter
    if (severityFilter !== 'ALL') {
      result = result.filter(item => (item.severity || '').toUpperCase() === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(item => {
        const itemStatus = (item.evidence?.urlStatus || '').toUpperCase();
        return itemStatus === statusFilter;
      });
    }

    // Tag filter
    if (tagFilter !== 'ALL') {
      result = result.filter(item => (item.tags || []).includes(tagFilter));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.firstSeen || 0) - new Date(a.firstSeen || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.firstSeen || 0) - new Date(b.firstSeen || 0);
      }
      if (sortBy === 'severity_desc') {
        const score = (s) => (s === 'Critical' ? 4 : s === 'High' ? 3 : s === 'Medium' ? 2 : 1);
        return score(b.severity) - score(a.severity);
      }
      if (sortBy === 'severity_asc') {
        const score = (s) => (s === 'Critical' ? 4 : s === 'High' ? 3 : s === 'Medium' ? 2 : 1);
        return score(a.severity) - score(b.severity);
      }
      return 0;
    });

    return result;
  }, [threats, searchQuery, severityFilter, statusFilter, tagFilter, sortBy]);

  // Statistics derived dynamically from loaded dataset
  const stats = useMemo(() => {
    const totalReports = threats.length;
    const uniqueIndicators = calculateUniqueIndicators(threats);
    const highSeverityCount = threats.filter(
      t => t.severity === 'Critical' || t.severity === 'High'
    ).length;
    const onlineCount = threats.filter(
      t => (t.evidence?.urlStatus || '').toLowerCase() === 'online'
    ).length;

    return {
      totalReports,
      uniqueIndicators,
      highSeverityCount,
      onlineCount
    };
  }, [threats]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    severityFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    tagFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setTagFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  /**
   * Safe CSV Export of filtered records
   */
  const handleExportCsv = () => {
    if (filteredThreats.length === 0) return;
    setIsExporting(true);
    try {
      const csvData = generateThreatCsv(filteredThreats);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadCsvFile(csvData, `cybershield_threat_intel_${timestamp}.csv`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Check if data is stale (> 15 minutes old)
  const isStale = useMemo(() => {
    if (!lastFetchedAt) return false;
    const ageMs = currentTime - new Date(lastFetchedAt).getTime();
    return ageMs > 15 * 60 * 1000;
  }, [lastFetchedAt, currentTime]);

  const formatLocalTime = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  /**
   * Directly hand off a threat from the table to AI Copilot
   */
  const handleExplainWithCopilot = (threat) => {
    if (!threat) return;
    setTransferredThreat(threat);
    navigate('/app/coming-soon/ai-copilot', {
      state: {
        threatRecord: threat,
        fromThreatIntel: true
      }
    });
  };

  const isUrlhaus = feedSource.toLowerCase().includes('urlhaus');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto w-full min-w-0 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-accent/15 text-accent text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-accent/30 uppercase tracking-wider">
              SOC Threat Intelligence
            </span>
            <span className="text-xs text-text-muted font-mono">
              Live Community Feed
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-bg-elevated border border-border text-accent shadow-sm">
              <FiZap size={24} />
            </div>
            Real-Time Threat Intelligence
          </h1>

          <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-3xl leading-relaxed">
            Live aggregated intelligence feed of reported malicious URLs, malware distribution points, and botnet command nodes from <strong>{feedSource}</strong>.
          </p>
        </div>

        {/* Source Status & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-surface/80 border border-border p-3 rounded-xl shadow-sm self-start lg:self-auto">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 border-r border-border/70 pr-3">
            {isLoading || isRefreshing ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-md border border-warning/20">
                <FiRefreshCw size={13} className="animate-spin text-warning" />
                Fetching Feed...
              </span>
            ) : connectionStatus === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-success bg-success/10 px-2.5 py-1 rounded-md border border-success/25" title={`Connected to ${feedSource}`}>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Connected: {isUrlhaus ? 'URLhaus' : 'Community Feed'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-danger bg-danger/10 px-2.5 py-1 rounded-md border border-danger/25" title="Feed connection offline or failed">
                <FiWifiOff size={13} className="text-danger" />
                Feed Offline
              </span>
            )}
          </div>

          {/* Sync Time Information */}
          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1 justify-end font-medium">
              <FiClock size={12} /> Last Sync:
            </div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-text-primary">
              {formatLocalTime(lastFetchedAt)}
            </div>
          </div>

          {/* Stale Data Warning */}
          {isStale && connectionStatus === 'CONNECTED' && (
            <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/30" title="Data fetched more than 15 minutes ago">
              Stale (&gt;15m)
            </span>
          )}

          {/* Refresh Action Button */}
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs font-semibold py-1.5 px-3 border-border hover:border-accent cursor-pointer"
            title="Fetch latest reported threat indicators"
          >
            <FiRefreshCw size={14} className={isRefreshing ? 'animate-spin text-accent' : 'text-accent'} />
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Scope Clarification & Attribution Notice */}
      <div className="bg-bg-elevated/60 border border-border/80 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
        <FiInfo className="text-accent shrink-0 mt-0.5" size={17} />
        <div>
          <strong className="text-text-primary font-semibold">Community Threat Telemetry Notice: </strong>
          This dashboard displays global reported threat intelligence from <strong>{feedSource}</strong>. These indicators represent external malicious payloads and botnet infrastructure tracked across the internet, not direct attacks or intrusions detected on your device.
          {providerLastUpdated && (
            <span className="block mt-1.5 font-mono text-xs text-text-muted">
              Official Provider Feed Snapshot: <strong>{providerLastUpdated}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Connection Error Banner with Retry */}
      {fetchError && threats.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <FiAlertTriangle className="text-danger shrink-0 mt-0.5" size={16} />
            <div>
              <strong className="text-danger font-semibold block">Threat Feed Refresh Failed</strong>
              <span className="text-text-secondary">{fetchError}</span>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="danger"
            size="sm"
            className="text-xs shrink-0 cursor-pointer"
          >
            <FiRefreshCw size={12} className="mr-1.5" /> Retry Retrieval
          </Button>
        </div>
      )}

      {/* THREAT STATISTICS CARDS */}
      <ThreatStatsCards
        totalReports={stats.totalReports}
        uniqueIndicators={stats.uniqueIndicators}
        highSeverityCount={stats.highSeverityCount}
        onlineCount={stats.onlineCount}
        lastUpdatedTime={providerLastUpdated}
        sourceName={feedSource}
      />

      {/* SEARCH, FILTER & SORT CONTROLS */}
      <ThreatFeedFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        severityFilter={severityFilter}
        onSeverityChange={handleSeverityChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        tagFilter={tagFilter}
        onTagChange={handleTagChange}
        availableTags={availableTags}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={threats.length}
        filteredCount={filteredThreats.length}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* THREAT FEED TABLE */}
      {isLoading ? (
        <div className="bg-surface/90 border border-border/80 rounded-xl p-16 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-text-primary">Loading Genuine Threat Intelligence...</p>
          <p className="text-xs text-text-muted mt-1">Connecting to live community threat telemetry feeds</p>
        </div>
      ) : fetchError && threats.length === 0 ? (
        <div className="bg-surface/90 border border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger mb-4 shadow-sm">
            <FiAlertTriangle size={26} />
          </div>
          <h4 className="text-base font-semibold text-text-primary mb-1">
            Unable to Load Threat Intelligence Feed
          </h4>
          <p className="text-xs text-text-muted max-w-md mb-4 leading-relaxed">
            {fetchError}
          </p>
          <Button
            onClick={handleRefresh}
            variant="danger"
            size="sm"
            className="text-xs font-semibold py-2 px-4 cursor-pointer"
          >
            <FiRefreshCw size={13} className="mr-1.5" />
            Retry Connection
          </Button>
        </div>
      ) : (
        <ThreatFeedTable
          threats={filteredThreats}
          selectedThreatId={selectedThreat?.id}
          onSelectThreat={(threat) => setSelectedThreat(threat)}
          onExplainWithCopilot={handleExplainWithCopilot}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* DETAILS DRAWER / INSPECTION MODAL */}
      <ThreatDetailsDrawer
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />

    </div>
  );
}
