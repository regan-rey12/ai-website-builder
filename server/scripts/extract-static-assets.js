const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../../backend/server.js');
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

function sliceTemplateConst(name) {
  let capturing = false;
  const parts = [];

  for (const line of lines) {
    if (!capturing) {
      if (line.startsWith(`const ${name} = \``)) {
        capturing = true;
        const rest = line.slice(`const ${name} = \``.length);
        if (rest.endsWith('`;')) {
          return rest.slice(0, -2);
        }
        parts.push(rest);
      }
      continue;
    }

    if (line.trim() === '`;') {
      return parts.join('\n');
    }
    parts.push(line);
  }

  throw new Error(`Could not extract ${name}`);
}

const STATIC_JS = sliceTemplateConst('STATIC_JS');
const BUSINESS_SITE_CSS = sliceTemplateConst('BUSINESS_SITE_CSS');
const MULTIPAGE_SITE_CSS = sliceTemplateConst('MULTIPAGE_SITE_CSS');

const out = `// Extracted from backend/server.js (V1 reference)

const STATIC_JS = ${JSON.stringify(STATIC_JS)};
const BUSINESS_SITE_CSS = ${JSON.stringify(BUSINESS_SITE_CSS)};
const MULTIPAGE_SITE_CSS = ${JSON.stringify(MULTIPAGE_SITE_CSS)};

module.exports = { STATIC_JS, BUSINESS_SITE_CSS, MULTIPAGE_SITE_CSS };
`;

fs.writeFileSync(path.join(__dirname, '../utils/staticAssets.js'), out);
console.log('Wrote staticAssets.js', out.length, 'bytes');
