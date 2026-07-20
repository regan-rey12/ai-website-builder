/** Sample content for local UI testing */
const dummyContent = {
  navbar: {
    restaurantName: 'Ember & Oak',
    tagline: 'Wood-fired flavors since 2010',
  },
  hero: {
    headline: 'Authentic flavors in the heart of Kampala',
    subheadline:
      'Seasonal ingredients, warm hospitality, and dishes crafted to share with family and friends.',
    ctaButton: 'View Menu',
    ctaButtonSecondary: 'Reserve Table',
  },
  about: {
    title: 'Our story',
    description:
      'Ember & Oak began as a small neighborhood grill and grew into a beloved gathering place. Every plate reflects our commitment to fresh local produce and time-honored recipes.',
    established: 'Est. 2010',
    stats: [
      { number: '40+', label: 'Tables' },
      { number: '50+', label: 'Dishes' },
      { number: '15 yrs', label: 'Serving you' },
    ],
  },
  menu: {
    title: 'Our menu',
    subtitle: 'Fresh ingredients, bold flavors, fair prices.',
    categories: [
      {
        name: 'Starters',
        items: [
          { name: 'Grilled Halloumi', description: 'Herbs, lemon, olive oil', price: '$8.99' },
          { name: 'Soup of the Day', description: 'Chef’s daily selection', price: '$6.50' },
          { name: 'Garden Salad', description: 'Mixed greens, vinaigrette', price: '$7.25' },
        ],
      },
      {
        name: 'Mains',
        items: [
          { name: 'Wood-Fired Steak', description: 'Angus beef, chimichurri', price: '$24.99' },
          { name: 'Herb Roasted Chicken', description: 'Seasonal vegetables', price: '$18.50' },
          { name: 'Seafood Pasta', description: 'Prawns, garlic, white wine', price: '$21.00' },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Chocolate Lava Cake', description: 'Vanilla ice cream', price: '$9.50' },
          { name: 'Seasonal Fruit Tart', description: 'Pastry cream, berries', price: '$8.75' },
          { name: 'Affogato', description: 'Espresso over gelato', price: '$6.99' },
        ],
      },
    ],
  },
  specialties: {
    title: 'Why choose us',
    items: [
      { icon: '🔥', title: 'Wood-fired kitchen', description: 'Signature smoky flavor in every bite.' },
      { icon: '🌿', title: 'Farm-fresh produce', description: 'Sourced daily from local growers.' },
      { icon: '🍷', title: 'Curated wine list', description: 'Pairings chosen to match our menu.' },
    ],
  },
  testimonials: {
    title: 'Guest reviews',
    items: [
      {
        name: 'Amina K.',
        comment: 'The best dinner we have had in months. Service was impeccable.',
        rating: 5,
        date: 'Jan 2026',
      },
      {
        name: 'David M.',
        comment: 'Warm atmosphere, incredible steak, and generous portions.',
        rating: 5,
        date: 'Dec 2025',
      },
    ],
  },
  contact: {
    title: 'Visit us',
    address: '14 Nakasero Road, Kampala',
    phone: '+256 700 123 456',
    email: 'reservations@emberandoak.ug',
    hours: {
      weekdays: 'Mon–Fri: 11am – 10pm',
      weekends: 'Sat–Sun: 10am – 11pm',
    },
  },
  footer: {
    tagline: 'Good food. Good company. Every day.',
    copyright: '© 2026 Ember & Oak. All rights reserved.',
  },
};

export default dummyContent;
