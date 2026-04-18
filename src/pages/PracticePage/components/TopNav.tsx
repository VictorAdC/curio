import { useI18n } from '../../../i18n/I18nProvider';
import styles from './TopNav.module.css';

export function TopNav() {
  const { locale, setLocale } = useI18n();

  return (
    <header className={styles.root}>
      <div className={styles.brand}>
        <span className={styles.logo}>Curio</span>
        <span className={styles.tagline}>PRECISION PRACTICE STUDIO</span>
      </div>
      <div className={styles.actions}>
        <div className={styles.langToggle}>
          <button
            className={`${styles.langBtn} ${locale === 'en' ? styles.langBtnActive : ''}`}
            type="button"
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            className={`${styles.langBtn} ${locale === 'pt-BR' ? styles.langBtnActive : ''}`}
            type="button"
            onClick={() => setLocale('pt-BR')}
          >
            PT
          </button>
        </div>
        <button className={styles.iconBtn} type="button" aria-label="Bookmark" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button className={styles.iconBtn} type="button" aria-label="History" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        <button className={styles.iconBtn} type="button" aria-label="User" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
      </div>
    </header>
  );
}
