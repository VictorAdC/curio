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
      </div>
    </header>
  );
}
