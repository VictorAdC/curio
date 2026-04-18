import { useI18n } from '../../../i18n/I18nProvider';
import styles from './BottomNav.module.css';

type Tab = 'practice' | 'record' | 'history';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className={styles.root} aria-label="Main navigation">
      <button
        className={`${styles.tab} ${activeTab === 'practice' ? styles.tabActive : ''}`}
        type="button"
        onClick={() => onTabChange('practice')}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <span>{t('practice.nav.practice')}</span>
      </button>

<button
        className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
        type="button"
        onClick={() => onTabChange('history')}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>{t('practice.nav.history')}</span>
      </button>
    </nav>
  );
}
