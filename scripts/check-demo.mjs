import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {DemoClock,DURATION,STORY,stepAt} from '../dist/assets/demo-timeline.mjs';
import {eventsAt,eventLine,EVENTS} from '../dist/assets/demo-events.mjs';
import {CONVERSATIONS,conversationAt,speechEventsAt} from '../dist/assets/demo-conversations.mjs';
import {makeScene,chooseVariation} from '../dist/assets/pixel-buddy/source/bank.mjs';
const source=new URL('../dist/assets/boop-preview/source/catalog.js',import.meta.url);
const context={window:{}};
vm.runInNewContext(await readFile(source,'utf8'),context);
const expressions=context.window.SlimeCatalog.expressions;
assert.equal(DURATION,240);
assert.equal(STORY[0].at,0);
assert(STORY.at(-1).at<DURATION);
for (let i=0;i<STORY.length;i++) {
  assert(expressions[STORY[i].mood],'Unknown expression: '+STORY[i].mood);
  const step=STORY[i];
  const id=chooseVariation({mood:step.mood,state:step.pixelState},{random:()=>0,hostContext:step.pixelState==='task_complete'?{completionOutcome:'success'}:{}});
  assert(makeScene(id).svg.includes('<svg'),'Original pixel scene must render for '+step.pixelState);
  if (i) assert(STORY[i].at>STORY[i-1].at,'Story must be chronological.');
}
const clock=new DemoClock();
clock.advance(15); assert.equal(clock.seconds,0,'Task starts paused until visible.');
clock.play(); clock.advance(91); assert.equal(STORY[stepAt(clock.seconds)].state,'Test failed');
clock.pause(); clock.advance(20); assert.equal(clock.seconds,91,'Pause preserves position.');
clock.play(); clock.setSpeed(2); clock.advance(10); assert.equal(clock.seconds,111);
assert.equal(STORY[stepAt(clock.seconds)].state,'Needs attention');
clock.seek(136); assert.equal(STORY[stepAt(clock.seconds)].state,'Resuming');
clock.seek(224); assert.equal(STORY[stepAt(clock.seconds)].state,'Task complete');
clock.advance(30); assert.equal(clock.seconds,240); assert.equal(clock.playing,false);
clock.play(); assert.equal(clock.seconds,0,'Replay returns to the beginning.');
clock.seek(-1); assert.equal(clock.seconds,0);
clock.seek(900); assert.equal(clock.seconds,240);
assert.throws(()=>clock.seek(NaN)); assert.throws(()=>clock.advance(-1)); assert.throws(()=>clock.setSpeed(3));
assert(EVENTS.every((event,i)=>i===0||event.at>=EVENTS[i-1].at));
assert(EVENTS.every(event=>JSON.parse(eventLine(event)).ts));
assert(eventsAt(111).some(e=>e.type==='permission.request'));
assert(eventsAt(191).some(e=>e.type==='subagent.start'));
assert(eventsAt(201).some(e=>e.type==='subagent.result'));
assert(eventsAt(240).some(e=>e.type==='task.complete'));
const voice=JSON.parse(await readFile(new URL('../dist/assets/recorded-voice/catalog.json',import.meta.url),'utf8'));
for(const take of voice.takes){
  const file=await readFile(new URL('../dist'+take.url,import.meta.url));
  assert.equal(file.toString('ascii',0,4),'RIFF');assert.equal(file.toString('ascii',8,12),'WAVE');
  let pcm=null;
  for(let p=12;p+8<=file.length;){const n=file.readUInt32LE(p+4);if(file.toString('ascii',p,p+4)==='data')pcm=file.subarray(p+8,p+8+n);p+=8+n+(n%2);}
  assert(pcm,'WAV data required');assert.equal(createHash('sha256').update(pcm).digest('hex'),take.sha256);
  assert(Math.abs(pcm.length/voice.sampleRate*1000-take.ms)<2);
  const frames=Math.ceil(take.ms/voice.mouthFrameMs);
  assert(take.mouth.length>=frames&&take.mouth.length<=frames+1,'Mouth table must span the recording, allowing the original trailing frame.');
  assert(take.mouth.every(n=>n===0||n===1));
}
for(const step of STORY){if(step.voice){const take=voice.takes.find(t=>t.id===step.voice);assert(take,'Missing scripted take');assert.equal(take.mood,step.mood);assert(!['listening','needs_you'].includes(step.pixelState));if(step.responseText)assert.equal(step.responseText,take.text);}}
assert(STORY.some(s=>s.interaction==='tap_spam'));assert(eventsAt(150).some(e=>e.type==='mode.change'));
assert.equal(CONVERSATIONS.length,5);
for(const c of CONVERSATIONS){
  assert(c.start<c.submittedAt&&c.submittedAt<c.reactAt&&c.reactAt<c.hideAt);
  assert.equal(STORY[stepAt(c.start)].pixelState,'listening');
  assert.equal(conversationAt(c.start+.3).held,true);
  assert(conversationAt(c.start+1).transcript.length<c.text.length);
  assert.equal(conversationAt(c.submittedAt).transcript,c.text);
  assert.equal(STORY[stepAt(c.reactAt)].mood,c.responseMood);
  assert(speechEventsAt(c.reactAt).some(e=>e.type==='input'&&e.text===c.text));
}
assert.equal(conversationAt(0),null);
assert.equal(STORY[stepAt(15)].mood,'determined');assert.equal(STORY[stepAt(24)].mood,'grumpy');
assert.equal(STORY[stepAt(63)].mood,'whiny');
assert.deepEqual([75,80,85].map(t=>STORY[stepAt(t)].mood),['calm','curious','happy']);
console.log(JSON.stringify({passed:true,durationSeconds:DURATION,storySteps:STORY.length,recordedClips:voice.takes.length,checks:['expression availability','chronology','pause/resume','permission stage','completion','replay','seek bounds','recorded PCM integrity and mouth frames','scripted tap and mode changes']}));
