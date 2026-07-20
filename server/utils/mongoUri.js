const dns = require('dns');

/**
 * Windows + Node often fail mongodb+srv SRV lookups (ECONNREFUSED on querySrv)
 * while nslookup works. Prefer IPv4 and public DNS before connecting.
 */
function configureMongoDns() {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
  // Optional: use reliable resolvers when ISP DNS blocks SRV
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // ignore if not allowed
  }
}

/**
 * Encode username/password so special chars (*, @, #) don't break the URI.
 */
function normalizeMongoUri(rawUri) {
  if (!rawUri || !rawUri.startsWith('mongodb')) return rawUri;

  try {
    const normalized = rawUri.replace(
      /^mongodb\+srv:\/\//,
      'https://'
    ).replace(/^mongodb:\/\//, 'https://');

    const url = new URL(normalized);
    const protocol = rawUri.startsWith('mongodb+srv') ? 'mongodb+srv' : 'mongodb';
    const user = decodeURIComponent(url.username);
    const pass = decodeURIComponent(url.password);
    const host = url.host;
    const path = url.pathname || '/ai-website-builder';
    const search = url.search || '?retryWrites=true&w=majority';

    return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}${path}${search}`;
  } catch {
    return rawUri;
  }
}

module.exports = { configureMongoDns, normalizeMongoUri };
