const rateLimit = require('express-rate-limit');

const generateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many generation requests. Please try again in a few minutes.' },
});

module.exports = { generateLimiter };
