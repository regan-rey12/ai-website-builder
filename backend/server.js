const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');

dotenv.config();

const app = express();
app.use(express.json());

// CORS configuration
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
if (allowedOriginsEnv) {
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser tools (no origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      },
    })
  );
} else {
  // Development: allow all origins
  app.use(cors());
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY in environment variables.');
  process.exit(1);
}

// Rate limiter for main generation endpoint
const generateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Fixed JS shipped with every generated site
const STATIC_JS = `
document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  const navLinks = document.querySelector('.nav-links');
  const header = document.querySelector('.site-header');

  // Mobile nav toggle
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
      if (siteNav) siteNav.classList.toggle('active');
      if (navLinks) navLinks.classList.toggle('active');
    });
  }

  // Header scrolled state
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  // Smooth scroll + preview navigation bridge
  document.addEventListener('click', function (event) {
    // Smooth scroll for in-page anchors
    const hashLink = event.target.closest('a[href^="#"]');
    if (hashLink) {
      const id = hashLink.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // In preview iframe: intercept pageX.html links and notify parent
    const pageLink = event.target.closest('a[href$=".html"]');
    if (pageLink && window.parent && window.parent !== window) {
      const href = pageLink.getAttribute('href');
      window.parent.postMessage({ type: 'navigate', href }, '*');
      event.preventDefault();
    }
  });
});
`;

// Navigation CSS overrides (desktop nav always visible, mobile hamburger)
const NAVIGATION_CSS_OVERRIDES = `
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(17, 24, 39, 0.06);
}

.site-header .header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: #111827;
  text-decoration: none;
}

.site-header .site-nav {
  display: block;
}

.site-header .nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-header .nav-links li {
  margin: 0;
}

.site-header .nav-links a {
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  color: #4b5563;
  font-size: 0.95rem;
}

.site-header .nav-links a:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.site-header .nav-links a.active,
.site-header .nav-links a[aria-current="page"] {
  background-color: #111827;
  color: #ffffff;
}

.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  width: 2.5rem;
  height: 2.5rem;
  position: relative;
  text-indent: -9999px;
}

.nav-toggle::before,
.nav-toggle::after {
  content: '';
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  height: 2px;
  background-color: #111827;
  border-radius: 999px;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.nav-toggle::before {
  top: 0.8rem;
  box-shadow: 0 0.4rem 0 0 #111827;
}

.nav-toggle::after {
  top: 1.6rem;
}

body.nav-open .nav-toggle::before {
  transform: translateY(0.4rem) rotate(45deg);
  box-shadow: none;
}

body.nav-open .nav-toggle::after {
  transform: translateY(-0.4rem) rotate(-45deg);
}

@media (min-width: 769px) {
  .nav-toggle {
    display: none !important;
  }

  .site-header .site-nav {
    display: block !important;
  }

  .site-header .nav-links {
    display: flex !important;
  }
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .site-header .site-nav {
    display: none !important;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: #ffffff;
    padding: 1rem 1.25rem;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
    z-index: 50;
  }

  body.nav-open .site-header .site-nav,
  .site-header .site-nav.active {
    display: block !important;
  }

  .site-header .nav-links {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-header .nav-links li {
    margin-bottom: 0.5rem;
  }
}
`;

// Typography & layout overrides
const TYPOGRAPHY_OVERRIDES = `
html {
  font-size: 16px;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: #111827;
}

p,
li {
  font-size: 0.95rem;
  line-height: 1.7;
}

h1,
.h1 {
  font-size: clamp(2rem, 1.6rem + 1.2vw, 3rem);
  line-height: 1.1;
  font-weight: 700;
}

h2,
.h2 {
  font-size: clamp(1.5rem, 1.3rem + 0.6vw, 2.25rem);
  line-height: 1.2;
  font-weight: 600;
}

h3,
.h3 {
  font-size: clamp(1.25rem, 1.1rem + 0.4vw, 1.75rem);
  line-height: 1.3;
  font-weight: 600;
}

small,
.text-sm {
  font-size: 0.875rem;
  line-height: 1.6;
}

button,
.btn,
.btn-primary,
.btn-secondary,
.site-header .nav-links a {
  font-size: 0.95rem;
}
`;

const LAYOUT_OVERRIDES = `
.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

main {
  padding-bottom: 3.5rem;
}

section,
.section {
  padding: 3.5rem 0;
}

/* Forms */
form,
.form {
  max-width: 640px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

input,
textarea,
select {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  line-height: 1.4;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.4);
}
`;

// Portfolio hero background overrides
const HERO_BACKGROUND_OVERRIDES = `
/* Portfolio: hero section with full-bleed background image */
body.portfolio .hero {
  position: relative;
  padding: 5rem 0;
  overflow: hidden;
  color: #ffffff;
  background-color: #0f172a;
}

/* Ensure hero content sits above the background image */
body.portfolio .hero .container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Make .hero-image behave like a background layer */
body.portfolio .hero .hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.4;
}

/* Optional: tighten hero buttons on dark background */
body.portfolio .hero .btn-primary,
body.portfolio .hero .btn-secondary {
  margin-right: 0.75rem;
}
`;

// Business/showcase single-page CSS template
const BUSINESS_SITE_CSS = `
:root {
  --bg: #0f172a;
  --bg-soft: #0b1120;
  --bg-alt: #f9fafb;
  --primary: #22c55e;
  --primary-soft: #22c55e1a;
  --text-main: #0f172a;
  --text-soft: #6b7280;
  --border-subtle: #e5e7eb;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text-main);
  background-color: #ffffff;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Layout */
.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

main {
  padding-bottom: 3.5rem;
}

section {
  padding: 3.5rem 0;
}

/* Header & nav */
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  color: #f9fafb;
  border-bottom: 1px solid rgba(148, 163, 184, 0.5);
}

.site-header .header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: #f9fafb;
  text-decoration: none;
}

/* Nav basics */
.site-header .site-nav {
  display: block;
}

.site-header .nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-header .nav-links li {
  margin: 0;
}

.site-header .nav-links a {
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.site-header .nav-links a:hover {
  background-color: rgba(15, 23, 42, 0.5);
}

.site-header .nav-links a.active,
.site-header .nav-links a[aria-current="page"] {
  background-color: #22c55e;
  color: #022c22;
}

/* Hamburger */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  width: 2.5rem;
  height: 2.5rem;
  position: relative;
  text-indent: -9999px;
}

.nav-toggle::before,
.nav-toggle::after {
  content: "";
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  height: 2px;
  background-color: #f9fafb;
  border-radius: 999px;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.nav-toggle::before {
  top: 0.8rem;
  box-shadow: 0 0.4rem 0 0 #f9fafb;
}

.nav-toggle::after {
  top: 1.6rem;
}

body.nav-open .nav-toggle::before {
  transform: translateY(0.4rem) rotate(45deg);
  box-shadow: none;
}

body.nav-open .nav-toggle::after {
  transform: translateY(-0.4rem) rotate(-45deg);
}

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  padding: 5rem 0 4rem;
  background: radial-gradient(circle at top left, #22c55e1a, #0b1120 55%);
  color: #f9fafb;
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 3rem;
  align-items: center;
}

.hero-heading {
  font-size: clamp(2.3rem, 1.8rem + 1.5vw, 3rem);
  line-height: 1.1;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1rem;
  color: #e5e7eb;
  margin-bottom: 1.75rem;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  background-color: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.badge span.icon {
  font-size: 0.9rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Hero card */
.hero-media {
  justify-self: center;
}

.hero-card {
  background-color: rgba(15, 23, 42, 0.9);
  border-radius: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.8);
  max-width: 360px;
}

.hero-card h3 {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a5b4fc;
  margin-bottom: 0.75rem;
}

.hero-card p {
  font-size: 0.9rem;
  color: #e5e7eb;
  margin-bottom: 1rem;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.7rem 1.4rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.btn-primary {
  background: linear-gradient(to right, #22c55e, #4ade80);
  color: #022c22;
  box-shadow: 0 12px 30px rgba(34, 197, 94, 0.35);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 40px rgba(34, 197, 94, 0.45);
}

.btn-secondary {
  background-color: transparent;
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.7);
}

.btn-secondary:hover {
  background-color: rgba(15, 23, 42, 0.85);
}

/* Sections */
.section-heading {
  font-size: clamp(1.6rem, 1.3rem + 0.6vw, 2.1rem);
  margin-bottom: 0.75rem;
}

.section-intro {
  max-width: 640px;
  color: var(--text-soft);
  margin-bottom: 2rem;
}

/* About */
.section-about {
  background-color: #ffffff;
}

.about-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}

/* Services */
.section-services {
  background-color: var(--bg-alt);
}

.services-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.service-card {
  background-color: #ffffff;
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  padding: 1.25rem 1.3rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.service-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

/* Testimonials */
.section-testimonials {
  background-color: #ffffff;
}

.testimonial-card {
  max-width: 640px;
  padding: 1.75rem;
  border-radius: 1.25rem;
  background: radial-gradient(circle at top left, #22c55e1a, #ffffff 60%);
  border: 1px solid var(--border-subtle);
}

.testimonial-quote {
  font-style: italic;
  margin-bottom: 0.75rem;
}

.testimonial-meta {
  font-size: 0.9rem;
  color: var(--text-soft);
}

/* Contact */
.section-contact {
  background-color: #0b1120;
  color: #e5e7eb;
}

.contact-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}

.contact-details p {
  margin-bottom: 0.4rem;
}

.contact-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.contact-value {
  font-weight: 500;
}

/* Contact form */
.form {
  max-width: 640px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #e5e7eb;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid #1f2937;
  font-size: 0.95rem;
  line-height: 1.4;
  background-color: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.4);
}

/* Footer */
.site-footer {
  background-color: #020617;
  color: #9ca3af;
  padding: 1.5rem 0 2rem;
  font-size: 0.85rem;
}

.site-footer .footer-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.footer-branding {
  font-weight: 600;
  color: #e5e7eb;
}

/* Responsive */
@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-media {
    order: -1;
  }

  .about-grid,
  .contact-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .site-header .header-inner {
    padding-inline: 1rem;
  }

  .nav-toggle {
    display: block;
  }

  .site-header .site-nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: rgba(15, 23, 42, 0.98);
    padding: 1rem 1.25rem;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.5);
  }

  body.nav-open .site-header .site-nav,
  .site-header .site-nav.active {
    display: block;
  }

  .site-header .nav-links {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-header .nav-links li {
    margin-bottom: 0.5rem;
  }

  .hero {
    padding: 4rem 0 3rem;
  }
}
`;

// High-level reference site patterns to guide structure & depth
const referenceSites = {
  portfolio: {
    description: `
A modern personal portfolio website with a strong narrative and clear presentation of work.
The design feels similar in quality to well-known designer/developer portfolios:
- Clean hero section with name, role, and CTA
- Always-visible or sticky navigation
- Projects presented as cards or case studies
- Professional typography and generous whitespace
- Clear contact / hire CTA
`,
    sections: [
      'Hero with name, role, short positioning, and primary CTA',
      'About section with personal story, background, and values',
      'Projects / case studies grid with descriptions of work and outcomes',
      'Skills and tools section (grouped, not just a flat list)',
      'Testimonials or social proof (optional but encouraged)',
      'Contact / work-with-me section with a simple form or clear CTA',
    ],
  },

  business: {
    description: `
A professional SaaS / business marketing website similar in structure to modern startups.
Clear value proposition, trust signals, and structured content that can be used as-is.
`,
    sections: [
      'Hero section with strong value proposition, subcopy, and primary CTA',
      'Key benefits or features section (3–6 items, each with a short description)',
      'How it works or process overview (3–4 steps)',
      'Social proof: logos, testimonials, or metrics',
      'Pricing preview or plans (if relevant)',
      'FAQ or objections handling',
      'Final call-to-action band with a clear next step',
    ],
  },

  ecommerce: {
    description: `
A modern ecommerce brand website focused on products and lifestyle.
The design feels like a contemporary DTC brand: large visuals, clear hierarchy, and simple flows.
`,
    sections: [
      'Hero banner featuring key product or collection with CTA',
      'Featured products grid with images, short copy, and pricing',
      'Brand story or manifesto section',
      'Customer reviews or social proof',
      'Benefits / guarantees (shipping, returns, support)',
      'Newsletter signup or community CTA',
      'Footer with links, policies, and basic contact info',
    ],
  },

  blog: {
    description: `
A content-first blog or editorial site with high emphasis on readability and structure.
Feels similar in quality to a well-designed tech or design blog.
`,
    sections: [
      'Hero or intro section with blog purpose and key topics',
      'Featured articles or latest posts grid/list',
      'Category or topic navigation',
      'Author / team intro section',
      'Newsletter or subscription CTA',
      'Single article layout pattern with hero, body text, and author bio',
      'Footer with links, categories, and contact/social info',
    ],
  },
};

function getReferenceSiteForDescription(description = '') {
  const d = description.toLowerCase();

  if (d.includes('portfolio')) return referenceSites.portfolio;
  if (d.includes('ecommerce') || d.includes('e-commerce') || d.includes('shop') || d.includes('store')) {
    return referenceSites.ecommerce;
  }
  if (d.includes('blog') || d.includes('magazine') || d.includes('news')) {
    return referenceSites.blog;
  }

  // Default: business / SaaS landing
  return referenceSites.business;
}

// Category-specific design guide (more qualitative)
function getDesignGuideForDescription(description = '') {
  const d = description.toLowerCase();

  if (d.includes('portfolio')) {
    return `
This is a personal portfolio website.

Visual style inspiration:
- Clean, minimal personal sites similar in feel to modern designer/developer portfolios.
- Strong typography, generous whitespace, simple color palette.
- Emphasis on project case studies, screenshots, and an "About" story.

Layout patterns:
- Hero section with name, role, and primary CTA ("View work", "Hire me").
- Projects grid or list with images and short descriptions.
- About + skills section (bio, skills, tools).
- Testimonials (optional) and a clear contact section or call-to-action.

Implementation detail for hero background image:
- For the main hero section on the home page, wrap it in:
  <section class="hero hero-with-bg"> ... </section>
- Inside that section, include ONE <img> with class="hero-bg-image" to serve as the background.
- All hero text/content should sit inside a nested .container or .hero-inner so it overlays the background image cleanly.`;
  }

  if (
    d.includes('ecommerce') ||
    d.includes('e-commerce') ||
    d.includes('shop') ||
    d.includes('store')
  ) {
    return `
This is a modern ecommerce website.

Visual style inspiration:
- Product-focused layouts like contemporary DTC brands (large imagery, bold type).
- Clear hierarchy for product info, pricing, and CTAs.

Layout patterns:
- Hero/banner with featured product or collection.
- Product grid with cards (image, name, price, CTA).
- Product detail sections with gallery, description, features, reviews.
- Trust signals (guarantees, shipping, customer quotes) and a clear checkout CTA.`;
  }

  if (d.includes('blog') || d.includes('magazine') || d.includes('news')) {
    return `
This is a content-first blog or editorial site.

Visual style inspiration:
- Clean reading experiences like Medium or modern tech blogs.
- Focus on typography and readability.

Layout patterns:
- Homepage with featured posts and latest posts list.
- Article listing page with titles, excerpts, dates, and tags.
- Single article layout with good typography, images, and author info.
- Simple categories/tags navigation and a newsletter or subscribe CTA.`;
  }

  // Default: SaaS / marketing / landing
  return `
This is a modern SaaS / product marketing site.

Visual style inspiration:
- stripe.com, linear.app, notion.so style: clean, minimal, with strong type and clear CTAs.
- Limited color palette with a primary accent and plenty of white space.

Layout patterns:
- Hero with big headline, supporting copy, primary and secondary CTAs.
- Feature sections with icons or screenshots.
- Social proof (logos, testimonials, metrics).
- Optional pricing section and a strong final CTA band.`;
}

// OpenRouter helper
async function callModel(prompt, model) {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': APP_ORIGIN,
          'X-Title': 'AI Website Builder',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error calling ${model}:`, error.message);
    if (error.response) {
      console.error('OpenRouter response data:', error.response.data);
    }
    throw new Error(`Failed to generate with ${model}`);
  }
}

// Unsplash: get real image URL
async function getUnsplashImageUrl(keywords, width, height) {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const response = await axios.get(`${UNSPLASH_API_BASE}/photos/random`, {
      params: {
        query: keywords || 'business',
        orientation: width >= height ? 'landscape' : 'portrait',
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const raw = response.data.urls.raw;
    const w = width || 1200;
    const h = height || 600;

    return `${raw}&w=${w}&h=${h}&fit=crop`;
  } catch (error) {
    console.error('Unsplash API error:', error.response?.data || error.message);
    return null;
  }
}

// Replace <img> src with Unsplash URLs
async function replaceImagesWithUnsplash(pageHtml) {
  if (!UNSPLASH_ACCESS_KEY) {
    return pageHtml;
  }

  const $ = cheerio.load(pageHtml, { decodeEntities: false });
  const cache = new Map();
  const tasks = [];

  $('img').each((i, el) => {
    const $el = $(el);

    tasks.push(
      (async () => {
        const src = $el.attr('src') || '';
        const alt = $el.attr('alt') || '';

        // Size: look for "1200x600" or "400x300"
        let width = 1200;
        let height = 600;
        const sizeMatch = src.match(/(\d+)[xX](\d+)/);
        if (sizeMatch) {
          width = parseInt(sizeMatch[1], 10);
          height = parseInt(sizeMatch[2], 10);
        }

        // Keywords: from query or alt
        let keywords = '';
        const queryMatch = src.match(/\?([^"'>]+)/);
        if (queryMatch) {
          keywords = queryMatch[1]
            .replace(/\+/g, ' ')
            .replace(/[^\w, ]+/g, ' ')
            .trim();
        } else if (alt) {
          keywords = alt;
        } else {
          keywords = 'business';
        }

        const cacheKey = `${width}x${height}:${keywords.toLowerCase() || 'business'}`;
        if (cache.has(cacheKey)) {
          const cachedUrl = cache.get(cacheKey);
          if (cachedUrl) {
            $el.attr('src', cachedUrl);
          }
          return;
        }

        const newUrl = await getUnsplashImageUrl(keywords, width, height);
        cache.set(cacheKey, newUrl);
        if (newUrl) {
          $el.attr('src', newUrl);
        }
      })()
    );
  });

  await Promise.all(tasks);

  const htmlWithoutDoctype = $.html();
  if (/<!doctype html>/i.test(pageHtml)) {
    return '<!DOCTYPE html>\n' + htmlWithoutDoctype;
  }
  return htmlWithoutDoctype;
}

// Business/showcase content generator returning JSON with richer copy
async function generateBusinessContent(description) {
  const model = process.env.BUSINESS_MODEL || 'openai/gpt-oss-20b:free';

  const prompt = `
You are generating structured content for a simple, professional business website.

The website is for a business, farm, shop, school, clinic, NGO, church, or personal service provider
in Uganda or East Africa. Visitors should quickly understand:
- What the organization does
- Where it is located
- Who it serves
- How to contact them (phone, WhatsApp, email, address)

User description:
"${description}"

Return ONLY valid JSON (no markdown, no explanations) matching this TypeScript type:

type Section =
  | { type: "hero"; title: string; subtitle: string; primaryCta: string; secondaryCta?: string; badges?: string[] }
  | { type: "about"; heading: string; body: string }
  | { type: "services"; heading: string; items: { title: string; body: string }[] }
  | { type: "testimonials"; heading: string; items: { quote: string; name: string; role: string }[] }
  | { type: "contact"; heading: string; description: string; phone?: string; whatsapp?: string; email?: string; address?: string };

interface PageContent {
  pageId: string; // "home"
  sections: Section[];
}

Content requirements (important):
- hero.title: clear, specific, and benefit-focused, max 12 words
  (e.g. "Fresh maize & beans for schools in Kampala").
- hero.subtitle: 2–3 full sentences explaining what the business does, who it serves, and why it is different.
- hero.badges: 2–4 short phrases that build trust or context
  (e.g. "Family-owned since 2010", "Serving Kampala & Wakiso", "Trusted by 20+ schools").
- about.body: at least 120–150 words, written in 2–4 short paragraphs (separate paragraphs with "\\n\\n").
  Explain the story, values, and what makes this business unique in its community.
- services.items: 3–5 items.
  - Each item.title is a specific service or product.
  - Each item.body is 1–3 full sentences describing what it is, who it is for, and the main benefit.
- testimonials (if present): 1–3 short quotes (1–2 sentences each) with realistic fictional names and roles
  that fit the business (e.g. "Head teacher, Kampala Primary").
- contact.description: 2–3 sentences explaining how people can reach out or visit
  (mention phone/WhatsApp if provided in the user description).

Tone and style:
- Warm, trustworthy, and clear.
- Simple English that most Ugandan customers can understand.
- Focus on practical benefits and local context (markets, schools, neighborhoods, communities).

Rules:
- Always include at least these sections in this order:
  1) hero
  2) about
  3) services
  4) contact
- testimonials section is optional but recommended if it makes sense from the description.
- Use realistic, specific text based on the user description (no lorem ipsum, no placeholders).
- If the user mentions phone, WhatsApp, email, or address in the description, copy those values EXACTLY
  into the contact section (do not change digits, do not change the email domain, do not invent new contact details).
- Keep JSON well-formed and valid.
`;

  const raw = await callModel(prompt, model);

  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error('Failed to parse business content JSON:', err.message);
    console.error('Raw model output (first 500 chars):', raw.slice(0, 500));
    throw new Error('Invalid JSON returned for business content');
  }
}

// Build HTML from business PageContent JSON
function buildBusinessHtml(content) {
  const sections = content.sections || [];

  const hero = sections.find((s) => s.type === 'hero') || {};
  const about = sections.find((s) => s.type === 'about') || {};
  const services = sections.find((s) => s.type === 'services') || {};
  const testimonials = sections.find((s) => s.type === 'testimonials');
  const contact = sections.find((s) => s.type === 'contact') || {};

  // Normalize phone/WhatsApp for hrefs
  const rawPhone = (contact.phone || '').trim();
  const rawWhatsApp = (contact.whatsapp || '').trim();

  const normalizeForHref = (value) => value.replace(/[^0-9]/g, '');

  const telHref = rawPhone ? `tel:${rawPhone.replace(/\s+/g, '')}` : null;
  // Prefer explicit WhatsApp if provided, otherwise reuse phone as WhatsApp
  const waNumber = rawWhatsApp || rawPhone;
  const waHref = waNumber ? `https://wa.me/${normalizeForHref(waNumber)}` : null;

  // Primary CTA logic:
  // 1) If WhatsApp available → open WhatsApp chat
  // 2) Else if phone available → tel:
  // 3) Else → scroll to contact section
  const primaryHref = waHref || telHref || '#contact';
  const primaryTarget = waHref ? '_blank' : '_self';
  const primaryRel = waHref ? 'noopener noreferrer' : '';

  // Secondary CTA: scroll to services section by default
  const secondaryHref = '#services';

  const heroBadgesHtml = (hero.badges || [])
    .map(
      (b) => `
      <span class="badge">
        <span class="icon">★</span>
        <span>${b}</span>
      </span>
    `
    )
    .join('');

  const servicesHtml = (services.items || [])
    .map(
      (item) => `
      <article class="service-card">
        <h3>${item.title || ''}</h3>
        <p>${item.body || ''}</p>
      </article>
    `
    )
    .join('');

  const testimonialsHtml = testimonials
    ? `
  <section class="section-testimonials">
    <div class="container">
      <h2 class="section-heading">${testimonials.heading || 'What our clients say'}</h2>
      <div class="section-intro">
        <p>Hear from some of the people and organizations we’ve worked with.</p>
      </div>
      <div class="testimonial-card">
        ${
          (testimonials.items || [])
            .map(
              (t) => `
          <p class="testimonial-quote">“${t.quote || ''}”</p>
          <p class="testimonial-meta">${t.name || ''}${t.role ? ', ' + t.role : ''}</p>
        `
            )
            .join('<hr style="border:none;border-top:1px solid rgba(148,163,184,0.4);margin:0.75rem 0;" />') || ''
        }
      </div>
    </div>
  </section>
  `
    : '';

  // Make contact details clickable (phone, WhatsApp, email, address)
  const contactDetailsHtml = `
    ${
      rawPhone
        ? `<p>
             <span class="contact-label">Phone</span><br />
             <span class="contact-value">${
               telHref ? `<a href="${telHref}">${rawPhone}</a>` : rawPhone
             }</span>
           </p>`
        : ''
    }
    ${
      waNumber
        ? `<p>
             <span class="contact-label">WhatsApp</span><br />
             <span class="contact-value">${
               waHref ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer">${waNumber}</a>` : waNumber
             }</span>
           </p>`
        : ''
    }
    ${
      contact.email
        ? `<p>
             <span class="contact-label">Email</span><br />
             <span class="contact-value"><a href="mailto:${contact.email}">${contact.email}</a></span>
           </p>`
        : ''
    }
    ${
      contact.address
        ? `<p>
             <span class="contact-label">Address</span><br />
             <span class="contact-value">${contact.address}</span>
           </p>`
        : ''
    }
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="styles.css" />
  <title>${hero.title || 'Business Website'}</title>
</head>
<body class="business">
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="logo">${hero.title || 'Your Business'}</a>
      <button class="nav-toggle" aria-label="Toggle navigation">Menu</button>
      <nav class="site-nav">
        <ul class="nav-links">
          <li><a href="index.html" class="active">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <!-- Hero -->
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <h1 class="hero-heading">${hero.title || ''}</h1>
          <p class="hero-subtitle">${hero.subtitle || ''}</p>
          <div class="hero-badges">
            ${heroBadgesHtml}
          </div>
          <div class="hero-actions">
            ${
              hero.primaryCta
                ? `<a href="${primaryHref}" class="btn-primary" target="${primaryTarget}" rel="${primaryRel}">${hero.primaryCta}</a>`
                : ''
            }
            ${
              hero.secondaryCta
                ? `<a href="${secondaryHref}" class="btn-secondary">${hero.secondaryCta}</a>`
                : ''
            }
          </div>
        </div>
        <div class="hero-media">
          <div class="hero-card">
            <h3>About us</h3>
            <p>${(about.body || '').slice(0, 220)}...</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section id="about" class="section-about">
      <div class="container">
        <div class="about-grid">
          <div>
            <h2 class="section-heading">${about.heading || 'Who we are'}</h2>
            <p class="section-intro">${about.body || ''}</p>
          </div>
          <div>
            <div class="service-card">
              <h3>Who we serve</h3>
              <p>We work with local customers and organizations who rely on consistent quality and trusted relationships.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services -->
    <section id="services" class="section-services">
      <div class="container">
        <h2 class="section-heading">${services.heading || 'What we offer'}</h2>
        <p class="section-intro">
          Explore our key services and offerings. Each project is tailored to the needs of our clients and communities.
        </p>
        <div class="services-grid">
          ${servicesHtml}
        </div>
      </div>
    </section>

    ${testimonialsHtml}

    <!-- Contact -->
    <section id="contact" class="section-contact">
      <div class="container contact-grid">
        <div class="contact-details">
          <h2 class="section-heading">${contact.heading || 'Get in touch'}</h2>
          <p class="section-intro">
            ${contact.description || 'Call, message, or visit us to learn more or place an order.'}
          </p>
          ${contactDetailsHtml}
        </div>
        <div>
          <form class="form">
            <div class="form-field">
              <label for="name">Name</label>
              <input id="name" name="name" type="text" placeholder="Your name" />
            </div>
            <div class="form-field">
              <label for="email">Email or WhatsApp</label>
              <input id="email" name="email" type="text" placeholder="Your email or WhatsApp number" />
            </div>
            <div class="form-field">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="4" placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" class="btn-primary">Send message</button>
          </form>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-branding">
        ${hero.title || 'Your Business'}
      </div>
      <div>
        © ${new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  </footer>

  <script src="script.js" defer></script>
</body>
</html>
`;
}

// Manager function for multi-page AI-generated sites
async function generateWebsiteManager(description, numPages) {
  const designGuide = getDesignGuideForDescription(description);
  const reference = getReferenceSiteForDescription(description);
  const isPortfolio = description.toLowerCase().includes('portfolio');

  // 1) PLAN THE WHOLE SITE FIRST – richer section descriptions with reference
  const planningPrompt = `
You are an expert UX/web designer.

Plan a professional, multi-page website based on this description:
"${description}"

Number of pages: ${numPages}

Additional context about this website type:
${designGuide}

Reference style and structure (for inspiration, not copy-paste):
${reference.description}

Typical sections for this kind of site:
${reference.sections.map((s) => '- ' + s).join('\n')}

Use the reference as a guide for quality, depth, and structure, but ADAPT it to this specific business or product.
Do NOT copy sentences; write original content that matches the user's concept.

Create a site map where each page has:
- Page number
- Page name (e.g., Home, About, Services, Pricing, Blog, Contact, Portfolio)
- Purpose / main focus
- 3–7 distinct sections with short descriptions

For each section description:
- Write 1–3 full sentences (not just a short phrase).
- Make the content specific to this business or product (benefits, outcomes, details).

Format the plan clearly in markdown like:

Page 1 – Home
File: page1.html
Purpose: ...
Sections:
1. ...
2. ...

Page 2 – ...
File: page2.html
Purpose: ...
Sections:
1. ...
2. ...

Design style and professionalism:
- The website should look like a modern, production-quality site suitable for real users.
- Use:
  - A clean, minimal layout with plenty of white space.
  - A limited color palette (1 primary, 1 accent, neutral backgrounds).
  - A clear typography hierarchy and strong calls-to-action.
- Avoid:
  - Too many colors.
  - Excessive borders or heavy shadows.
  - Overloaded sections with too much text.

Rules:
- You MUST create exactly ${numPages} pages in the plan. Do NOT add extra pages beyond this number.
- Each page must have a UNIQUE main focus and sections (no duplicate pages).
- Content should feel like a real business or product site (no lorem ipsum).
- Use fictional company names and people for testimonials and logos unless the user explicitly provided real names; do not invent endorsements from real brands like "Shopify" or "Stripe" unless mentioned.
- Do NOT include any code; this is just a human-readable plan.
`;

  const sitePlan = await callModel(planningPrompt, 'x-ai/grok-code-fast-1');

  // Navigation file mapping
  const navFileLines = Array.from(
    { length: numPages },
    (_, idx) => `Page ${idx + 1}: "page${idx + 1}.html"`
  ).join('\n    ');

  // 2) GENERATE HTML FOR EACH PAGE
  const pagePromises = Array.from({ length: numPages }, (_, i) => {
    const pageNumber = i + 1;
    const bodyClassAttr = isPortfolio ? ' class="portfolio"' : '';

    const pagePrompt = `
You are implementing Page ${pageNumber} of a multi-page website.

Overall website plan:
----------------
${sitePlan}
----------------

Additional context about this website type:
${designGuide}

Implement ONLY "Page ${pageNumber}" from the plan above.

HTML requirements (important):
- Return ONLY the HTML that belongs inside the <body> tag.
  DO NOT include <html>, <head>, or <body> tags.
- Structure:
  - Use <header>, <nav>, <main>, <section>, <article>, <footer>.
  - Include a header with logo/title and navigation.
  - Include multiple meaningful sections (based on this page's sections in the plan).
  - Include a footer.
- For each major section from the plan:
  - Include a clear heading (3–7 words).
  - Add at least 2–4 sentences of descriptive copy (or 3–6 bullet points) that explain benefits, features, or details.
  - Avoid sections that only have 1 short sentence or a single line of text.
- The overall page should feel like it could be used as-is by a real business (no placeholder-y text).

Global header and footer (very important):
- Every page MUST use the SAME basic header and footer structure.
- Header:
  - Wrap in <header class="site-header"> ... </header>
  - Inside, use a <div class="container header-inner"> with:
    - A logo/title: <a href="page1.html" class="logo">YourBrand</a> (adapt "YourBrand" to fit the user's concept)
    - A <button class="nav-toggle">Menu</button> for mobile
    - A <nav class="site-nav"> with a <ul class="nav-links"> and <li><a>...</a></li> items
- Footer:
  - Wrap in <footer class="site-footer"> ... </footer>
  - Include at least:
    - Branding (site name or logo text)
    - Short description or tagline
    - Simple links or contact info (e.g., email, social, legal links if relevant)

Navigation:
- The navigation links (inside .nav-links) MUST be the same on all pages
  (same order, same labels), only the "active" page visual state may differ.
- Links must point to these exact files:
    ${navFileLines}
  (e.g., href="page1.html", href="page2.html", etc.).
- Do NOT create links to page files above page${numPages}.html.
- Use human-friendly labels based on the page names in the plan 
  (e.g., Home, About, Services, Contact, Blog).

Images:
- Each page should use between 2 and 4 images TOTAL.
- Only include images in sections where they clearly support understanding (product overview, team, testimonials, key features).
- Do NOT add an image to every single section; some sections should be text-only.
- Typical useful placements:
  - 1 hero/banner image (if the page has a hero section).
  - 1–2 images for feature highlights, product visuals, or team/testimonials.
- Use ONLY dynamic stock-style images from https://source.unsplash.com with explicit sizes and simple English query keywords that match the page purpose and the user's concept. Examples:
  - Hero/banner image (1200x600), e.g.:
    https://source.unsplash.com/1200x600/?analytics,dashboard
    https://source.unsplash.com/1200x600/?ecommerce,store
  - Section/card images (400x300), e.g.:
    https://source.unsplash.com/400x300/?team,people
    https://source.unsplash.com/400x300/?product,detail
- Choose 1–3 relevant English keywords per image based on the page content (product type, industry, audience).
- Do NOT use via.placeholder.com or any other placeholder image service; use only source.unsplash.com URLs.
- Always include descriptive alt text for accessibility that matches the image idea (e.g. "Team collaborating in a modern office", "Dashboard showing analytics charts").
- Give images a class that indicates their role, such as:
  - class="hero-image"
  - class="section-image"
  - class="card-image"
  - class="avatar-image"

Classes & layout:
- Wrap the main content of each major section in a <div class="container"> to keep content aligned and centered.
- Use clear, descriptive class names (e.g., "hero", "section", "container", "btn-primary", "feature-grid").
- Design should feel like a modern site appropriate for this website type: hero, features, social proof, CTAs, etc.
- If you include a form (e.g., contact form, signup form):
  - Wrap it in <form class="form">.
  - Group each field in <div class="form-field"> with a <label> and <input>/<textarea>.
  - Keep the form concise but complete (e.g., name, email, message for a contact form).
- Avoid repeating entire sections that clearly belong to other pages in the plan.
- Content and layout should be adapted to the user's description and this specific page's purpose.

Testimonials and logos:
- If you include logos or testimonials, use fictional company names and people that fit the user's industry unless the user explicitly provided real names.
- Do not claim endorsements from real brands that the user did not mention.

Contact details and CTA behavior (very important):
- The user description may include real contact details like phone, WhatsApp, email, or address.
- If you include contact details in the page (phone, WhatsApp, email, address),
  you MUST reuse the exact values from the user description (same digits, same email domain, same wording).
- Do NOT invent or change contact details; do not "improve" them or add new numbers/emails.
- Primary calls-to-action that mean "order" or "get in touch" (e.g. "Order Now", "Book Delivery",
  "Get Started", "Call Us", "WhatsApp Us") should:
  - Either link to the contact section on the same page (e.g. href="#contact"),
  - Or use tel:, mailto:, or WhatsApp deep links based on the provided contact details (for example, tel:+256..., mailto:..., https://wa.me/...).
- Do NOT link primary CTAs like "Order Now" to another internal page such as "page3.html";
  prioritize direct contact (anchor to #contact or tel/mailto/WhatsApp).
- Do NOT mention advanced systems like online portals, online order dashboards, QR codes for tracking,
  live shipment tracking, or automatic confirmation emails, UNLESS the user explicitly described such a system
  in their original description.

Return ONLY valid HTML that would go inside <body>.
`;

    return (async () => {
      try {
        const bodyHtml = await callModel(
          pagePrompt,
          'x-ai/grok-code-fast-1'
        );

        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <title>Page ${pageNumber}</title>
</head>
<body${bodyClassAttr}>
  ${bodyHtml}
  <script src="script.js" defer></script>
</body>
</html>
`;
      } catch (err) {
        console.error(
          `HTML generation failed for page ${pageNumber}:`,
          err.message
        );

        const retryBodyHtml = await callModel(
          pagePrompt,
          'x-ai/grok-code-fast-1'
        );

        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <title>Page ${pageNumber}</title>
</head>
<body${bodyClassAttr}>
  ${retryBodyHtml}
  <script src="script.js" defer></script>
</body>
</html>
`;
      }
    })();
  });

  const htmlPagesRaw = await Promise.all(pagePromises);

  // Replace generated image URLs with real Unsplash URLs
  const htmlPages = await Promise.all(
    htmlPagesRaw.map((page) => replaceImagesWithUnsplash(page))
  );

  // Combine HTML for CSS context
  const allHtml = htmlPages.join('\n\n<!-- PAGE BREAK -->\n\n');

  // 3) GENERATE CSS
  const cssPrompt = `
You are writing a single global stylesheet (styles.css) for the multi-page website below.

Here is the FULL HTML for ALL pages:
----------------
${allHtml}
----------------

Requirements:
- Use ONLY standard CSS. Do NOT use Tailwind CSS or any CSS framework.
- Create a modern, clean, professional design:
  - Max-width centered content containers (e.g., .container { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }).
  - Comfortable spacing between sections (padding around sections, clear separation).
  - Clear typography hierarchy:
    - Larger font-size and weight for headings (h1, h2, h3).
    - Readable body text with adequate line-height.
    - Distinct styles for buttons and links.
  - A consistent color palette suitable for a modern SaaS / B2B or ecommerce product (for example, deep blue primary, neutral grays, and one accent color).

Typography (important):
- Base body text should be around 16px (e.g., body { font-size: 1rem; } on a 16px root).
- Do NOT use extremely small font sizes (avoid anything below 0.875rem / 14px for any text).
- Headings should be clearly larger than body text (h1 > h2 > h3).

Navigation and header:
- Classes to style:
  - .site-header, .header-inner, .logo
  - .site-nav, .nav-toggle, .nav-links, .nav-links li, .nav-links a
- On desktop:
  - Show navigation links inline.
- On small screens:
  - .nav-toggle should be visible.
  - The main navigation elements are ".site-nav" and ".nav-links".
  - Hide the nav links by default on small screens.
  - When ".site-nav" or ".nav-links" has an "active" class, or when the <body> has class "nav-open", show the navigation links (e.g., display: block or flex).
- Optionally style a ".scrolled" class on ".site-header" to add a subtle shadow or background change when the user scrolls.

Layout & sections:
- Use a consistent max-width container (e.g., .container { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }) and center main content inside it.
- Give each section comfortable vertical padding (around 3–4rem top and bottom).
- Avoid random large margins that push content to the very edges.
- Style major layout classes that appear in the HTML, especially:
  - Hero sections: .hero, .hero-inner, .hero-content, .hero-actions, .hero-media, .hero-image
  - Trust & social proof: .trust, .trust-inner, .client-logos, .testimonials
  - Features: .features, .feature-grid, .feature-card
  - How it works: .how-it-works, .steps
  - CTA bands: .cta-band, .cta-inner, .cta-actions
  - Footer: .site-footer, .footer-inner, .footer-branding, .footer-links, .footer-title, .footer-tagline

Forms:
- Style forms (.form, form) with a clean, stacked layout (one field per row) and even spacing.
- Inputs, selects, and textareas should have full-width, comfortable padding, and consistent border-radius.

Buttons and links:
- Style .btn, .btn-primary, .btn-secondary with clear hover states.
- Ensure buttons and links have sufficient contrast and accessible hit areas.

Images:
- Ensure images are responsive and visually balanced:
  - img, .hero-image, .section-image, .card-image, .avatar-image {
      max-width: 100%;
      height: auto;
      display: block;
    }
  - For hero and card images, you can add border-radius and a light box-shadow.

Responsiveness:
- Use media queries to adapt:
  - Stack grids and multi-column layouts vertically on smaller screens.
  - Adjust padding and font sizes for small screens for readability.

Consistency:
- Header and footer should look consistent across all pages.
- Use the same typography, colors, and button styles site-wide.

Return ONLY valid CSS code. No comments, no explanations.
`;

  const cssRaw = await callModel(cssPrompt, 'kwaipilot/kat-coder-pro:free');

  const css =
    cssRaw +
    '\n\n' +
    TYPOGRAPHY_OVERRIDES +
    '\n\n' +
    LAYOUT_OVERRIDES +
    '\n\n' +
    NAVIGATION_CSS_OVERRIDES +
    '\n\n' +
    HERO_BACKGROUND_OVERRIDES;

  const js = STATIC_JS;
  const pages = htmlPages.map((_, idx) => `page${idx + 1}.html`);

  return { pages, html: htmlPages, css, js };
}

// Validation for /generate-code
function validateGenerateCode(req, res, next) {
  const { description, numPages } = req.body;

  if (typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'description is required' });
  }

  if (!Number.isInteger(numPages) || numPages < 1 || numPages > 5) {
    return res
      .status(400)
      .json({ error: 'numPages must be an integer between 1 and 5' });
  }

  next();
}

// Main multi-page AI endpoint (existing)
app.post(
  '/generate-code',
  generateLimiter,
  validateGenerateCode,
  async (req, res) => {
    const { description, numPages } = req.body;
    try {
      const result = await generateWebsiteManager(description, numPages);
      res.json(result);
    } catch (error) {
      console.error('Multi-model generation failed:', error.message);
      res.status(500).json({ error: 'Multi-model generation failed' });
    }
  }
);

// New: single-page business/showcase site using templates
app.post('/generate-business-site', async (req, res) => {
  const { description } = req.body;

  if (typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'description is required' });
  }

  try {
    const content = await generateBusinessContent(description);
    const html = buildBusinessHtml(content);

    const pages = ['index.html'];

    res.json({
      pages,
      html: [html],
      css: BUSINESS_SITE_CSS,
      js: STATIC_JS,
    });
  } catch (error) {
    console.error('Business site generation failed:', error.message);
    res.status(500).json({ error: 'Business site generation failed' });
  }
});

// Testing-only endpoints (unchanged)
app.post('/generate-html', async (req, res) => {
  const { description, numPages } = req.body;
  try {
    const result = await generateWebsiteManager(description, numPages);
    res.json({ html: result.html });
  } catch (error) {
    console.error('HTML generation failed:', error.message);
    res.status(500).json({ error: 'HTML generation failed' });
  }
});

app.post('/generate-css', async (req, res) => {
  const { description } = req.body;

  const prompt = `
Generate plain CSS styles for a professional website based on this description:
"${description}"

Requirements:
- Use ONLY standard CSS. Do NOT use Tailwind CSS or any CSS framework.
- Assume the HTML uses semantic elements and clear class names.
- Return ONLY CSS code with no comments or explanations.
`;

  try {
    const css = await callModel(prompt, 'qwen/qwen3-coder');
    res.json({ css });
  } catch (error) {
    console.error('CSS generation failed:', error.message);
    res.status(500).json({ error: 'CSS generation failed' });
  }
});

app.post('/generate-js', async (req, res) => {
  const { description } = req.body;

  const prompt = `
Generate JavaScript interactivity for a professional website based on this description:
"${description}"

Requirements:
- Use ONLY plain JavaScript (no frameworks, no libraries).
- Keep interactivity simple and UI-focused (navigation, modals, basic animations).
- Return ONLY JS code with no comments or explanations.
`;

  try {
    const js = await callModel(
      prompt,
      'meta-llama/llama-3.3-70b-instruct:free'
    );
    res.json({ js });
  } catch (error) {
    console.error('JS generation failed:', error.message);
    res.status(500).json({ error: 'JS generation failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));