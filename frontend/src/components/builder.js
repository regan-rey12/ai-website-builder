import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Preview from './preview';

const templates = [
  { key: 'landing', title: 'Landing', desc: 'Professional business landing page with hero, features, testimonials, pricing and contact sections', pages: 3 },
  { key: 'portfolio', title: 'Portfolio', desc: 'Personal portfolio website with projects, skills, experience, about and contact pages', pages: 4 },
  { key: 'ecommerce', title: 'E-Com', desc: 'Modern ecommerce website with product listings, product details, cart and checkout pages', pages: 2 },
  { key: 'blog', title: 'Blog', desc: 'Professional blog website with homepage, article listings, single post and author pages', pages: 3 },
];

function Builder() {
  const [description, setDescription] = useState('');
  const [numPages, setNumPages] = useState(1);
  const [includeFramework, setIncludeFramework] = useState(false);
  const [code, setCode] = useState({ pages: [], html: [], css: '', js: '' });
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

    // 🔒 VERY IMPORTANT: Professional context injection (safe)
    const refinedDescription = `
Build a professional, real-world, production-quality website.

The website should:
- Feel like it was built by an experienced web agency
- Have detailed sections with real content
- Avoid short or shallow explanations
- Be suitable for a real business or startup

Website idea:
${description}
`;

    try {
      const response = await fetch('http://localhost:5000/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: refinedDescription,
          numPages,
          includeFramework
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCode(data);
        setSuccess('Website generated successfully!');
      } else {
        if (response.status === 429) {
          setError(
            'Rate limit exceeded (429). Check OpenRouter credits or try again later. Consider topping up at openrouter.ai.'
          );
        } else {
          setError(data.error || 'Generation failed.');
        }
      }
    } catch (err) {
      setError('Network error. Ensure backend is running on port 5000.');
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

    zip.file('styles.css', code.css);
    zip.file('script.js', code.js);

    zip.generateAsync({ type: 'blob' }).then((content) =>
      saveAs(content, 'website.zip')
    );
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

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            Number of Pages:
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={numPages}
            onChange={(e) => setNumPages(parseInt(e.target.value))}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-gray-900 dark:text-white w-20"
          />
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="framework"
            checked={includeFramework}
            onChange={() => setIncludeFramework(!includeFramework)}
            className="w-4 h-4"
          />
          <label
            htmlFor="framework"
            className="text-sm font-semibold text-gray-900 dark:text-white"
          >
            Include Tailwind CSS
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={generateCode}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-200 shadow-lg shadow-black/5"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Generating...
            </>
          ) : (
            'Generate Website'
          )}
        </button>

        {code.pages.length > 0 && (
          <button
            onClick={downloadZip}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-200 shadow-lg shadow-black/5"
          >
            Download ZIP
          </button>
        )}
      </div>

      {/* Messages */}
      {(success || error) && (
        <div className="text-center">
          {success && (
            <p className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {success}
            </p>
          )}
          {error && (
            <p className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm">
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
