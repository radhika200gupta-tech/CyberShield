import React, { useState } from 'react';
import { 
  FiShield, FiMapPin, FiGlobe, FiServer, FiActivity, FiCopy, 
  FiCheck, FiCpu, FiExternalLink, FiAlertTriangle, FiInfo, FiTag, FiX, FiClock 
} from 'react-icons/fi';
import Button from '../../common/Button';

export default function ThreatMapInspector({
  threat,
  onClose,
  onExplainWithCopilot
}) {
  const [copied, setCopied] = useState(false);

  if (!threat) {
    return (
      <div className="bg-[#101A27] border border-[#223244] rounded-2xl p-8 text-center text-[#A5B4C7] font-mono text-xs flex flex-col items-center justify-center min-h-[380px] shadow-sm">
        <FiShield size={36} className="text-[#A5B4C7]/30 mb-3" />
        <span className="font-semibold text-sm text-[#F1F5F9] mb-1">No Threat Indicator Selected</span>
        <span>Click any marker on the map or select an event from the stream to inspect forensic telemetry.</span>
      </div>
    );
  }

  const handleCopy = () => {
    if (threat?.indicator) {
      navigator.clipboard.writeText(threat.indicator);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const isOnline = (threat.evidence?.urlStatus || '').toLowerCase() === 'online';
  const indicatorType = threat.evidence?.isIpAddress ? 'IP Endpoint / Host' : 'Malicious URL';
  const categoryName = threat.threatType || threat.category || (threat.evidence?.fileExtension ? `${threat.evidence.fileExtension.toUpperCase()} Distribution` : 'Malicious Payload Delivery');
  const formattedTimestamp = threat.timestamp 
    ? new Date(threat.timestamp).toLocaleString() 
    : (threat.dateAdded || 'Recent telemetry feed ingest');

  return (
    <div className="bg-[#101A27] border border-[#223244] rounded-2xl overflow-hidden shadow-lg sticky top-6">
      {/* Inspector Header */}
      <div className="p-4 sm:p-5 border-b border-[#223244] bg-[#152334]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiShield className="text-[#20D9D2]" size={16} />
          <h3 className="text-sm sm:text-base font-bold text-[#F1F5F9] uppercase tracking-wide font-mono">
            Telemetry Inspector
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#A5B4C7] px-2 py-0.5 rounded bg-[#070B12] border border-[#223244]">
            ID #{threat.id}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#A5B4C7] hover:text-[#F1F5F9] p-1 rounded-lg hover:bg-[#101A27] transition-colors cursor-pointer"
              title="Close details and clear selection"
              aria-label="Close details"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-[640px] overflow-y-auto custom-scrollbar">
        
        {/* Indicator URL Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-[#A5B4C7] uppercase tracking-wider font-semibold">
              Reported Indicator ({indicatorType})
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] font-mono text-[#20D9D2] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <FiCheck size={11} className="text-[#10B981]" /> : <FiCopy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-3 rounded-xl bg-[#070B12] border border-[#223244] font-mono text-xs text-[#F1F5F9] break-all select-all leading-relaxed">
            {threat.indicator}
          </div>
        </div>

        {/* Threat Category & Provider Provenance */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#152334]/60 border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">Threat Category</span>
            <span className="text-[#F1F5F9] font-bold truncate block">
              {categoryName}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#152334]/60 border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">Intelligence Feed</span>
            <span className="text-[#20D9D2] font-semibold truncate block">
              abuse.ch URLhaus
            </span>
          </div>
        </div>

        {/* Severity & Heuristic Rationale */}
        <div className="p-3.5 rounded-xl bg-[#152334]/60 border border-[#223244] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#A5B4C7] uppercase tracking-wider font-semibold">
              Assessed Severity (Heuristic)
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider border ${getSeverityStyle(threat.severity)}`}>
              {threat.severity}
            </span>
          </div>
          <p className="text-xs text-[#A5B4C7] leading-relaxed">
            {threat.severityRationale || 'Derived from online status, hosting characteristics, and malware payload classification.'}
          </p>
        </div>

        {/* Timestamps & Online Status */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block flex items-center gap-1">
              <FiClock size={10} /> Observed Timestamp
            </span>
            <span className="text-[#F1F5F9] text-[11px] truncate block">
              {formattedTimestamp}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">URL Status</span>
            <span className={`font-semibold flex items-center gap-1.5 ${isOnline ? 'text-[#10B981]' : 'text-[#A5B4C7]'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981]' : 'bg-[#A5B4C7]'}`} />
              {threat.evidence?.urlStatus || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Geographic & Hosting Infrastructure Card */}
        <div className="p-3.5 rounded-xl bg-[#152334]/60 border border-[#223244] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#A5B4C7] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <FiServer className="text-[#20D9D2]" size={13} /> Hosting Infrastructure
            </span>
            {threat.isGeolocated ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Geolocated
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A5B4C7]/15 text-[#A5B4C7] border border-[#A5B4C7]/30">
                Unmapped
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#A5B4C7] uppercase block">Hosting Country</span>
              <span className="text-[#F1F5F9] font-bold">
                {threat.hostingCountry || 'Not available'}
                {threat.hostingCountryCode ? ` (${threat.hostingCountryCode})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#A5B4C7] uppercase block">City / Metro</span>
              <span className="text-[#F1F5F9] font-bold">
                {threat.hostingCity || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#A5B4C7] uppercase block">Coordinates</span>
              <span className="text-[#20D9D2]">
                {threat.latitude !== null && threat.longitude !== null 
                  ? `${threat.latitude.toFixed(3)}°, ${threat.longitude.toFixed(3)}°`
                  : 'Not plotted'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#A5B4C7] uppercase block">Hosting ASN / ISP</span>
              <span className="text-[#F1F5F9] truncate block">
                {threat.hostingAsn || (threat.evidence?.isIpAddress ? 'Autonomous System' : 'Domain Registrar')}
              </span>
            </div>
          </div>

          {/* Basis & Forensic Disclaimer */}
          <div className="mt-2 pt-2 border-t border-[#223244] text-[11px] text-[#A5B4C7] space-y-1">
            <div className="flex items-center gap-1.5 text-[#20D9D2]">
              <FiInfo size={12} className="shrink-0" />
              <span className="font-semibold">{threat.locationBasis}</span>
            </div>
            <p className="text-[#A5B4C7]/80 italic">
              {threat.locationDisclaimer}
            </p>
          </div>
        </div>

        {/* Network Evidence Technical Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">Host Endpoint</span>
            <span className="text-[#F1F5F9] font-semibold break-all">
              {threat.evidence?.host || 'Unknown'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#223244]">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">Destination Port</span>
            <span className="text-[#F1F5F9]">
              {threat.evidence?.port || (threat.evidence?.protocol === 'https' ? '443' : '80')}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#223244] col-span-2">
            <span className="text-[10px] text-[#A5B4C7] uppercase block">Payload Signature</span>
            <span className="text-[#EF4444] font-semibold">
              {threat.evidence?.fileExtension || 'Script / Executable / Redirect'}
            </span>
          </div>
        </div>

        {/* Threat Tags */}
        {threat.tags && threat.tags.length > 0 && (
          <div>
            <span className="text-[10px] font-mono text-[#A5B4C7] uppercase tracking-wider block mb-1.5 font-semibold">
              Community Threat Tags ({threat.tags.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {threat.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#152334] text-[#A5B4C7] border border-[#223244] flex items-center gap-1"
                >
                  <FiTag size={9} /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Forensic Telemetry Limitations Banner */}
        <div className="p-3 rounded-xl bg-[#070B12]/80 border border-[#223244] text-[11px] font-mono text-[#A5B4C7] space-y-1">
          <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
            <FiAlertTriangle size={12} />
            <span>Forensic Scope & Limitations</span>
          </div>
          <p className="text-[10px] leading-relaxed text-[#A5B4C7]/80">
            Telemetry indicates public server hosting infrastructure. Victim identity, lateral movement, physical operator coordinates, and specific breach impacts cannot be verified from public edge telemetry alone.
          </p>
        </div>

        {/* Bottom Actions: Explain with Copilot, URLhaus link & Close */}
        <div className="pt-3 border-t border-[#223244] flex flex-col gap-2">
          <Button
            onClick={() => onExplainWithCopilot(threat)}
            className="w-full py-2.5 bg-[#20D9D2] hover:bg-[#20D9D2]/90 text-[#070B12] font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiCpu size={14} /> Explain Threat with Copilot
          </Button>

          {threat.reportUrl && (
            <a
              href={threat.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[11px] font-mono text-[#A5B4C7] hover:text-[#20D9D2] flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <span>View Source Record on abuse.ch URLhaus</span>
              <FiExternalLink size={11} />
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-1.5 text-center text-xs font-mono text-[#A5B4C7] hover:text-[#F1F5F9] bg-[#152334]/50 hover:bg-[#152334] border border-[#223244] rounded-xl transition-colors cursor-pointer mt-1"
            >
              Close Details & Return to Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
