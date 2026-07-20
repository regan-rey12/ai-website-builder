/** Map AI / business-shaped JSON into restaurant template fields */
export function normalizeRestaurantContent(content = {}) {
  const navbar = content.navbar || {};
  const hero = content.hero || {};
  const about = content.about || {};
  const contact = content.contact || {};
  const footer = content.footer || {};
  const testimonials = content.testimonials || {};

  const restaurantName =
    navbar.restaurantName || navbar.businessName || 'Our Restaurant';

  let menu = content.menu;
  if (!menu?.categories?.length) {
    const serviceItems = content.services?.items || [];
    if (serviceItems.length >= 3) {
      const chunk = Math.ceil(serviceItems.length / 3);
      const names = ['Starters', 'Mains', 'Desserts'];
      menu = {
        title: content.services?.title || 'Our Menu',
        subtitle: content.services?.subtitle,
        categories: names.map((name, i) => ({
          name,
          items: serviceItems.slice(i * chunk, (i + 1) * chunk).map((item) => ({
            name: item.title || item.name,
            description: item.description,
            price: item.price || 'Ask server',
          })),
        })),
      };
    } else {
      menu = {
        title: 'Our Menu',
        subtitle: 'Chef-selected favorites',
        categories: [
          {
            name: 'Starters',
            items: [
              { name: 'Soup of the Day', description: 'Fresh daily', price: '—' },
              { name: 'House Salad', description: 'Seasonal greens', price: '—' },
              { name: 'Appetizer Platter', description: 'To share', price: '—' },
            ],
          },
          {
            name: 'Mains',
            items: [
              { name: 'Chef Special', description: 'Ask your server', price: '—' },
              { name: 'Grilled Plate', description: 'Local favorites', price: '—' },
              { name: 'Vegetarian Option', description: 'Plant-based', price: '—' },
            ],
          },
          {
            name: 'Desserts',
            items: [
              { name: 'Daily Dessert', description: 'Made in-house', price: '—' },
              { name: 'Ice Cream', description: 'Two scoops', price: '—' },
              { name: 'Coffee & Tea', description: 'To finish', price: '—' },
            ],
          },
        ],
      };
    }
  }

  let specialties = content.specialties;
  if (!specialties?.items?.length && content.services?.items?.length) {
    specialties = {
      title: 'Why dine with us',
      items: content.services.items.slice(0, 3),
    };
  }
  if (!specialties?.items?.length) {
    specialties = {
      title: 'Why dine with us',
      items: [
        { icon: '🍽️', title: 'Fresh daily', description: 'Ingredients sourced with care.' },
        { icon: '👨‍🍳', title: 'Expert chefs', description: 'Passion on every plate.' },
        { icon: '❤️', title: 'Warm service', description: 'Hospitality you will remember.' },
      ],
    };
  }

  const testimonialItems = (testimonials.items || []).map((t) => ({
    name: t.name,
    comment: t.comment,
    rating: t.rating || 5,
    date: t.date || t.role || '',
  }));

  return {
    navbar: {
      restaurantName,
      tagline: navbar.tagline || '',
    },
    hero,
    about: {
      ...about,
      established: about.established || (about.stats?.[2]?.label ? `Est. ${about.stats[2].number}` : ''),
      stats: about.stats || [],
    },
    menu,
    specialties,
    testimonials: {
      title: testimonials.title || 'Guest reviews',
      items: testimonialItems,
    },
    contact: {
      title: contact.title || 'Visit us',
      subtitle: contact.subtitle,
      address: contact.address || '',
      phone: contact.phone || '',
      email: contact.email || '',
      hours: contact.hours || {
        weekdays: 'Mon–Fri: 9am – 10pm',
        weekends: 'Sat–Sun: 10am – 11pm',
      },
    },
    footer: {
      tagline: footer.tagline || navbar.tagline,
      copyright:
        footer.copyright ||
        `© ${new Date().getFullYear()} ${restaurantName}. All rights reserved.`,
    },
  };
}
