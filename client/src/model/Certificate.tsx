interface Certificate {
  id: number;
  data: CertificateData;
}

interface CertificateData {
  host: string;
  type: string;
  groups: string[];
}

export default Certificate;
