/**
 * Run: node scripts/test-mongo.js
 * Diagnoses MongoDB Atlas connectivity (no secrets printed).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns').promises;
const mongoose = require('mongoose');
const { configureMongoDns, normalizeMongoUri } = require('../utils/mongoUri');

configureMongoDns();

function maskUri(uri) {
  if (!uri) return '(empty)';
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

function buildEncodedUri(raw) {
  const match = raw.match(/^mongodb(\+srv)?:\/\/([^/]+)(\/[^?]*)?(\?.*)?$/);
  if (!match) return raw;

  const protocol = match[1] ? 'mongodb+srv' : 'mongodb';
  const authHost = match[2];
  const dbPath = match[3] || '/ai-website-builder';
  const query = match[4] || '?retryWrites=true&w=majority';

  const at = authHost.lastIndexOf('@');
  if (at === -1) return raw;

  const creds = authHost.slice(0, at);
  const host = authHost.slice(at + 1);
  const colon = creds.indexOf(':');
  if (colon === -1) return raw;

  const user = creds.slice(0, colon);
  const pass = creds.slice(colon + 1);

  return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}${dbPath}${query}`;
}

async function checkDns(host) {
  try {
    const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
    console.log(`DNS SRV OK for ${host} (${records.length} record(s))`);
    return true;
  } catch (err) {
    console.error(`DNS SRV FAILED for ${host}:`, err.code || err.message);
    return false;
  }
}

async function main() {
  const raw = process.env.MONGODB_URI;
  console.log('MONGODB_URI loaded:', maskUri(raw));

  if (!raw || /YOUR_USER|YOUR_CLUSTER/i.test(raw)) {
    console.error('FAIL: server/.env still has placeholder URI');
    process.exit(1);
  }

  const hostMatch = raw.match(/@([^/?]+)/);
  const host = hostMatch ? hostMatch[1] : null;
  if (host) await checkDns(host);

  const encoded = normalizeMongoUri(raw);
  if (encoded !== raw) {
    console.log('Note: password was URL-encoded for connection (special chars like *)');
  }

  try {
    await mongoose.connect(encoded, { serverSelectionTimeoutMS: 20000 });
    console.log('SUCCESS: Mongoose connected');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('FAIL: Mongoose connect:', err.message);
    process.exit(1);
  }
}

main();
