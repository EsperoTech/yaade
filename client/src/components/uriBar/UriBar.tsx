import { cn } from '../../utils';
import styles from './UriBar.module.css';

type UriBarProps = {
  uri: string;
  setUri: any;
  handleSendButtonClicked: () => void;
};

function UriBar({ uri, setUri, handleSendButtonClicked }: UriBarProps) {
  return (
    <div className={styles.container}>
      <select className={cn(styles, 'select')}>
        <option>GET</option>
        <option>POST</option>
      </select>
      <input
        className={cn(styles, 'input')}
        type="text"
        placeholder="URL"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button className={cn(styles, 'button')} onClick={handleSendButtonClicked}>
        SEND
      </button>
    </div>
  );
}

export default UriBar;
