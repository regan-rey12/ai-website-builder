import React, { useState } from 'react';

function Preview({ pages, html, css, js }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Generated Website</title>
        <style>${css}</style>
      </head>
      <body class="fade-in">
        ${html[currentPage] || '<h1>No HTML for this page</h1>'}
        <script>${js}</script>
      </body>
    </html>
  `;

  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5 ${fullScreen ? 'fixed inset-0 z-50 p-6' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preview</h2>
        <div className="flex space-x-4">
          <select
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            {pages.map((page, idx) => (
              <option key={idx} value={idx}>{page}</option>
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
        srcDoc={fullHtml}
        title="Website Preview"
        className={`w-full border rounded-2xl ${fullScreen ? 'h-full' : 'h-96'}`}
        sandbox="allow-scripts allow-forms"  // Restricted sandbox for full isolation - no same-origin or top-navigation
      />
    </div>
  );
}

export default Preview;
