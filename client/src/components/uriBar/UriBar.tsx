import { cn } from '../../utils';
import { getMethodColor } from '../../utils';
import styles from './UriBar.module.css';

type UriBarProps = {
  uri: string;
  setUri: any;
  method: string;
  setMethod: any;
  handleSendButtonClick: () => void;
};

type MethodOptionProps = {
  method: string;
};

function MethodOption({ method }: MethodOptionProps) {
  return (
    <option className={cn(styles, 'option')} value={method}>
      {method}
    </option>
  );
}

function UriBar({ uri, setUri, method, setMethod, handleSendButtonClick }: UriBarProps) {
  return (
    <div className={styles.container}>
      <select
        className={cn(styles, 'select')}
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      >
        <MethodOption method="GET" />
        <MethodOption method="POST" />
        <MethodOption method="PUT" />
        <MethodOption method="DELETE" />
      </select>
      <input
        className={cn(styles, 'input')}
        type="text"
        placeholder="URL"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button className={cn(styles, 'button')} onClick={handleSendButtonClick}>
        SEND
      </button>
    </div>
  );
}

export default UriBar;
