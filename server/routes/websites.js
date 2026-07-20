const express = require('express');
const mongoose = require('mongoose');
const Website = require('../models/Website');
const { generateWebsiteContent } = require('../services/aiService');
const { selectTemplate } = require('../services/templateService');
const { extractContactInfoFromDescription } = require('../utils/contactUtils');
const { logEvent } = require('../utils/logger');
const { generateLimiter } = require('../middleware/rateLimiter');
const dbState = require('../dbState');

const router = express.Router();

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGODB_URI || '';
    let hint = 'MongoDB is not connected. Restart the server after fixing server/.env.';
    if (/YOUR_USER|YOUR_CLUSTER/i.test(uri)) {
      hint =
        'Your server/.env still has the example placeholder — paste your Atlas URI into server/.env (not .env.example).';
    } else if (/querySrv|ECONNREFUSED/i.test(String(dbState.mongoConnectionError || ''))) {
      hint =
        'DNS could not reach MongoDB Atlas. Restart the server (DNS fix applied) or check Network Access in Atlas.';
    }
    return res.status(503).json({
      error: hint,
      detail: dbState.mongoConnectionError || undefined,
    });
  }
  next();
}

function mergeContactIntoContent(content, contactInfo) {
  if (!content?.contact) return content;

  const merged = { ...content, contact: { ...content.contact } };
  if (contactInfo.email) merged.contact.email = contactInfo.email;
  if (contactInfo.phone) merged.contact.phone = contactInfo.phone;
  if (contactInfo.address) merged.contact.address = contactInfo.address;
  if (contactInfo.whatsapp && !merged.contact.phone) {
    merged.contact.phone = contactInfo.whatsapp;
  }
  return merged;
}

router.post('/generate', generateLimiter, requireDatabase, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.header('x-client-id') || null;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (prompt.trim().length < 10) {
    return res.status(400).json({ error: 'prompt must be at least 10 characters' });
  }

  logEvent({
    userId,
    name: 'v2_generate',
    route: '/api/websites/generate',
    data: { promptLength: prompt.length },
  });

  try {
    const aiResult = await generateWebsiteContent(prompt.trim());
    const templateId = selectTemplate(
      prompt,
      aiResult.detectedType,
      aiResult.confidence
    );

    const contactInfo = extractContactInfoFromDescription(prompt);
    const content = mergeContactIntoContent(aiResult.content, contactInfo);

    const website = await Website.create({
      prompt: prompt.trim(),
      templateId,
      content,
      settings: {
        primaryColor: '#2563eb',
        fontFamily: 'modern',
      },
      status: 'draft',
    });

    res.json({
      success: true,
      websiteId: website._id,
      templateId: website.templateId,
      content: website.content,
      settings: website.settings,
    });
  } catch (error) {
    console.error('Generate failed:', error.message);
    logEvent({
      userId,
      name: 'v2_generate_error',
      route: '/api/websites/generate',
      data: { error: error.message },
    });
    res.status(500).json({ error: 'Failed to generate website content. Please try again.' });
  }
});

router.get('/:id', requireDatabase, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }
    res.json(website);
  } catch (error) {
    res.status(400).json({ error: 'Invalid website id' });
  }
});

router.put('/:id/settings', requireDatabase, async (req, res) => {
  const { primaryColor, fontFamily } = req.body;

  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (primaryColor) website.settings.primaryColor = primaryColor;
    if (fontFamily) website.settings.fontFamily = fontFamily;

    await website.save();
    res.json(website);
  } catch (error) {
    res.status(400).json({ error: 'Invalid website id' });
  }
});

module.exports = router;
