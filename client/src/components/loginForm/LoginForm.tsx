import { useState } from 'react';

import styles from './LoginForm.module.css';

type State = {
  username: string;
  password: string;
};

function LoginForm() {
  const [state, setState] = useState<State>({
    username: '',
    password: '',
  });
  return <div className={styles.container}></div>;
}

export default LoginForm;
