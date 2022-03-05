import { useColorMode } from '@chakra-ui/react';

import styles from './UriBar.module.css';

function UriBar() {
  const { colorMode } = useColorMode();
  return (
    <div className={styles.container}>
      <select className={`${styles.select} ${styles[`select--${colorMode}`]}`}>
        <option>GET</option>
        <option>POST</option>
      </select>
      <input className={`${styles.input} ${styles[`input--${colorMode}`]}`} type="text" />
      <button className={`${styles.button} ${styles[`button--${colorMode}`]}`}>
        SEND
      </button>
    </div>
  );
}

export default UriBar;
