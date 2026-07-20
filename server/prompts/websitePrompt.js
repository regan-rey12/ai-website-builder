function buildWebsiteContentPrompt(userPrompt) {
  return `You are a professional copywriter for small business websites.

The user describes their business below. Write original, specific marketing copy — never use lorem ipsum, placeholders, or generic filler.

USER PROMPT:
"""
${userPrompt}
"""

Return ONLY valid JSON (no markdown, no code fences, no explanation) with this exact structure:

{
  "detectedType": "business" | "restaurant" | "portfolio",
  "confidence": <number between 0 and 1>,
  "content": {
    "navbar": {
      "businessName": "<max 30 chars>",
      "tagline": "<max 50 chars>"
    },
    "hero": {
      "headline": "<max 60 chars>",
      "subheadline": "<max 120 chars>",
      "ctaButton": "<max 20 chars>",
      "ctaButtonSecondary": "<max 20 chars>"
    },
    "about": {
      "title": "<max 40 chars>",
      "description": "<max 300 chars>",
      "mission": "<max 150 chars>",
      "stats": [
        { "number": "<max 10 chars>", "label": "<max 20 chars>" },
        { "number": "<max 10 chars>", "label": "<max 20 chars>" },
        { "number": "<max 10 chars>", "label": "<max 20 chars>" }
      ]
    },
    "services": {
      "title": "<max 40 chars>",
      "subtitle": "<max 100 chars>",
      "items": [
        { "icon": "<single emoji>", "title": "<max 30 chars>", "description": "<max 100 chars>" },
        { "icon": "<single emoji>", "title": "<max 30 chars>", "description": "<max 100 chars>" },
        { "icon": "<single emoji>", "title": "<max 30 chars>", "description": "<max 100 chars>" }
      ]
    },
    "testimonials": {
      "title": "<max 40 chars>",
      "items": [
        {
          "name": "<max 30 chars>",
          "role": "<max 40 chars>",
          "company": "<max 30 chars>",
          "comment": "<max 150 chars>",
          "rating": 5
        },
        {
          "name": "<max 30 chars>",
          "role": "<max 40 chars>",
          "company": "<max 30 chars>",
          "comment": "<max 150 chars>",
          "rating": 5
        }
      ]
    },
    "contact": {
      "title": "<max 40 chars>",
      "subtitle": "<max 100 chars>",
      "email": "<email or empty string>",
      "phone": "<phone or empty string>",
      "address": "<address or empty string>"
    },
    "footer": {
      "tagline": "<max 80 chars>",
      "copyright": "© ${new Date().getFullYear()} <business name>. All rights reserved."
    }
  }
}

Rules:
- detectedType: pick the best match — "restaurant" for food/dining, "portfolio" for freelancers/creatives, "business" for companies/services.
- confidence: how sure you are (0.0–1.0).
- Use realistic details from the user prompt. If they gave Phone:/Email:/WhatsApp:/Address: lines, copy those EXACTLY into contact fields.
- All testimonial ratings must be 5.
- Sound professional, warm, and credible.`;
}

module.exports = { buildWebsiteContentPrompt };
