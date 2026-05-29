import fs from 'node:fs';
import { LISTS } from '../worker/src/lists.js';

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const app = read('app.js');
const index = read('worker/src/index.js');
const mood = read('worker/src/mood.js');
const scorer = read('worker/src/scorer.js');

assert(app.includes('if (f.reason) meta.appendChild'), 'cards must render per-film reason text');
assert(app.includes('params.set("media", useLB ? "movie" : resolveMedia(state.media));'), 'Letterboxd recommend must force movie media');
assert(app.includes(`$("#path-lb").addEventListener("click", () => {
      state.path = "lb";
      state.media = "movie";`), 'Letterboxd entry must reset stale TV media state');
assert(app.includes(`state.path = "surprise";
      state.media = "movie";`), 'main surprise entry must reset stale media state');
assert(app.includes(`state.path = "surprise";
        state.media = "movie";`), 'quick surprise chips must reset stale media state');

assert(index.includes('const SHORT_RUNTIME_MAX = 90;'), 'worker must use strict 90-minute short cap');
assert(mood.includes('"with_runtime.lte": 90'), 'discover short runtime must be <=90');
assert(scorer.includes('film.runtime <= 90'), 'scorer short boost must match <=90 promise');
assert(!index.includes('profile === "short" && f.runtime && f.runtime > 95'), 'surprise short must not allow 95-minute leak');
assert(!index.includes('mood.runtime === "short" && f.runtime && f.runtime > 110'), 'recommend short must not allow 110-minute leak');
assert(index.includes('profile === "classic" ? 6'), 'classic surprise should not sample empty high TMDb pages');
assert(index.includes('media === "tv" ? 120 : 250'), 'classic TV needs lower vote floor than movies');
assert(index.includes('reason: pickReason(f, mood, lang)'), 'recommend response must attach per-film reasons');
assert(index.includes('reason: pickReason(f, surpriseMood, lang)'), 'surprise response must attach per-film reasons');

const ids = LISTS.flatMap(l => l.ids || []);
assert(!ids.includes(553604), 'known wrong TMDb id 553604 must stay out of lists');

console.log('moodwatch regressions ok');
