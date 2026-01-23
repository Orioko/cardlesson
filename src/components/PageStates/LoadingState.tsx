import { ProgressSpinner } from 'primereact/progressspinner';
import Footer from '../Footer';
import Header from '../Header';
import styles from './PageStates.module.scss';

interface LoadingStateProps {
  title: string;
  containerClassName?: string;
}

const LoadingState = ({ title, containerClassName }: LoadingStateProps) => {
  return (
    <div className={containerClassName}>
      <Header title={title} showNavigation={true} />
      <div className={styles.content}>
        <div className={styles.loading}>
          <ProgressSpinner />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoadingState;
