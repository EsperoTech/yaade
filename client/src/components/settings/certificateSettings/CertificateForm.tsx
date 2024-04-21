import { Input, Select, useColorMode, useToast } from '@chakra-ui/react';

import { CreateCertificateRequest } from '../../../model/Certificate';
import { cn } from '../../../utils';
import GroupsInput from '../../groupsInput';
import styles from './CertificateSettings.module.css';

type CertificateFormProps = {
  newCertificate: CreateCertificateRequest;
  onChangeNewCertificate: (newCertificate: CreateCertificateRequest) => void;
};

function CertificateSettings({
  newCertificate,
  onChangeNewCertificate: onChangeNewCertificate,
}: CertificateFormProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();

  return (
    <>
      <label htmlFor="host" className={styles.fieldLabel}>
        Host
      </label>
      <Input
        id="host"
        className={styles.formField}
        placeholder="Host"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        backgroundColor={colorMode === 'light' ? 'white' : undefined}
        value={newCertificate.host}
        onChange={(e) => {
          onChangeNewCertificate({ ...newCertificate, host: e.target.value });
        }}
      />

      <div className={styles.formField}>
        <label htmlFor="type" className={styles.fieldLabel}>
          Type
        </label>
        <Select
          id="type"
          borderRadius={20}
          value={newCertificate.type}
          onChange={(e) => {
            onChangeNewCertificate({ ...newCertificate, type: e.target.value });
          }}
        >
          <option key={'pem'} value={'pem'}>
            pem
          </option>
        </Select>
      </div>

      <label htmlFor="groups" className={styles.fieldLabel}>
        Groups
      </label>
      <GroupsInput
        id="groups"
        groups={newCertificate.groups}
        setGroups={(groups) => {
          onChangeNewCertificate({ ...newCertificate, groups });
        }}
        isRounded
        className={styles.formField}
      />

      <label htmlFor="pemCert" className={styles.fieldLabel}>
        Certificate (.pem)
      </label>
      <input
        id="pemCert"
        className={`${cn(styles, 'fileInput', [colorMode])} ${styles.formField}`}
        type="file"
        accept=".pem"
        onChange={(e) => {
          const pemCert = e.target.files ? e.target.files[0] : undefined;
          if (!pemCert) {
            return;
          }
          onChangeNewCertificate({ ...newCertificate, pemCert });
        }}
      />
    </>
  );
}

export default CertificateSettings;
