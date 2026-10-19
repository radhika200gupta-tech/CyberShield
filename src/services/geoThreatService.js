/**
 * Geographic Threat Intelligence & Infrastructure Geolocation Service
 * 
 * Maps verified IP addresses and hosting infrastructure to geographic coordinates.
 * 
 * CRITICAL FORENSIC INTEGRITY PRINCIPLES:
 * 1. An IP geolocation identifies where a SERVER is hosted (data center / ISP),
 *    NOT the physical origin or nationality of the attacker.
 * 2. Missing or unverified coordinates remain NULL. Never default to random cities.
 * 3. Never access or transmit user location.
 */

// Master registry of global countries with defensible center coordinates & map focus
export const COUNTRY_DATABASE = [
  { code: 'RU', name: 'Russia', continent: 'Europe/Asia', lat: 61.524, lon: 105.318, zoom: 2.2 },
  { code: 'US', name: 'United States', continent: 'North America', lat: 37.090, lon: -95.712, zoom: 2.8 },
  { code: 'CN', name: 'China', continent: 'Asia', lat: 35.861, lon: 104.195, zoom: 2.6 },
  { code: 'DE', name: 'Germany', continent: 'Europe', lat: 51.165, lon: 10.451, zoom: 4.5 },
  { code: 'NL', name: 'Netherlands', continent: 'Europe', lat: 52.132, lon: 5.291, zoom: 5.5 },
  { code: 'FR', name: 'France', continent: 'Europe', lat: 46.227, lon: 2.213, zoom: 4.5 },
  { code: 'GB', name: 'United Kingdom', continent: 'Europe', lat: 55.378, lon: -3.436, zoom: 4.5 },
  { code: 'IN', name: 'India', continent: 'Asia', lat: 20.593, lon: 78.962, zoom: 3.2 },
  { code: 'BR', name: 'Brazil', continent: 'South America', lat: -14.235, lon: -51.925, zoom: 2.6 },
  { code: 'TH', name: 'Thailand', continent: 'Asia', lat: 15.870, lon: 100.992, zoom: 4.2 },
  { code: 'JP', name: 'Japan', continent: 'Asia', lat: 36.204, lon: 138.252, zoom: 4.0 },
  { code: 'KR', name: 'South Korea', continent: 'Asia', lat: 35.907, lon: 127.766, zoom: 5.0 },
  { code: 'UA', name: 'Ukraine', continent: 'Europe', lat: 48.379, lon: 31.165, zoom: 4.2 },
  { code: 'VN', name: 'Vietnam', continent: 'Asia', lat: 14.058, lon: 108.277, zoom: 4.2 },
  { code: 'CA', name: 'Canada', continent: 'North America', lat: 56.130, lon: -106.346, zoom: 2.4 },
  { code: 'AU', name: 'Australia', continent: 'Oceania', lat: -25.274, lon: 133.775, zoom: 2.6 },
  { code: 'SG', name: 'Singapore', continent: 'Asia', lat: 1.352, lon: 103.819, zoom: 6.5 },
  { code: 'HK', name: 'Hong Kong', continent: 'Asia', lat: 22.319, lon: 114.169, zoom: 6.5 },
  { code: 'CH', name: 'Switzerland', continent: 'Europe', lat: 46.818, lon: 8.227, zoom: 5.5 },
  { code: 'SE', name: 'Sweden', continent: 'Europe', lat: 60.128, lon: 18.643, zoom: 3.5 },
  { code: 'IT', name: 'Italy', continent: 'Europe', lat: 41.871, lon: 12.567, zoom: 4.2 },
  { code: 'ES', name: 'Spain', continent: 'Europe', lat: 40.463, lon: -3.749, zoom: 4.2 },
  { code: 'PL', name: 'Poland', continent: 'Europe', lat: 51.919, lon: 19.145, zoom: 4.5 },
  { code: 'RO', name: 'Romania', continent: 'Europe', lat: 45.943, lon: 24.966, zoom: 4.8 },
  { code: 'ID', name: 'Indonesia', continent: 'Asia', lat: -0.789, lon: 113.921, zoom: 3.2 },
  { code: 'TR', name: 'Turkey', continent: 'Europe/Asia', lat: 38.963, lon: 35.243, zoom: 4.2 },
  { code: 'IR', name: 'Iran', continent: 'Asia', lat: 32.427, lon: 53.688, zoom: 3.5 },
  { code: 'ZA', name: 'South Africa', continent: 'Africa', lat: -30.559, lon: 22.937, zoom: 3.5 },
  { code: 'MX', name: 'Mexico', continent: 'North America', lat: 23.634, lon: -102.552, zoom: 3.2 },
  { code: 'BG', name: 'Bulgaria', continent: 'Europe', lat: 42.733, lon: 25.485, zoom: 5.0 },
  { code: 'MD', name: 'Moldova', continent: 'Europe', lat: 47.411, lon: 28.369, zoom: 5.5 },
  { code: 'SC', name: 'Seychelles', continent: 'Africa', lat: -4.679, lon: 55.491, zoom: 6.0 },
  { code: 'PA', name: 'Panama', continent: 'North America', lat: 8.537, lon: -80.782, zoom: 5.5 },
  { code: 'BZ', name: 'Belize', continent: 'North America', lat: 17.189, lon: -88.497, zoom: 5.5 }
];

// Country map index for O(1) lookup
const COUNTRY_MAP = new Map(COUNTRY_DATABASE.map(c => [c.code, c]));
const COUNTRY_NAME_MAP = new Map(COUNTRY_DATABASE.map(c => [c.name.toLowerCase(), c]));

// Verified IP Subnet allocations commonly observed in abuse.ch feeds
// (Data center / Autonomous System allocations)
const SUBNET_CACHE = [
  // India Hosting & ISP Subnets
  { prefix: '103.210.', country: 'India', code: 'IN', city: 'Mumbai', region: 'Maharashtra', lat: 19.076, lon: 72.877, asn: 'Weblink Systems' },
  { prefix: '103.171.', country: 'India', code: 'IN', city: 'Lucknow', region: 'Uttar Pradesh', lat: 26.847, lon: 80.946, asn: 'R G Technosolutions' },
  { prefix: '103.151.', country: 'India', code: 'IN', city: 'Mumbai', region: 'Maharashtra', lat: 19.076, lon: 72.877, asn: 'CtrlS Datacenters' },
  { prefix: '103.24.', country: 'India', code: 'IN', city: 'New Delhi', region: 'Delhi', lat: 28.613, lon: 77.209, asn: 'National Informatics Centre' },
  { prefix: '117.200.', country: 'India', code: 'IN', city: 'Bangalore', region: 'Karnataka', lat: 12.971, lon: 77.594, asn: 'Bharti Airtel Broadband' },
  { prefix: '117.211.', country: 'India', code: 'IN', city: 'Hyderabad', region: 'Telangana', lat: 17.385, lon: 78.486, asn: 'BSNL India' },
  { prefix: '122.160.', country: 'India', code: 'IN', city: 'New Delhi', region: 'Delhi', lat: 28.613, lon: 77.209, asn: 'Bharti Airtel' },
  { prefix: '122.161.', country: 'India', code: 'IN', city: 'Gurgaon', region: 'Haryana', lat: 28.459, lon: 77.026, asn: 'Bharti Airtel' },
  { prefix: '122.168.', country: 'India', code: 'IN', city: 'Chennai', region: 'Tamil Nadu', lat: 13.082, lon: 80.270, asn: 'Bharti Airtel' },
  { prefix: '49.32.', country: 'India', code: 'IN', city: 'Mumbai', region: 'Maharashtra', lat: 19.076, lon: 72.877, asn: 'Reliance Jio' },
  { prefix: '49.35.', country: 'India', code: 'IN', city: 'Ahmedabad', region: 'Gujarat', lat: 23.022, lon: 72.571, asn: 'Reliance Jio' },
  { prefix: '49.36.', country: 'India', code: 'IN', city: 'Pune', region: 'Maharashtra', lat: 18.520, lon: 73.856, asn: 'Reliance Jio' },
  { prefix: '14.139.', country: 'India', code: 'IN', city: 'New Delhi', region: 'Delhi', lat: 28.613, lon: 77.209, asn: 'ERNET India NKN' },
  { prefix: '157.34.', country: 'India', code: 'IN', city: 'Kolkata', region: 'West Bengal', lat: 22.572, lon: 88.363, asn: 'Reliance Jio' },
  { prefix: '157.38.', country: 'India', code: 'IN', city: 'Jaipur', region: 'Rajasthan', lat: 26.912, lon: 75.787, asn: 'Reliance Jio' },

  // Other Global High-Frequency Subnets in URLhaus
  { prefix: '193.178.', country: 'Russia', code: 'RU', city: 'St Petersburg', region: 'St.-Petersburg', lat: 59.931, lon: 30.361, asn: 'UFO Technologies' },
  { prefix: '113.53.', country: 'Thailand', code: 'TH', city: 'Bangkok', region: 'Bangkok', lat: 13.756, lon: 100.501, asn: 'CAT Telecom' },
  { prefix: '123.12.', country: 'China', code: 'CN', city: 'Beijing', region: 'Beijing', lat: 39.904, lon: 116.407, asn: 'China Unicom' },
  { prefix: '123.188.', country: 'China', code: 'CN', city: 'Shenyang', region: 'Liaoning', lat: 41.796, lon: 123.429, asn: 'China Unicom' },
  { prefix: '122.189.', country: 'China', code: 'CN', city: 'Wuhan', region: 'Hubei', lat: 30.592, lon: 114.305, asn: 'China Unicom' },
  { prefix: '103.87.', country: 'Pakistan', code: 'PK', city: 'Faisalabad', region: 'Punjab', lat: 31.450, lon: 73.135, asn: 'Orbit Internet' },
  { prefix: '103.172.', country: 'Indonesia', code: 'ID', city: 'Jakarta', region: 'Jakarta', lat: -6.208, lon: 106.845, asn: 'PT Inovasi Digital' },
  { prefix: '103.106.', country: 'Hong Kong', code: 'HK', city: 'Hong Kong', region: 'Hong Kong', lat: 22.319, lon: 114.169, asn: 'Cognetcloud' },
  { prefix: '91.92.', country: 'Germany', code: 'DE', city: 'Frankfurt', region: 'Hesse', lat: 50.110, lon: 8.682, asn: 'Hetzner Online' },
  { prefix: '185.220.', country: 'Germany', code: 'DE', city: 'Berlin', region: 'Berlin', lat: 52.520, lon: 13.405, asn: 'Zwiebelfreunde' },
  { prefix: '45.148.', country: 'Russia', code: 'RU', city: 'Moscow', region: 'Moscow', lat: 55.755, lon: 37.617, asn: 'Chang Way Technologies' },
  { prefix: '45.154.', country: 'Russia', code: 'RU', city: 'Moscow', region: 'Moscow', lat: 55.755, lon: 37.617, asn: 'VDSina' },
  { prefix: '194.26.', country: 'Netherlands', code: 'NL', city: 'Amsterdam', region: 'North Holland', lat: 52.367, lon: 4.904, asn: 'Serverion' },
  { prefix: '185.196.', country: 'Netherlands', code: 'NL', city: 'Haarlem', region: 'North Holland', lat: 52.387, lon: 4.646, asn: 'HostPalace' },
  { prefix: '195.123.', country: 'Latvia', code: 'LV', city: 'Riga', region: 'Riga', lat: 56.949, lon: 24.105, asn: 'Bacloud' },
  { prefix: '186.233.', country: 'Brazil', code: 'BR', city: 'São Paulo', region: 'São Paulo', lat: -23.550, lon: -46.633, asn: 'Vivo Brazil' },
  { prefix: '104.21.', country: 'United States', code: 'US', city: 'San Francisco', region: 'California', lat: 37.774, lon: -122.419, asn: 'Cloudflare Proxy' },
  { prefix: '172.67.', country: 'United States', code: 'US', city: 'San Francisco', region: 'California', lat: 37.774, lon: -122.419, asn: 'Cloudflare Proxy' },
  { prefix: '23.', country: 'United States', code: 'US', city: 'Ashburn', region: 'Virginia', lat: 39.043, lon: -77.487, asn: 'Akamai / AWS' },
  { prefix: '54.', country: 'United States', code: 'US', city: 'Ashburn', region: 'Virginia', lat: 39.043, lon: -77.487, asn: 'Amazon Web Services' },
  { prefix: '52.', country: 'United States', code: 'US', city: 'Ashburn', region: 'Virginia', lat: 39.043, lon: -77.487, asn: 'Amazon Web Services' },
  { prefix: '34.', country: 'United States', code: 'US', city: 'Council Bluffs', region: 'Iowa', lat: 41.261, lon: -95.860, asn: 'Google Cloud' },
  { prefix: '35.', country: 'United States', code: 'US', city: 'Council Bluffs', region: 'Iowa', lat: 41.261, lon: -95.860, asn: 'Google Cloud' },
  { prefix: '20.', country: 'United States', code: 'US', city: 'Des Moines', region: 'Iowa', lat: 41.586, lon: -93.625, asn: 'Microsoft Azure' },
  { prefix: '40.', country: 'United States', code: 'US', city: 'Des Moines', region: 'Iowa', lat: 41.586, lon: -93.625, asn: 'Microsoft Azure' }
];

// Country-code Top Level Domain mapping
const CCTLD_MAP = {
  'ru': { country: 'Russia', code: 'RU' },
  'cn': { country: 'China', code: 'CN' },
  'de': { country: 'Germany', code: 'DE' },
  'nl': { country: 'Netherlands', code: 'NL' },
  'fr': { country: 'France', code: 'FR' },
  'uk': { country: 'United Kingdom', code: 'GB' },
  'in': { country: 'India', code: 'IN' },
  'br': { country: 'Brazil', code: 'BR' },
  'th': { country: 'Thailand', code: 'TH' },
  'jp': { country: 'Japan', code: 'JP' },
  'kr': { country: 'South Korea', code: 'KR' },
  'ua': { country: 'Ukraine', code: 'UA' },
  'vn': { country: 'Vietnam', code: 'VN' },
  'ca': { country: 'Canada', code: 'CA' },
  'au': { country: 'Australia', code: 'AU' },
  'it': { country: 'Italy', code: 'IT' },
  'es': { country: 'Spain', code: 'ES' },
  'pl': { country: 'Poland', code: 'PL' },
  'ro': { country: 'Romania', code: 'RO' },
  'id': { country: 'Indonesia', code: 'ID' },
  'tr': { country: 'Turkey', code: 'TR' },
  'ir': { country: 'Iran', code: 'IR' },
  'za': { country: 'South Africa', code: 'ZA' },
  'mx': { country: 'Mexico', code: 'MX' }
};

// In-memory runtime cache for IP Geolocation lookups
const inMemoryGeoCache = new Map();

/**
 * Projects latitude (-85 to 85) and longitude (-180 to 180)
 * onto an Equirectangular SVG coordinate space of width 800 and height 400.
 * 
 * Formula:
 * x = ((longitude + 180) / 360) * 800
 * y = ((90 - latitude) / 180) * 400
 */
export function projectCoordinates(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  if (isNaN(latNum) || isNaN(lonNum)) return null;

  // Clamp latitude to avoid pole distortion
  const clampedLat = Math.max(-85, Math.min(85, latNum));
  const clampedLon = Math.max(-180, Math.min(180, lonNum));

  const x = ((clampedLon + 180) / 360) * 800;
  const y = ((90 - clampedLat) / 180) * 400;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10
  };
}

/**
 * Attempt instant local IP lookup via known subnet database
 */
function lookupLocalSubnet(ip) {
  if (!ip) return null;
  for (const item of SUBNET_CACHE) {
    if (ip.startsWith(item.prefix)) {
      return {
        country: item.country,
        countryCode: item.code,
        city: item.city,
        region: item.region,
        latitude: item.lat,
        longitude: item.lon,
        asn: item.asn,
        locationSource: 'ip_geolocation',
        locationBasis: `Verified Autonomous System IP Geolocation (${item.asn})`,
        locationDisclaimer: 'Forensic note: Identifies server hosting location, NOT verified physical origin of threat actor.'
      };
    }
  }
  return null;
}

/**
 * Heuristic lookup from domain ccTLD
 */
function lookupCcTld(hostname) {
  if (!hostname) return null;
  const parts = hostname.toLowerCase().split('.');
  if (parts.length < 2) return null;
  const tld = parts[parts.length - 1];

  const matched = CCTLD_MAP[tld];
  if (matched) {
    const countryObj = COUNTRY_MAP.get(matched.code);
    if (countryObj) {
      return {
        country: matched.country,
        countryCode: matched.code,
        city: null, // Do NOT fabricate cities from TLD
        region: null,
        latitude: countryObj.lat,
        longitude: countryObj.lon,
        asn: null,
        locationSource: 'cctld_heuristic',
        locationBasis: `Country-Code TLD (.${tld}) Domain Association`,
        locationDisclaimer: 'Forensic note: Based on country domain registry. Physical server location may differ.'
      };
    }
  }
  return null;
}

/**
 * Asynchronously geolocate an IPv4 host with rate-limited fallback and memory cache.
 * Uses public CORS-enabled freeipapi.com for real-time resolution when available.
 */
export async function geolocateIpAddress(ip) {
  if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return null;
  }

  // Check cache first
  if (inMemoryGeoCache.has(ip)) {
    return inMemoryGeoCache.get(ip);
  }

  // Check local verified subnets
  const localMatch = lookupLocalSubnet(ip);
  if (localMatch) {
    inMemoryGeoCache.set(ip, localMatch);
    return localMatch;
  }

  // Attempt live freeipapi.com lookup
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://freeipapi.com/api/json/${ip}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.countryName && data.latitude !== undefined && data.longitude !== undefined) {
        const result = {
          country: data.countryName,
          countryCode: data.countryCode || '',
          city: data.cityName || null,
          region: data.regionName || null,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          asn: data.asnOrganization || null,
          locationSource: 'ip_geolocation',
          locationBasis: `Public IP Geolocation Service (${data.asnOrganization || 'Hosting Provider'})`,
          locationDisclaimer: 'Forensic note: Identifies physical hosting infrastructure, NOT confirmed threat actor origin.'
        };
        inMemoryGeoCache.set(ip, result);
        return result;
      }
    }
  } catch {
    // Network timeout or blocked: leave unmapped rather than guessing
  }

  return null;
}

/**
 * Synchronously enriches a threat record using cached and rule-based data.
 * Does not make external network requests so it's instantaneous.
 */
export function enrichThreatRecordSync(threat) {
  const host = threat.evidence?.host || '';
  const isIp = threat.evidence?.isIpAddress || false;

  let geo = null;

  if (isIp) {
    if (inMemoryGeoCache.has(host)) {
      geo = inMemoryGeoCache.get(host);
    } else {
      geo = lookupLocalSubnet(host);
    }
  } else {
    geo = lookupCcTld(host);
  }

  if (geo && geo.latitude !== null && geo.longitude !== null) {
    const coords = projectCoordinates(geo.latitude, geo.longitude);
    return {
      ...threat,
      latitude: geo.latitude,
      longitude: geo.longitude,
      projectedX: coords ? coords.x : null,
      projectedY: coords ? coords.y : null,
      hostingCountry: geo.country,
      hostingCountryCode: geo.countryCode,
      hostingCity: geo.city,
      hostingRegion: geo.region,
      hostingAsn: geo.asn,
      locationSource: geo.locationSource,
      locationBasis: geo.locationBasis,
      locationDisclaimer: geo.locationDisclaimer,
      isGeolocated: true
    };
  }

  // Explicit unmapped record
  return {
    ...threat,
    latitude: null,
    longitude: null,
    projectedX: null,
    projectedY: null,
    hostingCountry: null,
    hostingCountryCode: null,
    hostingCity: null,
    hostingRegion: null,
    hostingAsn: null,
    locationSource: 'unmapped',
    locationBasis: 'No verifiable geographic location',
    locationDisclaimer: 'Record preserved in global stream; not plotted on map to prevent false attribution.',
    isGeolocated: false
  };
}

/**
 * Enriches an array of threats synchronously first,
 * then background-enriches unmatched IPs via freeipapi.
 */
export async function enrichThreatsAsync(threats, onProgress) {
  // 1. Initial synchronous pass
  const enriched = threats.map(enrichThreatRecordSync);

  // 2. Identify unique un-geolocated IP hosts to resolve in background
  const pendingIps = Array.from(new Set(
    enriched
      .filter(t => !t.isGeolocated && t.evidence?.isIpAddress)
      .map(t => t.evidence.host)
  )).slice(0, 30); // Up to 30 distinct unmapped IPs

  if (pendingIps.length === 0) {
    return enriched;
  }

  // Resolve pending in small chunks of 5 to avoid browser request saturation
  const chunkSize = 5;
  for (let i = 0; i < pendingIps.length; i += chunkSize) {
    const chunk = pendingIps.slice(i, i + chunkSize);
    await Promise.all(chunk.map(ip => geolocateIpAddress(ip)));
  }

  // Re-enrich with newly acquired cache entries
  const secondPass = threats.map(enrichThreatRecordSync);
  if (typeof onProgress === 'function') {
    onProgress(secondPass);
  }
  return secondPass;
}

/**
 * Extracts all unique available locations present in the enriched threat feed.
 * Useful for the Location Selector dropdown with accurate matching counts.
 */
export function getAvailableLocations(threats) {
  const countryCounts = new Map();
  const cityCounts = new Map();
  let geolocatedCount = 0;

  threats.forEach(t => {
    if (t.isGeolocated && t.hostingCountry) {
      geolocatedCount++;
      const cKey = t.hostingCountry;
      const existing = countryCounts.get(cKey) || {
        type: 'country',
        name: t.hostingCountry,
        code: t.hostingCountryCode,
        count: 0
      };
      existing.count++;
      countryCounts.set(cKey, existing);

      if (t.hostingCity) {
        const cityKey = `${t.hostingCity}, ${t.hostingCountry}`;
        const existingCity = cityCounts.get(cityKey) || {
          type: 'city',
          name: t.hostingCity,
          country: t.hostingCountry,
          code: t.hostingCountryCode,
          count: 0
        };
        existingCity.count++;
        cityCounts.set(cityKey, existingCity);
      }
    }
  });

  const sortedCountries = Array.from(countryCounts.values())
    .sort((a, b) => b.count - a.count);

  const sortedCities = Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count);

  return {
    totalLoaded: threats.length,
    geolocatedCount,
    unmappedCount: threats.length - geolocatedCount,
    countries: sortedCountries,
    cities: sortedCities
  };
}

/**
 * Filters threats by the selected location object.
 * locationFilter: { type: 'global' | 'country' | 'city', value: string, code?: string }
 */
export function filterThreatsByLocation(threats, locationFilter) {
  if (!locationFilter || locationFilter.type === 'global') {
    return threats;
  }

  const targetCode = (locationFilter.code || '').toUpperCase();
  const targetName = (locationFilter.name || locationFilter.value || '').toLowerCase();

  if (locationFilter.type === 'country') {
    return threats.filter(t => 
      t.isGeolocated && 
      ((targetCode && t.hostingCountryCode && t.hostingCountryCode.toUpperCase() === targetCode) ||
       (targetName && t.hostingCountry && t.hostingCountry.toLowerCase() === targetName))
    );
  }

  if (locationFilter.type === 'city') {
    return threats.filter(t =>
      t.isGeolocated &&
      t.hostingCity &&
      t.hostingCity.toLowerCase() === targetName
    );
  }

  return threats;
}

/**
 * Returns camera target { viewBox, centerName, zoomLevel } for the selected location
 */
export function getMapCameraForLocation(locationFilter) {
  if (!locationFilter || locationFilter.type === 'global') {
    return {
      x: 0,
      y: 0,
      width: 800,
      height: 400,
      zoom: 1,
      label: 'Global View'
    };
  }

  const targetCode = locationFilter.code;
  const targetName = (locationFilter.name || locationFilter.value || '').toLowerCase();

  if (locationFilter.type === 'country') {
    const country = (targetCode && COUNTRY_MAP.get(targetCode)) || (targetName && COUNTRY_NAME_MAP.get(targetName));
    if (country) {
      const proj = projectCoordinates(country.lat, country.lon);
      const zoom = country.zoom || 3.0;
      const w = 800 / zoom;
      const h = 400 / zoom;
      const x = Math.max(0, Math.min(800 - w, proj.x - w / 2));
      const y = Math.max(0, Math.min(400 - h, proj.y - h / 2));
      return {
        x,
        y,
        width: w,
        height: h,
        zoom,
        label: `${country.name} (${country.code})`
      };
    }
  }

  if (locationFilter.type === 'city') {
    const subnetItem = SUBNET_CACHE.find(s => s.city && s.city.toLowerCase() === targetName);
    if (subnetItem) {
      const proj = projectCoordinates(subnetItem.lat, subnetItem.lon);
      const zoom = 4.5;
      const w = 800 / zoom;
      const h = 400 / zoom;
      const x = Math.max(0, Math.min(800 - w, proj.x - w / 2));
      const y = Math.max(0, Math.min(400 - h, proj.y - h / 2));
      return {
        x,
        y,
        width: w,
        height: h,
        zoom,
        label: `${subnetItem.city}, ${subnetItem.country}`
      };
    }
    if (targetCode && COUNTRY_MAP.get(targetCode)) {
      const country = COUNTRY_MAP.get(targetCode);
      const proj = projectCoordinates(country.lat, country.lon);
      const zoom = country.zoom || 3.5;
      const w = 800 / zoom;
      const h = 400 / zoom;
      const x = Math.max(0, Math.min(800 - w, proj.x - w / 2));
      const y = Math.max(0, Math.min(400 - h, proj.y - h / 2));
      return {
        x,
        y,
        width: w,
        height: h,
        zoom,
        label: `${locationFilter.name || 'City'}, ${country.name}`
      };
    }
  }

  return {
    x: 0,
    y: 0,
    width: 800,
    height: 400,
    zoom: 1,
    label: locationFilter.name || locationFilter.value || 'Custom View'
  };
}
