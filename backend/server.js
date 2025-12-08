const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();  // Ensure .env has OPENROUTER_API_KEY

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODELS = ['qwen/qwen-2.5-coder-32b-instruct:free','qwen/qwen3-coder:free','mistralai/mistral-small-3.1-24b-instruct:free'];  // Fallback models
const cache = new Map();  // In-memory cache for repeated prompts

app.post('/generate-code', async (req, res) => {
  const { description, numPages = 1, includeFramework = false } = req.body;
  if (!description || description.trim().length < 5) {
    return res.status(400).json({ error: 'Description must be at least 5 characters.' });
  }
  if (numPages < 1 || numPages > 5) {
    return res.status(400).json({ error: 'Number of pages must be between 1 and 5.' });
  }

  const cacheKey = `${description.trim().toLowerCase()}-${numPages}-${includeFramework}`;
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  const frameworkLink = includeFramework ? '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">' : '';

  const prompt = `First, create a PLAN for a multi-page website (at least ${numPages} pages, e.g., Home, About, Contact) based on this description: "${description}". Outline layout, features, and interactivity in 3-4 sentences.

  Then, generate the code for ALL pages in this format (no extra text). Use relative links for navigation (e.g., href="about.html"). Include modern features like responsive design, animations, forms, and placeholder images from https://picsum.photos/. ${includeFramework ? 'Use Tailwind CSS classes.' : ''}

  ### PAGES
  [List of page filenames, e.g., index.html, about.html, contact.html]

  ### HTML (for each page)
  [Full HTML for index.html, including ${frameworkLink} in <head>]
  ---
  [Full HTML for about.html, including ${frameworkLink} in <head>]
  ---

  ### CSS
  [Shared CSS with media queries, keyframes for animations, and clean UI/UX. ${includeFramework ? 'Supplement with custom styles if needed.' : 'Use flexbox/grid.'}]

  ### JS
  [Shared JS for interactivity, e.g., form validation, sliders, or animations.]`;

  for (const model of MODELS) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,  // Increased for multi-page
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const generatedText = response.data.choices[0].message.content;
      const pagesMatch = generatedText.match(/### PAGES\n([\s\S]*?)(?=###|$)/);
      const htmlSection = generatedText.match(/### HTML\n([\s\S]*?)(?=###|$)/);
      const cssMatch = generatedText.match(/### CSS\n([\s\S]*?)(?=###|$)/);
      const jsMatch = generatedText.match(/### JS\n([\s\S]*?)(?=###|$)/);

      if (!htmlSection) throw new Error('Invalid AI response: Missing HTML section');

      const pages = pagesMatch ? pagesMatch[1].trim().split('\n').map(p => p.trim()) : [`index.html`];
      const htmlBlocks = htmlSection[1].split('---').map(block => block.trim()).filter(block => block);

      const result = {
        pages,
        html: htmlBlocks,
        css: cssMatch ? cssMatch[1].trim() : '',
        js: jsMatch ? jsMatch[1].trim() : ''
      };

      cache.set(cacheKey, result);
      return res.json(result);
    } catch (error) {
      console.error(`Model ${model} failed:`, error.message);
      if (model === MODELS[MODELS.length - 1]) {
        return res.status(500).json({ error: 'All AI models failed. Check API key or credits.' });
      }
    }
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));
