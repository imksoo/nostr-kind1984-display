<script setup lang="ts">
import * as Nostr from "nostr-tools";

import { feedRelays, pool, normalizeUrls } from "./relays";
import { getEventList, addReportEvent } from "./events";
import { getProfile, getProfileDisplayName } from "./profile";

pool.subscribe(
  [{
    kinds: [1984],
    limit: 50,
  }],
  [...new Set(normalizeUrls([...feedRelays]))],
  async (ev, _isAfterEose, _relayURL) => {
    ev.tags.forEach((t) => {
      if (t[0] === 'e') {
        addReportEvent(t[1], ev);
      }
    });
  }
);

</script>
<template>
  <h1>Nostr NIP-56 Board</h1>
  <p>This site displays events recently reported to Japanese relays on Nostr.</p>
  <template v-if="getEventList().length === 0">
    <p>Loading...</p>
  </template>
  <div v-for="e in getEventList()" class="div-events">
    <h2><a target="_blank" :href="'https://njump.me/' + Nostr.nip19.npubEncode(e.event.pubkey)">{{
      getProfileDisplayName(e.event.pubkey)
    }}</a></h2>
    <hr />
    <div class="div-events-container">
      <a target="_blank" :href="'https://njump.me/' + Nostr.nip19.npubEncode(e.event.pubkey)">
        <img class="div-events-avator"
          :src="getProfile(e.event.pubkey).picture ? getProfile(e.event.pubkey).picture : 'https://placehold.jp/623e70/d7c6c6/60x60.png?text=Unknown'"
          @error="(e) => { (e.target as HTMLImageElement).src = 'https://placehold.jp/391e6c/d7c6c6/60x60.png?text=Image%0ANot%20Found' }" />
      </a>
      <div class="div-events-content">
        <span>{{ e.event.content }}</span>
        <span>&nbsp;</span>
        <span>(<a :href="'https://njump.me/' + Nostr.nip19.noteEncode(e.event.id)" target="_blank">{{ new
          Date(e.event.created_at * 1000).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
          }) }}</a>)</span>
      </div>
      <div class="div-report-container">
        <h3>Report<template v-if="e.reports.length > 1">s</template></h3>
        <div v-for="r in e.reports">
          <a target="_blank" :href="'https://njump.me/' + Nostr.nip19.npubEncode(r.pubkey)">
            <img class="div-report-avator"
              :src="getProfile(r.pubkey).picture ? getProfile(r.pubkey).picture : 'https://placehold.jp/623e70/d7c6c6/60x60.png?text=Unknown'"
              @error="(e) => { (e.target as HTMLImageElement).src = 'https://placehold.jp/391e6c/d7c6c6/60x60.png?text=Image%0ANot%20Found' }" />
          </a>
          <template v-for="t in r.tags">
            <template v-if="t[0] === 'e' && t[1] === e.event.id"><a target="_blank"
                :href="'https://njump.me/' + Nostr.nip19.noteEncode(r.id)">{{ t[2] || '*' }}</a></template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
h2 {
  margin-block: 0;
  font-size: 18px;
  width: 100%;
  max-width: 100%;
}

h2>a {
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 100%;
  display: inline-block;
}

h3 {
  margin-block: 0;
  font-size: 14px;
  width: 100%;
  max-width: 100%;
}

hr {
  margin: 0.2rem;
  border: none;
  border-top: 1px solid #ccc;
}

.div-events {
  margin: 0 0.2em;
}

.div-events-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.div-events-avator {
  width: 3rem;
  max-width: 3rem;
  height: 3rem;
  max-height: 3rem;
  border-radius: 4px;
  margin: 0.2rem 0.5rem 1rem 0.5rem;
  object-fit: cover;
}

.div-events-content {
  flex: 5;
  padding: 0.5rem;
  margin: 0.2rem 0.5rem 1rem 0.5rem;
  border: 0.5px solid #ccc;
  border-radius: 4px;
  background-color: #f5ebeb;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
}

.div-events-content p {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  color: #a3a3a3;
}

.div-events-content .p-content-0 {
  color: #222;
  font-size: 18px;
}

.div-report-container {
  flex: 1;
  padding: 0.5rem;
  margin: 0.2rem 0.5rem 1rem 0.5rem;
  border: 0.5px solid #ccc;
  border-radius: 4px;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;

}

.div-report-container .div-report-avator {
  vertical-align: middle;
  width: 2rem;
  max-width: 2rem;
  height: 2rem;
  max-height: 2rem;
  border-radius: 4px;
  object-fit: cover;
  margin: 0.8rem 0.2em;
}
</style>
./profile./events