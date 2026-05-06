import { apiClient } from './client'

export async function uploadDocumentForAi(file: File, docType = 'DriverLicense') {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient.post(`/Ai/ocr?docType=${encodeURIComponent(docType)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
