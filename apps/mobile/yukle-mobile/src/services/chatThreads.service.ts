import type { ChatThreadSummary } from '../types/chat';
import { getBidsForLoad } from './bids.service';
import { getChatMessages } from './chat.service';
import { getCustomerLoads, getActiveLoads } from './loads.service';
import { canCustomerOpenChat, canDriverOpenChat } from '../utils/loadChat';
import type { Load } from '../types/load';

function routeLabel(load: Load): string {
  return `${load.fromCity} → ${load.toCity}`;
}

function baseThread(load: Load, counterpartName: string): ChatThreadSummary {
  return {
    loadId: load.id,
    route: routeLabel(load),
    counterpartName,
    lastMessage: '',
    lastMessageAt: null,
    hasMessages: false,
  };
}

async function enrichThreads(threads: ChatThreadSummary[]): Promise<ChatThreadSummary[]> {
  const updated = await Promise.all(
    threads.map(async (thread) => {
      try {
        const msgs = await getChatMessages(thread.loadId);
        const visible = msgs.filter((m) => !m.isBlocked);
        if (visible.length === 0) return thread;
        const last = visible[visible.length - 1];
        return {
          ...thread,
          lastMessage: last.message,
          lastMessageAt: last.sentAt,
          hasMessages: true,
        };
      } catch {
        return thread;
      }
    })
  );

  return updated.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return a.route.localeCompare(b.route, 'tr');
  });
}

/** Müşteri: şoför atanmış ilanlardan sohbet listesi (mevcut Chat API). */
export async function getCustomerChatThreads(): Promise<ChatThreadSummary[]> {
  const loads = await getCustomerLoads();
  const eligible = loads.filter(canCustomerOpenChat);

  const threads = await Promise.all(
    eligible.map(async (load) => {
      let counterpartName = 'Şoför';
      try {
        const bids = await getBidsForLoad(load.id);
        const accepted = bids.find((b) => b.status === 'Accepted');
        if (accepted?.driverFullName?.trim()) {
          counterpartName = accepted.driverFullName.trim();
        }
      } catch {
        /* teklif listesi opsiyonel */
      }
      return baseThread(load, counterpartName);
    })
  );

  return enrichThreads(threads);
}

/** Şoför: atanmış / yolda / teslim ilanlardan sohbet listesi. */
export async function getDriverChatThreads(driverUserId: number): Promise<ChatThreadSummary[]> {
  const loads = await getActiveLoads();
  const eligible = loads.filter(
    (load) => load.driverId === driverUserId && canDriverOpenChat(load)
  );

  const threads = eligible.map((load) =>
    baseThread(load, load.ownerFullName?.trim() || 'Müşteri')
  );

  return enrichThreads(threads);
}
