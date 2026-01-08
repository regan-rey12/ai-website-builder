const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const EVENTS_LOG = path.join(__dirname, 'events.log');
const FEEDBACK_LOG = path.join(__dirname, 'feedback.log');

// Log simple usage events (e.g., successful generations)
app.post('/events', (req, res) => {
  const { userId, type, data } = req.body || {};

  if (!type) {
    return res.status(400).json({ error: 'type is required' });
  }

  const entry = {
    userId: userId || null,
    type,
    data: data || {},
    createdAt: new Date().toISOString(),
  };

  fs.appendFile(EVENTS_LOG, JSON.stringify(entry) + '\n', (err) => {
    if (err) {
      console.error('Failed to write event:', err);
      return res.status(500).json({ error: 'failed to store event' });
    }
    res.json({ ok: true });
  });
});

// Log feedback (thumbs up/down + comment)
app.post('/feedback', (req, res) => {
  const { userId, rating, comment } = req.body || {};

  if (!rating) {
    return res.status(400).json({ error: 'rating is required' });
  }

  const entry = {
    userId: userId || null,
    rating,
    comment: (comment || '').slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  fs.appendFile(FEEDBACK_LOG, JSON.stringify(entry) + '\n', (err) => {
    if (err) {
      console.error('Failed to write feedback:', err);
      return res.status(500).json({ error: 'failed to store feedback' });
    }
    res.json({ ok: true });
  });
});

const PORT = process.env.ANALYTICS_PORT || 5001;
app.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
});