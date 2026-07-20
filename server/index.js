const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const websiteRoutes = require('./routes/websites');
const { configureMongoDns, normalizeMongoUri } = require('./utils/mongoUri');
const dbState = require('./dbState');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function configureCors() {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;

  if (allowedOriginsEnv) {
    const allowedOrigins = allowedOriginsEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.use(
      cors({
        origin(origin, callback) {
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          console.warn(`Blocked CORS request from origin: ${origin}`);
          return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
      })
    );
    return;
  }

  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );
}

configureCors();
app.use(express.json());

app.use((req, res, next) => {
  req.clientId = req.header('x-client-id') || null;
  next();
});

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    message: 'AI Website Builder V2 API is running',
    mongodb: connected ? 'connected' : 'disconnected',
    mongoError: connected ? null : dbState.mongoConnectionError,
  });
});

app.use('/api/websites', websiteRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

function isPlaceholderMongoUri(uri) {
  return !uri || /YOUR_USER|YOUR_PASSWORD|YOUR_CLUSTER|your_password/i.test(uri);
}

async function connectDatabase() {
  const rawUri = process.env.MONGODB_URI;
  if (isPlaceholderMongoUri(rawUri)) {
    dbState.mongoConnectionError = 'MONGODB_URI is missing or still a placeholder in server/.env';
    console.warn(dbState.mongoConnectionError);
    return;
  }

  configureMongoDns();
  const uri = normalizeMongoUri(rawUri);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
  });

  dbState.mongoConnectionError = null;
  console.log('MongoDB connected');
}

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set — generation will fail.');
}

async function startServer() {
  try {
    await connectDatabase();
  } catch (err) {
    dbState.mongoConnectionError = err.message;
    console.error('MongoDB connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (dbState.mongoConnectionError) {
      console.warn('API is up but database is offline — /api/websites/generate will return 503');
    }
  });
}

startServer();
