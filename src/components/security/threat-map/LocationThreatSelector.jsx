import React, { useState, useMemo } from 'react';
import { 
  FiGlobe, FiSearch, FiMapPin, FiX, FiCheck, FiLayers, FiAlertCircle 
} from 'react-icons/fi';

export default function LocationThreatSelector({
  availableLocations,
  selectedLocation,
  onSelectLocation,
  onClearLocation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filtered available countries and cities based on search query
  const filteredOptions = useMemo(() => {
    if (!availableLocations) {
      return { countries: [], cities: [] };
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return {
        countries: availableLocations.countries || [],
        cities: (availableLocations.cities || []).slice(0, 10)
      };
    }

    const matchedCountries = (availableLocations.countries || []).filter(c => 
      c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
    );

    const matchedCities = (availableLocations.cities || []).filter(c => 
      c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );

    return {
      countries: matchedCountries,
      cities: matchedCities
    };
  }, [availableLocations, searchQuery]);

  // Quick preset chips for top countries
  const topPresetCountries = useMemo(() => {
    return (availableLocations?.countries || []).slice(0, 5);
  }, [availableLocations]);

  const handleSelect = (item) => {
    onSelectLocation(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 1. TOP SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101A27] border border-[#223244] p-3 sm:p-4 rounded-xl shadow-md">
        
        {/* Left: Current Active Scope Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-[#152334] text-[#20D9D2] border border-[#223244]">
            {selectedLocation?.type === 'global' ? <FiGlobe size={18} /> : <FiMapPin size={18} />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A5B4C7] block">
              Active Geographic Scope
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[#F1F5F9] truncate">
                {selectedLocation?.type === 'global' ? 'Global Threat View' : selectedLocation?.name}
              </span>
              {selectedLocation?.type !== 'global' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#20D9D2]/15 text-[#20D9D2] border border-[#20D9D2]/30">
                  {selectedLocation?.count || 0} Indicators
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Searchable Dropdown & Clear Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {/* Location Search Dropdown Trigger */}
          <div className="relative flex-1 sm:w-64">
            <div 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-[#152334] border border-[#223244] hover:border-[#20D9D2]/50 rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] flex items-center justify-between cursor-pointer shadow-sm transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <FiSearch className="text-[#A5B4C7] shrink-0" size={13} />
                <span className="truncate text-[#A5B4C7]">
                  {selectedLocation?.type !== 'global' ? selectedLocation.name : 'Select Country or City...'}
                </span>
              </div>
              <span className="text-[10px] text-[#A5B4C7] bg-[#101A27] px-1.5 py-0.5 rounded border border-[#223244]">
                Browse
              </span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#101A27] border border-[#223244] rounded-xl shadow-2xl z-40 overflow-hidden animate-fade-in">
                {/* Search Input inside Dropdown */}
                <div className="p-2.5 border-b border-[#223244] bg-[#152334]/80">
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A5B4C7]" size={13} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Type country, code, or city..."
                      className="w-full bg-[#070B12] border border-[#223244] rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-[#F1F5F9] placeholder:text-[#A5B4C7]/60 focus:outline-none focus:border-[#20D9D2]"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Dropdown Options List */}
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                  {/* Reset to Global */}
                  <div
                    onClick={() => handleSelect({ type: 'global', name: 'Global View' })}
                    className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                      selectedLocation?.type === 'global' 
                        ? 'bg-[#20D9D2]/15 text-[#20D9D2] font-bold' 
                        : 'text-[#F1F5F9] hover:bg-[#152334]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FiGlobe size={14} className="text-[#20D9D2]" />
                      <span>Global View (All Locations)</span>
                    </div>
                    <span className="text-[11px] text-[#A5B4C7]">{availableLocations?.totalLoaded || 0}</span>
                  </div>

                  {/* Countries Section */}
                  {filteredOptions.countries.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A5B4C7] font-semibold">
                        Hosting Countries ({filteredOptions.countries.length})
                      </div>
                      {filteredOptions.countries.map(c => (
                        <div
                          key={`country-${c.code}`}
                          onClick={() => handleSelect({ type: 'country', name: c.name, code: c.code, count: c.count })}
                          className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                            selectedLocation?.type === 'country' && selectedLocation?.code === c.code
                              ? 'bg-[#20D9D2]/15 text-[#20D9D2] font-bold'
                              : 'text-[#F1F5F9] hover:bg-[#152334]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-[10px] text-[#A5B4C7] font-bold">{c.code}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152334] text-[#20D9D2] border border-[#223244]">
                            {c.count} {c.count === 1 ? 'node' : 'nodes'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cities Section */}
                  {filteredOptions.cities.length > 0 && (
                    <div className="pt-1 border-t border-[#223244]/60">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A5B4C7] font-semibold">
                        Verified Cities ({filteredOptions.cities.length})
                      </div>
                      {filteredOptions.cities.map(cty => (
                        <div
                          key={`city-${cty.name}-${cty.country}`}
                          onClick={() => handleSelect({ type: 'city', name: cty.name, country: cty.country, code: cty.code, count: cty.count })}
                          className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                            selectedLocation?.type === 'city' && selectedLocation?.name === cty.name
                              ? 'bg-[#20D9D2]/15 text-[#20D9D2] font-bold'
                              : 'text-[#F1F5F9] hover:bg-[#152334]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FiMapPin size={12} className="text-[#56A6D9]" />
                            <span>{cty.name}</span>
                            <span className="text-[10px] text-[#A5B4C7]">({cty.country})</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152334] text-[#56A6D9] border border-[#223244]">
                            {cty.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredOptions.countries.length === 0 && filteredOptions.cities.length === 0 && (
                    <div className="p-4 text-center text-xs font-mono text-[#A5B4C7]">
                      No active threat indicators match "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Scope Button (if not global) */}
          {selectedLocation?.type !== 'global' && (
            <button
              onClick={onClearLocation}
              className="p-2 rounded-lg bg-[#152334] hover:bg-[#223244] text-[#A5B4C7] hover:text-[#F1F5F9] border border-[#223244] transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
              title="Return to Global View"
            >
              <FiX size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. QUICK PRESET PILLS FOR TOP COUNTRIES */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-[#A5B4C7] uppercase tracking-wider font-semibold mr-1">
          Quick Filters:
        </span>

        {/* Global Pill */}
        <button
          onClick={() => handleSelect({ type: 'global', name: 'Global View' })}
          className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer transition-all border ${
            selectedLocation?.type === 'global'
              ? 'bg-[#20D9D2]/20 text-[#20D9D2] border-[#20D9D2] font-semibold'
              : 'bg-[#101A27] text-[#A5B4C7] border-[#223244] hover:border-[#20D9D2]/50 hover:text-[#F1F5F9]'
          }`}
        >
          All (Global)
        </button>

        {/* Top 5 Country Pills */}
        {topPresetCountries.map(c => (
          <button
            key={`preset-${c.code}`}
            onClick={() => handleSelect({ type: 'country', name: c.name, code: c.code, count: c.count })}
            className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer transition-all border flex items-center gap-1.5 ${
              selectedLocation?.type === 'country' && selectedLocation?.code === c.code
                ? 'bg-[#20D9D2]/20 text-[#20D9D2] border-[#20D9D2] font-semibold'
                : 'bg-[#101A27] text-[#A5B4C7] border-[#223244] hover:border-[#20D9D2]/50 hover:text-[#F1F5F9]'
            }`}
          >
            <span>{c.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#152334] text-[#20D9D2]">
              {c.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
