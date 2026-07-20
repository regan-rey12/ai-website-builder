import { useState } from 'react';
import styles from './styles.module.css';
import { getThemeVariables } from '../../utils/colorUtils';
import { getFontStack } from '../shared/fontStacks';
import { normalizeRestaurantContent } from './normalizeContent';

function Stars({ rating = 5 }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
    </div>
  );
}

function RestaurantTemplate({ content = {}, settings = {} }) {
  const [navOpen, setNavOpen] = useState(false);
  const [menuTab, setMenuTab] = useState(0);

  const data = normalizeRestaurantContent(content);
  const { navbar, hero, about, menu, specialties, testimonials, contact, footer } =
    data;

  const primaryColor = settings.primaryColor || '#c2410c';
  const themeStyle = {
    ...getThemeVariables(primaryColor),
    '--font-family': getFontStack(settings.fontFamily),
  };

  const categories = menu.categories || [];
  const activeCategory = categories[menuTab] || categories[0];

  const closeNav = () => setNavOpen(false);

  return (
    <div
      className={`${styles.site} ${navOpen ? styles.navOpen : ''}`}
      style={themeStyle}
    >
      {/* Navbar */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="#home" onClick={closeNav}>
            <span className={styles.logo}>{navbar.restaurantName}</span>
            {navbar.tagline && (
              <span className={styles.logoTagline}>{navbar.tagline}</span>
            )}
          </a>

          <button
            type="button"
            className={styles.navToggle}
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={styles.nav}>
            <ul className={styles.navLinks}>
              <li>
                <a href="#home" onClick={closeNav}>
                  Home
                </a>
              </li>
              <li>
                <a href="#menu" onClick={closeNav}>
                  Menu
                </a>
              </li>
              <li>
                <a href="#about" onClick={closeNav}>
                  About
                </a>
              </li>
              <li>
                <a href="#contact" onClick={closeNav}>
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <a href="#contact" className={styles.navCta} onClick={closeNav}>
            <span className={styles.btnPrimary}>
              {hero.ctaButtonSecondary || 'Reserve'}
            </span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className={styles.hero}>
        <div className={`${styles.container} ${styles.heroInner}`}>
          <span className={styles.heroLabel}>{navbar.restaurantName}</span>
          <h1>{hero.headline}</h1>
          <p className={styles.heroSub}>{hero.subheadline}</p>
          <div className={styles.heroActions}>
            <a href="#menu" className={styles.btnPrimary}>
              {hero.ctaButton || 'View Menu'}
            </a>
            <a href="#contact" className={styles.btnOutline}>
              {hero.ctaButtonSecondary || 'Reserve Table'}
            </a>
          </div>
        </div>
      </section>

      <main>
        {/* About */}
        <section id="about" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutText}>
                <div className={styles.sectionHeader} style={{ textAlign: 'left' }}>
                  <h2>{about.title || 'Our story'}</h2>
                  {about.established && (
                    <span className={styles.established}>{about.established}</span>
                  )}
                </div>
                <p>{about.description}</p>
                {about.stats?.length > 0 && (
                  <div className={styles.statsRow}>
                    {about.stats.map((stat, i) => (
                      <div key={i}>
                        <span className={styles.statNumber}>{stat.number}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.aboutImage}>
                <span>{navbar.tagline || 'Crafted with passion'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu */}
        <section id="menu" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>{menu.title || 'Our menu'}</h2>
              {menu.subtitle && <p>{menu.subtitle}</p>}
            </div>

            {categories.length > 0 && (
              <>
                <div className={styles.menuTabs} role="tablist">
                  {categories.map((cat, i) => (
                    <button
                      key={cat.name}
                      type="button"
                      role="tab"
                      aria-selected={menuTab === i}
                      className={`${styles.menuTab} ${menuTab === i ? styles.menuTabActive : ''}`}
                      onClick={() => setMenuTab(i)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className={styles.menuList} role="tabpanel">
                  {(activeCategory?.items || []).map((item, i) => (
                    <article key={i} className={styles.menuItem}>
                      <div className={styles.menuItemInfo}>
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                      </div>
                      <span className={styles.menuPrice}>{item.price}</span>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Specialties */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>{specialties.title || 'Why choose us'}</h2>
            </div>
            <div className={styles.specialtiesGrid}>
              {(specialties.items || []).map((item, i) => (
                <article key={i} className={styles.specialtyCard}>
                  <div className={styles.specialtyIcon}>{item.icon || '✦'}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {(testimonials.items || []).length > 0 && (
          <section className={`${styles.section} ${styles.sectionAlt}`}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2>{testimonials.title}</h2>
              </div>
              <div className={styles.reviewsGrid}>
                {testimonials.items.map((item, i) => (
                  <article key={i} className={styles.reviewCard}>
                    <Stars rating={item.rating} />
                    <blockquote>&ldquo;{item.comment}&rdquo;</blockquote>
                    <div className={styles.reviewMeta}>
                      <strong>{item.name}</strong>
                      {item.date && ` · ${item.date}`}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact & hours */}
        <section id="contact" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>{contact.title}</h2>
              {contact.subtitle && <p>{contact.subtitle}</p>}
            </div>
            <div className={styles.contactGrid}>
              <div className={styles.contactBlock}>
                {contact.address && (
                  <div className={styles.contactLine}>
                    <div>
                      <strong>Address</strong>
                      <span>{contact.address}</span>
                    </div>
                  </div>
                )}
                {contact.phone && (
                  <div className={styles.contactLine}>
                    <div>
                      <strong>Phone</strong>
                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.email && (
                  <div className={styles.contactLine}>
                    <div>
                      <strong>Email</strong>
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                  </div>
                )}
                <div className={styles.hoursBox}>
                  <strong>Opening hours</strong>
                  <p>{contact.hours?.weekdays}</p>
                  <p>{contact.hours?.weekends}</p>
                </div>
              </div>
              <div className={styles.mapPlaceholder} aria-hidden>
                Map — {contact.address || 'Find us nearby'}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div>
            <div className={styles.footerBrand}>{navbar.restaurantName}</div>
            <p>{footer.tagline}</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#home">Home</a>
            <a href="#menu">Menu</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className={styles.container}>
          <p className={styles.footerCopy}>{footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

export default RestaurantTemplate;
