import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Preview from './preview';

const templates = [
  {
    key: 'landing',
    title: 'Landing',
    desc: 'Professional business landing page with hero, features, testimonials, pricing and contact sections',
    pages: 3,
  },
  {
    key: 'portfolio',
    title: 'Portfolio',
    desc: 'Personal portfolio website with projects, skills, experience, about and contact pages',
    pages: 4,
  },
  {
    key: 'ecommerce',
    title: 'E-Com',
    desc: 'Modern ecommerce website with product listings, product details, cart and checkout pages',
    pages: 2,
  },
  {
    key: 'blog',
    title: 'Blog',
    desc: 'Professional blog website with homepage, article listings, single post and author pages',
    pages: 3,
  },
];

// Try to infer page count from description text like "4-page website" or "3 pages"
function inferPagesFromDescription(description) {
  if (!description) return null;

  // Look for patterns like "4 page", "4 pages", "4-page", "4 pages website"
  const match = description.match(/(\d+)\s*[- ]*\s*page(?:s)?\b/i);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  if (Number.isNaN(count)) return null;

  // Clamp between 1 and 5 to match backend validation
  return Math.min(5, Math.max(1, count));
}

// For production, you can set REACT_APP_API_URL in .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Builder() {
  const [description, setDescription] = useState('');
  const [numPages, setNumPages] = useState(1);
  const [code, setCode] = useState({
    pages: [],
    html: [],
    css: '',
    js: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateCode = async () => {
    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Infer pages from the description text if user wrote something like "4-page website"
    let pagesToGenerate = numPages;
    const inferredPages = inferPagesFromDescription(description);
    if (inferredPages && inferredPages !== numPages) {
      pagesToGenerate = inferredPages;
      setNumPages(inferredPages); // Update the UI so user sees the real count
    }

    // Professional context injection (content only)
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
        setError(data.error || 'Generation failed.');
      } else {
        setCode(data);
        setSuccess('Website generated successfully!');
      }
    } catch (err) {
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
  };

  return (
    <div className="space-y-4 relative">
      {/* Templates */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Templates
        </h2>
        <hr className="border-gray-200 dark:border-gray-700 mb-6" />
        <div className="flex flex-wrap gap-2 justify-center">
          {templates.map((template) => (
            <button
              key={template.key}
              onClick={() => loadTemplate(template)}
              title={template.desc}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Website Description
        </h2>
        <hr className="border-gray-200 dark:border-gray-700 mb-6" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your website idea in detail..."
          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
          rows={3}
        />

        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            Number of Pages:
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
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white w-20"
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          The generated website will use plain HTML, CSS, and JavaScript (no Tailwind or CSS frameworks).
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={generateCode}
          disabled={loading}
          className={`px-8 py-4 rounded-full font-bold transition-all duration-200 shadow-lg shadow-black/5 ${
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
            className={`px-8 py-4 rounded-full font-bold transition-all duration-200 shadow-lg shadow-black/5 ${
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
        <div className="text-center">
          {success && (
            <p className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
              {success}
            </p>
          )}
          {error && (
            <p className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </p>
          )}
        </div>
      )}

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