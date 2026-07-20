const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, '..', 'events.log');
const feedbackPath = path.join(__dirname, '..', 'feedback.log');

let eventsStream = null;
let feedbackStream = null;

try {
  eventsStream = fs.createWriteStream(eventsPath, { flags: 'a' });
} catch (err) {
  console.error('Failed to open events.log:', err.message);
}

try {
  feedbackStream = fs.createWriteStream(feedbackPath, { flags: 'a' });
} catch (err) {
  console.error('Failed to open feedback.log:', err.message);
}

function safeWrite(stream, line) {
  if (!stream) {
    console.log('[LOG FALLBACK]', line);
    return;
  }
  stream.write(line + '\n');
}

function logEvent({ userId, name, route, data }) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      type: 'event',
      userId: userId || null,
      name,
      route,
      data: data || null,
    });
    safeWrite(eventsStream, line);
  } catch (err) {
    console.error('logEvent error:', err.message);
  }
}

function logFeedback({ userId, route, message, extra }) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      type: 'feedback',
      userId: userId || null,
      route,
      message,
      extra: extra || null,
    });
    safeWrite(feedbackStream, line);
  } catch (err) {
    console.error('logFeedback error:', err.message);
  }
}

module.exports = { logEvent, logFeedback };
