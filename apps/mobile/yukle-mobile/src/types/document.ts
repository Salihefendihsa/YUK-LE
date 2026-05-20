export type DriverDocType = 'DriverLicense' | 'SrcCertificate' | 'Psychotechnical';

export type DocUiStatus = 'Bekleniyor' | 'Inceleniyor' | 'Onayli' | 'Reddedildi';

export interface DocumentOcrResult {
  isValid: boolean;
  validationMessage?: string | null;
  fullName?: string | null;
  confidenceScore?: number | null;
}

export interface DocumentUploadResult {
  documentType?: string;
  isDocumentValid?: boolean;
  validationMessage?: string | null;
  approvalStatus?: string;
  isAccountActive?: boolean;
  message?: string;
}

export interface PickedDocumentFile {
  uri: string;
  name: string;
  mimeType: string;
}
