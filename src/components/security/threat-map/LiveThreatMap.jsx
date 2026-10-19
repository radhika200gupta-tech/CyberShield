import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  FiMap, FiRefreshCw, FiWifiOff, FiCheckCircle, FiClock, 
  FiInfo, FiX, FiActivity, FiArrowRight, FiGlobe, FiAlertTriangle 
} from 'react-icons/fi';
import Button from '../../common/Button';
import InteractiveWorldMap from './InteractiveWorldMap';
import LocationThreatSelector from './LocationThreatSelector';
import ThreatMapStats from './ThreatMapStats';
import ThreatMapEventStream from './ThreatMapEventStream';
import ThreatMapInspector from './ThreatMapInspector';
import { fetchThreatIntelligenceFeed } from '../../../services/threatIntelService';
import { 
  enrichThreatsAsync, 
  getAvailableLocations, 
  filterThreatsByLocation, 
  getMapCameraForLocation 
} from '../../../services/geoThreatService';
import { setTransferredThreat } from '../../../services/imageHandoffService';
import { WORLD_MAP_PATH } from '../../common/WorldMapData';

export default function LiveThreatMap({ isCompact = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingThreat = location.state?.threatRecord;

  // Primary Threat Intel & Geolocation state
  const [threats, setThreats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTED' | 'ERROR' | 'CONNECTING'

  // Selected threat for inspector & marker focus
  const [selectedThreat, setSelectedThreat] = useState(incomingThreat || null);
  const [showHandoffBanner, setShowHandoffBanner] = useState(Boolean(incomingThreat));

  // Location Scope State ({ type: 'global' | 'country' | 'city', name, code, count })
  const [selectedLocation, setSelectedLocation] = useState({ type: 'global', name: 'Global View' });
  const [cameraTarget, setCameraTarget] = useState(null);

  /**
   * Load feed data from abuse.ch URLhaus and enrich with geolocation
   */
  const loadFeed = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setFetchError(null);

    try {
      const result = await fetchThreatIntelligenceFeed({ byteLimit: 65536 });
      if (result.success && result.data && result.data.length > 0) {
        // Enrich threat records with verified IP / domain geolocation
        const enriched = await enrichThreatsAsync(result.data, (progressBatch) => {
          setThreats(progressBatch);
        });

        setThreats(enriched);
        setLastFetchedAt(result.fetchedAt);
        setConnectionStatus('CONNECTED');

        setSelectedThreat(prev => {
          if (!prev && !incomingThreat && enriched.length > 0) {
            return enriched[0];
          }
          return prev;
        });
      } else {
        setConnectionStatus('ERROR');
        setFetchError(result.error || 'Failed to connect to URLhaus threat intelligence feed.');
      }
    } catch (err) {
      setConnectionStatus('ERROR');
      setFetchError(err.message || 'Network error: could not connect to threat intelligence feed.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [incomingThreat]);

  useEffect(() => {
    loadFeed(false);
  }, [loadFeed]);

  // Synchronize incoming threat passed via React Router navigation state
  useEffect(() => {
    if (incomingThreat) {
      setSelectedThreat(incomingThreat);
      setShowHandoffBanner(true);
    }
  }, [incomingThreat]);

  // Available locations aggregated from active dataset
  const availableLocations = useMemo(() => {
    return getAvailableLocations(threats);
  }, [threats]);

  // Filtered threats based on selected location scope
  const filteredThreats = useMemo(() => {
    return filterThreatsByLocation(threats, selectedLocation);
  }, [threats, selectedLocation]);

  // Location selection handler
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    const camera = getMapCameraForLocation(loc);
    setCameraTarget(camera);

    // If active threat is outside the selected location, switch to first matching
    const matching = filterThreatsByLocation(threats, loc);
    if (matching.length > 0 && selectedThreat && !matching.some(m => m.id === selectedThreat.id)) {
      setSelectedThreat(matching[0]);
    }
  };

  // Reset to Global View
  const handleClearLocation = () => {
    setSelectedLocation({ type: 'global', name: 'Global View' });
    setCameraTarget({ x: 0, y: 0, width: 800, height: 400, zoom: 1, label: 'Global View' });
  };

  // Select threat handler (from map marker or event stream)
  // Keeps marker firmly anchored at its geographic coordinates without forcing disorienting camera jumps
  const handleSelectThreat = (threat) => {
    setSelectedThreat(threat);
  };

  // Close details panel and clear selection
  const handleCloseThreat = () => {
    setSelectedThreat(null);
  };

  // Explain threat with Security Copilot handoff
  const handleExplainWithCopilot = (threat) => {
    if (!threat) return;
    setTransferredThreat(threat);
    navigate('/app/coming-soon/ai-copilot', {
      state: {
        threatRecord: threat,
        fromThreatMap: true
      }
    });
  };

  const formatLocalTime = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  // ==========================================
  // COMPACT MODE (for Dashboard Widget)
  // ==========================================
  if (isCompact) {
    const onlineCount = threats.filter(t => (t.evidence?.urlStatus || '').toLowerCase() === 'online').length;

    return (
      <div className="flex flex-col w-full h-full bg-[#101A27] rounded-xl relative overflow-hidden border border-[#223244] shadow-sm min-h-[280px]">
        <div className="relative w-full h-full min-h-[280px] bg-[#070B12] overflow-hidden">
          {/* Top HUD Badge */}
          <div className="absolute top-3 left-3 z-20 pointer-events-auto">
            <div className="bg-[#101A27]/90 backdrop-blur-md border border-[#223244] p-3 rounded-xl shadow-lg">
              <h4 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
                <FiActivity className="text-[#20D9D2]" size={14} /> Global Threat Telemetry
              </h4>
              <div className="flex gap-4 font-mono">
                <div>
                  <div className="text-[10px] text-[#A5B4C7] uppercase tracking-wider mb-0.5">URLhaus Indicators</div>
                  <div className="text-xl font-bold text-[#20D9D2] leading-none">{threats.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A5B4C7] uppercase tracking-wider mb-0.5">Online Hosts</div>
                  <div className="text-xl font-bold text-[#10B981] leading-none">{onlineCount}</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7] font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> Live URLhaus Feed Active
              </div>
            </div>
          </div>

          {/* View Full Threat Map Button */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
            <Link to="/app/coming-soon/threat-map">
              <Button variant="outline" className="text-xs py-1.5 px-3 bg-[#152334]/90 backdrop-blur-md shadow-lg border-[#20D9D2]/40 text-[#20D9D2] hover:bg-[#20D9D2]/10 font-semibold tracking-wider uppercase font-mono">
                View Full Threat Map <FiArrowRight className="ml-1.5" size={13} />
              </Button>
            </Link>
          </div>

          {/* SVG World Map Outline */}
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-80 z-10">
            <defs>
              <pattern id="dotGridCompact" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.6" fill="#20D9D2" opacity="0.15" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotGridCompact)" />
            <path d={WORLD_MAP_PATH} fill="#101A27" stroke="#20D9D2" strokeOpacity="0.3" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL SOC THREAT MAP DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto w-full min-w-0 pb-12 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#223244] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#20D9D2]/15 text-[#20D9D2] text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-[#20D9D2]/30 uppercase tracking-wider">
              SOC Threat Telemetry
            </span>
            <span className="text-xs text-[#A5B4C7] font-mono">
              Live Network Map & Infrastructure Telemetry
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F1F5F9] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#101A27] border border-[#223244] text-[#20D9D2] shadow-sm">
              <FiMap size={24} />
            </div>
            Live Cyber Threat Map
          </h1>

          <p className="text-sm sm:text-base text-[#A5B4C7] mt-2 max-w-3xl leading-relaxed">
            Real-time global visualization of malicious payload delivery infrastructure and synchronized threat telemetry from <strong>abuse.ch URLhaus</strong>.
          </p>
        </div>

        {/* Connection Status & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-[#101A27] border border-[#223244] p-3 rounded-xl shadow-sm self-start lg:self-auto font-mono">
          <div className="flex items-center gap-2 border-r border-[#223244] pr-3">
            {isLoading || isRefreshing ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-md border border-[#F59E0B]/20">
                <FiRefreshCw size={13} className="animate-spin text-[#F59E0B]" />
                Syncing Feed...
              </span>
            ) : connectionStatus === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md border border-[#10B981]/25">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Connected: URLhaus
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-md border border-[#EF4444]/25">
                <FiWifiOff size={13} className="text-[#EF4444]" />
                Feed Offline
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[#A5B4C7] uppercase tracking-wider flex items-center gap-1 justify-end font-medium">
              <FiClock size={11} /> Last Sync:
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#F1F5F9]">
              {formatLocalTime(lastFetchedAt)}
            </div>
          </div>

          <Button
            onClick={() => loadFeed(true)}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs font-semibold py-1.5 px-3 border-[#223244] hover:border-[#20D9D2] cursor-pointer"
            title="Fetch latest reported threat indicators"
          >
            <FiRefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#20D9D2]' : 'text-[#20D9D2]'} />
            <span className="ml-1.5 hidden sm:inline text-[#20D9D2]">Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. FORENSIC ATTRIBUTION NOTICE */}
      <div className="bg-[#101A27]/90 border border-[#223244] rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-[#A5B4C7] leading-relaxed shadow-sm">
        <FiInfo className="text-[#20D9D2] shrink-0 mt-0.5" size={17} />
        <div>
          <strong className="text-[#F1F5F9] font-semibold">Forensic Infrastructure Attribution: </strong>
          CyberShield plots confirmed hosting servers and IP infrastructure associated with reported malicious URLs. In accordance with forensic integrity standards, server locations represent physical data center and IP allocations, <strong>not</strong> the verified physical origin or nationality of the attacker. Indicators lacking verifiable IP geolocation remain unmapped to prevent speculative attribution.
        </div>
      </div>

      {/* 3. INCOMING THREAT HANDOFF BANNER (if navigated from Threat Intel) */}
      {showHandoffBanner && incomingThreat && (
        <div className="bg-[#20D9D2]/10 border border-[#20D9D2]/40 rounded-xl p-4 text-xs sm:text-sm text-[#F1F5F9] flex items-start justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#20D9D2]/20 text-[#20D9D2] shrink-0 mt-0.5">
              <FiCheckCircle size={16} />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-[#F1F5F9] block text-sm">
                Active Telemetry Focus: Record #{incomingThreat.id}
              </span>
              <p className="font-mono text-xs text-[#20D9D2] mt-0.5 truncate">
                {incomingThreat.indicator}
              </p>
              <p className="text-xs text-[#A5B4C7] mt-1 font-mono">
                Host: <code className="text-[#F1F5F9]">{incomingThreat.evidence?.host || 'endpoint'}</code> &bull; Assessed Severity: <strong className="text-[#F1F5F9]">{incomingThreat.severity}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHandoffBanner(false)}
            className="text-[#A5B4C7] hover:text-[#F1F5F9] p-1 rounded-lg hover:bg-[#152334] cursor-pointer shrink-0"
            title="Dismiss notice"
          >
            <FiX size={15} />
          </button>
        </div>
      )}

      {/* 4. LOCATION-BASED THREAT SELECTOR */}
      <LocationThreatSelector
        availableLocations={availableLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        onClearLocation={handleClearLocation}
      />

      {/* 5. SUMMARY STATISTICS GRID */}
      <ThreatMapStats
        threats={threats}
        filteredThreats={filteredThreats}
        selectedLocation={selectedLocation}
      />

      {/* 6. MAIN VISUAL FOCUS: INTERACTIVE SOC WORLD MAP */}
      <InteractiveWorldMap
        threats={filteredThreats}
        selectedThreat={selectedThreat}
        onSelectThreat={handleSelectThreat}
        cameraTarget={cameraTarget}
        onResetView={handleClearLocation}
        isLoading={isLoading || isRefreshing}
      />

      {/* 7. SYNCHRONIZED STREAM & TELEMETRY INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Event Stream */}
        <div className="lg:col-span-7">
          <ThreatMapEventStream
            threats={filteredThreats}
            selectedThreat={selectedThreat}
            onSelectThreat={handleSelectThreat}
            onExplainWithCopilot={handleExplainWithCopilot}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Right Column (5 cols): Telemetry Inspector */}
        <div className="lg:col-span-5">
          <ThreatMapInspector
            threat={selectedThreat}
            onClose={handleCloseThreat}
            onExplainWithCopilot={handleExplainWithCopilot}
          />
        </div>
      </div>
    </div>
  );
}
