const axios = require('axios');
const { buildWebsiteContentPrompt } = require('../prompts/websitePrompt');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_ORIGIN = process.env.APP_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000';

const PRIMARY_MODEL = 'meta-llama/llama-3.1-8b-instruct';
const FALLBACK_MODEL = 'mistralai/mistral-7b-instruct';

async function callModel(prompt, model, retries = 1) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': APP_ORIGIN,
            'X-Title': 'VoidBuild',
          },
          timeout: 60000,
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      lastError = error;
      console.error(`Error calling ${model} (attempt ${attempt + 1}):`, error.message);
      if (error.response) {
        console.error('OpenRouter response data:', error.response.data);
      }
    }
  }

  throw new Error(`Failed to generate with ${model}: ${lastError?.message || 'unknown error'}`);
}

function parseJsonFromModel(raw) {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model response');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function validateWebsitePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }
  if (!['business', 'restaurant', 'portfolio'].includes(payload.detectedType)) {
    throw new Error('Invalid detectedType');
  }
  if (typeof payload.confidence !== 'number') {
    throw new Error('Invalid confidence');
  }
  if (!payload.content || typeof payload.content !== 'object') {
    throw new Error('Invalid content');
  }
  return payload;
}

async function generateWebsiteContent(userPrompt) {
  const prompt = buildWebsiteContentPrompt(userPrompt);

  try {
    const raw = await callModel(prompt, PRIMARY_MODEL, 1);
    return validateWebsitePayload(parseJsonFromModel(raw));
  } catch (primaryError) {
    console.warn('Primary model failed, trying fallback:', primaryError.message);
    const raw = await callModel(prompt, FALLBACK_MODEL, 1);
    return validateWebsitePayload(parseJsonFromModel(raw));
  }
}

module.exports = {
  callModel,
  generateWebsiteContent,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
};
