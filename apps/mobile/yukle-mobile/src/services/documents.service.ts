import { Platform } from 'react-native';
import type { DocumentOcrResult, DocumentUploadResult, DriverDocType, PickedDocumentFile } from '../types/document';
import { apiClient } from './api.client';

function normalizeOcr(raw: unknown): DocumentOcrResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    isValid: Boolean(r.isValid ?? r.IsValid),
    validationMessage: (r.validationMessage ?? r.ValidationMessage) as string | null | undefined,
    fullName: (r.fullName ?? r.FullName) as string | null | undefined,
    confidenceScore: r.confidenceScore != null ? Number(r.confidenceScore) : null,
  };
}

function normalizeUpload(raw: unknown): DocumentUploadResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    documentType: r.documentType != null ? String(r.documentType) : undefined,
    isDocumentValid: r.isDocumentValid != null ? Boolean(r.isDocumentValid) : undefined,
    validationMessage: (r.validationMessage ?? r.ValidationMessage) as string | null | undefined,
    approvalStatus: r.approvalStatus != null ? String(r.approvalStatus) : undefined,
    isAccountActive: r.isAccountActive != null ? Boolean(r.isAccountActive) : undefined,
    message: (r.message ?? r.Message) as string | undefined,
  };
}

async function buildFormData(file: PickedDocumentFile): Promise<FormData> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const res = await fetch(file.uri);
    const blob = await res.blob();
    formData.append('file', blob, file.name);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }
  return formData;
}

export async function uploadDocumentOcr(
  file: PickedDocumentFile,
  docType: DriverDocType
): Promise<DocumentOcrResult> {
  const formData = await buildFormData(file);
  const res = await apiClient.post(`/Ai/ocr?docType=${encodeURIComponent(docType)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return normalizeOcr(res.data);
}

export async function uploadDriverDocument(
  file: PickedDocumentFile,
  docType: DriverDocType
): Promise<DocumentUploadResult> {
  const formData = await buildFormData(file);
  const res = await apiClient.post(
    `/Auth/upload-document?docType=${encodeURIComponent(docType)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }
  );
  return normalizeUpload(res.data);
}
