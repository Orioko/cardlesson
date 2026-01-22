import { Message } from 'primereact/message';
import styles from './LanguageSettings.module.scss';

interface StatusMessagesProps {
  error: string;
  statusMessage: string;
  statusSeverity: 'error' | 'success' | 'info';
}

const StatusMessages = ({ error, statusMessage, statusSeverity }: StatusMessagesProps) => {
  return (
    <>
      {error && <Message severity="error" text={error} className={styles.message} />}
      {statusMessage && !error && (
        <Message severity={statusSeverity} text={statusMessage} className={styles.message} />
      )}
    </>
  );
};

export default StatusMessages;
