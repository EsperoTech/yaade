import GroupsInput from '../../groupsInput';
import styles from './CollectionSettingsTab.module.css';

type CollectionSettingsTabProps = {
  groups: string[];
  setGroups: (groups: string[]) => void;
};

export default function CollectionSettingsTab({
  groups,
  setGroups,
}: CollectionSettingsTabProps) {
  return (
    <div>
      <table className={styles.settingsTable}>
        <tr>
          <td className={styles.groupsLabel}>
            <div>Groups</div>
          </td>
          <td>
            <GroupsInput groups={groups} setGroups={setGroups} isRounded />
          </td>
        </tr>
      </table>
    </div>
  );
}
