import { ref } from "vue";
import * as Nostr from "nostr-tools";
import { feedRelays, profileRelays, pool, normalizeUrls } from "./relays";
import { getEventList } from "./events";

type Profile = {
  pubkey: string,
  picture: string,
  display_name: string,
  name: string,
  created_at: number,
};

// ローカルストレージからプロフィール情報を読み出しておく
const profiles = ref(
  new Map<string, any>(JSON.parse(localStorage.getItem("profiles") ?? "[]"))
);
let cacheMissHitPubkeys = new Set<string>()

export function getProfile(pubkey: string): Profile {
  let prof;
  if (!profiles.value.has(pubkey)) {
    cacheMissHitPubkeys.add(pubkey);
    prof = {
      pubkey: pubkey,
      picture: "https://placehold.jp/60x60.png",
      display_name: "",
      name: "",
      created_at: 0,
    };
  } else {
    prof = profiles.value.get(pubkey);
  }

  return prof;
}

setInterval(() => { collectProfiles(false); }, 5 * 1000);

const forceProfileUpdateInterval = 29;
setInterval(() => { collectProfiles(true); }, forceProfileUpdateInterval * 1000);

setInterval(() => {
  // ローカルストレージにプロフィール情報を保存しておく
  const diskProfiles = new Map<string, any>(JSON.parse(localStorage.getItem("profiles") ?? "[]"));

  profiles.value.forEach((val, key) => {
    if (val.created_at > 0) {
      if (diskProfiles.has(key) && diskProfiles.get(key).created_at < val.created_at) {
        diskProfiles.set(key, val);
      } else {
        diskProfiles.set(key, val);
      }
    }
  });

  localStorage.setItem(
    "profiles",
    JSON.stringify(Array.from(profiles.value.entries()))
  );
}, 8 * 1000);

async function collectProfiles(force = false) {
  if (cacheMissHitPubkeys.size === 0 && !force) {
    return;
  }

  const pubkeys = [...new Set<string>([...getEventList().filter((e)=>(e.event !== undefined)).map((e)=>(e.event.pubkey)), ...cacheMissHitPubkeys])];
  const unsub = pool.subscribe(
    [{
      kinds: [0],
      authors: pubkeys,
    }],
    [...new Set(normalizeUrls([...feedRelays, ...profileRelays]))],
    async (ev, _isAfterEose, _relayURL) => {
      if (!Nostr.verifySignature(ev)) {
        console.log('Invalid nostr event, signature invalid', ev);
        return;
      }

      if (ev.kind === 0) {
        const content = JSON.parse(ev.content);

        if (force && ev.created_at > Math.floor(new Date().getTime() / 1000) - forceProfileUpdateInterval * 2) {
          pool.publish(ev, [...new Set(normalizeUrls([...feedRelays]))]);
        } else if (cacheMissHitPubkeys.has(ev.pubkey)) {
          pool.publish(ev, [...new Set(normalizeUrls([...feedRelays]))]);
        }
        if (!profiles.value.has(ev.pubkey) ||
          profiles.value.get(ev.pubkey)?.created_at < ev.created_at) {
          const press = {
            pubkey: ev.pubkey,
            picture: content.picture,
            display_name: content.display_name,
            name: content.name,
            created_at: ev.created_at,
          };
          profiles.value.set(ev.pubkey, press);
          cacheMissHitPubkeys.delete(ev.pubkey);
        }
      }
    },
    undefined,
    () => {
      if (cacheMissHitPubkeys.size === 0) {
        unsub();
        clearTimeout(timeout);
      }
    },
    { unsubscribeOnEose: true }
  );
  const timeout = setTimeout(() => {
    unsub();
  }, 5 * 1000);
}

export function getProfileDisplayName(pubkey: string): string {
  return getProfile(pubkey).display_name || getProfile(pubkey).name || pubkey.substring(0, 8);
}