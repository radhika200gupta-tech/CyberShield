/**
 * Vercel Serverless Function: URLhaus Threat Intelligence Feed Proxy
 * Securely proxies abuse.ch URLhaus threat feeds server-to-server,
 * bypassing browser CORS restrictions and preventing SPA HTML fallbacks.
 */

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (req.method && req.method !== 'GET') {
    if (res && typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method Not Allowed. Only GET requests are supported.' });
    }
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Forward Range header if present (default to ~64KB for recent URLs)
    const headers = req.headers || {};
    let rangeHeader = 'bytes=0-65536';
    if (typeof headers.get === 'function') {
      rangeHeader = headers.get('range') || rangeHeader;
    } else if (headers['range']) {
      rangeHeader = headers['range'];
    }

    const upstreamUrl = 'https://urlhaus.abuse.ch/downloads/csv_recent/';

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        'Range': rangeHeader,
        'User-Agent': 'CyberShield-ThreatIntel/1.0 (Security Telemetry Aggregator; +https://cybershield.security)'
      }
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      const errorMsg = `URLhaus upstream feed returned status ${upstreamResponse.status} (${upstreamResponse.statusText || 'Error'})`;
      if (res && typeof res.status === 'function') {
        return res.status(upstreamResponse.status).json({ error: errorMsg });
      }
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: upstreamResponse.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const csvData = await upstreamResponse.text();

    // Node.js serverless response
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
      return res.status(upstreamResponse.status).send(csvData);
    }

    // Web Standard Response
    return new Response(csvData, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=120, stale-while-revalidate=60',
      }
    });
  } catch (err) {
    const errorMsg = `Gateway error fetching URLhaus threat intelligence: ${err.message || 'Connection failure'}`;
    if (res && typeof res.status === 'function') {
      return res.status(502).json({ error: errorMsg });
    }
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
