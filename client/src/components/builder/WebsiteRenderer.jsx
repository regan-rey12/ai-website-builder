import { getTemplateComponent } from '../../templates';
import styles from './WebsiteRenderer.module.css';

function WebsiteRenderer({ templateId, content, settings }) {
  if (!content) {
    return <p className={styles.empty}>Generate a website to see the preview.</p>;
  }

  const Template = getTemplateComponent(templateId || 'business');

  return (
    <div className={styles.frame}>
      <div className={styles.viewport}>
        <Template content={content} settings={settings || {}} />
      </div>
    </div>
  );
}

export default WebsiteRenderer;
