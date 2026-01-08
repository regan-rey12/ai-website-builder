// src/components/builder.js
import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Preview from './preview';

// Template definitions (compact)
const templates = [
  {
    key: 'portfolio',
    title: 'Portfolio',
    desc: 'Personal portfolio with projects, skills, about and contact.',
    pages: 4,
    badge: 'Recommended',
  },
  {
    key: 'blog',
    title: 'Blog',
    desc: 'Blog-style site with posts and an about/author section.',
    pages: 3,
    badge: 'Recommended',
  },
  {
    key: 'landing',
    title: 'Business Landing',
    desc: 'Simple website for a service or small business.',
    pages: 3,
    badge: 'Beta',
  },
  {
    key: 'ecommerce',
    title: 'E‑Commerce',
    desc: 'Small product catalogue with order/contact CTAs.',
    pages: 2,
    badge: 'Beta',
  },
];

// Try to infer page count from description text like "4-page website" or "3 pages"
function inferPagesFromDescription(description) {
  if (!description) return null;

  const match = description.match(/(\d+)\s*[- ]*\s*page(?:s)?\b/i);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  if (Number.isNaN(count)) return null;

  return Math.min(5, Math.max(1, count));
}

// For production, you can set REACT_APP_API_URL in .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Builder() {
  const [description, setDescription] = useState('');
  const [numPages, setNumPages] = useState(4); // default = portfolio
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('portfolio');
  const [code, setCode] = useState({
    pages: [],
    html: [],
    css: '',
    js: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedTemplate =
    templates.find((t) => t.key === selectedTemplateKey) || templates[0];

  const generateCode = async () => {
    if (!description.trim()) {
      setError('Describe the website and include your contact details.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Infer pages from description if user writes "4-page website"
    let pagesToGenerate = numPages;
    const inferredPages = inferPagesFromDescription(description);
    if (inferredPages && inferredPages !== numPages) {
      pagesToGenerate = inferredPages;
      setNumPages(inferredPages);
    }

    // Context for backend (content-only)
    const refinedDescription = `
Build a professional, production-ready website.

Requirements:
- Real business-quality content
- Multiple meaningful sections per page
- Clean, structured HTML
- Styling must be handled via styles.css (external stylesheet)
- Do NOT use Tailwind or any CSS framework in the generated website

Website concept:
${description}
`;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: refinedDescription,
          numPages: pagesToGenerate,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.error || 'Generation failed. Please try again.');
      } else {
        setCode(data);
        setSuccess('Website generated successfully!');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Ensure backend is running and API URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      generateCode();
    }
  };

  const downloadZip = () => {
    if (!code.pages.length) return;

    const zip = new JSZip();

    code.pages.forEach((page, idx) => {
      zip.file(page, code.html[idx] || '<h1>Error</h1>');
    });

    zip.file('styles.css', code.css || '/* styles.css */');
    zip.file('script.js', code.js || '');

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'website.zip');
    });
  };

  const loadTemplate = (template) => {
    setDescription(template.desc);
    setNumPages(template.pages);
    setSelectedTemplateKey(template.key);
  };

  return (
    <div className="space-y-4 relative">
      {/* Template + description + actions */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-lg shadow-black/5 space-y-3">
        {/* Templates row */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Template
            </h2>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Portfolio &amp; Blog are strongest
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((template) => {
              const isSelected = selectedTemplateKey === template.key;
              const isRecommended = template.badge === 'Recommended';
              const isBeta = template.badge === 'Beta';

              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => loadTemplate(template)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-100'
                      : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200 hover:border-blue-400'
                  }`}
                  title={template.desc}
                >
                  {template.title}
                  {isRecommended && (
                    <span className="ml-1 px-1.5 rounded-full text-[9px] bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200">
                      Recommended
                    </span>
                  )}
                  {isBeta && (
                    <span className="ml-1 px-1.5 rounded-full text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      Beta
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {selectedTemplate.desc}
          </p>
        </div>

        {/* Description + pages */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Enter = generate · Shift+Enter = new line
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: 4-page portfolio for a Ugandan frontend developer with projects, skills, about and contact. Phone/WhatsApp/Email: ..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm mb-2"
            rows={3}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-semibold text-gray-900 dark:text-white">
              Pages
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={numPages}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (Number.isNaN(value)) {
                  setNumPages(1);
                } else {
                  setNumPages(Math.min(5, Math.max(1, value)));
                }
              }}
              className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white w-16 text-xs"
            />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Add Phone / WhatsApp / Email for better contact buttons.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          <button
            onClick={generateCode}
            disabled={loading}
            className={`px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-black/5 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:scale-105'
            }`}
          >
            {loading ? 'Generating…' : 'Generate Website'}
          </button>

          {code.pages.length > 0 && (
            <button
              onClick={downloadZip}
              disabled={loading}
              className={`px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-black/5 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105'
              }`}
            >
              Download ZIP
            </button>
          )}
        </div>

        {/* Messages */}
        {(success || error) && (
          <div className="text-center pt-1">
            {success && (
              <p className="inline-block px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs">
                {success}
              </p>
            )}
            {error && (
              <p className="inline-block px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs max-w-md">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      {code.pages.length > 0 && (
        <Preview
          pages={code.pages}
          html={code.html}
          css={code.css}
          js={code.js}
        />
      )}
    </div>
  );
}

export default Builder;