import fs from 'node:fs';

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const app = read('app.js');
const index = read('worker/src/index.js');
const lists = read('worker/src/lists.js');
const curated = read('worker/src/curated.js');
const html = read('index.html');

assert(index.includes('function moodSummary'), 'backend must expose moodSummary explanation helper');
assert(index.includes('function pickReason'), 'backend must attach per-film why/reason copy');
assert(index.includes('profile ='), 'surprise endpoint must accept quick profile filters');
assert(index.includes('surpriseMoodForProfile'), 'surprise profiles must map to mood/filters');

const listCount = (lists.match(/slug:/g) || []).length;
assert(listCount >= 16, `need at least 16 editorial list buckets, found ${listCount}`);
assert(lists.includes('sad-girl-cinema'), 'missing sad girl cinema list');
assert(lists.includes('rainy-night-cinema'), 'missing rainy night list');
assert(lists.includes('terror-sin-jumpscares'), 'missing no-jumpscare horror list');
assert(lists.includes('latam-pulse'), 'missing latin american list');

assert(html.includes('quick-surprise'), 'homepage must render quick surprise filter buttons');
assert(app.includes('renderWhy'), 'frontend must render why panel');
assert(app.includes('quick-surprise'), 'frontend must wire quick surprise filters');
assert(app.includes('f.reason'), 'cards must render per-film recommendation reason');

assert(curated.includes('CURATED_GROUPS'), 'curated file must expose admin-friendly grouped data');

console.log('moodwatch validation ok');
