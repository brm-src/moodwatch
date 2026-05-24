import { CURATED, CURATED_GROUPS } from '../worker/src/curated.js';
import { LISTS } from '../worker/src/lists.js';

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function idsFrom(items) { return items.flatMap(x => Array.isArray(x.ids) ? x.ids : []); }

const knownWrong = new Map([
  [837082, 'not Aftersun'],
  [1011985, 'not Past Lives'],
  [804150, 'not Killers of the Flower Moon'],
  [777245, 'not The Fabelmans'],
  [58244, 'not I Saw the Devil'],
  [23269, 'not Martyrs'],
  [516486, 'not Booksmart'],
  [155341, 'not About Time'],
  [615173, 'not Palm Springs'],
  [553604, 'not The Lighthouse'],
  [254508, 'not The Lobster'],
  [524911, 'not One Cut of the Dead'],
  [376292, 'not The Wailing'],
  [67345, 'not Lake Mungo'],
  [625215, 'not Saint Maud'],
  [721589, 'not My Octopus Teacher'],
]);

const all = [
  ...CURATED.map(c => c.id),
  ...Object.values(CURATED_GROUPS).flat(),
  ...idsFrom(LISTS),
];
assert(all.length > 180, `expected broad curated/list coverage, got ${all.length} ids`);
for (const id of all) {
  assert(Number.isInteger(id) && id > 0, `bad TMDb id: ${id}`);
  assert(!knownWrong.has(id), `known wrong TMDb id still present: ${id} (${knownWrong.get(id)})`);
}
for (const c of CURATED) {
  assert(typeof c.note === 'string' && c.note.length >= 12, `curated note too short for ${c.id}`);
}
for (const [bucket, ids] of Object.entries(CURATED_GROUPS)) {
  assert(Array.isArray(ids) && ids.length >= 4, `bucket ${bucket} too thin`);
}
for (const list of LISTS) {
  assert(list.slug && list.name && list.signature && Array.isArray(list.ids), `malformed list ${list.slug || list.name}`);
  assert(list.ids.length >= 8, `list ${list.slug} too thin`);
}
const priorityMinimums = {
  'latam-pulse': 55,
  'terror-sin-jumpscares': 50,
  'rainy-night-cinema': 45,
  'sunday-anxiety': 45,
};
for (const [slug, min] of Object.entries(priorityMinimums)) {
  const list = LISTS.find(l => l.slug === slug);
  assert(list && list.ids.length >= min, `priority list ${slug} needs >=${min}, got ${list?.ids?.length || 0}`);
}
console.log(`id validation ok: ${new Set(all).size} unique ids, ${LISTS.length} lists, ${Object.keys(CURATED_GROUPS).length} curated buckets`);
