import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import styles from './Dashboard.module.css';

function Dashboard() {
  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <div className={styles.main}>
        <RequestPanel />
        <ResponsePanel />
      </div>
    </div>
  );
}

export default Dashboard;
