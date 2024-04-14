export interface CreateCertificateRequest {
  host: string;
  type: string;
  groups: string[];
  pemCert: File | undefined | null;
}

interface Certificate {
  host: string;
  type: string;
  groups: string[];
}

export default Certificate;
