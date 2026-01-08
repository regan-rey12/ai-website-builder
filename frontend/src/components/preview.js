import React, { useState, useMemo, useEffect } from 'react';

function Preview({ pages, html, css, js }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  // Reset current page when pages change (new generation)
  useEffect(() => {
    setCurrentPage(0);
  }, [pages.length]);

  // Listen for navigation messages from the iframe (from script.js)
  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || event.data.type !== 'navigate') return;
      const targetHref = event.data.href;
      const index = pages.findIndex((p) => p === targetHref);
      if (index !== -1) setCurrentPage(index);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pages]);

  // Extract <body> contents AND original <body class="...">
  const { bodyHtml, bodyClass } = useMemo(() => {
    const raw = html[currentPage] || '<h1>No HTML for this page</h1>';

    if (typeof DOMParser === 'undefined') {
      return { bodyHtml: raw, bodyClass: 'fade-in' };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');
      const inner = (doc.body && doc.body.innerHTML.trim()) || raw;
      const originalClass = (doc.body && doc.body.getAttribute('class')) || '';
      const combinedClass = ['fade-in', originalClass].filter(Boolean).join(' ');
      return { bodyHtml: inner, bodyClass: combinedClass };
    } catch {
      return { bodyHtml: raw, bodyClass: 'fade-in' };
    }
  }, [html, currentPage]);

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Generated Website</title>
        <style>${css || ''}</style>
      </head>
      <body class="${bodyClass}">
        ${bodyHtml}
        <script>${js || ''}</script>
      </body>
    </html>
  `;

  return (
    <div
      className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5 ${
        fullScreen ? 'fixed inset-0 z-50 p-6' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Preview
        </h2>
        <div className="flex space-x-4">
          <select
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            {pages.map((page, idx) => (
              <option key={idx} value={idx}>
                {page}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFullScreen(!fullScreen)}
            className="px-6 py-3 bg-gray-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-200 shadow-lg shadow-black/5"
            aria-label="Toggle full screen"
          >
            {fullScreen ? 'Exit' : 'Full Screen'}
          </button>
        </div>
      </div>

      <iframe
        key={currentPage}
        srcDoc={fullHtml}
        title="Website Preview"
        className={`w-full border rounded-2xl ${fullScreen ? 'h-full' : 'h-96'}`}
        sandbox="allow-scripts allow-forms"
      />
    </div>
  );
}

export default Preview;