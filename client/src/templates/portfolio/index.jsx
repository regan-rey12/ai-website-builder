import { useState } from 'react';
import styles from './styles.module.css';
import { getThemeVariables } from '../../utils/colorUtils';
import { getFontStack } from '../shared/fontStacks';
import { normalizePortfolioContent } from './normalizeContent';

function Stars({ rating = 5 }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
    </div>
  );
}

function getInitials(name) {
  return (name || 'P')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function PortfolioTemplate({ content = {}, settings = {} }) {
  const [navOpen, setNavOpen] = useState(false);

  const data = normalizePortfolioContent(content);
  const {
    navbar,
    hero,
    about,
    projects,
    services,
    testimonials,
    contact,
    footer,
  } = data;

  const primaryColor = settings.primaryColor || '#6366f1';
  const themeStyle = {
    ...getThemeVariables(primaryColor),
    '--font-family': getFontStack(settings.fontFamily),
  };

  const closeNav = () => setNavOpen(false);
  const displaySkills = about.skills?.slice(0, 6) || [];

  return (
    <div
      className={`${styles.site} ${navOpen ? styles.navOpen : ''}`}
      style={themeStyle}
    >
      {/* Navbar */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="#home" onClick={closeNav}>
            <span className={styles.logoName}>{navbar.name}</span>
            <span className={styles.logoRole}>{navbar.role}</span>
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
                <a href="#projects" onClick={closeNav}>
                  Projects
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
            <span className={styles.btnPrimary}>Hire Me</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div>
            <span className={styles.heroGreeting}>{hero.greeting}</span>
            <h1 className={styles.heroName}>{hero.name}</h1>
            <p className={styles.heroTitle}>{hero.title}</p>
            <p className={styles.heroDesc}>{hero.description}</p>
            <div className={styles.heroActions}>
              <a href="#projects" className={styles.btnPrimary}>
                {hero.ctaButton}
              </a>
              <a href="#contact" className={styles.btnGhost}>
                {hero.ctaButtonSecondary}
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.avatarRing}>
              <div className={styles.avatarInner}>{getInitials(hero.name)}</div>
            </div>
            {displaySkills.length > 0 && (
              <div className={styles.heroBadges} aria-hidden>
                {displaySkills.slice(0, 4).map((skill) => (
                  <span key={skill} className={styles.badge}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main>
        {/* About */}
        <section id="about" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutText}>
                <div className={styles.sectionHeader}>
                  <h2>{about.title}</h2>
                </div>
                <p>{about.description}</p>
                <div className={styles.skillList}>
                  {displaySkills.map((skill) => (
                    <span key={skill} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{about.experience}</span>
                  <span className={styles.statLabel}>Experience</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{about.projectsDone}</span>
                  <span className={styles.statLabel}>Projects</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{about.clients}</span>
                  <span className={styles.statLabel}>Clients</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className={styles.section}>
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter}`}>
              <h2>{projects.title}</h2>
              {projects.subtitle && <p>{projects.subtitle}</p>}
            </div>
            <div className={styles.projectsGrid}>
              {(projects.items || []).map((project, i) => (
                <article key={i} className={styles.projectCard}>
                  <div className={styles.projectIcon}>{project.icon || '✦'}</div>
                  <span className={styles.categoryBadge}>{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <a href="#contact" className={styles.projectLink}>
                    View Project →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter}`}>
              <h2>{services.title}</h2>
            </div>
            <div className={styles.servicesGrid}>
              {(services.items || []).map((item, i) => (
                <article key={i} className={styles.serviceCard}>
                  <div className={styles.serviceIcon}>{item.icon || '✦'}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className={styles.servicePrice}>{item.price}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {(testimonials.items || []).length > 0 && (
          <section className={styles.section}>
            <div className={styles.container}>
              <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter}`}>
                <h2>{testimonials.title}</h2>
              </div>
              <div className={styles.reviewsGrid}>
                {testimonials.items.map((item, i) => (
                  <article key={i} className={styles.reviewCard}>
                    <Stars rating={item.rating} />
                    <blockquote>&ldquo;{item.comment}&rdquo;</blockquote>
                    <div className={styles.reviewAuthor}>
                      <strong>{item.name}</strong>
                      {item.role && <span>{item.role}</span>}
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
                  <h2>{contact.title}</h2>
                  {contact.subtitle && <p>{contact.subtitle}</p>}
                </div>
                <div className={styles.availability}>
                  <span className={styles.availabilityDot} />
                  {contact.availability}
                </div>
                <div className={styles.contactList}>
                  {contact.email && (
                    <div className={styles.contactItem}>
                      <strong>Email</strong>
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className={styles.contactItem}>
                      <strong>Phone</strong>
                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.location && (
                    <div className={styles.contactItem}>
                      <strong>Location</strong>
                      <span>{contact.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <form className={styles.contactForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formField}>
                  <label htmlFor="pf-name">Name</label>
                  <input id="pf-name" type="text" placeholder="Your name" />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pf-email">Email</label>
                  <input id="pf-email" type="email" placeholder="you@email.com" />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pf-msg">Message</label>
                  <textarea id="pf-msg" placeholder="Tell me about your project" />
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
          <div>
            <div className={styles.footerName}>{navbar.name}</div>
            <p>{footer.tagline}</p>
          </div>
          <div className={styles.socialLinks}>
            <a href="#contact" aria-label="Email">
              ✉
            </a>
            <a href="#contact" aria-label="LinkedIn">
              in
            </a>
            <a href="#contact" aria-label="GitHub">
              gh
            </a>
          </div>
        </div>
        <div className={styles.container}>
          <p className={styles.footerCopy}>{footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

export default PortfolioTemplate;
