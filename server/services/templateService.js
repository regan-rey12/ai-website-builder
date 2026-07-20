const RESTAURANT_KEYWORDS = [
  'restaurant',
  'food',
  'cafe',
  'bar',
  'pizza',
  'coffee',
  'dining',
  'kitchen',
  'eat',
  'cook',
  'chef',
  'menu',
];

const PORTFOLIO_KEYWORDS = [
  'portfolio',
  'designer',
  'developer',
  'artist',
  'photographer',
  'freelancer',
  'creative',
  'writer',
];

function matchKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((word) => lower.includes(word));
}

function selectTemplateByKeywords(userPrompt) {
  if (matchKeywords(userPrompt, RESTAURANT_KEYWORDS)) return 'restaurant';
  if (matchKeywords(userPrompt, PORTFOLIO_KEYWORDS)) return 'portfolio';
  return 'business';
}

function selectTemplate(userPrompt, detectedType, confidence) {
  const normalized = String(detectedType || '').toLowerCase();
  const valid = ['business', 'restaurant', 'portfolio'];

  if (confidence >= 0.7 && valid.includes(normalized)) {
    return normalized;
  }

  return selectTemplateByKeywords(userPrompt);
}

module.exports = { selectTemplate, selectTemplateByKeywords };
