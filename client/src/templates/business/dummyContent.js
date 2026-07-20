/** Sample content for local UI testing without API */
const dummyContent = {
  navbar: {
    businessName: 'Summit Agency',
    tagline: 'Strategy that scales',
  },
  hero: {
    headline: 'Grow your business with clarity and confidence',
    subheadline:
      'We help small teams build brands, websites, and campaigns that win customers and keep them coming back.',
    ctaButton: 'Get Started',
    ctaButtonSecondary: 'Our Services',
  },
  about: {
    title: 'About Summit Agency',
    description:
      'Founded in Kampala, we partner with ambitious businesses to turn ideas into polished digital experiences. From first impression to final conversion, we focus on work that feels human and performs.',
    mission: 'Empower local businesses with world-class design and messaging.',
    stats: [
      { number: '120+', label: 'Projects' },
      { number: '8 yrs', label: 'Experience' },
      { number: '98%', label: 'Happy clients' },
    ],
  },
  services: {
    title: 'What we offer',
    subtitle: 'Practical services tailored to your goals and budget.',
    items: [
      {
        icon: '🎯',
        title: 'Brand Strategy',
        description: 'Positioning, messaging, and visual identity that stands out.',
      },
      {
        icon: '💻',
        title: 'Web Design',
        description: 'Fast, responsive sites built for trust and conversions.',
      },
      {
        icon: '📣',
        title: 'Marketing',
        description: 'Campaigns and content that reach the right audience.',
      },
    ],
  },
  testimonials: {
    title: 'What clients say',
    items: [
      {
        name: 'Sarah N.',
        role: 'Founder',
        company: 'GreenLeaf Cafe',
        comment: 'They understood our vision immediately and delivered a site we are proud to share.',
        rating: 5,
      },
      {
        name: 'James O.',
        role: 'Director',
        company: 'Nova Logistics',
        comment: 'Professional, responsive, and sharp. Our inquiries doubled within a month.',
        rating: 5,
      },
    ],
  },
  contact: {
    title: 'Get in touch',
    subtitle: 'Tell us about your project — we typically reply within one business day.',
    email: 'hello@summitagency.ug',
    phone: '+256 700 000 000',
    address: 'Plot 12, Kampala Road, Kampala',
  },
  footer: {
    tagline: 'Building brands that people remember.',
    copyright: '© 2026 Summit Agency. All rights reserved.',
  },
};

export default dummyContent;
