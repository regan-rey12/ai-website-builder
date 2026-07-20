/** Map AI / business-shaped JSON into portfolio template fields */
export function normalizePortfolioContent(content = {}) {
  const navbar = content.navbar || {};
  const hero = content.hero || {};
  const about = content.about || {};
  const contact = content.contact || {};
  const footer = content.footer || {};
  const testimonials = content.testimonials || {};
  const services = content.services || {};

  const name = navbar.name || navbar.businessName || hero.name || 'Your Name';
  const role = navbar.role || navbar.tagline || 'Creative Professional';

  let projects = content.projects;
  if (!projects?.items?.length && services.items?.length) {
    projects = {
      title: 'Selected work',
      subtitle: services.subtitle || 'Recent projects and collaborations.',
      items: services.items.map((item, i) => ({
        title: item.title,
        description: item.description,
        category: ['Design', 'Branding', 'Web'][i] || 'Project',
        icon: item.icon || '✦',
      })),
    };
  }
  if (!projects?.items?.length) {
    projects = {
      title: 'Selected work',
      subtitle: 'Projects that reflect my craft and process.',
      items: [
        { title: 'Project One', description: 'Case study coming soon.', category: 'Design', icon: '🎯' },
        { title: 'Project Two', description: 'Brand and web experience.', category: 'Branding', icon: '✨' },
        { title: 'Project Three', description: 'Product interface redesign.', category: 'Product', icon: '🚀' },
      ],
    };
  }

  let skills = about.skills;
  if (!skills?.length && services.items?.length) {
    skills = services.items.map((s) => s.title).slice(0, 6);
  }
  if (!skills?.length) {
    skills = ['Design', 'Branding', 'Web', 'UI/UX', 'Strategy', 'Prototyping'];
  }

  const stats = about.stats || [];
  const experience = about.experience || stats[0]?.number || stats[0]?.label || '5+ Years';
  const projectsDone = about.projectsDone || stats[1]?.number || '40+';
  const clients = about.clients || stats[2]?.number || '25+';

  let serviceItems = services.items || [];
  if (!serviceItems.length) {
    serviceItems = [
      { icon: '🎨', title: 'Design', description: 'Interfaces and visual systems.', price: 'From $500' },
      { icon: '💻', title: 'Development', description: 'Clean, responsive builds.', price: 'From $700' },
      { icon: '📣', title: 'Consulting', description: 'Strategy and creative direction.', price: 'From $400' },
    ];
  }

  return {
    navbar: { name, role },
    hero: {
      greeting: hero.greeting || 'Hi, I am',
      name: hero.name || name,
      title: hero.title || hero.headline || role,
      description: hero.description || hero.subheadline || about.description?.slice(0, 200),
      ctaButton: hero.ctaButton || 'View Work',
      ctaButtonSecondary: hero.ctaButtonSecondary || 'Contact Me',
    },
    about: {
      title: about.title || 'About me',
      description: about.description || about.mission,
      skills: skills.slice(0, 6),
      experience,
      projectsDone,
      clients,
    },
    projects,
    services: {
      title: services.title || 'Services',
      items: serviceItems.slice(0, 3).map((item) => ({
        ...item,
        price: item.price || 'Get quote',
      })),
    },
    testimonials: {
      title: testimonials.title || 'Client feedback',
      items: (testimonials.items || []).map((t) => ({
        name: t.name,
        role: t.role || t.company || '',
        comment: t.comment,
        rating: t.rating || 5,
      })),
    },
    contact: {
      title: contact.title || 'Get in touch',
      subtitle: contact.subtitle || 'Available for new projects.',
      email: contact.email || '',
      phone: contact.phone || '',
      location: contact.location || contact.address || '',
      availability: contact.availability || 'Available for freelance',
    },
    footer: {
      tagline: footer.tagline || navbar.tagline || role,
      copyright:
        footer.copyright ||
        `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
    },
  };
}
