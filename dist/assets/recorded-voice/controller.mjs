// Browser translation of app/BoopKit/Voice/Voice.swift + ReactAction's speech
// floor. Audio is existing voicegen-processed recordings, never runtime TTS.
export const VOICE_KINDS = ['sound', 'word', 'phrase', 'swear'];
export const FEELINGS = ['upset', 'glad', 'tickled'];
export const TOPICS = ['start', 'helpers', 'helper back', 'retry', 'work', 'tests', 'command', 'tool', 'looking', 'planning', 'done', 'answer', 'stopped', 'waiting', 'quiet', 'hello'];
export const JOIN_GAP_MS = 180;
export const MAX_LINE_MS = 2800;

// Matches Core/LocalTime.swift's SplitMix64 and its modulo selection.
export function createSplitMix64(seed = 0x7A4En) {
  let state = BigInt.asUintN(64, BigInt(seed));
  const next = () => {
    state = BigInt.asUintN(64, state + 0x9E3779B97F4A7C15n);
    let z = state;
    z = BigInt.asUintN(64, (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n);
    z = BigInt.asUintN(64, (z ^ (z >> 27n)) * 0x94D049BB133111EBn);
    return z ^ (z >> 31n);
  };
  return {next, int: span => Number(next() % BigInt(span))};
}

export function kindOrder(kind) {
  const at = VOICE_KINDS.indexOf(kind);
  if (at < 0) return kindOrder('sound');
  return VOICE_KINDS.map((value, i) => ({value, i}))
    .sort((a, b) => Math.abs(a.i - at) - Math.abs(b.i - at) || Number(a.i > at) - Number(b.i > at))
    .map(a => a.value).filter(k => k !== 'swear' || kind === 'swear');
}

function pickAnswer(value, options) {
  const choice = typeof value === 'object' && value ? value.choice : value;
  const confidence = typeof value === 'object' && value ? Number(value.p) : 1;
  return confidence >= .35 && options.includes(choice) ? choice : null;
}

export function selectVoiceLine(takes, {feeling = null, about = null, kind = 'sound', face, finish = null, avoiding = new Set(), rng = createSplitMix64()} = {}) {
  kind = VOICE_KINDS.includes(kind) ? kind : 'sound';
  const choose = (part, meaning) => {
    if (!meaning) return null;
    const fit = takes.filter(t => t.part === part && t.meaning === meaning && t.mood === face && (!t.finish || t.finish === finish));
    for (const k of kindOrder(kind)) {
      let pool = fit.filter(t => t.kind === k);
      if (pool.some(t => !avoiding.has(t.text))) pool = pool.filter(t => !avoiding.has(t.text));
      if (pool.length) return pool[rng.int(pool.length)];
    }
    return null;
  };
  const first = choose('feeling', pickAnswer(feeling, FEELINGS));
  const second = choose('about', pickAnswer(about, TOPICS));
  if (!first) return second ? [second] : [];
  if (!second) return [first];
  if (first.kind === 'phrase' || second.kind === 'phrase') return [kind === 'phrase' && first.kind !== 'phrase' ? second : first];
  return first.ms + JOIN_GAP_MS + second.ms <= MAX_LINE_MS ? [first, second] : [first];
}

export function createVoiceController({audioContext, catalogURL = '/data/voice-catalog.json', volume = .4, onMouth = () => {}, onSpeechActive = () => {}, onBubble = () => {}, onStatus = () => {}} = {}) {
  let ctx = audioContext, gain = null, catalog = null, pendingCatalog = null, generation = 0, raf = 0;
  let active = null, lastWords = new Set(), lastMouth = false, level = Math.max(0, Math.min(.8, Number(volume) || 0));
  const rng = createSplitMix64(), cache = new Map(), pendingClips = new Map();
  function mouth(value) { if (lastMouth !== value) { lastMouth = value; onMouth(value); } }
  async function load() {
    if (catalog) return catalog;
    if (!pendingCatalog) pendingCatalog = fetch(catalogURL).then(r => {if (!r.ok) throw new Error('Voice catalog unavailable'); return r.json();}).then(value => catalog = value).catch(e => {pendingCatalog = null; throw e;});
    return pendingCatalog;
  }
  async function ready() {
    if (!ctx) {const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) throw new Error('Web Audio unavailable'); ctx = new C();}
    if (!gain) {gain = ctx.createGain(); gain.gain.value = level; gain.connect(ctx.destination);}
    await ctx.resume();
    if (ctx.state !== 'running') throw new Error('Enable audio with a user gesture');
  }
  async function clip(take) {
    if (cache.has(take.id)) {
      const buffer = cache.get(take.id);
      cache.delete(take.id); cache.set(take.id, buffer);
      return buffer;
    }
    if (pendingClips.has(take.id)) return pendingClips.get(take.id);
    const pending = (async () => {
      const response = await fetch(take.url);
      if (!response.ok) throw new Error('Recorded take unavailable: ' + take.id);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      // Browser interpolation uses its output rate; duration and pitch stay native.
      if (Math.abs(buffer.duration * 1000 - take.ms) > 2) throw new Error('Processed take duration differs from runtime table: ' + take.id);
      if (cache.size >= 48) cache.delete(cache.keys().next().value);
      cache.set(take.id, buffer);
      return buffer;
    })();
    pendingClips.set(take.id, pending);
    try {return await pending;} finally {if (pendingClips.get(take.id) === pending) pendingClips.delete(take.id);}
  }
  async function preloadTakes(idsOrSay = []) {
    await load(); await ready();
    const input = typeof idsOrSay === 'string' ? [idsOrSay] : Array.isArray(idsOrSay) ? idsOrSay : [idsOrSay?.take, idsOrSay?.then];
    const ids = [...new Set(input.filter(id => typeof id === 'string' && id))].slice(0, 24);
    const results = new Array(ids.length);
    let next = 0;
    // A small look-ahead cache, never a full voice-bank download. Preparing a
    // clip emits no status/mouth/bubble and cannot interrupt ongoing speech.
    await Promise.all(Array.from({length: Math.min(4, ids.length)}, async () => {
      while (next < ids.length) {
        const index = next++, id = ids[index], take = catalog.takes.find(t => t.id === id);
        if (!take) {results[index] = {id, missing: true}; continue;}
        try {await clip(take); results[index] = {id};}
        catch (error) {results[index] = {id, error: error.message};}
      }
    }));
    return {requested: ids, loaded: results.filter(r => !r.missing && !r.error).map(r => r.id),
      missing: results.filter(r => r.missing).map(r => r.id),
      errors: results.filter(r => r.error).map(({id, error}) => ({id, error})), limit: 24};
  }
  function stop({clearBubble = true, reason = 'cut'} = {}) {
    generation++; cancelAnimationFrame(raf);
    if (active) {
      const now = ctx.currentTime;
      active.bus.gain.cancelScheduledValues(now);
      active.bus.gain.setValueAtTime(active.bus.gain.value, now);
      active.bus.gain.linearRampToValueAtTime(0, now + .004);
      for (const source of active.sources) {try {source.stop(now + .004);} catch {}}
      const old = active; setTimeout(() => old.bus.disconnect(), 20);
      active = null;
    }
    mouth(false); onSpeechActive(false);
    if (clearBubble) onBubble({phase: 'hidden', text: '', takes: []});
    onStatus({phase: reason});
  }
  async function select(request) {
    await load();
    const line = selectVoiceLine(catalog.takes, {...request, avoiding: lastWords, rng});
    if (line.length) lastWords = new Set(line.map(t => t.text));
    return line;
  }
  async function playLine(line, {delayMs = 0, notBefore = null, playbackRate = 1} = {}) {
    if (![.5, 1, 2, 4].includes(playbackRate)) throw new Error('Voice replay rate must be 0.5, 1, 2 or 4');
    stop({reason: 'replaced'});
    const token = generation;
    if (!line.length) {onStatus({phase: 'silent', reason: 'No eligible recorded take', takes: []}); return {takes: [], ms: 0};}
    await ready();
    let buffers;
    try {buffers = await Promise.all(line.map(clip));} catch (error) {if (generation === token) {stop({reason: 'missing'}); onStatus({phase: 'silent', reason: error.message, takes: []});} return {takes: [], ms: 0, error: error.message};}
    if (generation !== token) return null;
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(gain);
    const start = Math.max(ctx.currentTime + .015, Number.isFinite(notBefore) ? notBefore : ctx.currentTime + Math.max(0, Number(delayMs) || 0) / 1000 + .015);
    const windows = [], sources = [];
    let at = start;
    for (let i = 0; i < line.length; i++) {
      const source = ctx.createBufferSource(); source.buffer = buffers[i]; source.playbackRate.value = playbackRate; source.connect(bus); source.start(at);
      sources.push(source); windows.push({take: line[i], start: at, end: at + buffers[i].duration / playbackRate});
      at += (buffers[i].duration + (i < line.length - 1 ? JOIN_GAP_MS / 1000 : 0)) / playbackRate;
    }
    const session = {bus, sources, windows, start, end: at, shown: false, ended: false, playbackRate}; active = session;
    const text = line.map(t => t.text).join(' '), ms = Math.round((at - start) * 1000);
    onStatus({phase: 'queued', takes: line, ms, delayMs, playbackRate});
    function tick() {
      if (active !== session) return;
      const now = ctx.currentTime;
      if (now >= start && !session.shown) {session.shown = true; onSpeechActive(true); onBubble({phase: 'speaking', text, takes: line}); onStatus({phase: 'playing', takes: line, ms, playbackRate});}
      const window = windows.find(w => now >= w.start && now < w.end);
      mouth(!!window && !!window.take.mouth[Math.floor((now - window.start) * 1000 * playbackRate / catalog.mouthFrameMs)]);
      if (now >= at && !session.ended) {session.ended = true; mouth(false); onSpeechActive(false); onBubble({phase: 'holding', text, takes: line}); onStatus({phase: 'finished', takes: line, ms, playbackRate});}
      if (now < at + 1.2 / playbackRate) raf = requestAnimationFrame(tick);
      else {active = null; bus.disconnect(); onBubble({phase: 'hidden', text: '', takes: []}); onStatus({phase: 'bubble-ended', takes: line, ms});}
    }
    raf = requestAnimationFrame(tick);
    return {takes: line, text, ms, playbackRate, startsAt: start, endsAt: at, bubbleEndsAt: at + 1.2 / playbackRate};
  }
  async function say(request = {}) {
    // Attention and listening are device-priority states, with no recorded line.
    if (request.blocked || ['needs_you', 'listening'].includes(request.state)) {stop({reason: 'blocked'}); return {takes: [], ms: 0};}
    stop({reason: 'preparing'});
    const token = generation, line = await select(request);
    return token === generation ? playLine(line, request) : null;
  }
  function setVolume(value) {level = Math.max(0, Math.min(.8, Number(value) || 0)); if (gain) gain.gain.setTargetAtTime(level, ctx.currentTime, .02);}
  const visibility = () => {if (document.hidden) stop({reason: 'hidden'});};
  const pagehide = () => stop({reason: 'hidden'});
  document.addEventListener('visibilitychange', visibility);
  globalThis.addEventListener('pagehide', pagehide);
  async function dispose() {stop(); cache.clear(); gain?.disconnect(); document.removeEventListener('visibilitychange', visibility); globalThis.removeEventListener('pagehide', pagehide);}
  return {load, select, say, playLine, preloadTakes, stop, setVolume, dispose,
    stats: () => ({playing: !!active && !active.ended, pending: !!active && !active.shown, bubble: !!active, playbackRate: active?.playbackRate || 1, cacheEntries: cache.size, lastWords: [...lastWords]}),
    get catalog() {return catalog;}, get audioContext() {return ctx;}};
}
