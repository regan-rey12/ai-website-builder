const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper to call a model
async function callModel(prompt, model) {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error calling ${model}:`, error.message);
    throw new Error(`Failed to generate with ${model}`);
  }
}

// Helper to generate image URLs (placeholder via Unsplash search term)
function generateImageURL(keyword) {
  const query = encodeURIComponent(keyword);
  return `https://source.unsplash.com/800x600/?${query}`;
}

// Manager function: orchestrates a professional multi-page website
async function generateWebsiteManager(description, numPages, includeFramework, websiteType) {
  const htmlPages = [];

  // Generate global nav/footer + color palette
  const globalPrompt = `
Generate a professional navigation bar, footer, and color palette for a ${websiteType} website described as: "${description}".
Return JSON:
{
  "nav": "<nav>...</nav>",
  "footer": "<footer>...</footer>",
  "colors": { "primary": "#...", "secondary": "#...", "accent": "#..." }
}
`;
  let globalData;
  try {
    const globalDataRaw = await callModel(globalPrompt, 'openai/gpt-oss-20b:free');
    globalData = JSON.parse(globalDataRaw);
  } catch {
    globalData = {
      nav: `<nav><ul>${Array.from({ length: numPages }, (_, i) => `<li><a href="page${i + 1}.html">Page ${i + 1}</a></li>`).join('')}</ul></nav>`,
      footer: `<footer><p>© ${new Date().getFullYear()} ${websiteType} Website</p></footer>`,
      colors: { primary: '#1f2937', secondary: '#3b82f6', accent: '#f97316' },
    };
  }

  // Generate HTML pages individually
  for (let i = 0; i < numPages; i++) {
    const prompt = `
Generate a professional HTML page for a ${websiteType} website.
Rules:
1. Page number: ${i + 1} of ${numPages}.
2. Include header, nav (use global nav), hero, 3–7 meaningful sections, and footer (use global footer).
3. Include at least 1–2 images in sections reflecting the description: "${description}".
4. Use semantic HTML (<header>, <nav>, <main>, <section>, <article>, <footer>).
5. Descriptive class names, matching color palette: primary=${globalData.colors.primary}, secondary=${globalData.colors.secondary}, accent=${globalData.colors.accent}.
6. Content must be professional startup/business-grade. Do NOT use lorem ipsum.
7. Wrap entire HTML in triple backticks: \`\`\`html ... \`\`\`.
Return only the HTML inside the backticks.
`;
    try {
      let html = await callModel(prompt, 'openai/gpt-oss-20b:free');
      const match = html.match(/```html([\s\S]*?)```/);
      if (match) html = match[1].trim();
      htmlPages.push(html);
    } catch (err) {
      console.error(`HTML generation failed for page ${i + 1}:`, err.message);
      let html = await callModel(prompt, 'openai/gpt-oss-20b:free');
      const match = html.match(/```html([\s\S]*?)```/);
      if (match) html = match[1].trim();
      htmlPages.push(html);
    }
  }

  // Generate CSS
  const framework = includeFramework ? 'Tailwind CSS' : 'plain CSS';
  const cssPrompt = `
Generate ${framework} styling for a professional ${websiteType} website.
Use the color palette: primary=${globalData.colors.primary}, secondary=${globalData.colors.secondary}, accent=${globalData.colors.accent}.
Style navigation, footer, hero, sections, buttons, and images.
Return only CSS code.
`;
  const css = await callModel(cssPrompt, 'google/gemma-3-12b-it:free');

  // Generate JS
  const jsPrompt = `
Generate JavaScript interactivity for a professional ${websiteType} website.
Include responsive menu, buttons, sliders, modals if appropriate.
Return only JS code.
`;
  const js = await callModel(jsPrompt, 'openai/gpt-oss-20b:free');

  const pages = htmlPages.map((_, idx) => `page${idx + 1}.html`);
  return { pages, html: htmlPages, css, js };
}

// Combined endpoint using manager
app.post('/generate-code', async (req, res) => {
  const { description, numPages, includeFramework, websiteType = 'landing' } = req.body;
  try {
    const result = await generateWebsiteManager(description, numPages, includeFramework, websiteType);
    res.json(result);
  } catch (error) {
    console.error('Multi-model generation failed:', error.message);
    res.status(500).json({ error: 'Multi-model generation failed' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
