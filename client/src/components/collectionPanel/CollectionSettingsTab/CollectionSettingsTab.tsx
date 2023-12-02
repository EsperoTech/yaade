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
    <div className={styles.grid}>
      <div>Groups</div>
      <GroupsInput groups={groups} setGroups={setGroups} isRounded />
    </div>
  );
}
