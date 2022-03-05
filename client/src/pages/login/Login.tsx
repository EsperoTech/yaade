import LoginForm from '../../components/loginForm';
import styles from './Login.module.css';

function Login() {
  return (
    <div className={styles.root}>
      <LoginForm />
    </div>
  );
}

export default Login;
