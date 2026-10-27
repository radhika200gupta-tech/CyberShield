/* global process */
/**
 * Vercel Serverless Function & Node.js API Handler: Threat Intelligence Feed Proxy
 * Securely proxies threat intelligence feeds server-to-server:
 * 1. If URLHAUS_AUTH_KEY is configured, queries official abuse.ch URLhaus recent exports.
 * 2. If no key is configured or URLhaus returns an error (such as 410 Gone / 401 Unauthorized),
 *    seamlessly falls back to the live public TweetFeed security telemetry feed.
 * 
 * Bypasses browser CORS restrictions, eliminates SPA HTML routing fallbacks,
 * and ensures reliable live threat records for CyberShield.
 */

const TWEETFEED_URL = 'https://raw.githubusercontent.com/0xDanielLopez/TweetFeed/master/week.csv';

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
      if (typeof res.status === 'function') {
        return res.status(204).end();
      }
      res.statusCode = 204;
      return res.end();
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
    const errorBody = JSON.stringify({ error: 'Method Not Allowed. Only GET requests are supported.' });
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (typeof res.status === 'function') {
        return res.status(405).send(errorBody);
      }
      res.statusCode = 405;
      return res.end(errorBody);
    }
    return new Response(errorBody, {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const sendTextResponse = (status, text, sourceName) => {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
      res.setHeader('X-Threat-Source', sourceName);
      if (typeof res.status === 'function') {
        return res.status(status).send(text);
      }
      res.statusCode = status;
      return res.end(text);
    }
    return new Response(text, {
      status,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=120, stale-while-revalidate=60',
        'X-Threat-Source': sourceName,
      }
    });
  };

  const sendJsonResponse = (status, json) => {
    const body = JSON.stringify(json);
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (typeof res.status === 'function') {
        return res.status(status).send(body);
      }
      res.statusCode = status;
      return res.end(body);
    }
    return new Response(body, {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  };

  const authKey = (typeof process !== 'undefined' && process.env?.URLHAUS_AUTH_KEY)
    ? process.env.URLHAUS_AUTH_KEY.trim()
    : '';

  // 1. Try URLhaus if Auth-Key is configured
  if (authKey) {
    try {
      const urlhausUrl = `https://urlhaus-api.abuse.ch/v2/files/exports/${encodeURIComponent(authKey)}/recent.csv`;
      const headers = req.headers || {};
      let rangeHeader = 'bytes=0-65536';
      if (typeof headers.get === 'function') {
        rangeHeader = headers.get('range') || rangeHeader;
      } else if (headers['range']) {
        rangeHeader = headers['range'];
      }

      const response = await fetch(urlhausUrl, {
        headers: {
          'Range': rangeHeader,
          'User-Agent': 'CyberShield-ThreatIntel/1.0 (Security Telemetry Aggregator; +https://cybershield.security)'
        }
      });

      if (response.ok || response.status === 206) {
        const csvData = await response.text();
        // Validate that response is genuine CSV, not HTML
        if (!csvData.trim().toLowerCase().startsWith('<!doctype html') && !csvData.trim().startsWith('<html')) {
          return sendTextResponse(response.status, csvData, 'abuse.ch URLhaus');
        }
      }
    } catch (urlhausErr) {
      console.warn('URLhaus keyed query failed, falling back to TweetFeed:', urlhausErr.message);
    }
  }

  // 2. Fetch from legitimate live public threat intelligence feed (TweetFeed)
  try {
    const upstreamResponse = await fetch(TWEETFEED_URL, {
      headers: {
        'User-Agent': 'CyberShield-ThreatIntel/1.0 (Security Telemetry Aggregator; +https://cybershield.security)'
      }
    });

    if (!upstreamResponse.ok) {
      return sendJsonResponse(upstreamResponse.status, {
        error: `Threat intelligence provider returned status ${upstreamResponse.status}`
      });
    }

    const csvData = await upstreamResponse.text();
    // Return newest lines from week.csv (chronological order, slice latest 300 entries)
    const lines = csvData.trim().split(/\r?\n/);
    const recentLines = lines.slice(-300);
    const resultCsv = recentLines.join('\n');

    return sendTextResponse(200, resultCsv, 'TweetFeed Security Telemetry (Live Community Feed)');
  } catch (err) {
    return sendJsonResponse(502, {
      error: `Gateway error fetching threat intelligence: ${err.message || 'Connection failure'}`
    });
  }
}
