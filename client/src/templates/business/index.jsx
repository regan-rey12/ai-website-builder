import { useState } from 'react';
import styles from './styles.module.css';
import { getThemeVariables } from '../../utils/colorUtils';
import { getFontStack } from '../shared/fontStacks';

function Stars({ rating = 5 }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
    </div>
  );
}

function BusinessTemplate({ content = {}, settings = {} }) {
  const [navOpen, setNavOpen] = useState(false);

  const navbar = content.navbar || {};
  const hero = content.hero || {};
  const about = content.about || {};
  const services = content.services || {};
  const testimonials = content.testimonials || {};
  const contact = content.contact || {};
  const footer = content.footer || {};
  const stats = about.stats || [];

  const businessName = navbar.businessName || 'Your Business';
  const primaryColor = settings.primaryColor || '#2563eb';

  const themeStyle = {
    ...getThemeVariables(primaryColor),
    '--font-family': getFontStack(settings.fontFamily),
  };

  const closeNav = () => setNavOpen(false);

  return (
    <div
      className={`${styles.site} ${navOpen ? styles.navOpen : ''}`}
      style={themeStyle}
    >
      {/* Navbar */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="#home" className={styles.logoBlock} onClick={closeNav}>
            <span className={styles.logo}>{businessName}</span>
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
                <a href="#about" onClick={closeNav}>
                  About
                </a>
              </li>
              <li>
                <a href="#services" onClick={closeNav}>
                  Services
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
              {hero.ctaButton || 'Get Started'}
            </span>
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="home" className={styles.hero}>
          <div className={`${styles.container} ${styles.heroInner}`}>
            <div className={styles.heroContent}>
              <h1>{hero.headline}</h1>
              <p>{hero.subheadline}</p>
              <div className={styles.heroActions}>
                <a href="#contact" className={styles.btnPrimary}>
                  {hero.ctaButton || 'Get Started'}
                </a>
                <a href="#services" className={styles.btnSecondary}>
                  {hero.ctaButtonSecondary || 'Learn More'}
                </a>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroCard}>
                <div className={styles.heroCardLabel}>Trusted partner</div>
                <p>{about.mission || about.description?.slice(0, 120)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats.length > 0 && (
          <section className={styles.stats} aria-label="Key statistics">
            <div className={`${styles.container} ${styles.statsGrid}`}>
              {stats.map((stat, i) => (
                <div key={i}>
                  <span className={styles.statNumber}>{stat.number}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        <section id="about" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutText}>
                <div className={styles.sectionHeader}>
                  <h2>{about.title || 'About us'}</h2>
                </div>
                <p>{about.description}</p>
                {about.mission && (
                  <p className={styles.mission}>{about.mission}</p>
                )}
                <a href="#contact" className={styles.btnPrimary}>
                  Work with us
                </a>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutVisualInner}>
                  <strong>{businessName}</strong>
                  <span>
                    {navbar.tagline || 'Dedicated to your success'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>{services.title || 'Our services'}</h2>
              {services.subtitle && <p>{services.subtitle}</p>}
            </div>
            <div className={styles.servicesGrid}>
              {(services.items || []).map((item, i) => (
                <article key={i} className={styles.serviceCard}>
                  <div className={styles.serviceIcon}>{item.icon || '✦'}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {(testimonials.items || []).length > 0 && (
          <section className={styles.section}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2>{testimonials.title || 'Testimonials'}</h2>
              </div>
              <div className={styles.testimonialsGrid}>
                {testimonials.items.map((item, i) => (
                  <article key={i} className={styles.testimonialCard}>
                    <Stars rating={item.rating || 5} />
                    <blockquote>&ldquo;{item.comment}&rdquo;</blockquote>
                    <div className={styles.testimonialAuthor}>
                      <strong>{item.name}</strong>
                      {[item.role, item.company].filter(Boolean).join(' · ')}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact */}
        <section id="contact" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              <div>
                <div className={styles.sectionHeader}>
                  <h2>{contact.title || 'Contact us'}</h2>
                  {contact.subtitle && <p>{contact.subtitle}</p>}
                </div>
                <div className={styles.contactList}>
                  {contact.email && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactIcon}>✉</span>
                      <div>
                        <strong>Email</strong>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactIcon}>☎</span>
                      <div>
                        <strong>Phone</strong>
                        <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.address && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactIcon}>📍</span>
                      <div>
                        <strong>Address</strong>
                        <span>{contact.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form className={styles.contactForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formField}>
                  <label htmlFor="contact-name">Name</label>
                  <input id="contact-name" name="name" type="text" placeholder="Your name" />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="contact-email">Email</label>
                  <input id="contact-email" name="email" type="email" placeholder="you@email.com" />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="contact-message">Message</label>
                  <textarea id="contact-message" name="message" placeholder="How can we help?" />
                </div>
                <button type="submit" className={styles.btnPrimary}>
                  Send message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <strong>{businessName}</strong>
            <span>{footer.tagline}</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className={styles.container}>
          <div className={styles.footerBottom}>
            <span>{footer.copyright}</span>
            <div className={styles.social}>
              <a href="#contact" aria-label="Email">
                ✉
              </a>
              <a href="#contact" aria-label="Phone">
                ☎
              </a>
              <a href="#contact" aria-label="Location">
                📍
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BusinessTemplate;
