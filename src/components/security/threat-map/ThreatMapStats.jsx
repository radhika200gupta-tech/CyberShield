import React, { useMemo } from 'react';
import { 
  FiDatabase, FiActivity, FiAlertTriangle, FiGlobe, FiMapPin, FiServer 
} from 'react-icons/fi';

export default function ThreatMapStats({
  threats = [],
  filteredThreats = [],
  selectedLocation = null
}) {
  const stats = useMemo(() => {
    // Current active dataset depending on whether location filter is active
    const activeSet = selectedLocation?.type !== 'global' ? filteredThreats : threats;

    const total = activeSet.length;
    const globalTotal = threats.length;
    
    // Online verified hosts
    const onlineCount = activeSet.filter(
      t => (t.evidence?.urlStatus || '').toLowerCase() === 'online'
    ).length;

    // High & Critical severity indicators
    const highCriticalCount = activeSet.filter(
      t => t.severity === 'Critical' || t.severity === 'High'
    ).length;

    // Unique host endpoints
    const uniqueHosts = new Set(
      activeSet.map(t => t.evidence?.host).filter(Boolean)
    ).size;

    // Geolocated hosting servers
    const geolocatedCount = activeSet.filter(t => t.isGeolocated).length;

    return {
      total,
      globalTotal,
      onlineCount,
      highCriticalCount,
      uniqueHosts,
      geolocatedCount
    };
  }, [threats, filteredThreats, selectedLocation]);

  const isLocationFiltered = selectedLocation && selectedLocation.type !== 'global';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Monitored Indicators Card */}
      <div className="bg-[#101A27] border border-[#223244] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#A5B4C7] uppercase tracking-wider font-mono">
            {isLocationFiltered ? 'Matching In Scope' : 'Monitored Indicators'}
          </span>
          <div className="p-2 rounded-lg bg-[#152334] text-[#20D9D2] border border-[#223244]">
            {isLocationFiltered ? <FiMapPin size={16} /> : <FiDatabase size={16} />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-[#20D9D2]">
            {stats.total.toLocaleString()}
          </span>
          {isLocationFiltered && (
            <span className="text-xs font-mono text-[#A5B4C7]">
              of {stats.globalTotal} global
            </span>
          )}
        </div>
        <span className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7]">
          {isLocationFiltered ? `Verified in ${selectedLocation.name}` : 'URLhaus community feed records'}
        </span>
      </div>

      {/* 2. Reported Online Card */}
      <div className="bg-[#101A27] border border-[#223244] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#A5B4C7] uppercase tracking-wider font-mono">
            Verified Online
          </span>
          <div className="p-2 rounded-lg bg-[#152334] text-[#10B981] border border-[#223244]">
            <FiActivity size={16} />
          </div>
        </div>
        <span className="text-2xl sm:text-3xl font-display font-bold text-[#10B981]">
          {stats.onlineCount.toLocaleString()}
        </span>
        <span className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7]">
          Reachable hosting endpoints
        </span>
      </div>

      {/* 3. High & Critical Severity Card */}
      <div className="bg-[#101A27] border border-[#223244] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#A5B4C7] uppercase tracking-wider font-mono">
            High & Critical Severity
          </span>
          <div className="p-2 rounded-lg bg-[#152334] text-[#EF4444] border border-[#223244]">
            <FiAlertTriangle size={16} />
          </div>
        </div>
        <span className="text-2xl sm:text-3xl font-display font-bold text-[#EF4444]">
          {stats.highCriticalCount.toLocaleString()}
        </span>
        <span className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7]">
          Internal heuristic classification
        </span>
      </div>

      {/* 4. Geolocated Hosting Infrastructure */}
      <div className="bg-[#101A27] border border-[#223244] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#A5B4C7] uppercase tracking-wider font-mono">
            Geolocated Hosting Nodes
          </span>
          <div className="p-2 rounded-lg bg-[#152334] text-[#56A6D9] border border-[#223244]">
            <FiServer size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-[#56A6D9]">
            {stats.geolocatedCount.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-[#A5B4C7]">
            ({stats.uniqueHosts} unique hosts)
          </span>
        </div>
        <span className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7]">
          Verified server coordinates
        </span>
      </div>
    </div>
  );
}
