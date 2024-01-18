import { ref } from "vue";
import * as Nostr from "nostr-tools";
import { feedRelays, profileRelays, pool, normalizeUrls } from "./relays";

export const events = ref(new Map<string, Nostr.Event | undefined>());
export const reports = ref(new Map<string, Set<Nostr.Event>>());

setInterval(() => { collectEvents(); }, 5 * 1000);
export async function collectEvents() {
  const missingEventIds = new Set<string>();
  events.value.forEach((val, key) => {
    if (!val) {
      missingEventIds.add(key);
    }
  });

  if (missingEventIds.size === 0) {
    return;
  }
  const unsub = pool.subscribe(
    [{ ids: [...missingEventIds] }],
    [...new Set(normalizeUrls([...feedRelays, ...profileRelays]))],
    async (ev, _isAfterEose, _relayURL) => {
      missingEventIds.delete(ev.id);
      events.value.set(ev.id, ev);
    },
    undefined,
    () => {
      if (missingEventIds.size === 0) {
        unsub();
        clearTimeout(timeout);
      }
    },
    { unsubscribeOnEose: true }
  );
  const timeout = setTimeout(() => {
    unsub();
  }, 3 * 1000);
}

export function addReportEvent(id: string, report: Nostr.Event) {
  if (!reports.value.has(id)) {
    reports.value.set(id, new Set<Nostr.Event>());
  }
  reports.value.get(id)!.add(report);
  events.value.set(id, undefined);
}

type ReportedEvent = {
  event: Nostr.Event,
  reports: Array<Nostr.Event>,
};
export function getEventList(): Array<ReportedEvent> {
  const res = [] as Array<ReportedEvent>;
  events.value.forEach((ev, id) => {
    if (ev) {
      res.push({
        event: ev,
        reports: reports.value.has(id) ? [...reports.value.get(id)!] : [],
      });
    }
  });
  return res.sort((a, b) => (b.event.created_at - a.event.created_at));
}