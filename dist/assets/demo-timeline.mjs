// An authored four-minute story, not a capture of a model call or hardware timing.
export const DURATION = 240;
export const STORY = Object.freeze([
  {"phase":"build","at":0,"mood":"calm","state":"Starting","pixelState":"starting","activity":"A new coding task arrives.","voice":"phase1.word.begin.start__calm__contained"},
  {"phase":"build","at":3,"mood":"happy","state":"A friendly poke","pixelState":"poked","activity":"A little hello before getting started.","interaction":"tap","voice":"phase1.word.poke.hi__happy__contained"},
  {"phase":"build","at":6,"mood":"curious","state":"Planning","pixelState":"planning","activity":"Reading the task: add keyboard shortcuts.","voice":"phase1.word.plan.plan__curious__contained"},
  {"phase":"build","at":8,"mood":"curious","state":"Listening to you","pixelState":"listening","activity":"You hold the mic and speak to Boop."},
  {"phase":"build","at":10.25,"mood":"determined","state":"Working harder","pixelState":"working","activity":"Challenge accepted. Boop gets determined.","voice":"phase1.phrase.retry.back-at-it__determined__contained","responseText":"Back at it"},
  {"phase":"build","at":19,"mood":"determined","state":"Listening to you","pixelState":"listening","activity":"You hold the mic again. Boop listens."},
  {"phase":"build","at":20.75,"mood":"grumpy","state":"Grumpy but working","pixelState":"working","activity":"That second remark stings. Still working, though.","voice":"phase1.nonverbal.frustration.hmph__grumpy__contained","responseText":"Hmph"},
  {"phase":"build","at":28,"mood":"irritated","state":"A tiny tantrum","pixelState":"working","activity":"A little grumble while the agent reads the files."},
  {"phase":"build","at":30,"mood":"irritated","state":"Too many pokes","pixelState":"tap_spam","activity":"Three pokes while it is busy. A tiny protest.","interaction":"tap_spam","voice":"phase1.nonverbal.frustration.hff__irritated__contained"},
  {"phase":"build","at":34,"mood":"grumpy","state":"Working","pixelState":"working","activity":"Still grumpy. Still getting the work done.","voice":"phase1.word.work.steady__grumpy__contained"},
  {"phase":"build","at":39,"mood":"grumpy","state":"Terminal","pixelState":"terminal","activity":"Following the terminal output."},
  {"phase":"build","at":44,"mood":"grumpy","state":"Working","pixelState":"working","activity":"Writing the keyboard handler.","voice":"phase1.word.work.busy__grumpy__contained"},
  {"phase":"build","at":50,"mood":"grumpy","state":"A little poke","pixelState":"poked","activity":"A poke does not instantly erase a grumpy mood.","interaction":"tap","voice":"phase1.word.poke.hi__grumpy__contained"},
  {"phase":"build","at":55,"mood":"grumpy","state":"Working","pixelState":"working","activity":"Covering the typing and focus edge cases."},
  {"phase":"debug","at":58,"mood":"grumpy","state":"Listening to you","pixelState":"listening","activity":"Another impatient nudge. Boop hears you."},
  {"phase":"debug","at":59.75,"mood":"whiny","state":"Feeling whiny","pixelState":"working","activity":"The grumbling turns into a little whine.","voice":"phase1.phrase.frustration.why-though__whiny__contained","responseText":"Why though"},
  {"phase":"debug","at":67,"mood":"whiny","state":"Listening to you","pixelState":"listening","activity":"You soften your tone and reassure Boop."},
  {"phase":"debug","at":70.25,"mood":"calm","state":"Settling down","pixelState":"working","activity":"Reassurance lands. Boop slowly settles.","voice":"phase1.phrase.work.steady-now__calm__contained","responseText":"Steady now"},
  {"phase":"debug","at":80,"mood":"curious","state":"Finding its rhythm","pixelState":"analyzing","activity":"A little curiosity returns."},
  {"phase":"debug","at":85,"mood":"happy","state":"Happy again","pixelState":"working","activity":"Back to happy, with a little laugh.","voice":"phase1.nonverbal.delight.hehehe__happy__contained","responseText":"Hehehe..."},
  {"phase":"debug","at":88,"mood":"engaged","state":"Testing","pixelState":"testing","activity":"Now check the keyboard handler.","voice":"phase1.word.test.test__engaged__contained","cue":"keyboard"},
  {"phase":"debug","at":91,"mood":"annoyed","state":"Test failed","pixelState":"error","activity":"A real task setback: the editable target test fails.","voice":"phase1.word.setback.uh-oh__annoyed__contained","cue":"failed"},
  {"phase":"debug","at":94,"mood":"curious","state":"Listening to you","pixelState":"listening","activity":"You suggest checking the editable parent."},
  {at:95.75, voice:'phase1.word.retry.recheck__determined__contained', phase:'debug', mood:'determined', state:'Working', pixelState:'working', activity:'Trying a better guard', message:'Check the closest editable ancestor before handling the key.'},
  {at:111, phase:'attention', mood:'curious', state:'Needs attention', pixelState:'needs_you', activity:'Your agent needs a hand', message:'May I install the browser test runner to check the UI?', cue:'knock_ding'},
  {at:126, phase:'attention', mood:'curious', state:'Needs attention', pixelState:'needs_you', activity:'Waiting for permission', message:'Boop keeps the request visible while the agent waits.'},
  {at:136, voice:'phase1.word.begin.ready__happy__contained', phase:'attention', mood:'happy', state:'Resuming', pixelState:'reply_ready', activity:'Permission granted', message:'The scripted task resumes. You can also grant permission yourself.'},
  {at:143, phase:'debug', mood:'happy', state:'Thank you', pixelState:'poked', activity:'Permission granted. One little reassuring tap.', interaction:'tap', voice:'phase1.word.poke.hi__happy__contained'},
  {at:147, voice:'phase1.word.work.work__determined__contained', phase:'debug', mood:'determined', state:'Working', pixelState:'working', activity:'Preparing the UI check', message:'Opening the notes app and replaying the keyboard interaction.'},
  {at:150, phase:'debug', mood:'calm', state:'Quiet mode', pixelState:'idle', activity:'You switch to quiet mode while the tests start.', voice:'phase1.word.idle.mellow__calm__contained'},
  {at:154, phase:'debug', mood:'engaged', state:'Waiting', pixelState:'waiting', activity:'Waiting for the browser test runner.'},
  {at:158, voice:'phase1.word.test.test__engaged__contained', phase:'debug', mood:'engaged', state:'Testing', pixelState:'testing', activity:'Running browser tests', message:'Typing stays untouched. The command menu opens with the shortcut.'},
  {at:169, voice:'phase1.word.celebrate.bravo__excited__contained', phase:'debug', mood:'excited', state:'Testing', pixelState:'testing', activity:'Checking accessibility', message:'Focus returns to the editor when the menu closes.'},
  {at:180, voice:'phase1.word.success.passed__happy__contained', phase:'debug', mood:'happy', state:'Tests passed', pixelState:'reply_ready', activity:'The checks turn green', message:'Keyboard, typing and focus checks all pass.', cue:'bounce'},
  {at:185, phase:'finish', mood:'excited', state:'A celebratory poke', pixelState:'poked', activity:'Green tests! You tap to celebrate together.', interaction:'tap', voice:'phase1.word.poke.hi__excited__contained'},
  {at:191, voice:'phase1.word.delegate.scout__determined__contained', phase:'finish', mood:'determined', state:'Reviewing', pixelState:'delegating', activity:'One last look', message:'Reviewing the diff for duplicate listeners and cleanup.'},
  {at:201, voice:'phase1.word.return.delivery__engaged__contained', phase:'finish', mood:'engaged', state:'Reviewing', pixelState:'helper_return', activity:'Tidying the change', message:'Keeping the implementation small and removing the listener on unmount.'},
  {at:212, voice:'phase1.word.reply.ta-da__happy__contained', phase:'finish', mood:'happy', state:'Finishing', pixelState:'reply_ready', activity:'Writing the handoff', message:'Summarizing the change and the checks that passed.'},
  {at:219, phase:'finish', mood:'excited', state:'Ready to celebrate', pixelState:'reply_ready', activity:'The review is clean. The buddy perks up.'},
  {at:224, voice:'phase1.word.success.complete__proud__contained', phase:'finish', mood:'proud', state:'Task complete', pixelState:'task_complete', activity:'A little celebration', message:'The keyboard shortcuts are ready to review.', cue:'complete'},
  {at:234, voice:'phase1.word.idle.mellow__calm__contained', phase:'finish', mood:'calm', state:'Resting', pixelState:'idle', activity:'Back to a quiet desk', message:'Boop settles down. Give it a poke, or replay the task.'},
  {at:238, phase:'finish', mood:'calm', state:'Asleep', pixelState:'asleep', activity:'A quiet desk again. Time for a little nap.'}
]);
export function stepAt(seconds) {
  let index=0;
  for (let i=1;i<STORY.length && STORY[i].at<=seconds;i++) index=i;
  return index;
}
export class DemoClock {
  constructor() { this.seconds=0; this.speed=1; this.playing=false; }
  get ended() { return this.seconds>=DURATION; }
  play() { if (this.ended) this.seek(0); this.playing=true; }
  pause() { this.playing=false; }
  seek(seconds) {
    if (!Number.isFinite(seconds)) throw new TypeError('A finite position is required.');
    this.seconds=Math.min(DURATION,Math.max(0,seconds));
    if (this.ended) this.pause();
  }
  setSpeed(speed) {
    if (![1,2,4].includes(speed)) throw new RangeError('Unsupported playback speed.');
    this.speed=speed;
  }
  advance(seconds) {
    if (!Number.isFinite(seconds) || seconds<0) throw new RangeError('Invalid elapsed time.');
    if (this.playing) this.seek(this.seconds+seconds*this.speed);
    return stepAt(this.seconds);
  }
}
