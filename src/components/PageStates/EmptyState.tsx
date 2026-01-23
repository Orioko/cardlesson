import { useTranslation } from 'react-i18next';
import Footer from '../Footer';
import Header from '../Header';
import styles from './PageStates.module.scss';

interface EmptyStateProps {
  title: string;
  message?: string;
  containerClassName?: string;
}

const EmptyState = ({ title, message, containerClassName }: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className={containerClassName}>
      <Header title={title} showNavigation={true} />
      <div className={styles.content}>
        <div className={styles.emptyState}>
          <p>{message || t('noWords')}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmptyState;
