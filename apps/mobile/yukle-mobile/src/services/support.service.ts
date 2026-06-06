import type { SupportSenderRole, SupportStatus } from '@navlonix/shared';
import { slaRemainingLabel, supportStatusLabel } from '@navlonix/shared';
import type { StatusTone } from '../components/ui/StatusPill';
import { apiClient } from './api.client';

/**
 * Destek talepleri servis katmanı — web `api/support.ts` ile birebir sözleşme.
 * Backend: SupportController (/Support/tickets ...). AI (Gemini/curated) + insan
 * operatör (admin) aynı thread'de. Yeni tablo/migration YOK — mevcut endpoint'ler.
 */
export type { SupportSenderRole, SupportStatus };
// Durum etiketi + SLA metni tek kaynaktan (platform-bağımsız). Mevcut çağrı
// yolları korunsun diye buradan re-export edilir; tone (render) altta lokal kalır.
export { slaRemainingLabel, supportStatusLabel };

export interface SupportMessage {
  id: string;
  senderId: number;
  senderRole: SupportSenderRole;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface SupportTicketDetail {
  id: string;
  userId: number;
  userName: string;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  lastMessageAt: string;
  slaDeadline: string;
  isOverdue: boolean;
  messages: SupportMessage[];
}

export interface SupportTicketSummary {
  id: string;
  userId: number;
  userName: string;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  lastMessageAt: string;
  slaDeadline: string;
  isOverdue: boolean;
  lastMessagePreview?: string;
  messageCount: number;
}

export async function createSupportTicket(message: string, subject?: string): Promise<SupportTicketDetail> {
  const res = await apiClient.post('/Support/tickets', { message, subject });
  return res.data;
}

export async function postSupportMessage(id: string, content: string): Promise<SupportTicketDetail> {
  const res = await apiClient.post(`/Support/tickets/${id}/messages`, { content });
  return res.data;
}

export async function escalateSupportTicket(id: string): Promise<SupportTicketDetail> {
  const res = await apiClient.post(`/Support/tickets/${id}/escalate`);
  return res.data;
}

export async function updateSupportStatus(id: string, status: SupportStatus): Promise<SupportTicketDetail> {
  const res = await apiClient.patch(`/Support/tickets/${id}/status`, { status });
  return res.data;
}

export async function getMySupportTickets(): Promise<SupportTicketSummary[]> {
  const res = await apiClient.get('/Support/tickets/mine');
  return res.data;
}

export async function getAdminSupportTickets(): Promise<SupportTicketSummary[]> {
  const res = await apiClient.get('/Support/tickets');
  return res.data;
}

export async function getSupportOpenCount(): Promise<number> {
  const res = await apiClient.get('/Support/tickets/open-count');
  return (res.data?.count ?? 0) as number;
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  const res = await apiClient.get(`/Support/tickets/${id}`);
  return res.data;
}

/** Durum → StatusPill tone (mobil tasarım dili). */
export function supportStatusTone(status: SupportStatus): StatusTone {
  switch (status) {
    case 'Open':
      return 'warning';
    case 'Answered':
      return 'info';
    case 'Resolved':
      return 'success';
    case 'Closed':
      return 'neutral';
    default:
      return 'neutral';
  }
}

